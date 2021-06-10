/**
 * This module defines the games service, which processes all requests relating
 * to games.
 *
 * @category Games
 * @category Services
 *
 * @module GamesService
 */

import { Types } from 'mongoose';
import { DocumentType } from '@typegoose/typegoose';

import { ServiceWithAuth, GameState, GameType } from '../_helpers';
import { organisationsService, eventsService, usersService } from '../services';
import SimulationsService from './simulations.service';
import { GameClass, OrganisationClass, ControlClass, UserClass, SettingsClass } from '../models';
import { Game, Control, Settings, isValidId } from '../_helpers/db';
import { Setting, AtLeast } from '../../typings';

/**
 * Represents the games service.
 */
export default class GamesService extends ServiceWithAuth<GameClass> {
  /**
   * The service used to run game simulations.
   */
  private _simulationsService: SimulationsService;

  /**
   * Initialise the superclass with the `Game` model.
   */
  constructor() {
    super(Game);

    this._simulationsService = new SimulationsService();
    this._simulationsService.getSettings();
  }

  /**
   * Create a new game, also creating its initial organisation.
   *
   * @category CRUD
   * @category Games
   *
   * @param newDetails  The details of the new game to create.
   * @param newOrganisationDetails  The details of the initial organisation to create.
   * @returns  The newly-created game.
   *
   * @todo It shouldn't be necessary to keep re-retrieving the games, and this
   *   won't scale well.
   */
  async createGameAndOrganisation(
    newDetails: GameClass,
    newOrganisationDetails: OrganisationClass,
  ): Promise<GameClass> {
    const organisation: OrganisationClass = await organisationsService.create(newOrganisationDetails);
    const newOrganisationId: Types.ObjectId = organisation['id'];

    const newDetailsInclOrganisation: GameClass = {
      ...newDetails,
      organisations: [newOrganisationId],
    };
    if (newDetailsInclOrganisation.gameType === GameType.Competitive)
      newDetailsInclOrganisation['readyOrganisations'] = [];

    const game: GameClass = await this.create(newDetailsInclOrganisation);
    const id: Types.ObjectId = game['id'];

    const newGame: DocumentType<GameClass> = await Game.findById(id).populate({
      path: 'organisations',
      model: 'Organisation',
    });

    return this._basicDetails(newGame);
  }

  /**
   * Retrieve a value from a given field on a given game.
   *
   * The base method has been extended to allow for handling reference
   * population.
   *
   * @category CRUD
   * @category Games
   *
   * @param id  The ID of the game to query.
   * @param fieldName  The name of the field to query.
   * @returns  The retrieved value(s).
   *
   * @todo Sanitise `members` and `controls`.
   */
  async get(id: Types.ObjectId): Promise<GameClass> {
    if (!isValidId(id)) throw { code: 400, message: 'Invalid ID!' };

    return await Game.findById(id).populate({
      path: 'organisations',
      model: 'Organisation',
    });
  }

  /*eslint-disable @typescript-eslint/no-unused-vars */
  /**
   * Retrieve a game by an event that has occured during it.
   *
   * @category CRUD
   * @category Games
   * @category Stub
   *
   * @param eventID  The ID of the event to search with.
   * @returns  The retrieved game.
   *
   * @todo Implement.
   */
  async getByEvent({ eventId }: { eventId: Types.ObjectId }): Promise<GameClass> {
    throw 'WIP';
    //return await this._getByEvent(eventId);
  }

  /**
   * Retrieve all players within a multiplayer game.
   *
   * @category CRUD
   * @category Games
   *
   * @async
   *
   * @returns  The retrieved players.
   */
  async getPlayers(gameId: Types.ObjectId): Promise<UserClass[]> {
    const game: DocumentType<GameClass> = await this._getById(gameId);
    let members = [];

    switch (game.gameType) {
      case GameType.Cooperative:
        members = <UserClass[]>await organisationsService.getValue(<Types.ObjectId>game.organisations[0], 'members');
        return members;
      case GameType.Competitive:
        for (const organisationId of game.organisations) {
          members.push(<UserClass[]>await organisationsService.getValue(<Types.ObjectId>organisationId, 'members'));
        }

        return members.flat();
      default:
        throw { code: 500, message: 'Invalid/unknown game type' };
    }
  }

