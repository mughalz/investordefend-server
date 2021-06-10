/**
 * This file routes top-level API calls to their respective routers.
 *
 * @module ServerController
 */

import express, { Request, Response } from 'express';
import { Types } from 'mongoose';
import Joi from 'joi';
import fetch from 'node-fetch';

import {
  usersRouter,
  gamesRouter,
  securityAreasRouter,
  controlsRouter,
  eventsRouter,
  organisationsRouter,
} from './controllers';
import { gamesService } from './services';
import { validateRequest, authorise } from './_middleware';
import config from './config';

/**
 * Represents the `/` root controller.
 *
 * This controller defines one request as requiring administrator
 * permissions (`/reset`).
 */
export default class ServerController {
  /**
   * The Express router for this route.
   */
  public router = express.Router();

  /**
   * Initialise the controller.
   */
  constructor() {
    // Set up the route handlers.
    this.router.use('/users', usersRouter);
    this.router.use('/games', gamesRouter);
    this.router.use('/securityAreas', securityAreasRouter);
    this.router.use('/controls', controlsRouter);
    this.router.use('/events', eventsRouter);
    this.router.use('/organisations', organisationsRouter);

    // Add any additional root routes.
    this._addPOSTRoutes();
    this._addDELETERoutes();
  }

  /**
   * Register HTTP POST routes.
   *
   * @category POST
   */
  protected _addPOSTRoutes(): void {
    /**
     * @swagger
     * /report-issue:
     *   post:
     *     tags: []
     *     summary: Report an issue.
     *     description: Create an issue on the project repository.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               title:
     *                 type: string
     *                 required: true
     *                 description: The title summary of the issue.
     *               description:
     *                 type: string
     *                 required: true
     *                 description: The description of the issue.
     *     responses:
     *       '201':
     *         description: Created.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 web_url:
     *                   type: string
     *                   format: uri
     *                   description: The Issue URL.
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorised'
     */
    this.router.post('/report-issue', authorise(), this._reportIssueSchema, this._reportIssue);
  }

  /**
   * Register HTTP DELETE routes.
   *
   * @category DELETE
   */
  protected _addDELETERoutes(): void {
    /**
     * @swagger
     * /reset:
     *   delete:
     *     tags: [Admin,Games]
     *     summary: Reset the game data.
     *     description: Deletes all user-created content from the database,
     *       leaving only the `settings`, `securityares`, `controls` and `users`
     *       collections.
     *     responses:
     *       '204':
     *         description: Reset.
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorised'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     */
    this.router.delete('/reset', authorise(true), this._reset);
  }

  /**
   * Validate the request data.
   *
   * @category Schema
   * @category POST
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   *
   * @hidden
   */
  protected _reportIssueSchema(req: Request, res: Response, next: any): void {
    const schema = Joi.object({
      title: Joi.string().required(),
      description: Joi.string().required(),
    });
    validateRequest(req, next, schema);
  }

  /**
   * Pass an issue report on to the GitLab API for handling.
   *
   * @category POST
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected async _reportIssue(req: Request, res: Response): Promise<void> {
    const { id: userId }: { id: Types.ObjectId } = req['user'];
    const { title, description } = req.body;

    const response = await fetch(`https://delta.lancs.ac.uk/api/v4/projects/${config.repo.client.id}/issues`, {
      method: 'post',
      body: JSON.stringify({
        title,
        description: `${description}\n\nReported by ${userId}`,
        labels: 'bug,in-app report',
      }),
      headers: {
        'Content-Type': 'application/json',
        'Private-Token': config.repo.token,
      },
    });
    const { web_url } = await response.json();

    console.warn(`Issue reported: ${web_url}`);
    res.status(201).json(web_url);
  }

  /**
   * Pass a game reset request on to {@link GamesService} for handling.
   *
   * @category Admin
   * @category DELETE
   * @category CRUD
   * @category Games
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected _reset(req: Request, res: Response, next: any): void {
    gamesService
      .reset(req['user']['id'], req.ip)
      .then(() => res.status(204).send())
      .catch(next);
  }
}
