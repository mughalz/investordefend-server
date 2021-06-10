/**
 * This module represents the error handler for the server. All exceptions
 * thrown elsewhere in the code are routed to this handler.
 *
 * It also contains the OpenAPI definition of each unsuccessful HTTP request
 * response, as well as the `Error` response component.
 *
 * @category Middlewares
 * @category Error Handling
 *
 * @module Error Handler
 */

import { Request, Response } from 'express';

import config from '../config';

/**
 * @swagger
 * components:
 *   responses:
 *     BadRequest:
 *       description: The request was malformed.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     Unauthorised:
 *       description: Unauthorised (authentication failed).
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     Forbidden:
 *       description: Forbidden (authorisation failed).
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     NotFound:
 *       description: Resource not found.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     MethodNotAllowed:
 *       description: Method not allowed.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     Timeout:
 *       description: Request timed out.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         code:
 *           description: The HTTP response code.
 *           type: string
 *         message:
 *           description: A summary of the error encountered.
 *           type: string
 *       required:
 *         - code
 *         - message
 */

/*eslint-disable @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-unused-vars */

/**
 * Catch all exceptions thrown elsewhere.
 *
 * @param err  The error object (or string in the case of a custom error).
 * @param req  The request object.
 * @param res  The response object.
 * @param next  The callback function.
 * @returns  The response object with an HTTP status code and error message attached.
 *
 * @todo Rewrite.
 */
export default function errorHandler(
  err: string | Record<string, any>,
  req: Request,
  res: Response,
  next: any,
): Response {
  if (config.env === 'development') console.error(err);

  switch (typeof err) {
    case 'string':
      // Custom application errors are currently sent as simple strings.
      const is404 = err.toLowerCase().endsWith('not found');
      const statusCode = is404 ? 404 : 400;
      return res.status(statusCode).json({ message: err });

    case 'object':
      if (err['code'] && err['message']) {
        return res.status(err['code']).json({ message: err['message'] });
      } else {
        // If it's not a custom error...
        switch (err['name']) {
          case 'VersionError':
            return res.status(500).json({ message: 'Version mismatch' });

          case 'ValidationError':
            // mongoose validation error
            let message = 'Missing required field';
            message += err.errors.length > 1 ? 's:' : ':';
            Object.entries(err.errors).forEach((error) => {
              message += ` "${error[0]}"`;
            });
            return res.status(400).json({ message });

          case 'UnauthorizedError':
            // jwt authentication error
            return res.status(401).json({ message: 'Unauthorised' });

          case 'MongoError':
            // mongoDB database error
            switch (err.code) {
              case 11000:
                return res.status(409).json({ message: 'Item already exists' });

              default:
                return res.status(500).json({ message: 'Unspecified database error' });
            }

          default:
            return res.status(500).json({ message: `Unidentified error: ${err.message}` });
        }
      }
      break;
    default:
      return res
        .status(500)
        .json({ message: 'Unidentified error of unidentified type (something has gone very wrong)' });
  }
}

/*eslint-enable @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-unused-vars */
