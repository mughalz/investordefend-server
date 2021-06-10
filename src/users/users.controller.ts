/**
 * This module represents the controller for all routes under `/users`.
 *
 * It also contains the OpenAPI definition of each route.
 *
 * @category Users
 * @category Controllers
 *
 * @module UsersController
 */

import { Request, Response, CookieOptions } from 'express';
import Joi from 'joi';
import { DocumentType } from '@typegoose/typegoose';

import { validateRequest, authorise } from '../_middleware';
import { usersService } from '../services';
import { UserClass } from '../models';
import { Controller } from '../_helpers/base.controller';
import config from '../config';

/**
 * Represents the `/users` controller.
 *
 * This controller defines the following requests as requiring administrator
 * permissions:
 *
 * - ‘get all’.
 *
 * This controller also provides two things that are unique to it:
 *
 * - the only routes that do not require authentication to access; and
 * - the only rebranding of a base route (i.e., `/register` for the base
 *   `/create` defined in {@link Controller}).
 *
 * @category Users
 */
export default class UsersController extends Controller<UserClass> {
  /**
   * Initialise the controller.
   */
  constructor() {
    super('users', { getAll: true });

    /*
     * Required for all callbacks.
     * See https://stackoverflow.com/a/55089107/4580273
     */
    this.adminLogin = this.adminLogin.bind(this);
    this.login = this.login.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
    this.refreshAdminToken = this.refreshAdminToken.bind(this);

    this._addPOSTRoutes();
    this._addGETRoutes();
    this._addPATCHRoutes();
    this._addDELETERoutes();
  }

  /**
   * Register HTTP POST routes in addition to those provided by base class.
   *
   * @category POST
   * @category Auth
   * @category Users
   */
  protected _addPOSTRoutes(): void {
    /**
     * @swagger
     * /users/register:
     *   post:
     *     tags: [Users]
     *     summary: Register a new user.
     *     description: Register a new user, provided their username is not already in use.
     *     security: []
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
     *                   $ref: '#/components/schemas/User'
     *                 description: The details of the new user to register.
     *     responses:
     *       '201':
     *         description: Created.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     */
    this.router.post('/register', this.createSchema, this.create);

    /**
     * @swagger
     * /users/login/admin:
     *   post:
     *     tags: [Users]
     *     summary: Authenticate an admin. user.
     *     description: Authenticate an admin. user to allow them to use the admin. panel.
     *     security: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               username:
     *                 required: true
     *                 type: string
     *                 description: The admin. user's username (i.e., their email address).
     *                 example: foo@bar.baz
     *               password:
     *                 required: true
     *                 type: string
     *                 description: The admin. user's password.
     *                 example: 123456
     *     responses:
     *       '200':
     *         description: Authenticated.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     */
    this.router.post('/login/admin', this.loginSchema, this.adminLogin);

    /**
     * @swagger
     * /users/login:
     *   post:
     *     tags: [Users]
     *     summary: Authenticate a user.
     *     description: Authenticate a user to allow them to enter the game.
     *     security: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               username:
     *                 required: true
     *                 type: string
     *                 description: The user's username (i.e., their email address).
     *                 example: foo@bar.baz
     *               password:
     *                 required: true
     *                 type: string
     *                 description: The user's password.
     *                 example: 123456
     *     responses:
     *       '200':
     *         description: Authenticated.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     */
    this.router.post('/login', this.loginSchema, this.login);

    /**
     * @swagger
     * /users/refresh-token:
     *   post:
     *     tags: [Users]
     *     summary: Refresh a logged-in user's token.
     *     description: Refreshes the logged-in user's JSON Web Token (JWT) to allow them to remain authenticated.
     *     security: []
     *     parameters:
     *       - in: cookie
     *         name: refreshToken
     *         schema:
     *           type: string
     *     responses:
     *       '201':
     *         description: Refreshed.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     */
    this.router.post('/refresh-token', this.refreshToken);

    /**
     * @swagger
     * /users/refresh-admin-token:
     *   post:
     *     tags: [Users, Admin]
     *     summary: Refresh a logged-in admin. user's token.
     *     description: Refreshes the logged-in admin. user's JSON Web Token (JWT) to allow them to remain authenticated.
     *     security: []
     *     parameters:
     *       - in: cookie
     *         name: adminRefreshToken
     *         schema:
     *           type: string
     *     responses:
     *       '201':
     *         description: Refreshed.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     */
    this.router.post('/refresh-admin-token', this.refreshAdminToken);

    super._addPOSTRoutes();
  }

  /**
   * Register HTTP GET routes in addition to those provided by base class.
   *
   * @category GET
   * @category Users
   */
  protected _addGETRoutes(): void {
    /**
     * @swagger
     * /users/:
     *   get:
     *     tags: [Users]
     *     summary: Retrieve all users.
     *     description: Retrieve all user objects.
     *     responses:
     *       '200':
     *         description: Returned.
     *         content:
     *           application/json:
     *             schema:
     *               oneOf:
     *                 - $ref: '#/components/schemas/User'
     *               description: The retrieved user.
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorised'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     */
    this.router.get('/', authorise(true), this.getAll);

    super._addGETRoutes();
  }

