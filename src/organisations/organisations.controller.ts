/**
 * This module represents the controller for all routes under `/organisations`.
 *
 * It also contains the OpenAPI definition of each route.
 *
 * @category Organisations
 * @category Controllers
 *
 * @module OrganisationsController
 */

import { Request, Response } from 'express';
import Joi from 'joi';
import JoiObjectId from 'joi-oid';
import { Types } from 'mongoose';

import { validateRequest, authorise } from '../_middleware';
import { organisationsService } from '../services';
import OrganisationsService from './organisations.service';
import { OrganisationClass, ControlClass } from '../models';
import { Controller } from '../_helpers/base.controller';
import { AtLeast } from '../../typings';

/**
 * Represents the `/organisations` controller.
 *
 * This controller defines the following requests as requiring administrator
 * permissions:
 *
 * - ‘get all’; and
 * - ‘remove control’.
 *
 * @category Organisations
 */
export default class OrganisationsController extends Controller<OrganisationClass> {
  /**
   * Initialise the controller.
   */
  constructor() {
    super('organisations', { getAll: true });

    this._addPOSTRoutes();
    this._addGETRoutes();
    this._addPATCHRoutes();
    this._addDELETERoutes();
  }

  /**
   * Register HTTP GET routes in addition to those provided by base class.
   *
   * @category GET
   * @category Organisations
   */
  protected _addGETRoutes(): void {
    /**
     * @swagger
     * /organisations/get/sizes:
     *   get:
     *     tags: [Organisations]
     *     summary: Retrieve all possible size values.
     *     description: Retrieve a list of all possible organisation size values.
     *     responses:
     *       '200':
     *         description: Returned.
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Size'
     *               description: The retrieved list of possible values.
     *               uniqueItems: true
     *       '401':
     *         $ref: '#/components/responses/Unauthorised'
     */
    this.router.get('/get/sizes', authorise(), this.getSizes);

    /**
     * @swagger
     * /organisations/get/industries:
     *   get:
     *     tags: [Organisations]
     *     summary: Retrieve all possible industry values.
     *     description: Retrieve a list of all possible organisation industry values.
     *     responses:
     *       '200':
     *         description: Returned.
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Industry'
     *               description: The list of possible values.
     *               uniqueItems: true
     *       '401':
     *         $ref: '#/components/responses/Unauthorised'
     */
    this.router.get('/get/industries', authorise(), this.getIndustries);

    /**
     * @swagger
     * /organisations/:id/get/controls/new:
     *   get:
     *     tags: [Organisations]
     *     summary: Retrieve the list of available controls.
     *     description: Retrieve a list of all available controls for a given organisation.
     *     responses:
     *       '200':
     *         description: Returned.
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Control'
     *       '401':
     *         $ref: '#/components/responses/Unauthorised'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     */
    this.router.get('/:id/get/controls/new', authorise(), this.getNewControls);

    super._addGETRoutes();
  }

