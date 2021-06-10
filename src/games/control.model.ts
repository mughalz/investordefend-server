/**
 * This module defines the Control model, which represents a security control
 * measure that organisations may implement to mitigate the risk and cost of
 * related incidents.
 *
 * It also contains the OpenAPI definition of a `Control`.
 *
 * @category Controls
 * @category Models
 *
 * @module ControlModel
 */

import { Schema } from 'mongoose';
import { modelOptions, prop, Ref, Severity } from '@typegoose/typegoose';

import { Model } from '../_helpers';
import { SecurityAreaClass } from '../models';

/**
 * Represents a Control object in the system.
 *
 * @category Controls
 * @category Models
 *
 * @swagger
 * components:
 *   schemas:
 *     Control:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           required: true
 *           format: uuid
 *           description: The control's ID.
 *           example: 123456789abcdef01234567
 *         number:
 *           type: string
 *           required: true
 *           description: The 'number' of the control. Please note
 *             that this does not necessarily have to be a number, it is just
 *             however the area is uniquely identified in whatever standard you
 *             are importing.
 *           example: 1.3.1
 *         name:
 *           type: string
 *           required: true
 *           description: The control's name.
 *           example: Foos
 *         summary:
 *           type: string
 *           description: A brief summary of what the control is and does.
 *           example: Foos bars by bazzing goos.
 *         description:
 *           type: string
 *           description: A description of what the control is and does.
 *           example: Foos bars by bazzing goos.
 *         cost:
 *           type: number
 *           required: true
 *           format: float
 *           description: The cost of the control
 *           example: 1000.00
 *         effectiveness:
 *           type: number
 *           required: true
 *           format: float
 *           description: The % cost reduction that the control will do on mitigation.
 *           example: 50.0
 *         asset:
 *           type: string
 *           description: The asset on which the control is implemented.
 *           example: desktop
 *         source:
 *           type: string
 *           required: true
 *           description: The source from which the control is derived.
 *           example: Original
 *         securityAreas:
 *           type: array
 *           required: true
 *           items:
 *             type: string
 *             format: uuid
 *           uniqueItems: true
 *           description: References to the security areas that the control mitigates against.
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
  options: {
    allowMixed: Severity.ALLOW,
  },
})
class Control extends Model {
  /**
   * The 'number' of the control.
   *
   * NB: this does not necessarily have to be a number, it is just however the
   * area is uniquely identified in whatever standard you are importing.
   */
  @prop({ required: true })
  public number!: string;

  /**
   * The name of the control.
   */
  @prop({ required: true })
  public name!: string;

  /**
   * A brief summary of what the control is and does.
   */
  @prop()
  public summary?: string;

  /**
   * A description of what the control is and does.
   */
  @prop()
  public description?: string;

  /**
   * The cost of implementing the control.
   */
  @prop({ required: true })
  public cost!: number;

  /**
   * The effectiveness of the control.
   */
  @prop({ required: true })
  public effectiveness!: number;

  /**
   * The asset on which the control may be implemented.
   */
  @prop()
  public asset?: string;

  /**
   * The source from which the control is derived.
   */
  @prop({ required: true })
  public source?: string;

  /**
   * The name of the control image file.
   */
  @prop()
  public img?: string;

  /**
   * Any effect that the control might have when implemented.
   */
  @prop()
  public effect?: {
    description: string;
    script: string;
  };

  /**
   * The security area(s) under which the control is classified.
   */
  @prop({ required: true, ref: () => SecurityAreaClass, type: Schema.Types.ObjectId, default: [] })
  public securityAreas!: Ref<SecurityAreaClass>[];
}

class ImplementedControl extends Control {
  /**
   * The turn on which the control was implemented.
   */
  @prop({ required: true })
  turnImplemented!: number;

  /**
   * How much the control has mitigated so far.
   */
  @prop({ required: true, default: 0.0 })
  mitigation!: number;
}

export { Control as ControlClass, ImplementedControl };
