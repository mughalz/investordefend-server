/**
 * This module defines the Organisation model, which represents an instance of
 * an organisation within the game.
 *
 * It also contains the OpenAPI definition of an `Organisation`.
 *
 * @category Organisations
 * @category Models
 *
 * @module OrganisationModel
 */

import { Schema } from 'mongoose';
import { pre, modelOptions, prop, Ref, Severity } from '@typegoose/typegoose';
import { Base } from '@typegoose/typegoose/lib/defaultClasses';

import { Model, sizes, industries, SIZE } from '../_helpers';
import { UserClass, ImplementedControl, ExperiencedEvent } from '../models';
import { Game } from '../_helpers/db';

// WARNING: if you don't disable ESLint here, it will automatically 'fix' this
// by turning it into a type declaration, which will break the whole server.
/*eslint-disable @typescript-eslint/no-empty-interface */
interface Organisation extends Base {}
/*eslint-enable @typescript-eslint/no-empty-interface */

/**
 * Represents an Organisation object in the system.
 *
 * @category Organisations
 * @category Models
 *
 * @todo Add `toJSON()` to convert `organisations` to `organisation` when on
 *   solo play.
 *
 * @swagger
 * components:
 *   schemas:
 *     Organisation:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           required: false
 *           format: uuid
 *           description: The organisation's ID.
 *           example: 123456789abcdef01234567
 *         owner:
 *           type: string
 *           required: true
 *           format: uuid
 *           description: Reference to the organisation's owner.
 *           example: 123456789abcdef01234567
 *         name:
 *           type: string
 *           required: true
 *           description: The organisation's name.
 *           example: Foo Corp.
 *         balance:
 *           type: number
 *           required: true
 *           format: float
 *           description: The organisation's balance.
 *           example: 1000.00
 *           default: 0.00
 *         controls:
 *           type: array
 *           required: true
 *           items:
 *             type: string
 *             format: uuid
 *           uniqueItems: true
 *           description: References to the organisation's implemented controls.
 *           example: ["123456789abcdef01234567"]
 *           default: []
 *         size:
 *           type: string
 *           required: true
 *           enum: [Micro, Small, Medium, Large]
 *           description: The organisation's size.
 *           example: Small
 *           default: Medium
 *         industry:
 *           type: string
 *           required: true
 *           description: The organisation's industry.
 *           example: Mining and quarrying
 *           default: Information and communication
 *         members:
 *           type: array
 *           required: true
 *           items:
 *             type: string
 *             format: uuid
 *           uniqueItems: true
 *           description: References to the organisation's members.
 *           example: ["123456789abcdef01234567"]
 *         joiningCode:
 *           type: string
 *           required: true
 *           description: The organisation's joining code.
 *           example: 1234
 *           uniqueItems: true
 *         joiningPassword:
 *           type: string
 *           description: The organisation's joining password.
 *           example: 1234
 *         events:
 *           type: array
 *           required: true
 *           items:
 *             type: string
 *             format: uuid
 *           uniqueItems: true
 *           description: References to the events that have occurred to the organisation.
 *           example: ["123456789abcdef01234567"]
 *           default: []
 */
@pre<Organisation>('deleteOne', async function () {
  const organisationId = this.getQuery()._id;
  await Game.updateOne({ organisations: { $in: [organisationId] } }, { $pull: { organisations: organisationId } });

  //Event.removeMany({ _id: { $in: this.events }}, next);
})
@modelOptions({
  schemaOptions: {
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: function (doc, ret) {
        // remove these props when object is serialized
        delete ret.joiningPassword;
      },
    },
    toObject: {
      virtuals: true,
    },
  },
  options: { allowMixed: Severity.ALLOW },
})
class Organisation extends Model {
  /**
   * The user that created the organisation.
   *
   * NB: Ownership is not currently transferable.
   */
  @prop({ required: true, ref: () => UserClass, type: Schema.Types.ObjectId })
  public owner!: Ref<UserClass>;

  /**
   * The name of the organisation.
   */
  @prop({ required: true })
  public name!: string;

  /**
   * The organisation's current balance (i.e., score).
   */
  @prop({ required: true, default: 0.0 })
  public balance!: number;

  /**
   * The set of controls implemented by the organisation.
   */
  @prop({ required: true, type: ImplementedControl, default: [] })
  public controls!: ImplementedControl[];

  /**
   * The size classification of the organisation.
   *
   * @todo Refactor to use enum properly (see {@link Enums.SIZE}).
   */
  @prop({ required: true, enum: sizes, default: sizes[SIZE.MEDIUM] })
  public size!: string;

  /**
   * The industrial classification of the organisation.
   *
   * @todo Refactor to use enum properly (see {@link Enums.industries}).
   */
  @prop({ required: true, enum: industries, default: industries['J'] })
  public industry!: string;

  /**
   * The set of players in the organisation (for multi-player games).
   */
  @prop({ required: true, ref: () => UserClass, type: Schema.Types.ObjectId })
  public members!: Ref<UserClass>[];

  /**
   * The joining code players can use to join the organisation (for multi-
   * player games).
   */
  @prop({ required: true, unique: true })
  public joiningCode!: string;

  /**
   * The (optional) password that players must provide to join the organisation.
   */
  @prop({ required: false })
  public joiningPassword?: string;

  /**
   * The balance of the organisation over the course of its game.
   */
  @prop({ required: true, default: [] })
  public pastBalances: number[];

  /**
   * The set of events that have occurred to the organisation over the course
   * of a game.
   *
   * @todo Add additional event information.
   */
  @prop({ required: true, type: ExperiencedEvent, default: [] })
  public events!: ExperiencedEvent[];
}

export { Organisation as OrganisationClass };
