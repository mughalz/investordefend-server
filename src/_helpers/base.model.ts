/**
 * This module represents the base functionality common to all models and
 * document definitions.
 *
 * @category Base
 * @category Models
 *
 * @module BaseModels
 */

import { Types } from 'mongoose';
import { TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';

/**
 * Provides base functionality that is common to all models.
 *
 * @category Base
 *
 * @abstract
 */
abstract class Model {
  id!: Types.ObjectId;
}

/**
 * Provides base functionality that is common to all timestamped models.
 *
 * @category Base
 *
 * @abstract
 */
abstract class ModelWithTimestamps extends TimeStamps {}

export { Model, ModelWithTimestamps };
