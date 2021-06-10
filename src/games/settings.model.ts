/**
 * This module defines the Setting model, which represents an instance of a
 * customisable game setting.
 *
 * It also contains the OpenAPI definition of a `Setting`.
 *
 * @category Games
 * @category Models
 *
 * @module SettingModel
 */

import { prop, modelOptions, Severity } from '@typegoose/typegoose';

/**
 * Represents an Setting object in the system.
 *
 * @category Games
 * @category Models
 *
 * @swagger
 * components:
 *   schemas:
 *     Setting:
 *       type: object
 *       properties:
 *         key:
 *           type: string
 *           required: true
 *           format: uuid
 *           description: The setting key.
 *           example: foo
 *         value:
 *           required: true
 *           description: The setting value. Can be any type.
 *           example: bar
 */
@modelOptions({ options: { allowMixed: Severity.ALLOW } })
class Settings {
  /**
   * The unique key for identifying the setting.
   */
  @prop({ required: true, unique: true })
  public key!: any;

  /**
   * The value of the setting.
   */
  @prop({ required: true })
  public value!: any;
}

export { Settings as SettingsClass };
