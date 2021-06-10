/**
 * This file initialises the Express server and exports it.
 *
 * @module Server
 */

import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import helmet from 'helmet';
import errorhandler from 'errorhandler';
import swaggerUi from 'swagger-ui-express';

import { errorHandler } from './_middleware';
import ServerController from './server.controller';
import { swaggerSpec } from './_helpers';
import config from './config';

/**
 * Represents the Express server.
 */
export class Server {
  /**
   * The Express server object.
   */
  public server;

  /**
   * Initialise the Express server and activate the distribution regeneration.
   */
  constructor() {
    this.server = express();

    if (config.env === 'development') {
      this.server.use(errorhandler());
    }

    this.server.use(bodyParser.json());
    this.server.use(bodyParser.urlencoded({ extended: false }));

    this.server.use(cookieParser());

    this.server.use(morgan('dev'));

    if (config.env === 'production') {
      this.server.use(
        helmet({
          contentSecurityPolicy: {
            directives: {
              ...helmet.contentSecurityPolicy.getDefaultDirectives(),
              'script-src': ["'self'", 'ajax.googleapis.com', 'cdn.jsdelivr.net'],
            },
          },
        }),
      );
    }

    // allow cors requests from any origin and with credentials
    this.server.use(
      cors({
        origin: (origin, callback) => callback(null, true),
        credentials: true,
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      }),
    );

    this.server.use(compression());

    // Handle API routes.
    const serverRouter = new ServerController();
    this.server.use('/', serverRouter.router);

    // Generate the API documentation and serve it.
    this.server.use('/docs/api', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // Host the admin. panel, codebase documentation and test coverage results.
    this.server.use(express.static('public'));

    // global error handler
    this.server.use(errorHandler);

    this.server.listen(config.server.port, () => {
      console.debug(`Server listening on port ${config.server.port}`);
    });
  }
}

export const server = new Server().server;
