/**
 * This module represents the controller for all routes under `/securityAreas`.
 *
 * It also contains the OpenAPI definition of each route.
 *
 * @category Security Areas
 * @category Controllers
 *
 * @module SecurityAreasController
 */

import { Request, Response } from 'express';

import { SecurityAreaClass } from '../models';
import { Controller } from '../_helpers/base.controller';
import SecurityAreasService from './securityAreas.service';
import { authorise } from '../_middleware';

/**
 * Represents the `/securityAreas` controller.
 *
 * This controller defines the following requests as requiring administrator
 * permissions:
 *
 * - ‘create’;
 * - ‘update’; and
 * - ‘delete’.
 *
 * @category Security Areas
 */
export default class SecurityAreasController extends Controller<SecurityAreaClass> {
  /**
   * Initialise the controller.
   */
  constructor() {
    super('securityAreas', { create: true, update: true, delete: true });

    this._addPOSTRoutes();
    this._addGETRoutes();
    this._addPATCHRoutes();
    this._addDELETERoutes();
  }

  /**
   * Register HTTP GET routes in addition to those provided by base class.
   *
   * @category GET
   * @category Security Areas
   */
  protected _addGETRoutes(): void {
    /**
     * @swagger
     * /securityAreas/get/sources:
     *   get:
     *     tags: [SecurityAreas]
     *     summary: Retrieve all possible source values.
     *     description: Retrieve a list of all possible security area source values.
     *     responses:
     *       '200':
     *         description: Returned.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ⟨source⟩:
     *                   type: string
     *                   description: The name of the source (indexed by the slug).
     *                   example: Original
     *       '401':
     *         $ref: '#/components/responses/Unauthorised'
     */
    this.router.get('/get/sources', authorise(), this.getSources);

    super._addGETRoutes();
  }

  /*eslint-disable @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-unused-vars */

  /**********************************
   *
   *	GET routes.
   *
   **********************************/

  /**
   * Pass a source enum request to the security areas service for handling.
   *
   * @category GET
   * @category Security Areas
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected getSources(req: Request, res: Response, next: any): void {
    SecurityAreasService.getSources()
      .then((sources: Record<string, string>) => res.json(sources))
      .catch(next);
  }

  /*eslint-enable @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-unused-vars */
}
