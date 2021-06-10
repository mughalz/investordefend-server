/**
 * This module re-exports middleware functionality for neater importing.
 *
 * @category Middlewares
 * @category Re-export
 *
 * @module Middlewares
 * @hidden
 */

import validateRequest from './validate-request';
import errorHandler from './error-handler';
import authorise from './authorise';

export { validateRequest, errorHandler, authorise };
