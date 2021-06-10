/**
 * This module handles request authentication and authorisation.
 *
 * Note that it only handles top-level admin/non-admin authorisation, and that
 * lower-level authorisation checks are handled in individual services.
 *
 * @category Middlewares
 * @category Auth
 *
 * @module Authn/Authz
 */

import jwt from 'express-jwt';
import { DocumentType } from '@typegoose/typegoose';
import { Response } from 'express';

import { User, RefreshToken } from '../_helpers/db';
import { UserClass, RefreshTokenClass } from '../models';

/*eslint-disable @typescript-eslint/explicit-module-boundary-types */
/**
 * Authenticate and authorise a received request.
 *
 * @param admin  Whether the requester requires admin. permissions or not.
 * @returns
 *
 * @todo Define return value.
 * @todo Define type for `Response` + `user`.
 */
export default function authorise(admin = false) {
  return [
    // Authenticates the provided JSON Web Token (JWT) and, if successful,
    // attaches the derived user to the request object (as `req.user`).
    jwt({ secret: process.env.JWT_SECRET, algorithms: ['HS256'] }),

    // Checks whether the derived user is authorised to make the request.
    async (req, res: Response, next: any) => {
      const user: DocumentType<UserClass> = await User.findById(req.user.id);

      if (!user) return res.status(401).json({ message: 'User not found' });
      if (admin && !user.isAdmin) return res.status(403).json({ message: 'User is not an admin.' });

      // If authentication and authorisation are both successful, gets the
      // user's refresh token.
      const refreshToken: DocumentType<RefreshTokenClass> = await RefreshToken.findById(user.id);
      req.user.ownsToken = (token) => !!refreshToken.token === token;
      next();
    },
  ];
}
/*eslint-enable @typescript-eslint/explicit-module-boundary-types */