  /**
   * Retrieve a value from a given field on a given game.
   *
   * The base method has been extended to allow for handling reference
   * population.
   *
   * @category CRUD
   * @category Games
   *
   * @param id  The ID of the game to query.
   * @param fieldName  The name of the field to query.
   * @returns  The retrieved value(s).
   *
   * @todo Sanitise `members` and `controls`.
   */
  async getValue(id: Types.ObjectId, fieldName: string): Promise<unknown | unknown[]> {
    let game: DocumentType<GameClass>;

    if (fieldName === 'organisations') {
      switch (fieldName) {
        case 'organisations':
          game = await Game.findById(id).populate({
            path: 'organisations',
            model: 'Organisation',
          });
          return game['organisations'];
        default:
      }
    } else return await super.getValue(id, fieldName);
  }

  /**
   * Retrieve all customisable game settings.
   *
   * @category CRUD
   * @category Games
   *
   * @async
   *
   * @returns  The retrieved setting(s).
   */
  async getSettings(): Promise<SettingsClass[]> {
    const settings: DocumentType<SettingsClass>[] = await Settings.find();
    return settings;
  }

  /**
   * Retrieve a customisable game settings by its key.
   *
   * @category CRUD
   * @category Games
   *
   * @async
   *
   * @param key  The key of the setting to retrieve.
   * @returns  The retrieved setting.
   */
  async getSetting(key: string): Promise<SettingsClass> {
    const setting: DocumentType<SettingsClass> = await Settings.findOne({ key: key });
    return setting;
  }

  /**
   * Get the enum of possible game types (see {@link Enums.GameType}).
   *
   * @category Games
   *
   * @returns  The list of possible game type values.
   */
  static getGameTypes(): string[] {
    return ['single-player', 'co-operative multiplayer (alpha)', 'competitive multiplayer (alpha)'];
  }

  /**
   * Retrieve a list of controls still available to be implemented by a given
   * organisation.
   *
   * @category Games
   *
   * @see {@link OrganisationsService.default.getNewControls}
   *
   * @param organisationId  The ID of the organisation to get new controls for.
   * @returns  The list of controls still to be implemented.
   *
   * @todo Move to {@link ControlsService}?
   */
  async getNewControls(organisationId: Types.ObjectId): Promise<DocumentType<ControlClass>[]> {
    const game = await Game.findOne({ organisations: organisationId }).populate({
      path: 'organisations',
      model: 'Organisation',
    });

    //const {controls} = await Organisation.findById(organisationId).populate({
    //  path: 'controls.securityAreas',
    //  model: 'SecurityArea',
    //});
    //console.debug(controls[0].securityAreas);
    const implementedControlIds = game.organisations[0]['controls'].map((control) => control.id);

    const controls = await Control.find({
      _id: { $nin: implementedControlIds },
      source: game.source,
    }).populate({
      path: 'securityAreas',
      model: 'SecurityArea',
    });

    return controls;
  }

  /**
   * Add a new organisation to a game.
   *
   * @category CRUD
   * @category Games
   *
   * @param gameId  The ID of the game to add the organisation to.
   * @param organisation  The details of the new organisation to create and add.
   * @returns  The updated game.
   */
  async addOrganisation({
    userId,
    gameId,
    organisation,
    ownerUsername,
  }: {
    userId: Types.ObjectId;
    gameId: Types.ObjectId;
    organisation: OrganisationClass;
    ownerUsername: string;
  }): Promise<GameClass> {
    await this._authorise(userId, gameId);

    const orgOwner: UserClass = await usersService.getByUsername(ownerUsername);
    organisation.owner = orgOwner.id;

    const newOrganisation: OrganisationClass = await organisationsService.create(organisation);

    const game: DocumentType<GameClass> = await this._getById(gameId);

    game.organisations.push(newOrganisation.id);

    await game.save();

    return this._basicDetails(game);
  }

