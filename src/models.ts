/**
 * This module re-exports object schema classes for neater importing.
 *
 * @category Models
 * @category Re-export
 *
 * @module Schemas
 * @hidden
 */

import { UserClass } from './users/user.model';
import { RefreshTokenClass } from './users/refreshToken.model';
import { ControlClass, ImplementedControl } from './games/control.model';
import { SecurityAreaClass } from './games/securityArea.model';
import { EventClass, ExperiencedEvent } from './games/event.model';
import { GameClass } from './games/game.model';
import { SettingsClass } from './games/settings.model';
import { OrganisationClass } from './organisations/organisation.model';

export {
  UserClass,
  RefreshTokenClass,
  ControlClass,
  ImplementedControl,
  SecurityAreaClass,
  EventClass,
  ExperiencedEvent,
  GameClass,
  SettingsClass,
  OrganisationClass,
};
