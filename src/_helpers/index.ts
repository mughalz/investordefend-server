/**
 * This module re-exports helper functionality for neater importing.
 *
 * @category Helpers
 * @category Re-export
 *
 * @module Helpers
 *
 * @hidden
 */

import * as db from './db';
import sendMail from './email';
import swaggerSpec from './swagger';
import { SIZE, sizes, industries, AssetLocation, GameState, GameType, randomEnum } from './enums';
import { Service, ServiceWithAuth } from './base.service';
import { Model, ModelWithTimestamps } from './base.model';
/*
 * When trying to re-export the Base Controller from this file I ran into a
 * strange issue in which I could not successfully import it in any others.
 * I'm not sure what the problem was, but importing directly from the module
 * fixes it.
 */
//import { Controller } from './base.controller';

export {
  db,
  sendMail,
  swaggerSpec,
  SIZE,
  sizes,
  industries,
  AssetLocation,
  GameState,
  GameType,
  Service,
  ServiceWithAuth,
  randomEnum,
  Model,
  ModelWithTimestamps,
};