  /**
   * Updates a given game object. This method can perform full or partial updates.
   *
   * If the update is just vote tallies (for multiplayer games), then auth is
   * not needed.
   *
   * @category CRUD
   * @category Auth
   * @category Games
   *
   * @async
   *
   * @param userId  The ID of the requesting user.
   * @param updatedGame  The new details of the game object.
   * @returns  The newly-updated game object.
   */
  async updateWithAuth(userId: Types.ObjectId, updatedGame: AtLeast<GameClass, 'id'>): Promise<GameClass> {
    if (Object.keys(updatedGame).length === 2) {
      if (updatedGame['id'] && updatedGame['votes']) return await super.update(updatedGame);
    }

    return await super.updateWithAuth(userId, updatedGame);
  }

  /**
   * Remove an existing organisation from a game.
   *
   * NB: This will result in the organisation being deleted.
   *
   * @category CRUD
   * @category Games
   *
   * @param ownerId  The ID of the user who owns the game.
   * @param gameId  The ID of the game to remove the organisation from.
   * @param organisationId  The ID of the organisation to remove from the game.
   * @returns  Whether the organisation was successfully removed or not.
   */
  async removeOrganisation({
    ownerId,
    gameId,
    organisationId,
  }: {
    ownerId: Types.ObjectId;
    gameId: Types.ObjectId;
    organisationId: Types.ObjectId;
  }): Promise<GameClass> {
    await organisationsService.deleteWithAuth(ownerId, organisationId);
    const game: DocumentType<GameClass> = await this._getById(gameId);

    console.log(`Removing organisation ${organisationId} from game ${gameId}`);
    game.organisations = game.organisations.filter(
      (organisation: OrganisationClass) => organisation.id !== organisationId,
    );
    await game.save();

    return this._basicDetails(game);
  }

  /**
   * Add a new player to a game.
   *
   * Players are not assigned directly to a game, but rather to an organisation
   * within a game.
   *
   * @category CRUD
   * @category Games
   *
   * @see {@link OrganisationsService.default.addMember}
   *
   * @param userId  The ID of the user to add to the game.
   * @param joiningCode  The unique joining code of the organisation to add the
   *   player to.
   * @param joiningPassword  The (optional) joining password that is required.
   * @returns  The updated game.
   */
  async addPlayer({
    userId,
    joiningCode,
    joiningPassword,
  }: {
    userId: Types.ObjectId;
    joiningCode: string;
    joiningPassword: string;
  }): Promise<GameClass> {
    const { id: organisationId }: { id: Types.ObjectId } = await organisationsService.getByJoiningCode(
      joiningCode,
      joiningPassword,
    );

    const { gameType }: { gameType: GameType } = await Game.findOne({ organisations: organisationId });
    //if (!(gameType === GameType.Cooperative)) throw { code: 403, message: "Organisation does not accept new members." };

    const organisation: OrganisationClass = await organisationsService.addMember({
      joiningCode,
      joiningPassword,
      newMemberId: userId,
    });

    // Get the game that contains the newly-joined organisation, populate
    // its subdocuments and return the lot.
    const game: DocumentType<GameClass> = await Game.findOne({ organisations: organisation.id }).populate({
      path: 'organisations',
      model: 'Organisation',
    });

    return this._basicDetails(game);
  }

  /**
   * Remove a player from a game.
   *
   * Players are not removed directly from a game, but rather from an
   * organisation within a game.
   *
   * @category CRUD
   * @category Games
   *
   * @see {@link OrganisationsService.default.removeMember}
   *
   * @param ownerId  The ID of the user who owns the game. If none is
   *   specified, the value of `memberId` will be used for authorisation (i.e.,
   *   it will be assumed that the requester is requesting their own removal).
   * @param memberId  The ID of the user to remove from the game.
   * @returns  The updated game.
   */
  async removePlayer({
    ownerId,
    memberId,
  }: {
    ownerId?: Types.ObjectId;
    memberId: Types.ObjectId;
  }): Promise<GameClass> {
    const organisation: OrganisationClass = await organisationsService.getByMember(memberId);

    await organisationsService.removeMember({ ownerId, organisationId: organisation.id, memberId });

    const updatedGame: DocumentType<GameClass> = await Game.findOne({
      organisations: { $in: [organisation.id] },
    }).populate({
      path: 'organisations',
      model: 'Organisation',
    });

    return this._basicDetails(updatedGame);
  }

