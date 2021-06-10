/**
 * This module defines the Game model, which represents an instance of an
 * individual game within the system.
 *
 * It also contains the OpenAPI definition of a `Game`.
 *
 * @category Games
 * @category Models
 *
 * @module GameModel
 */

import { Schema } from 'mongoose';
import { modelOptions, prop, Ref, Severity } from '@typegoose/typegoose';

import { EventClass, UserClass, OrganisationClass } from '../models';
import { Model, GameState, GameType } from '../_helpers';

/**
 * Represents an Game object in the system.
 *
 * @category Games
 * @category Models
 *
 * @swagger
 * components:
 *   schemas:
 *     Game:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           required: true
 *           format: uuid
 *           description: The game's ID.
 *           example: 123456789abcdef01234567
 *         owner:
 *           type: string
 *           required: true
 *           format: uuid
 *           description: Reference to the game's owner.
 *           example: 123456789abcdef01234567
 *         gameType:
 *           $ref: '#/components/responses/GameType'
 *           required: true
 *         votes:
 *           type: array
 *           items:
 *             - object:
 *               properties:
 *                 id:
 *                   type: string
 *                 votes:
 *                   type: integer
 *         currentTurn:
 *           type: integer
 *           required: true
 *           description: The turn that the game is currently on.
 *           example: 5
 *           default: 1
 *         maxTurns:
 *           type: integer
 *           required: true
 *           description: The maximum length of the game.
 *           example: 20
 *           default: 12
 *         moneyPerTurn:
 *           type: number
 *           format: float
 *           required: true
 *           description: The amount of money each organisation received at the
 *             start of a new turn.
 *           example: 1234.56
 *           default: 1000.00
 *         showAvailableControls:
 *           type: boolean
 *           required: true
 *           description: Whether to show the number of evailable controls or not.
 *           example: true
 *           default: true
 *         allowUnavoidableIncidents:
 *           type: boolean
 *           required: true
 *           description: Whether to allow incidents to target assets for which there are no controls available.
 *           example: true
 *           default: true
 *         state:
 *           required: true
 *           description: The current state of the game.
 *           $ref: '#/components/schemas/GameState'
 *         source:
 *           type: string
 *           required: true
 *           description: The source to use for controls/security areas.
 *           example: Original
 *         organisations:
 *           type: array
 *           required: true
 *           items:
 *             type: string
 *             format: uuid
 *           uniqueItems: true
 *           description: References to the organisations in the game.
 *           example: ["123456789abcdef01234567"]
 *         events:
 *           type: array
 *           required: true
 *           items:
 *             type: string
 *             format: uuid
 *           uniqueItems: true
 *           description: References to the events that have occurred over the
 *             course of the game.
 *           example: ["123456789abcdef01234567"]
 */
@modelOptions({
  schemaOptions: {
    toJSON: {
      virtuals: true,
      versionKey: false,
    },
    toObject: {
      virtuals: true,
    },
  },
  options: { allowMixed: Severity.ALLOW },
})
class Game extends Model {
  /**
   * The user that created the game.
   *
   * Ownership is not currently transferable.
   */
  @prop({ required: true, ref: () => UserClass, type: Schema.Types.ObjectId })
  public owner!: Ref<UserClass>;

  /**
   * The game type.
   */
  @prop({ required: true, enum: GameType })
  public gameType!: number;

  /**
   * The ongoing vote tallies for the game.
   *
   * Only used in co-operative games; {@see Game.gameType}.
   */
  @prop({})
  public votes?: {
    id: string;
    votes: Ref<UserClass>[];
  }[];

  /**
   * The turn that the game is currently on.
   */
  @prop({ required: true, default: 1 })
  public currentTurn!: number;

  /**
   * The number of turns that the game will go on for.
   */
  @prop({ required: true, default: 12 })
  public maxTurns!: number;

  /**
   * The amount of money each organisation receives to spend each turn.
   */
  @prop({ required: true, default: 1000.0 })
  public moneyPerTurn!: number;

  /**
   * The current state of the game.
   */
  @prop({ required: true, enum: GameState, default: GameState.Purchasing })
  public state!: number;

  /**
   * The source to use for security areas/controls.
   */
  @prop({ required: true })
  public source!: string;

  /**
   * The minimum number of events per turn.
   */
  @prop({ required: true, default: 1 })
  public minNumOfEvents!: number;

  /**
   * The maximum number of events per turn.
   */
  @prop({ required: true, default: 3 })
  public maxNumOfEvents!: number;

  /**
   * The minimum cost per event.
   */
  @prop({ required: true, default: 250.0 })
  public minCostPerEvent!: number;

  /**
   * The maximum cost per event.
   */
  @prop({ required: true, default: 3000.0 })
  public maxCostPerEvent!: number;

  /**
   * Whether to show available controls or not.
   */
  @prop({ required: true, default: true })
  public showAvailableControls!: boolean;

  /**
   * Whether to allow incidents to target assets for which there are no controls available.
   */
  @prop({ required: true, default: true })
  public allowUnavoidableIncidents!: boolean;

  /**
   * The organisation(s) within the game.
   */
  @prop({ required: true, ref: () => OrganisationClass, type: Schema.Types.ObjectId, default: [] })
  public organisations!: Ref<OrganisationClass>[];

  /**
   * The organisations within a competitive multiplayer game that have requested
   * to simulate the next turn.
   */
  @prop({ ref: () => OrganisationClass, type: Schema.Types.ObjectId, default: [] })
  public readyOrganisations?: Ref<OrganisationClass>[];

  /**
   * The events that have occurred within the game.
   *
   * NB: This is not currently used, but shuts the TypeDoc compiler up
   */
  @prop({ required: true, ref: () => EventClass, type: Schema.Types.ObjectId, default: [] })
  public events?: Ref<EventClass>[];
}

export { Game as GameClass };
