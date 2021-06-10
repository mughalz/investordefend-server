/**
 * This module defines the Event model, which represents an event or incident.
 *
 * It also contains the OpenAPI definition of a `Event`.
 *
 * @category Events
 * @category Models
 *
 * @module EventModel
 */

import { Schema, Types } from 'mongoose';
import { modelOptions, prop, Ref } from '@typegoose/typegoose';

import { SecurityAreaClass, GameClass, ImplementedControl } from '../models';
import { Model } from '../_helpers';

/**
 * Represents a Event object in the system.
 *
 * @category Events
 * @category Models
 *
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           required: true
 *           format: uuid
 *           description: The control's ID.
 *           example: 123456789abcdef01234567
 *         game:
 *           type: string
 *           required: true
 *           format: uuid
 *           description: Reference to the game in which the event occurred.
 *           example: 123456789abcdef01234567
 *         date:
 *           type: string
 *           format: date-time
 *           required: true
 *           description: The datetime at which the event occurred.
 *           example: 2021-03-04T10:30:41.090+00:00
 *         cost:
 *           type: number
 *           required: true
 *           format: float
 *           description: The cost of the event.
 *           example: 1000.00
 *         likelihood:
 *           type: number
 *           required: true
 *           format: float
 *           description: The likelihood that the control would happen.
 *           example: 54.0
 *         securityAreas:
 *           type: array
 *           required: true
 *           items:
 *             type: string
 *             format: uuid
 *           uniqueItems: true
 *           description: References to the security areas that the event relates to.
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
})
class Event extends Model {
  /**
   * The game in which the event has occured.
   */
  @prop({ required: true, ref: () => GameClass, type: Schema.Types.ObjectId })
  public game!: Ref<GameClass>;

  /**
   * The game turn on which the event occurred.
   */
  @prop({ required: true })
  public turn!: number;

  /**
   * The base, unmitigated cost of the event.
   */
  @prop({ required: true })
  public cost!: number;

  /**
   * The asset(s) against which the event occured.
   */
  @prop({ required: true })
  public asset!: string;

  /**
   * The threat actor to which the event is attributed.
   */
  @prop({ required: true })
  public threatActor!: string;

  /**
   * The security areas under which the event is classified.
   */
  @prop({ required: true, ref: () => SecurityAreaClass, type: Schema.Types.ObjectId, default: [] })
  public securityAreas!: Ref<SecurityAreaClass>[];
}

class ExperiencedEvent extends Event {
  /**
   * The ObjectID (required for type checking).
   */
  id!: Types.ObjectId;

  @prop({ required: true, default: false })
  mitigated: boolean;

  /**
   * How much the control has mitigated so far.
   */
  @prop({ ref: () => ImplementedControl, type: Schema.Types.ObjectId })
  mitigatedBy?: Ref<ImplementedControl>;

  @prop({})
  mitigatedCost?: number;
}

export { Event as EventClass, ExperiencedEvent };
