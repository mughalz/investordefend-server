/**
 * This module represents the controller for all routes under `/games`.
 *
 * It also contains the OpenAPI definition of each route.
 *
 * @category Games
 * @category Controllers
 *
 * @module GamesController
 */

import { Request, Response } from 'express';
import Joi from 'joi';
import JoiObjectId from 'joi-oid';
import { Types } from 'mongoose';

import { validateRequest, authorise } from '../_middleware';
import { gamesService } from '../services';
import GamesService from './games.service';
import { UserClass, GameClass, OrganisationClass } from '../models';
import { Controller } from '../_helpers/base.controller';
import { AtLeast, Setting } from '../../typings';

/**
 * Represents the `/games` controller.
 *
 * This controller defines no requests as requiring administrator
 * permissions.
 */
export default class GamesController extends Controller<GameClass> {
  /**
   * Initialise the controller.
   */
  constructor() {
    super('games');

    this._addPOSTRoutes();
    this._addGETRoutes();
    this._addPATCHRoutes();
    this._addDELETERoutes();
  }

  /**
   * Register HTTP POST routes in addition to those provided by base class.
   *
   * @category POST
   */
  protected _addPOSTRoutes(): void {
    /**
     * @swagger
     * /games/create:
     *   post:
     *     tags: [Games]
     *     summary: Create a new game.
     *     description: Create a new game and its initial organisation, assigning
     *       ownership of both to the requesting user.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               newDetails:
     *                 type: object
     *                 required: true
     *                 description: The details of the new game.
     *                 schema:
     *                   $ref: '#/components/schemas/Game'
     *               newOrganisationDetails:
     *                 type: object
     *                 required: true
     *                 description: The details of the new initial organisation.
     *                 schema:
     *                   $ref: '#/components/schemas/Organisation'
     *     responses:
     *       '201':
     *         description: Created.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Game'
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorised'
     */
    this.router.post('/create', authorise(), this.createGameSchema, this.createGame);

    /**
     * @swagger
     * /games/simulate-turn:
     *   post:
     *     tags: [Games]
     *     summary: Simulate a turn for a game.
     *     description: Simulate a turn for a game and all organisations within it.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               gameId:
     *                 type: string
     *                 required: true
     *                 format: uuid
     *                 description: The ID of the game to simulate a turn for.
     *                 example: 123456789abcdef01234567
     *               organisationId:
     *                 type: string
     *                 format: uuid
     *                 description: The ID of the organisation of the user making
     *                   the request.
     *                 example: 123456789abcdef01234567
     *     responses:
     *       '200':
     *         description: Simulated.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Game'
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorised'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     */
    this.router.post('/simulate-turn', this.simulateTurnSchema, this.simulateTurn);

    super._addPOSTRoutes();
  }

  /**
   * Register HTTP GET routes in addition to those provided by base class.
   *
   * @category GET
   */
  protected _addGETRoutes(): void {
    /**
     * @swagger
     * /games/:modelId/get/players:
     *   get:
     *     tags: [Games]
     *     summary: Retrieve all players.
     *     description: Retrieve all players within a game.
     *     parameters:
     *       - in: path
     *         name: gameId
     *         required: true
     *         description: The ID of the game to retrieve player for.
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
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/User'
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorised'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     */
    this.router.get('/:gameId/get/players', authorise(true), this.getPlayers);

    /**
     * @swagger
     * /games/get/settings:
     *   get:
     *     tags: [Games]
     *     summary: Retrieve all settings
     *     description: Retrieve all customisable game settings.
     *     responses:
     *       '200':
     *         description: Returned.
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Setting'
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorised'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     */
    this.router.get('/get/settings', authorise(true), this.getSettings);

    /**
     * Swagger documentation provided below.
     */
    this.router.get(/\/get\/setting\/(tutorial[s]?|assets|threatActors)$/, authorise(), this.getSetting);

    /**
     * @swagger
     * /games/get/setting/:settingKey:
     *   get:
     *     tags: [Games]
     *     summary: Retrieve a setting.
     *     description: Retrieve a given setting from matching the key provided.
     *     parameters:
     *       - in: path
     *         name: settingKey
     *         required: true
     *         description: The key of the setting to retrieve.
     *         schema:
     *           type: string
     *         example: foo
     *     responses:
     *       '200':
     *         description: Returned.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Setting'
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorised'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     */
    this.router.get('/get/setting/:settingKey', authorise(true), this.getSetting);

    /**
     * @swagger
     * /games/get/gameTypes:
     *   get:
     *     tags: [Games]
     *     summary: Retrieve all possible game type values.
     *     description: Retrieve a list of all possible game type values.
     *     responses:
     *       '200':
     *         description: Returned.
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/GameType'
     *               description: The list of possible values.
     *               uniqueItems: true
     *       '401':
     *         $ref: '#/components/responses/Unauthorised'
     */
    this.router.get('/get/gameTypes', authorise(), this.getGameTypes);

    super._addGETRoutes();
  }

