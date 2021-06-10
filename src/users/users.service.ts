/**
 * This module defines the users service, which processes all requests relating
 * to users (including authentication and authorisation).
 *
 * @category Users
 * @category Services
 *
 * @module UsersService
 */

import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { DocumentType } from '@typegoose/typegoose';
import crypto from 'crypto';

import { Service, sendMail } from '../_helpers';
import { UserClass, RefreshTokenClass } from '../models';
import { User, RefreshToken } from '../_helpers/db';

/**
 * Represents the users service.
 */
export class UsersService extends Service<UserClass> {
  /**
   * Initialise the superclass with the `User` model.
   */
  constructor() {
    super(User);
  }

  /**
   * Create a new user and send them an email.
   *
   * @category CRUD
   * @category Users
   *
   * @param newDetails  The details of the new user to create.
   * @returns  The newly-created user.
   */
  async create(newDetails: UserClass): Promise<UserClass> {
    const user: UserClass = await super.create(newDetails);

    await sendMail({
      to: user.username,
      subject: 'Thank you for registering!',
      template: 'registered-user',
      context: {
        name: user.name,
      },
    });

    return user;
  }

  /**
   * Retrieve a user by their username (i.e., their email address).
   *
   * @category CRUD
   * @category Users
   *
   * @param username  The user's username/email address to search for.
   * @returns  The requested user.
   */
  async getByUsername(username: string): Promise<UserClass> {
    return this._basicDetails(await this._getByUsername(username));
  }

  /**
   * Authenticate an admin. user and provide them with a JSON Web Token (JWT).
   *
   * @category Auth
   * @category Users
   *
   * @param username  The user's username/email address.
   * @param password  The user's password.
   * @param ipAddress  The IP address of the requester.
   * @returns  The details of the user, a JWT and a refresh token.
   */
  async authenticateAdmin({
    username,
    password,
    ipAddress,
  }: {
    username: string;
    password: string;
    ipAddress: string;
  }): Promise<{ user: DocumentType<UserClass>; jwtToken: string; refreshToken: string }> {
    console.warn(`Admin. login request from ${username} (from ${ipAddress})`);

    const user: DocumentType<UserClass> = await this._getByUsername(username);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      throw 'Username or password is incorrect';
    }

    await this.revokeTokensForUser(user.id, true);

    if (!user.isAdmin) throw { code: 403, message: 'User is not an admin, this login attempt has been logged' };

    // If authentication is successful, generate the JWT and refresh tokens.
    const jwtToken: string = this._generateJwtToken(user.id);
    const refreshToken: DocumentType<RefreshTokenClass> = await this._generateRefreshToken(user.id, ipAddress, true);

    await refreshToken.save();

