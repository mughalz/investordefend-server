/**
 * This module defines the RefreshToken model, which represents an instance of a
 * refresh token used for JSON Web Token (JWT)-based authentication.
 *
 * It also contains the OpenAPI definition of a `RefreshToken`.
 *
 * @category Auth
 * @category Models
 *
 * @module RefreshTokenModel
 *
 * @hidden
 */

import { Schema, Types } from 'mongoose';
import { modelOptions, prop, Ref } from '@typegoose/typegoose';

import { ModelWithTimestamps } from '../_helpers';
import { UserClass } from '../models';

/**
 * Represents a RefreshToken object in the system.
 *
 * @category Auth
 * @category Models
 *
 * @swagger
 * components:
 *   schemas:
 *     RefreshToken:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           required: true
 *           format: uuid
 *           description: The control's ID.
 *           example: 5349b4ddd2781d08c09890f3
 *         user:
 *           type: string
 *           required: true
 *           format: uuid
 *           description: Reference to the user associated with the token.
 *           example: 5349b4ddd2781d08c09890f3
 *         token:
 *           type: string
 *           required: true
 *           description: The token string.
 *         expires:
 *           type: string
 *           format: date-time
 *           required: true
 *           description: The datetime on which the token will expire.
 *           example: 2021-03-04T10:30:41.090+00:00
 *         createdByIp:
 *           type: string
 *           required: true
 *           description: The IP address from which the token was created.
 *           example: ::ffff:127.0.0.1
 */
@modelOptions({
  schemaOptions: {
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: function (doc, ret) {
        // remove these props when object is serialized
        delete ret.user;
      },
    },
    toObject: {
      virtuals: true,
    },
  },
})
class RefreshToken extends ModelWithTimestamps {
  id!: Types.ObjectId;

  /**
   * The user that the refresh token belongs to.
   */
  @prop({ required: true, ref: () => UserClass, type: Schema.Types.ObjectId })
  user!: Ref<UserClass>;

  /**
   * The token value.
   */
  @prop({ required: true, unique: true })
  token!: string;

  /**
   * Whether the token represents an admin. login or not.
   */
  @prop({ required: true, default: false })
  isAdmin?: boolean;

  /**
   * When the token will expire and no longer be usable for authentication.
   */
  @prop({ required: true, default: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) })
  expires!: Date;

  /**
   * The IP address of the requester who produced the token.
   */
  @prop({
    required: true,
  })
  createdByIp!: string;

  /**
   * Check whether the token is assigned to an existing user or not.
   */
  //hasUser(): boolean { return isDocument(this.user) }

  /**
   * Check whether the token is expired or not.
   */
  //isExpired(): boolean { return this.expires <= new Date() }

  /**
   * Check whether the token was created more than 1 day ago or not.
   */
  //isOld(): boolean { return this.createdAt <= new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }
}

export { RefreshToken as RefreshTokenClass };