  /**
   * Register HTTP DELETE routes in addition to those provided by base class.
   *
   * @category DELETE
   * @category Auth
   * @category Users
   */
  protected _addDELETERoutes(): void {
    /**
     * @swagger
     * /users/logout:
     *   delete:
     *     tags: [Users]
     *     summary: Log a user out of all sessions.
     *     description: Purge all JWTs for a given user.
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               token:
     *                 type: string
     *                 description: The JWT of the user.
     *     responses:
     *       '205':
     *         description: All tokens revoked for user.
     *       '401':
     *         $ref: '#/components/responses/Unauthorised'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     */
    this.router.delete('/logout', authorise(), this.logoutSchema, this.logout);

    super._addDELETERoutes();
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
   * @category Auth
   * @category Users
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   *
   * @hidden
   */
  protected loginSchema(req: Request, res: Response, next: any): void {
    const schema = Joi.object({
      username: Joi.string().required(),
      password: Joi.string().required(),
    });
    validateRequest(req, next, schema);
  }

  /**
   * Pass an admin. user login request on to the users service for handling.
   *
   * @category POST
   * @category CRUD
   * @category Auth
   * @category Users
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected adminLogin(req: Request, res: Response, next: any): void {
    const { username, password }: { username: string; password: string } = req.body;
    const ipAddress = req.ip;

    usersService
      .authenticateAdmin({ username, password, ipAddress })
      .then(
        ({
          user,
          jwtToken,
          refreshToken,
        }: {
          user: DocumentType<UserClass>;
          jwtToken: string;
          refreshToken: string;
        }) => {
          this._setTokenCookie(res, refreshToken, true);
          res.json({ ...user.toJSON(), jwtToken });
        },
      )
      .catch(next);
  }

  /**
   * Pass a user login request on to the users service for handling.
   *
   * @category POST
   * @category CRUD
   * @category Auth
   * @category Users
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected login(req: Request, res: Response, next: any): void {
    const { username, password }: { username: string; password: string } = req.body;
    const ipAddress = req.ip;

    usersService
      .authenticate({ username, password, ipAddress })
      .then(
        ({
          user,
          jwtToken,
          refreshToken,
        }: {
          user: DocumentType<UserClass>;
          jwtToken: string;
          refreshToken: string;
        }) => {
          this._setTokenCookie(res, refreshToken);
          res.json({ ...user.toJSON(), jwtToken });
        },
      )
      .catch(next);
  }

  /**
   * Pass a token refresh request on to the users service for handling.
   *
   * @category POST
   * @category Auth
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected refreshToken(req: Request, res: Response, next: any): void {
    const token: string = req.cookies.refreshToken;

    if (!token) res.status(401).json({ message: 'No `refreshToken` cookie found.' });

    const ipAddress: string = req.ip;

    usersService
      .refreshToken({ token, ipAddress })
      .then(({ refreshToken, ...user }) => {
        this._setTokenCookie(res, <string>refreshToken);
        res.status(201).json(user);
      })
      .catch(next);
  }

  /**
   * Pass an admin. token refresh request on to the users service for handling.
   *
   * @category POST
   * @category Auth
   * @cateogry Admin
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected refreshAdminToken(req: Request, res: Response, next: any): void {
    const token: string = req.cookies.adminRefreshToken;

    if (!token) res.status(401).json({ message: 'No `adminRefreshToken` cookie found.' });

    const ipAddress: string = req.ip;

    usersService
      .refreshToken({ token, ipAddress, isAdmin: true })
      .then(({ refreshToken, ...user }) => {
        this._setTokenCookie(res, <string>refreshToken, true);
        res.status(201).json(user);
      })
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
   * @category Auth
   * @category Users
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   *
   * @hidden
   */
  protected logoutSchema(req: Request, res: Response, next: any): void {
    const schema = Joi.object({
      token: Joi.string().empty(''),
    });
    validateRequest(req, next, schema);
  }

  /**
   * Pass a user logout request on to the users service for handling.
   *
   * @category DELETE
   * @category Auth
   * @category Users
   *
   * @param req  The request object.
   * @param res  The response object.
   * @param next  The callback function.
   */
  protected logout(req: Request, res: Response, next: any): void {
    const token: string = req.body.token || req.cookies.refreshToken;

    if (!token) res.status(400).json({ message: 'No token found.' });
    else {
      usersService
        .revokeToken(token)
        .then(() => {
          res.status(205).send();
        })
        .catch(next);
    }
  }

  /*eslint-enable @typescript-eslint/explicit-module-boundary-types */

  /**********************************
   *
   *	Helper (private) methods.
   *
   **********************************/

  /**
   * Attach the refresh token to the response as a cookie.
   *
   * @category Auth
   *
   * @param res  The response object.
   * @param token  The refresh token value.
   */
  private _setTokenCookie(res: Response, token: string, admin = false): void {
    // create http only cookie with refresh token that expires in 7 days
    const cookieOptions: CookieOptions = {
      domain: config.cookie.domain || 'localhost',
      httpOnly: true,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      sameSite: config.cookie.sameSite || 'Strict',
      secure: config.cookie.secure || true,
      path: config.cookie.path || '/',
    };
    res.cookie(admin ? 'adminRefreshToken' : 'refreshToken', token, cookieOptions);
  }
}
