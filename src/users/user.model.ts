/**
 * This module defines the User model, which represents an instance of a
 * user within the game.
 *
 * It also contains the OpenAPI definition of a `User`.
 *
 * @category Users
 * @category Models
 *
 * @module UserModel
 */

import bcrypt from 'bcryptjs';
import { pre, modelOptions, prop, DocumentType } from '@typegoose/typegoose';

import { Model } from '../_helpers';

/**
 * Represents a User object in the system.
 *
 * @category Users
 * @category Models
 *
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The user's ID.
 *           example: 123456789abcdef01234567
 *         name:
 *           type: string
 *           description: The user's name.
 *           example: Foo Bar
 *         username:
 *           required: true
 *           type: string
 *           description: The user's username (i.e., their email address).
 *           example: foo@bar.baz
 *         password:
 *           required: true
 *           type: string
 *           description: The user's password.
 *           example: foobarbaz123
 */
@pre<User>('save', async function () {
  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
})
@modelOptions({
  schemaOptions: {
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: function (doc, ret) {
        // remove these props when object is serialized
        delete ret._id;
        delete ret.password;
        delete ret.isAdmin;
      },
    },
    toObject: {
      virtuals: true,
    },
  },
})
class User extends Model {
  /**
   * The name of the user.
   */
  @prop({ required: false })
  name?: string;

  /**
   * The username (i.e., email address) of the user.
   */
  @prop({
    required: true,
    unique: true,
    validate: new RegExp(
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    ),
  })
  username!: string;

  /**
   * The password of the user, stored as a hash.
   */
  @prop({ required: true })
  password!: string;

  /**
   * Whether the user is an adminstrator or not.
   */
  @prop({ required: false })
  isAdmin?: boolean;

  /**
   * Compares a provided password with a given user's to see if they match.
   *
   * @param this  The user to retrieve the password hash from.
   * @param password  The password string to hash and compare.
   * @returns  Whether the two hashes match or not.
   */
  async isValidPassword(this: DocumentType<User>, password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
  }
}

export { User as UserClass };
