/**
 * This module represents the controller for all routes under `/controls`.
 *
 * It also contains the OpenAPI definition of each route.
 *
 * @category Controls
 * @category Controllers
 *
 * @module ControlsController
 */

import { ControlClass } from '../models';
import { Controller } from '../_helpers/base.controller';

/**
 * Represents the `/controls` controller.
 *
 * This controller defines the following requests as requiring administrator
 * permissions:
 *
 * - ‘create’;
 * - ‘update’; and
 * - ‘delete’.
 *
 * @category Controls
 */
export default class ControlsController extends Controller<ControlClass> {
  /**
   * Initialise the controller.
   */
  constructor() {
    super('controls', { create: true, update: true, delete: true });

    this._addPOSTRoutes();
    this._addGETRoutes();
    this._addPATCHRoutes();
    this._addDELETERoutes();
  }
}
