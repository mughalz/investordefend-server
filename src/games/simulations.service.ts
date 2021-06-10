/**
 * This module defines the simulations service, which handles all in-game
 * simulations.
 *
 * This was originally intended to interface with the [Threat Intel. Service][tis],
 * which would run complex Monte Carlo simulations based on real-world threat
 * intelligence data. However, this has been shelved for the time being due to
 * being overly complex for the purposes of this game.
 *
 * Instead, the in-game simulations are designed to be fast and based on a set
 * of customisable parameters set at game creation time.
 *
 * NB: This is also the only service that does not extend the base service, as
 * there is no need for CRUD methods.
 *
 * [tis]: https://github.com/Rumperuu/Threat-Intelligence-Service
 *
 * @category Games
 * @category Services
 *
 * @module SimulationsService
 */

import { Types } from 'mongoose';

import { gamesService, eventsService, securityAreasService, organisationsService, controlsService } from '../services';
import { EventClass, SecurityAreaClass, GameClass } from '../models';
import { Settings, Game } from '../_helpers/db';
import { Asset, ThreatActor } from '../../typings';

/**
 * Represents the games service.
 */
export default class SimulationsService {
  private _threatActors: ThreatActor[];
  private _assets: Asset[];
  private _assetsWithControls: Asset[];

  /**
   * Initialise the object with parameter settings from the database.
   */
  async getSettings(): Promise<void> {
    const { value: threatActors }: { value: ThreatActor[] } = await Settings.findOne({ key: 'threatActors' });
    const { value: assets }: { value: Asset[] } = await Settings.findOne({
      key: 'assets',
    });
    this._threatActors = threatActors;
    this._assets = assets;
    this._assetsWithControls = await controlsService.filterAssetsWithControls(this._assets);
  }

  /**
   * Simulate a turn occuring within a game.
   *
   * This method also handles game logic such as detecting the end of a game.
   *
   * @category Simulations
   *
   * @param gameId  The ID of the game to simulate a turn for.
   *
   * @todo  Replace `['id']` with `.id`.
   */
  async simulateTurn(gameId: Types.ObjectId): Promise<void> {
    const events: EventClass[] = await this._simulateEventsForTurn(gameId);

    const game: GameClass = await Game.findById(gameId).populate({
      path: 'organisations',
      model: 'Organisation',
    });

    for (const organisation of game.organisations) {
      await organisationsService.saveBalance(organisation['id'], game.currentTurn);

      for (const event of events) {
        await organisationsService.simulateEvent({
          organisationId: organisation['id'],
          eventId: event.id,
        });
      }
    }

    for (const organisation of game.organisations) {
      await organisationsService.simulateNewTurn({
        organisationId: organisation['id'],
        moneyPerTurn: game.moneyPerTurn,
      });
    }
  }

  /**
   * Simulate the events of a given turn.
   *
   * @category Simulations
   *
   * @param gameId  The ID of the game to run the simulations for.
   * @returns  The list of events resulting from the simulation(s).
   */
  protected async _simulateEventsForTurn(gameId: Types.ObjectId): Promise<EventClass[]> {
    const {
      id,
      source,
      currentTurn,
      maxTurns,
      minNumOfEvents,
      maxNumOfEvents,
      minCostPerEvent,
      maxCostPerEvent,
      allowUnavoidableIncidents,
    } = await gamesService.get(gameId);
    const numOfEvents = Number(Math.floor(Math.random() * (maxNumOfEvents - minNumOfEvents) + minNumOfEvents));
    console.debug(`Simulating turn ${currentTurn} of game ${id}: ${numOfEvents} events`);

    const eventsForTurn: EventClass[] = [];

    for (let i = 1; i <= numOfEvents; i++) {
      const threatActor: ThreatActor = await this._generateThreatActor(currentTurn / maxTurns);
      const asset: Asset = await this._generateAsset(allowUnavoidableIncidents);
      const securityAreas: SecurityAreaClass[] = await this._generateSecurityAreas(source);
      const cost: number = this._generateCost(minCostPerEvent, maxCostPerEvent, threatActor.costModifier);

      const event: EventClass = await eventsService.create({
        game: gameId,
        turn: currentTurn,
        cost,
        threatActor: threatActor.slug,
        asset: asset.slug,
        securityAreas: securityAreas.map((securityArea) => securityArea.id),
      });
      eventsForTurn.push(event);
    }

    return eventsForTurn;
  }

