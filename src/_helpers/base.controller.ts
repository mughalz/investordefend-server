/**
 * This module represents the base set of functionality common to all Exporess
 * controllers.
 *
 * It also contains the OpenAPI definition of each route.
 *
 * Finally, it also demonstrates the pattern that all extending controllers
 * should follow:
 *
 * - separate route handler methods from schema validation methods; and
 * - add additional routes via extended `_add⟨HTTP verb⟩Routes()` methods called
 *   from the constructor (and ending in `super` calls).
 *
 * Finally, it also demonstrates the code layout that all extending controllers
 * should follow:
 *
 * - define all protected `_add⟨HTTP verb⟩Routes()` methods in POST, GET, PATCH,
 *   DELETE order; then
 * - define all route handler functions in the same order, defining validation
 *   handlers beforehand where required.
 *
 * @category Base
 * @category Controllers
 *
 * @module BaseController
 */

import express, { Request, Response } from 'express';
import Joi from 'joi';
import JoiObjectId from 'joi-oid';
import { Types } from 'mongoose';

import { validateRequest, authorise } from '../_middleware';
import {
  securityAreasService,
  controlsService,
  usersService,
  organisationsService,
  eventsService,
  gamesService,
} from '../services';
import { AnyModel } from '../../typings';

/**
 * Provides base functionality that is common to all controllers.
 *
 * @category Base
 *
 * @abstract
 *
 * @typeParam T  The document class that is handled by the controller.
 */
export abstract class Controller<T> {
  /**
   * The Express router for this route.
   */
  public router = express.Router();

  /**
   * The parent route name.
   */
  protected _route: string;

  /**
   * The primary service for `T`.
   */
  protected _service;

  /**
   * Any routes that require administrator authorisation to access.
   *
   * @todo Replace with array.
   */
  protected _adminRoutes: Record<string, boolean>;

  /**
   * Initialise the controller.
   *
   * @param route  The name of the parent route (e.g., ‘users’).
   * @param adminRoutes  The list of admin-only routes, if any.
   *
   * @todo Replace `adminRoutes` with array.
   */
  constructor(route: string, adminRoutes: Record<string, boolean> = {}) {
    this._route = route;
    this._adminRoutes = adminRoutes;

    switch (this._route) {
      case 'securityAreas':
        this._service = securityAreasService;
        break;
      case 'controls':
        this._service = controlsService;
        break;
      case 'users':
        this._service = usersService;
        break;
      case 'organisations':
        this._service = organisationsService;
        break;
      case 'events':
        this._service = eventsService;
        break;
      case 'games':
        this._service = gamesService;
        break;
      default:
        throw 'No service available for route.';
    }

    /*
     * Required for all callbacks.
     * See https://stackoverflow.com/a/55089107/4580273
     */
    this.create = this.create.bind(this);
    this.getValue = this.getValue.bind(this);
    this.get = this.get.bind(this);
    this.getAll = this.getAll.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);