  /**
   * Register HTTP PATCH routes in addition to those provided by base class.
   *
   * @category PATCH
   * @category Organisations
   */
  protected _addPATCHRoutes(): void {
    /**
     * @swagger
     * /organisations/add/member:
     *   patch:
     *     tags: [Organisations]
     *     summary: Add a user to an organisation.
     *     description: Add a user to an organisation as a non-owner member.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               joiningCode:
     *                 type: string
     *                 required: true
     *                 description: The joining code for the organisation to add to.
     *                 example: 1234
     *               joiningPassword:
     *                 type: string
     *                 description: The joining password for the organisation to add to.
     *                 example: 1234
     *               newMemberId:
     *                 type: string
     *                 required: true
     *                 format: uuid
     *                 description: The ID of the user to add.
     *                 example: 123456789abcdef01234567
     *     responses:
     *       '200':
     *         description: User added to organisation.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Organisation'
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorised'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     */
    this.router.patch('/add/member', authorise(), this.addMemberSchema, this.addMember);

    /**
     * @swagger
     * /organisations/remove/member:
     *   patch:
     *     tags: [Organisations]
     *     summary: Remove a member from an organisation.
     *     description: Removes a given user from a given organisation, but do not delete the user.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               organisationId:
     *                 type: string
     *                 required: true
     *                 format: uuid
     *                 description: The ID of the organisation to remove the member from.
     *                 example: 123456789abcdef01234567
     *               memberId:
     *                 type: string
     *                 required: true
     *                 format: uuid
     *                 description: The ID of the user to remove as a member.
     *                 example: 123456789abcdef01234567
     *     responses:
     *       '204':
     *         description: User removed as member.
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorised'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     */
    this.router.patch('/remove/member', authorise(), this.removeMemberSchema, this.removeMember);

    /**
     * @swagger
     * /organisations/add/control:
     *   patch:
     *     tags: [Organisations]
     *     summary: Add a control to an organisation.
     *     description: Implement a new control for an organisation.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               organisationId:
     *                 type: string
     *                 required: true
     *                 format: uuid
     *                 description: The ID of the organisation implementing the new control.
     *                 example: 123456789abcdef01234567
     *               newControlId:
     *                 type: string
     *                 required: true
     *                 format: uuid
     *                 description: The ID of the control to implement.
     *                 example: 123456789abcdef01234567
     *     responses:
     *       '200':
     *         description: Control added as member.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Organisation'
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorised'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     */
    this.router.patch('/add/control', authorise(), this.addControlSchema, this.addControl);

    /**
     * @swagger
     * /organisations/remove/control:
     *   patch:
     *     tags: [Organisations]
     *     summary: Remove a control from an organisation.
     *     description: Removes a given control from a given organisation.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               organisationId:
     *                 type: string
     *                 required: true
     *                 format: uuid
     *                 description: The ID of the organisation to remove the control from.
     *                 example: 123456789abcdef01234567
     *               controlId:
     *                 type: string
     *                 required: true
     *                 format: uuid
     *                 description: The ID of the control to remove.
     *                 example: 123456789abcdef01234567
     *     responses:
     *       '204':
     *         description: Control removed from organisation.
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorised'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     */
    this.router.patch('/remove/control', authorise(true), this.removeControlSchema, this.removeControl);

    super._addPATCHRoutes();
  }

  /*eslint-disable @typescript-eslint/explicit-module-boundary-types */

  /**********************************
   *
   *	POST routes.
   *
   **********************************/

  /**
   * Pass an organisation creation request on to the organisations service for
   * handling.
   *
   * @category POST
   * @category CRUD
   * @category Organisations
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected create(req: Request, res: Response, next: any): void {
    const { id: userId }: { id: Types.ObjectId } = req['user'];
    req.body.newDetails.owner = userId;
    req.body.newDetails.members = [userId];

    super.create(req, res, next);
  }

  /*eslint-disable @typescript-eslint/no-unused-vars */

  /**********************************
   *
   *	GET routes.
   *
   **********************************/

  /**
   * Pass a size enum request to the organisations service for handling.
   *
   * @category GET
   * @category Organisations
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected getSizes(req: Request, res: Response, next: any): void {
    res.json(OrganisationsService.getSizes());
  }

  /**
   * Pass an industry enum request to the organisations service for handling.
   *
   * @category GET
   * @category Organisations
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected getIndustries(req: Request, res: Response, next: any): void {
    res.json(OrganisationsService.getIndustries());
  }

  /*eslint-enable @typescript-eslint/no-unused-vars */

  /**
   * Pass an available controls request to the organisations service for handling.
   *
   * @category GET
   * @category Organisations
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected getNewControls(req: Request, res: Response, next: any): void {
    const id: Types.ObjectId = new Types.ObjectId(req.params['id']);

    organisationsService
      .getNewControls(id)
      .then((newControls: ControlClass[]) => res.json(newControls))
      .catch(next);
  }

  /**********************************
   *
   *	PATCH routes.
   *
   **********************************/

  /**
   * Pass an organistion update request to the organisations service for handling.
   *
   * @category PATCH
   * @category Organisations
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected update(req: Request, res: Response, next: any): void {
    const { id: userId }: { id: Types.ObjectId } = req['user'];
    const { updatedDetails }: { updatedDetails: AtLeast<OrganisationClass, 'id'> } = req.body;

    organisationsService
      .updateWithAuth(userId, updatedDetails)
      .then((organisation: OrganisationClass) => res.json(organisation))
      .catch(next);
  }

  /**
   * Validate the request data.
   *
   * @category Schema
   * @category PATCH
   * @category Organisations
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   *
   * @hidden
   */
  protected addMemberSchema(req: Request, res: Response, next: any): void {
    const schema = Joi.object({
      joiningCode: Joi.string().required(),
      joiningPassword: Joi.string(),
      newMemberId: JoiObjectId,
    });
    validateRequest(req, next, schema);
  }

