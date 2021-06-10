/**
 * This module handles request validation.
 *
 * Note that it only handles top-level request body validation, and that
 * lower-level data validation checks are provided in individual services.
 *
 * @category Middlewares
 * @category Sanitisation
 *
 * @module Validation
 */

import { Request } from 'express';

/*eslint-disable @typescript-eslint/explicit-module-boundary-types */
/**
 * Validate the request body of a given request.
 *
 * @param req  The request object.
 * @param next  The callback function.
 * @param schema  The Joi object to use for validation.
 *
 * @todo Add type for `schema`.
 */
export default function validateRequest(req: Request, next: any, schema): void {
  /*eslint-enable @typescript-eslint/explicit-module-boundary-types */
  const options = {
    abortEarly: false, // include all errors
    allowUnknown: true, // ignore unknown props
    stripUnknown: true, // remove unknown props
  };

  const { error, value } = schema.validate(req.body, options);

  if (error) {
    next(`Validation error: ${error.details.map((x) => x.message).join(', ')}`);
  } else {
    req.body = value;
    next();
  }
}