  protected _addPATCHRoutes(): void {
    /**
     * @swagger
     * /games/add/organisation:
     *   patch:
     *     tags: [Games]
     *     summary: Add an organisation to a game.
     *     description: Create and add a new organisation to a game.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               gameId:
     *                 type: string
     *                 required: true
     *                 format: uuid
     *                 description: The ID of the game to add the organisation to.
     *                 example: 123456789abcdef01234567
     *               organisation:
     *                 type: object
     *                 required: true
     *                 description: The details of the new organisation to create and add.
     *                 schema:
     *                   $ref: '#/components/schemas/Organisation'
     *               ownerUsername:
     *                 type: string
     *                 required: true
     *                 format: email
     *                 description: The username of the user to assign the organisation to.
     *                 example: foo@bar.baz
     *     responses:
     *       '200':
     *         description: Added.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Game'
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorised'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     */
    this.router.patch('/add/organisation', authorise(), this.addOrganisationSchema, this.addOrganisation);

    /**
     * @swagger
     * /games/remove/organisation:
     *   patch:
     *     tags: [Games]
     *     summary: Remove an organisation from a game.
     *     description: Remove an organisation from a game and delete it.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               gameId:
     *                 type: string
     *                 required: true
     *                 format: uuid
     *                 description: The ID of the game to remove the organisation from.
     *                 example: 123456789abcdef01234567
     *               organisationId:
     *                 type: string
     *                 required: true
     *                 format: uuid
     *                 description: The ID of the organisation to remove.
     *                 example: 123456789abcdef01234567
     *     responses:
     *       '200':
     *         description: Removed.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Game'
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorised'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     */
    this.router.patch('/remove/organisation', authorise(), this.removeOrganisationSchema, this.removeOrganisation);

    /**
     * @swagger
     * /games/join:
     *   patch:
     *     tags: [Games]
     *     summary: Add a user to a game.
     *     description: Add a user to an organisation, consequently adding
     *       them to the game that organisation is part of.
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
     *                 description: The joining code of the organisation to join.
     *                 example: 1234
     *               joiningPassword:
     *                 type: string
     *                 description: The joining password of the organisation to join.
     *                 example: 1234
     *     responses:
     *       '200':
     *         description: Joined.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Game'
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorised'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     */
    this.router.patch('/join', authorise(), this.joinSchema, this.join);

    /**
     * @swagger
     * /games/leave:
     *   patch:
     *     tags: [Games]
     *     summary: Remove a user from a game.
     *     description: Remove a user from an organisation, consequently removing
     *       them from the game that organisation is part of.
     *     responses:
     *       '200':
     *         description: Removed from game.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Game'
     *       '401':
     *         $ref: '#/components/responses/Unauthorised'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     */
    this.router.patch('/leave', authorise(), this.leave);

    /**
     * @swagger
     * /games/setting/update:
     *   patch:
     *     tags: [Games]
     *     summary: Update a setting.
     *     description: Update an existing setting's value.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Setting'
     *             description: The new value for the setting.
     *     responses:
     *       '200':
     *         description: Updated.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Setting'
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
    this.router.patch('/setting/update', authorise(true), this.updateSettingSchema, this.updateSetting);

    super._addPATCHRoutes();
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
   * @category Games
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   *
   * @hidden
   */
  protected createGameSchema(req: Request, res: Response, next: any): void {
    const schema = Joi.object({
      newDetails: Joi.object().required(),
      newOrganisationDetails: Joi.object().required(),
    });
    validateRequest(req, next, schema);
  }

  /**
   * Pass a game creation request on to {@link GamesService} for handling.
   *
   * @category POST
   * @category CRUD
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected createGame(req: Request, res: Response, next: any): void {
    const { id: userId }: { id: Types.ObjectId } = req['user'];
    const {
      newDetails,
      newOrganisationDetails,
    }: { newDetails: GameClass; newOrganisationDetails: OrganisationClass } = req.body;

    newDetails.owner = userId;
    newOrganisationDetails.owner = userId;

    gamesService
      .createGameAndOrganisation(newDetails, newOrganisationDetails)
      .then((game) => res.status(201).json(game))
      .catch(next);
  }

  /**
   * Validate the request data.
   *
   * @category Schema
   * @category POST
   * @category Games
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   *
   * @hidden
   */
  protected simulateTurnSchema(req: Request, res: Response, next: any): void {
    const schema = Joi.object({
      gameId: JoiObjectId.required(),
      organisationId: JoiObjectId.optional(),
    });
    validateRequest(req, next, schema);
  }

  /**
   * Pass a turn simulation request to {@link GamesService} for handling.
   *
   * @category POST
   * @category Games
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected simulateTurn(req: Request, res: Response, next: any): void {
    const { gameId, organisationId } = req.body;

    gamesService
      .simulateTurn({ gameId, organisationId })
      .then((game) => res.json(game))
      .catch(next);
  }

  /**********************************
   *
   *	GET routes.
   *
   **********************************/

  /**
   * Pass a game players request on to {@link GamesService} for handling.
   *
   * @category GET
   * @category CRUD
   * @category Games
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected getPlayers(req: Request, res: Response, next: any): void {
    const gameId: Types.ObjectId = new Types.ObjectId(req.params['gameId']);

    gamesService
      .getPlayers(gameId)
      .then((players: UserClass[]) => res.json(players))
      .catch(next);
  }

  /**
   * Pass a setting query request on to {@link GamesService} for handling.
   *
   * @category GET
   * @category CRUD
   * @category Games
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected getSettings(req: Request, res: Response, next: any): void {
    gamesService
      .getSettings()
      .then((settings: Record<string, any>[]) => res.json(settings))
      .catch(next);
  }

  /**
   * Pass a setting query request on to {@link GamesService} for handling.
   *
   * @category GET
   * @category CRUD
   * @category Games
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   *
   * @todo  What is the ternary for?
   */
  protected getSetting(req: Request, res: Response, next: any): void {
    const settingKey: string = req.params['settingKey'] ? req.params['settingKey'] : req.url.split('/').pop();

    gamesService
      .getSetting(settingKey)
      .then((setting: Record<string, any>) => res.json(setting))
      .catch(next);
  }

  /**
   * Pass a gametype enum request to {@link GamesService} for handling.
   *
   * @category GET
   * @category Games
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected getGameTypes(req: Request, res: Response): void {
    res.json(GamesService.getGameTypes());
  }

  /**********************************
   *
   *	PATCH routes.
   *
   **********************************/

  /**
   * Pass a game update request to {@link GamesService} for handling.
   *
   * @category PATCH
   * @category Games
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected update(req: Request, res: Response, next: any): void {
    const { id: userId }: { id: Types.ObjectId } = req['user'];
    const { updatedDetails }: { updatedDetails: AtLeast<GameClass, 'id'> } = req.body;

    gamesService
      .updateWithAuth(userId, updatedDetails)
      .then((game: GameClass) => res.json(game))
      .catch(next);
  }

  /**
   * Validate the request data.
   *
   * @category Schema
   * @category PATCH
   * @category Games
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   *
   * @hidden
   */
  protected addOrganisationSchema(req: Request, res: Response, next: any): void {
    const schema = Joi.object({
      gameId: JoiObjectId.required(),
      organisation: Joi.object().required(),
      ownerUsername: Joi.string().required(),
    });
    validateRequest(req, next, schema);
  }

  /**
   * Pass an add organisation request to {@link GamesService} for handling.
   *
   * NB: Even through this is a PATCH rather than a POST request, a new
   * organisation is created prior to being added to the game.
   *
   * @category PATCH
   * @category Games
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected addOrganisation(req: Request, res: Response, next: any): void {
    const { id: userId }: { id: Types.ObjectId } = req['user'];
    const {
      gameId,
      organisation,
      ownerUsername,
    }: { gameId: Types.ObjectId; organisation: OrganisationClass; ownerUsername: string } = req.body;

    gamesService
      .addOrganisation({
        userId,
        gameId,
        organisation,
        ownerUsername,
      })
      .then((game: GameClass) => res.json(game))
      .catch(next);
  }

  /**
   * Validate the request data.
   *
   * @category Schema
   * @category PATCH
   * @category Games
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   *
   * @hidden
   */
  protected removeOrganisationSchema(req: Request, res: Response, next: any): void {
    const schema = Joi.object({
      gameId: JoiObjectId.required(),
      organisationId: JoiObjectId.required(),
    });
    validateRequest(req, next, schema);
  }

  /**
   * Pass a remove organisation request to {@link GamesService} for handling.
   *
   * NB: Even through this is a PATCH rather than a DELETE request, the removed
   * organisation is delected after being removed from the game.
   *
   * @category PATCH
   * @category Games
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected removeOrganisation(req: Request, res: Response, next: any): void {
    const user: UserClass = req['user'];
    const { gameId, organisationId }: { gameId: Types.ObjectId; organisationId: Types.ObjectId } = req.body;

    gamesService
      .removeOrganisation({
        ownerId: user.id,
        gameId,
        organisationId,
      })
      .then(({ ...game }) => {
        res.json(game);
      })
      .catch(next);
  }

  /**
   * Validate the request data.
   *
   * @category Schema
   * @category PATCH
   * @category Games
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   *
   * @hidden
   */
  protected joinSchema(req: Request, res: Response, next: any): void {
    const schema = Joi.object({
      joiningCode: Joi.string().required(),
      joiningPassword: Joi.string().allow(null, ''),
    });
    validateRequest(req, next, schema);
  }

  /**
   * Pass a join game request to {@link GamesService} for handling.
   *
   * @category PATCH
   * @category Games
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected join(req: Request, res: Response, next: any): void {
    const { id: userId }: { id: Types.ObjectId } = req['user'];
    const { joiningCode, joiningPassword }: { joiningCode: string; joiningPassword?: string } = req.body;

    gamesService
      .addPlayer({
        userId,
        joiningCode,
        joiningPassword,
      })
      .then((game) => res.json(game))
      .catch(next);
  }

  /**
   * Pass a leave game request to {@link GamesService} for handling.
   *
   * @category PATCH
   * @category Games
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected leave(req: Request, res: Response, next: any): void {
    const { id: userId }: { id: Types.ObjectId } = req['user'];

    gamesService
      .removePlayer({
        memberId: userId,
      })
      .then((game) => res.json(game))
      .catch(next);
  }

  /**
   * Validate the request data.
   *
   * @category Schema
   * @category PATCH
   * @category Games
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   *
   * @hidden
   */
  protected updateSettingSchema(req: Request, res: Response, next: any): void {
    const schema = Joi.object({
      key: Joi.string().required(),
      value: Joi.any().required(),
    });
    validateRequest(req, next, schema);
  }

  /**
   * Pass an update setting request to {@link GamesService} for handling.
   *
   * @category PATCH
   * @category Games
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected updateSetting(req: Request, res: Response, next: any): void {
    const updatedSetting: Setting = req.body;

    gamesService
      .updateSetting(updatedSetting)
      .then((setting: Setting) => res.json(setting))
      .catch(next);
  }

  /**********************************
   *
   *	DELETE routes.
   *
   **********************************/

  /**
   * Pass a game deletion request to {@link GamesService} for handling.
   *
   * @category DELETE
   * @category Games
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected deleteGame(req: Request, res: Response, next: any): void {
    const { id: userId }: { id: Types.ObjectId } = req['user'];
    const { id }: { id: Types.ObjectId } = req.body;

    gamesService
      .deleteWithAuth(userId, id)
      .then(() => {
        res.status(204).send();
      })
      .catch(next);
  }

  /*eslint-enable @typescript-eslint/explicit-module-boundary-types */
}
