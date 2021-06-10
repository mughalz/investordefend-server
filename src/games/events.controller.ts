/**
 * This module represents the controller for all routes under `/events`.
 *
 * It also contains the OpenAPI definition of each route.
 *
 * @category Events
 * @category Controllers
 *
 * @module EventsController
 */

import { EventClass } from '../models';
import { Controller } from '../_helpers/base.controller';

/**
 * Represents the `/events` controller.
 *
 * This controller defines the following requests as requiring administrator
 * permissions:
 *
 * - ‘create’;
 * - ‘getAll’;
 * - ‘update’; and
 * - ‘delete’.
 *
 * @category Events
 */
export default class EventsController extends Controller<EventClass> {
  /**
   * Initialise the controller.
   */
  constructor() {
    super('events', { create: true, getAll: true, update: true, delete: true });

    this._addPOSTRoutes();
    this._addGETRoutes();
    this._addPATCHRoutes();
    this._addDELETERoutes();
  }
}