    this.router = express.Router();
  }

  /**
   * Register all HTTP POST routes.
   *
   * @category POST
   * @category Base
   */
  protected _addPOSTRoutes(): void {
    /**
     * @swagger
     * /⟨model⟩s/create:
     *   post:
     *     tags: [Base]
     *     summary: Create a new object.
     *     description: Create a new document for a given model.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               newDetails:
     *                 type: object
     *                 oneOf:
     *                   - $ref: '#/components/schemas/Control'
     *                   - $ref: '#/components/schemas/Event'
     *                   - $ref: '#/components/schemas/Game'
     *                   - $ref: '#/components/schemas/SecurityArea'
     *                   - $ref: '#/components/schemas/Organisation'
     *                   - $ref: '#/components/schemas/RefreshToken'
     *                   - $ref: '#/components/schemas/User'
     *                 description: The details of the object to create.
     *     responses:
     *       '201':
     *         description: Created.
     *         content:
     *           application/json:
     *             schema:
     *               description: The newly-created object.
     *               oneOf:
     *                 - $ref: '#/components/schemas/Control'
     *                 - $ref: '#/components/schemas/Event'
     *                 - $ref: '#/components/schemas/Game'
     *                 - $ref: '#/components/schemas/SecurityArea'
     *                 - $ref: '#/components/schemas/Organisation'
     *                 - $ref: '#/components/schemas/RefreshToken'
     *                 - $ref: '#/components/schemas/User'
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorised'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     */
    this.router.post('/create', authorise(this._adminRoutes.create), this.createSchema, this.create);
  }

  /**
   * Register all HTTP GET routes.
   *
   * @category GET
   * @category Base
   */
  protected _addGETRoutes(): void {
    /**
     * @swagger
     * /⟨model⟩s/:modelId/get/:fieldName:
     *   get:
     *     tags: [Base]
     *     summary: Retrieve specific model data.
     *     description: Retrieve the data held in a single field of the model object.
     *     parameters:
     *       - in: path
     *         name: ⟨model⟩Id
     *         required: true
     *         description: The ID of the model to retrieve data from.
     *         schema:
     *           type: string
     *           format: uuid
     *         example: 123456789abcdef01234567
     *       - in: path
     *         name: fieldName
     *         required: true
     *         description: The name of the field to retrieve data from.
     *         schema:
     *           type: string
     *         example: name
     *     responses:
     *       '200':
     *         description: Returned.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 value:
     *                   anyOf:
     *                   - type: string
     *                   - type: number
     *                   - type: object
     *                   - type: boolean
     *                   - type: array
     *                 description: The retrieved field's value.
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorised'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     */
    this.router.get('/:id/get/:fieldName', authorise(this._adminRoutes.getValue), this.getValue);

    /**
     * @swagger
     * /⟨model⟩s/:modelId:
     *   get:
     *     tags: [Base]
     *     summary: Retrieve a model.
     *     description: Retrieve a given model object.
     *     parameters:
     *       - in: path
     *         name: modelId
     *         required: true
     *         description: The ID of the model to retrieve.
     *         schema:
     *           type: string
     *           format: uuid
     *         example: 123456789abcdef01234567
     *     responses:
     *       '200':
     *         description: Returned.
     *         content:
     *           application/json:
     *             schema:
     *               oneOf:
     *                 - $ref: '#/components/schemas/Control'
     *                 - $ref: '#/components/schemas/Event'
     *                 - $ref: '#/components/schemas/Game'
     *                 - $ref: '#/components/schemas/SecurityArea'
     *                 - $ref: '#/components/schemas/Organisation'
     *                 - $ref: '#/components/schemas/RefreshToken'
     *                 - $ref: '#/components/schemas/User'
     *               description: The retrieved object.
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorised'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     */
    this.router.get('/:id', authorise(this._adminRoutes.get), this.get);

    /**
     * @swagger
     * /⟨model⟩s/:
     *   get:
     *     tags: [Base]
     *     summary: Retrieve all objects.
     *     description: Retrieve all of a given model object.
     *     responses:
     *       '200':
     *         description: Returned.
     *         content:
     *           application/json:
     *             schema:
     *               oneOf:
     *                 - $ref: '#/components/schemas/Control'
     *                 - $ref: '#/components/schemas/Event'
     *                 - $ref: '#/components/schemas/Game'
     *                 - $ref: '#/components/schemas/SecurityArea'
     *                 - $ref: '#/components/schemas/Organisation'
     *                 - $ref: '#/components/schemas/RefreshToken'
     *                 - $ref: '#/components/schemas/User'
     *               description: The retrieved object(s).
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorised'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     */
    this.router.get('/', authorise(this._adminRoutes.getAll), this.getAll);
  }

  /**
   * Register all HTTP PATCH routes.
   *
   * @category PATCH
   * @category Base
   */
  protected _addPATCHRoutes(): void {
    /**
     * @swagger
     * /⟨model⟩s/update:
     *   patch:
     *     tags: [Base]
     *     summary: Update a model.
     *     description: Update an existing model's details.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               newDetails:
     *                 type: object
     *                 schema:
     *                   oneOf:
     *                     - $ref: '#/components/schemas/Control'
     *                     - $ref: '#/components/schemas/Event'
     *                     - $ref: '#/components/schemas/Game'
     *                     - $ref: '#/components/schemas/SecurityArea'
     *                     - $ref: '#/components/schemas/Organisation'
     *                     - $ref: '#/components/schemas/RefreshToken'
     *                     - $ref: '#/components/schemas/User'
     *                   description: The new details for the object.
     *     responses:
     *       '200':
     *         description: Updated.
     *         content:
     *           application/json:
     *             schema:
     *               oneOf:
     *                 - $ref: '#/components/schemas/Control'
     *                 - $ref: '#/components/schemas/Event'
     *                 - $ref: '#/components/schemas/Game'
     *                 - $ref: '#/components/schemas/SecurityArea'
     *                 - $ref: '#/components/schemas/Organisation'
     *                 - $ref: '#/components/schemas/RefreshToken'
     *                 - $ref: '#/components/schemas/User'
     *               description: The newly-updated object.
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorised'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     */
    this.router.patch('/update', authorise(this._adminRoutes.update), this.updateSchema, this.update);
  }

  /**
   * Register all HTTP DELETE routes.
   *
   * @category DELETE
   * @category Base
   */
  protected _addDELETERoutes(): void {
    /**
     * @swagger
     * /⟨model⟩s/delete:
     *   delete:
     *     tags: [Base]
     *     summary: Delete an object.
     *     description: Delete a given object.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               id:
     *                 type: string
     *                 required: true
     *                 format: uuid
     *                 description: The ID of the object to delete.
     *                 example: 123456789abcdef01234567
     *     responses:
     *       '204':
     *         description: Object deleted.
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorised'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     */
    this.router.delete('/delete', authorise(this._adminRoutes.delete), this.deleteSchema, this.delete);
  }

  /*eslint-disable @typescript-eslint/explicit-module-boundary-types */

  /**********************************
   *
   *	POST routes.
   *
   **********************************/

  /**
   * Validate the request data.
   *
   * @category Schema
   * @category POST
   * @category Base
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   *
   * @hidden
   */
  protected createSchema(req: Request, res: Response, next: any): void {
    const schema = Joi.object({
      newDetails: Joi.object().required(),
    });
    validateRequest(req, next, schema);
  }

  /**
   * Pass an object creation request on to the `T` service for handling.
   *
   * @category POST
   * @category CRUD
   * @category Base
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected create(req: Request, res: Response, next: any): void {
    const { newDetails }: { newDetails: T } = req.body;

    this._service
      .create(newDetails)
      .then((newDocument) => res.status(201).json(newDocument))
      .catch(next);
  }

  /**********************************
   *
   *	GET routes.
   *
   **********************************/

  /**
   * Pass an object value query request on to the `T` service for handling.
   *
   * @category GET
   * @category CRUD
   * @category Base
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected getValue(req: Request, res: Response, next: any): void {
    const fieldName: string = req.params['fieldName'];
    const id: Types.ObjectId = new Types.ObjectId(req.params['id']);

    this._service
      .getValue(id, fieldName)
      .then((value) => res.status(200).json(value))
      .catch(next);
  }

  /**
   * Pass an object retrieval request on to the `T` service for handling.
   *
   * @category GET
   * @category CRUD
   * @category Base
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected get(req: Request, res: Response, next: any): void {
    const id: Types.ObjectId = new Types.ObjectId(req.params['id']);

    this._service
      .get(id)
      .then((document: AnyModel) => res.status(200).json(document))
      .catch(next);
  }

  /**
   * Pass an object bulk retrieval request on to the `T` service for handling.
   *
   * @category GET
   * @category CRUD
   * @category Base
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected getAll(req: Request, res: Response, next: any): void {
    this._service
      .getAll()
      .then((documents: AnyModel[]) => res.status(200).json(documents))
      .catch(next);
  }

  /**********************************
   *
   *	PATCH routes.
   *
   **********************************/

  /**
   * Validate the request data.
   *
   * @category Schema
   * @category PATCH
   * @category Base
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   *
   * @hidden
   */
  protected updateSchema(req: Request, res: Response, next: any): void {
    const schema = Joi.object({
      updatedDetails: Joi.object({ id: JoiObjectId.required() }).unknown(true),
    });
    validateRequest(req, next, schema);
  }

  /**
   * Pass an object update request on to the `T` service for handling.
   *
   * @category PATCH
   * @category CRUD
   * @category Base
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected update(req: Request, res: Response, next: any): void {
    const { updatedDetails }: { updatedDetails: Record<string, unknown> } = req.body;

    this._service
      .update(updatedDetails)
      .then((document: AnyModel) => res.json(document))
      .catch(next);
  }

  /**********************************
   *
   *	DELETE routes.
   *
   **********************************/

  /**
   * Validate the request data.
   *
   * @category Schema
   * @category DELETE
   * @category Base
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   *
   * @hidden
   */
  protected deleteSchema(req: Request, res: Response, next: any): void {
    const schema = Joi.object({
      id: JoiObjectId.required(),
    });
    validateRequest(req, next, schema);
  }

  /**
   * Pass an object deletion request on to the `T` service for handling.
   *
   * @category DELETE
   * @category CRUD
   * @category Base
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected delete(req: Request, res: Response, next: any): void {
    const { id }: { id: Types.ObjectId } = req.body;

    this._service.delete(id).then(res.status(204).send()).catch(next);
  }

  /*eslint-enable @typescript-eslint/explicit-module-boundary-types */
}
