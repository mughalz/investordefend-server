/**
 * This module defines the SecurityArea model, which represents an security area
 * by which events and controls can be classified.
 *
 * It also contains the OpenAPI definition of a `SecurityArea`.
 *
 * @category Security Areas
 * @category Models
 *
 * @module SecurityAreaModel
 */

import { Schema } from 'mongoose';
import { modelOptions, prop, Ref } from '@typegoose/typegoose';

import { Model } from '../_helpers';

/**
 * Represents a SecurityArea object in the system.
 *
 * @category Security Areas
 * @category Models
 *
 * @swagger
 * components:
 *   schemas:
 *     SecurityArea:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           required: true
 *           format: uuid
 *           description: The security area's ID.
 *           example: 123456789abcdef01234567
 *         number:
 *           type: string
 *           required: true
 *           description: The 'number' of the security area. Please note
 *             that this does not necessarily have to be a number, it is just
 *             however the area is uniquely identified in whatever standard you
 *             are importing.
 *           example: 1.3
 *         name:
 *           type: string
 *           required: true
 *           description: The name of the security area.
 *           example: Fooing bars
 *         summary:
 *           type: string
 *           description: A brief summary of what the security area is.
 *           example: Ensure that all bars are correctly fooed.
 *         description:
 *           type: string
 *           description: A description of what the security area is.
 *           example: Ensure that all bars are correctly fooed.
 *         source:
 *           type: string
 *           required: true
 *           description: The source from which the security area is derived.
 *           example: Original
 *         parent:
 *           type: string
 *           format: uuid
 *           description: Reference to the security area's parent security area.
 *           example: 123456789abcdef01234567
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
class SecurityArea extends Model {
  /**
   * The 'number' of the security area.
   *
   * NB: this does not necessarily have to be a number, it is just however the
   * area is uniquely identified in whatever standard you are importing.
   */
  @prop({ required: true })
  public number!: string;

  /**
   * The name of the security area.
   */
  @prop({ required: true })
  public name!: string;

  /**
   * A brief summary of what the security area represents.
   */
  @prop()
  public summary?: string;

  /**
   * A description of what the security area represents.
   */
  @prop()
  public description?: string;

  /**
   * The source from which the security area is derived.
   */
  @prop({ required: true })
  public source!: string;

  /**
   * Any parent security area(s).
   */
  @prop({ ref: () => SecurityArea, type: Schema.Types.ObjectId })
  public parent?: Ref<SecurityArea>;

  @prop({
    ref: () => SecurityArea,
    foreignField: 'parent',
    localField: '_id',
  })
  public children?: Ref<SecurityArea>[];
}

export { SecurityArea as SecurityAreaClass };
