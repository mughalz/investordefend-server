/**
 * This module defines additional types.
 *
 * @category Types
 *
 * @module TypeDefinitions
 *
 * @hidden
 */

import { Types } from 'mongoose';

import {
  UserClass,
  RefreshTokenClass,
  ControlClass,
  SecurityAreaClass,
  EventClass,
  GameClass,
  OrganisationClass,
} from '../src/models';

/**
 * Any type of object.
 */
export type AnyModel =
  | ControlClass
  | EventClass
  | GameClass
  | SecurityAreaClass
  | OrganisationClass
  | RefreshTokenClass
  | UserClass;

/**
 * A partial object with a certain number of required fields.
 */
export type AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/**
 * An asset onto which controls and events can be placed.
 *
 * @todo Add more values to allow for more per-industry display customisation.
 *   A possible resulting type could look like this:
 *   ```typescript
 *   export type Asset = {
 *     slug: string;
 *     name: string;
 *     description?: string;
 *     img?: string;
 *     location: string;
 *     probability: number;
 *     loc: {
 *       environment: string;
 *       x: number;
 *       y: number;
 *     };
 *     industry?: string;
 *   }
 *   ```
 */
export type Asset = {
  slug: string;
  name: string;
  description?: string;
  img: string;
  location: string;
  probability: number;
};

/**
 * The threat actor responsible for an incident.
 */
export type ThreatActor = {
  slug: string;
  name: string;
  probability: number;
  includeFrom?: number;
  description?: string;
  img?: string;
  costModifier: number;
};

/**
 * A configurable game setting.
 */
export type Setting = {
  id?: Types.ObjectId;
  key: string;
  value: any;
  description?: string;
};
