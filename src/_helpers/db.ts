/**
 * This module provides an interface for the MongoDB document database.
 *
 * @category Helpers
 *
 * @module DocumentDBHelper
 */

import mongoose from 'mongoose';
import { getModelForClass } from '@typegoose/typegoose';

import {
  UserClass,
  RefreshTokenClass,
  GameClass,
  EventClass,
  ControlClass,
  OrganisationClass,
  SecurityAreaClass,
} from '../models';

import { SettingsClass } from '../games/settings.model';

import config from '../config';

const {
  db: { host, port, name },
} = config;

const connectionString = `mongodb://${host}:${port}/${name}`;

const connectionOptions = {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
};

mongoose.connect(connectionString, connectionOptions);

mongoose.connection.on('error', (error) => {
  console.error(error);
  process.exit(1);
});

mongoose.connection.on('connected', function () {
  console.debug('connected to mongo');
});

/*eslint-disable @typescript-eslint/no-explicit-any */
(<any>mongoose).Promise = global.Promise;
/*eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Check whether a given document's `ObjectID` is valid.
 *
 * @category Sanitisation
 *
 * @param id  The `ObjectID` to test.
 * @returns  Whether the ID is valid or not.
 */
export function isValidId(id: mongoose.Types.ObjectId): boolean {
  if (!id) throw 'No ID';
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * The current Mongoose connection, useful for testing the connection state.
 */
export const connection = mongoose.connection;

/**
 * Provides an interface for documents in the `users` collection.
 *
 * @category Models
 */
export const User = getModelForClass(UserClass);

/**
 * Provides an interface for documents in the `refreshtokens` collection.
 *
 * @category Models
 */
export const RefreshToken = getModelForClass(RefreshTokenClass);

/**
 * Provides an interface for documents in the `games` collection.
 *
 * @category Models
 */
export const Game = getModelForClass(GameClass);

/**
 * Provides an interface for documents in the `organisations` collection.
 *
 * @category Models
 */
export const Organisation = getModelForClass(OrganisationClass);

/**
 * Provides an interface for documents in the `controls` collection.
 *
 * @category Models
 */
export const Control = getModelForClass(ControlClass);

/**
 * Provides an interface for documents in the `events` collection.
 *
 * @category Models
 */
export const Event = getModelForClass(EventClass);

/**
 * Provides an interface for documents in the `securityareas` collection.
 *
 * @category Models
 */
export const SecurityArea = getModelForClass(SecurityAreaClass);

/**
 */
export const Settings = getModelForClass(SettingsClass);