    return {
      user: user,
      jwtToken,
      refreshToken: refreshToken.token,
    };
  }

  /**
   * Authenticate a user and provide them with a JSON Web Token (JWT).
   *
   * @category Auth
   * @category Users
   *
   * @param username  The user's username/email address.
   * @param password  The user's password.
   * @param ipAddress  The IP address of the requester.
   * @returns  The details of the user, a JWT and a refresh token.
   */
  async authenticate({
    username,
    password,
    ipAddress,
  }: {
    username: string;
    password: string;
    ipAddress: string;
  }): Promise<{ user: DocumentType<UserClass>; jwtToken: string; refreshToken: string }> {
    const user: DocumentType<UserClass> = await this._getByUsername(username);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      throw 'Username or password is incorrect';
    }

    await this.revokeTokensForUser(user.id);

    // If authentication is successful, generate the JWT and refresh tokens.
    const jwtToken: string = this._generateJwtToken(user.id);
    const refreshToken: DocumentType<RefreshTokenClass> = await this._generateRefreshToken(user.id, ipAddress);

    await refreshToken.save();

    return {
      user: user,
      jwtToken,
      refreshToken: refreshToken.token,
    };
  }

  /**
   * Refresh a JSON Web Token (JWT).
   *
   * @category Auth
   * @category Users
   *
   * @param token  The refresh token from the request.
   * @param ipAddress  The IP Address of the requester.
   * @param isAdmin  Whether to revoke admin. tokens or regular ones. Default 'false'.
   * @returns  The details of the user, a new JWT and a new refresh token.
   */
  async refreshToken({
    token,
    ipAddress,
    isAdmin = false,
  }: {
    token: string;
    ipAddress: string;
    isAdmin?: boolean;
  }): Promise<Record<string, unknown>> {
    const refreshToken: DocumentType<RefreshTokenClass> = await this._getRefreshToken(token, isAdmin);
    const { user } = refreshToken;
    const userId: Types.ObjectId = user['id'] || user['id'];

    // replace old refresh token with a new one and save
    const newRefreshToken: DocumentType<RefreshTokenClass> = await this._generateRefreshToken(
      userId,
      ipAddress,
      isAdmin,
    );
    await newRefreshToken.save();
    await this.revokeToken(refreshToken.token, isAdmin);

    // generate new jwt
    const jwtToken: string = this._generateJwtToken(userId);

    // return basic details and tokens
    return {
      ...(<UserClass>user),
      jwtToken,
      refreshToken: newRefreshToken.token,
    };
  }

  /**
   * Revoke all refresh tokens for a given user.
   *
   * @category Auth
   * @category Users
   *
   * @param userId  The ObjectID of the user to revoke all tokens for.
   * @param isAdmin  Whether to revoke admin. tokens or regular ones. Default 'false'.
   * @returns  Whether the revocation was successful or not.
   */
  async revokeTokensForUser(userId: Types.ObjectId, isAdmin = false): Promise<boolean> {
    const refreshTokens: RefreshTokenClass[] = await this.getRefreshTokens(userId, isAdmin);

    for (const token of refreshTokens) {
      this.revokeToken(token.token, isAdmin);
    }

    return true;
  }

  /**
   * Revoke a given refresh token.
   *
   * @category Auth
   * @category Users
   *
   * @param token  The token string to revoke.
   * @param isAdmin  Whether to revoke an admin. token or a regular one. Default 'false'.
   * @returns  Whether the recovation was successful or not.
   */
  async revokeToken(token: string, isAdmin = false): Promise<boolean> {
    return !!(await RefreshToken.deleteOne({ token, isAdmin }));
  }

  /**
   * Get all of a user's associated refresh tokens.
   *
   * @category Auth
   * @category Users
   *
   * @param userId  The ID of the user to retrieve tokens for.
   * @param isAdmin  Whether to retrieve admin. tokens or regular ones. Default 'false'.
   * @returns  All of the retrieved refresh tokens.
   */
  async getRefreshTokens(userId: Types.ObjectId, isAdmin = false): Promise<RefreshTokenClass[]> {
    // check that user exists
    await this._getById(userId);

    // return refresh tokens for user
    const refreshTokens: DocumentType<RefreshTokenClass>[] = await RefreshToken.find({ user: userId, isAdmin });

    return refreshTokens.map((refreshToken: DocumentType<RefreshTokenClass>) => this._basicTokenDetails(refreshToken));
  }

  /**
   * Retrieve a refresh token from the document database.
   *
   * @category Auth
   * @category Users
   *
   * @param token  The token string to search for.
   * @param isAdmin  Whether to retrieve an admin. token or a regular one. Default 'false'.
   * @returns  The retrieved refresh token document.
   */
  protected async _getRefreshToken(token: string, isAdmin = false): Promise<DocumentType<RefreshTokenClass>> {
    const refreshToken: DocumentType<RefreshTokenClass> = await RefreshToken.findOne({ token, isAdmin }).populate(
      'user',
    );

    if (!refreshToken) throw 'Invalid token';
    return refreshToken;
  }

  /**
   * Generate a new refresh token.
   *
   * @category Auth
   * @category Users
   *
   * @param userId  The ID of the user to generate the token for.
   * @param ipAddress  The IP address of the requester.
   * @param isAdmin  Whether to generate an admin. token or a regular one. Default 'false'.
   * @returns  The newly-created refresh token document.
   */
  protected async _generateRefreshToken(
    userId: Types.ObjectId,
    ipAddress: string,
    isAdmin = false,
  ): Promise<DocumentType<RefreshTokenClass>> {
    // create a refresh token that expires in 7 days
    return await new RefreshToken({
      user: userId,
      token: crypto.randomBytes(40).toString('hex'),
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdByIp: ipAddress,
      isAdmin,
    });
  }

  /**
   * Retrieve a user from the document database by username.
   *
   * @category CRUD
   * @category Users
   *
   * @param username  The username to search for.
   * @returns  The retrieved user document.
   */
  protected async _getByUsername(username: string): Promise<DocumentType<UserClass>> {
    return await User.findOne({ username });
  }

  /**
   * Retrieve a user from the document database by refresh token.
   *
   * @category CRUD
   * @category Users
   *
   * @param token  The refresh token to derive the user from.
   * @returns  The retrieved user document.
   */
  protected async _getByToken(token: string): Promise<UserClass> {
    const refreshToken: DocumentType<RefreshTokenClass> = await this._getRefreshToken(token);
    const user: UserClass = <UserClass>refreshToken.user;
    return user;
  }

  /**
   * Generate a new JSON Web Token (JWT).
   *
   * @category Auth
   * @category Users
   *
   * @param userId  The ID of the user to generate the JWT for.
   * @returns  The generated JWT.
   */
  protected _generateJwtToken(userId: Types.ObjectId): string {
    // create a jwt token containing the user id that expires in 15 minutes
    return jwt.sign({ sub: userId, id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
  }

  /**
   * Serialise a user document into a user object.
   *
   * @category Sanitisation
   * @category Users
   *
   * @param document  The user document from the document database.
   * @returns  The user object.
   */
  protected _basicDetails(document: DocumentType<UserClass>): UserClass {
    const { id, name, username } = document;
    return { id, name, username, password: undefined, isValidPassword: undefined };
  }

  /**
   * Serialise a refresh token document into a refresh token object.
   *
   * @category Sanitisation
   * @category Auth
   * @category Users
   *
   * @param document  The refresh token document from the document database.
   * @returns  The refresh token object.
   */
  protected _basicTokenDetails(document: DocumentType<RefreshTokenClass>): RefreshTokenClass {
    const { id, user, token, expires } = document;
    return { id, user, token, expires, createdByIp: undefined };
  }
}