  /**
   * Pass an add member request to the organisations service for handling.
   *
   * NB: This is a PATCH rather than a POST request because the user is not
   * created; the organisation is just updated to reference it.
   *
   * @category PATCH
   * @category Organisations
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected addMember(req: Request, res: Response, next: any): void {
    const { joiningCode, joiningPassword }: { joiningCode: string; joiningPassword: string } = req.body;
    let { newMemberId }: { newMemberId: Types.ObjectId } = req.body;
    if (!newMemberId) newMemberId = req['user']['id'];

    organisationsService
      .addMember({ joiningCode, joiningPassword, newMemberId })
      .then((organisation: OrganisationClass) => res.json(organisation))
      .catch(next);
  }

  /**
   * Validate the request data.
   *
   * @category Schema
   * @category PATCH
   * @category Organisations
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   *
   * @hidden
   */
  protected removeMemberSchema(req: Request, res: Response, next: any): void {
    const schema = Joi.object({
      organisationId: JoiObjectId.required(),
      memberId: JoiObjectId.required(),
    });
    validateRequest(req, next, schema);
  }

  /**
   * Pass a remove member request to the organisations service for handling.
   *
   * NB: This is a PATCH rather than a DELETE request because the user is not
   * created; the organisation is just updated to dereference it.
   *
   * @category PATCH
   * @category Organisations
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected removeMember(req: Request, res: Response, next: any): void {
    const { id: userId }: { id: Types.ObjectId } = req['user'];
    const { organisationId, memberId } = req.body;

    organisationsService
      .removeMember({ ownerId: userId, organisationId, memberId })
      .then(() => {
        res.status(204).send();
      })
      .catch(next);
  }

  /**
   * Validate the request data.
   *
   * @category Schema
   * @category PATCH
   * @category Organisations
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   *
   * @hidden
   */
  protected addControlSchema(req: Request, res: Response, next: any): void {
    const schema = Joi.object({
      organisationId: JoiObjectId.required(),
      newControlId: JoiObjectId.required(),
    });
    validateRequest(req, next, schema);
  }

  /**
   * Pass a single control implementation request to the organisations service
   * for handling.
   *
   * NB: This is a PATCH rather than a POST request because the control is not
   * created; the organisation is just updated to reference it.
   *
   * @category PATCH
   * @category Organisations
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected addControl(req: Request, res: Response, next: any): void {
    const { organisationId, newControlId }: { organisationId: Types.ObjectId; newControlId: Types.ObjectId } = req.body;

    organisationsService
      .addControl({ organisationId, newControlId })
      .then((organisation: OrganisationClass) => res.json(organisation))
      .catch(next);
  }

  /**
   * Validate the request data.
   *
   * @category Schema
   * @category PATCH
   * @category Organisations
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   *
   * @hidden
   */
  protected removeControlSchema(req: Request, res: Response, next: any): void {
    const schema = Joi.object({
      organisationId: JoiObjectId.required(),
      controlId: JoiObjectId.required(),
    });
    validateRequest(req, next, schema);
  }

  /**
   * Pass a single control removal request to the organisations service for
   * handling.
   *
   * NB: This is a PATCH rather than a DELETE request because the control is not
   * deleted; the organisation is just updated to dereference it.
   *
   * @category PATCH
   * @category Organisations
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected removeControl(req: Request, res: Response, next: any): void {
    const { organisationId, controlId }: { organisationId: Types.ObjectId; controlId: Types.ObjectId } = req.body;

    organisationsService
      .removeControl({ organisationId, controlId })
      .then(() => {
        res.status(204).send();
      })
      .catch(next);
  }

  /**********************************
   *
   *	DELETE routes.
   *
   **********************************/

  /**
   * Pass an organisation deletion request to the organisations service for
   * handling.
   *
   * @category DELETE
   * @category Organisations
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected delete(req: Request, res: Response, next: any): void {
    const { id: userId }: { id: Types.ObjectId } = req['user'];
    const { id }: { id: Types.ObjectId } = req.body;

    organisationsService
      .deleteWithAuth(userId, id)
      .then(() => {
        res.status(204).send();
      })
      .catch(next);
  }
  /*eslint-enable @typescript-eslint/explicit-module-boundary-types */
}