  async updateSetting(updatedSetting: Setting): Promise<Setting> {
    const setting = await Settings.updateOne({ key: updatedSetting.key }, { $set: { value: updatedSetting.value } });
    return setting;
  }

  /**
   * Simulate a turn occuring within a game.
   *
   * This method also handles game logic such as detecting the end of a game.
   *
   * @category Games
   *
   * @param gameId  The ID of the game to simulate a turn for.
   * @param organisationId  The ID of the organisation of the user
   *   making the request.
   * @param useMonteCarlo  Whether to use the Threat Intelligence Service or not.
   * @returns  The updated game.
   *
   * @todo Replace `organisation['id']` with `organisation.id`.
   */
  async simulateTurn({
    gameId,
    organisationId,
  }: {
    gameId: Types.ObjectId;
    organisationId: Types.ObjectId;
  }): Promise<GameClass | void> {
    const game: DocumentType<GameClass> = await Game.findById(gameId).populate({
      path: 'organisations',
      model: 'Organisation',
    });

    if (game.state === GameState.Ended) throw { code: 403, message: 'Game is already finished' };

    if (game.gameType === GameType.Competitive) {
      game.readyOrganisations.push(organisationId);
      if (game.readyOrganisations.length < game.organisations.length) {
        await game.save();
        return this._basicDetails(game);
      }
    }

    game.readyOrganisations = [];

    game.state = GameState.Simulating;

    await game.save();

    await this._simulationsService.simulateTurn(game.id);

    const updatedGame: DocumentType<GameClass> = await Game.findById(gameId).populate({
      path: 'organisations',
      model: 'Organisation',
    });

    if (updatedGame.currentTurn >= updatedGame.maxTurns) updatedGame.state = GameState.Ended;
    else {
      updatedGame.currentTurn++;
      updatedGame.state = GameState.Purchasing;
    }

    updatedGame.save();

    return this._basicDetails(updatedGame);
  }

  /**
   * Delete all user-created stuff (events, organisations, games, etc.) from the
   * database.
   *
   * @category Games
   * @category Admin
   *
   * @param userId  The ID of the user requesting the reset.
   * @param ip  The IP address of the requester.
   * @returns  Whether the reset was successful or not.
   */
  async reset(userId: Types.ObjectId, ip: string): Promise<boolean> {
    console.warn(`Reset requested by user ${userId} (${ip})`);

    await eventsService.deleteAll();
    await organisationsService.deleteAll();
    await this.deleteAll();

    return true;
  }

  /**
   * Authorise actions.
   *
   * @category Games
   * @category Auth
   *
   * @param userId  The ID of the user to authorise.
   * @param id  The ID of the game.
   * @returns  Whether the user is authorised to perform the action or not.
   */
  protected async _authorise(userId: Types.ObjectId, id: Types.ObjectId): Promise<boolean> {
    const user: UserClass = await usersService.get(userId);

    if (!user.isAdmin) {
      const game: GameClass = await this._getById(id);
      if (game.owner != user.id) throw 'User does not have permission to update Game.';
    }

    return true;
  }

  /**
   * Serialise a game document into a game object.
   *
   * @category Sanitisation
   * @category Games
   *
   * @param document  The game document from the document database.
   * @returns  The game object.
   */
  protected _basicDetails(document: DocumentType<GameClass>): GameClass {
    const {
      id,
      currentTurn,
      maxTurns,
      moneyPerTurn,
      source,
      organisations,
      readyOrganisations,
      gameType,
      votes,
      state,
      minNumOfEvents,
      maxNumOfEvents,
      minCostPerEvent,
      maxCostPerEvent,
      showAvailableControls,
      allowUnavoidableIncidents,
    } = document;

    return {
      id,
      currentTurn,
      maxTurns,
      source,
      moneyPerTurn,
      organisations,
      readyOrganisations,
      gameType,
      votes,
      state,
      minNumOfEvents,
      maxNumOfEvents,
      minCostPerEvent,
      maxCostPerEvent,
      showAvailableControls,
      allowUnavoidableIncidents,
      owner: undefined,
    };
  }
}