  /**
   * Generate a cost value for an event.
   *
   * @category Simulations
   *
   * @param min  The minimum possible cost value.
   * @param max  The maximum possible cost value.
   * @param costModifier  The cost modifier to apply. Default '1.0'.
   * @returns  The event cost.
   */
  private _generateCost(min: number, max: number, costModifier = 1.0): number {
    return Number((Math.random() * (max - min + 1) + min).toFixed(2)) * costModifier;
  }

  /**
   * Assign a threat actor to an event.
   *
   * Any threat actor that does not have a probability value assigned is automatically
   * given a probability equal to 1/_n_, where _n_ is the total number of threat
   * actors.
   *
   * If the sum total of all probabilities is not equal to 1, the values are
   * normalised to the scale of 0.0–1.0.
   *
   * @category Simulations
   *
   * @param  gameProgress  The level of progress through the game so far.
   * @returns  The threat actor's name.
   *
   * @todo  Take filtering arguments.
   */
  private async _generateThreatActor(gameProgress: number): Promise<ThreatActor> {
    // Use a local variable in case values need to be normalised.
    let threatActors = this._threatActors.filter((threatActor) => {
      return !threatActor.includeFrom || threatActor.includeFrom <= gameProgress;
    });
    const rand = Math.random();
    let sum = 0.0;

    let sumProbabilities = 0.0;
    for (const threatActor of threatActors) sumProbabilities += threatActor.probability || 1 / threatActors.length;

    if (sumProbabilities !== 1.0) {
      console.warn('Probabilities for threat actors do not add up to 1! Normalising values...');
      threatActors = threatActors.map((threatActor) => {
        threatActor.probability = threatActor.probability / sumProbabilities;
        return threatActor;
      });
    }

    for (const threatActor of threatActors) {
      sum += threatActor.probability || 0.1;
      if (rand <= sum) return threatActor;
    }
  }

  /**
   * Assigns an event to an asset.
   *
   * Any asset that does not have a probability value assigned is automatically
   * given a probability equal to 1/_n_, where _n_ is the total number of assets.
   *
   * If the sum total of all probabilities is not equal to 1, the values are
   * normalised to the scale of 0.0–1.0.
   *
   * @category Simulations
   *
   * @param allowUnavoidableIncidents  Whether to allow incidents to target
   *                                   assets for which there are no controls
   *                                   available. Default 'true'.
   * @returns  The asset's name.
   *
   * @todo  Take filtering arguments.
   */
  private async _generateAsset(allowUnavoidableIncidents = true): Promise<Asset> {
    // Use a local variable in case values need to be normalised.
    let assets = allowUnavoidableIncidents ? this._assets : this._assetsWithControls;
    const rand = Math.random();
    let sum = 0.0;

    let sumProbabilities = 0.0;
    for (const asset of assets) sumProbabilities += asset.probability || 1 / assets.length;

    if (sumProbabilities !== 1.0) {
      console.warn('Probabilities for assets do not add up to 1! Normalising values...');
      assets = assets.map((asset) => {
        asset.probability = asset.probability / sumProbabilities;
        return asset;
      });
    }

    for (const asset of assets) {
      sum += asset.probability || 0.1;
      if (rand <= sum) return asset;
    }
  }

  /**
   * Assign security area(s) to an event.
   *
   * @category Simulations
   *
   * @param source  The source to retrieve security areas from.
   * @returns  The security area(s) assigned.
   *
   * @todo  Assign non-randomly.
   * @todo  Remove off-by-one catch once I'm happy the issue is fixed.
   */
  private async _generateSecurityAreas(source): Promise<SecurityAreaClass[]> {
    const allSecurityAreas: SecurityAreaClass[] = await securityAreasService.getAllBySource(source);

    const numOfSecurityAreas: number = Math.floor(Math.random() * (3 - 1 + 1) + 1);
    const eventSecurityAreas: SecurityAreaClass[] = [];

    for (let i = 1; i <= numOfSecurityAreas; i++) {
      const randIdx = Math.floor(Math.random() * (allSecurityAreas.length - 1 - 0) + 0);

      eventSecurityAreas.push(allSecurityAreas[randIdx]);

      allSecurityAreas.splice(randIdx, 1);
    }

    return eventSecurityAreas.sort((a, b) => Number(a.number) - Number(b.number));
  }
}
