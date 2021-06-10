/**
 * This module represents the base functionality common to all services,
 * including those that require user authentication.
 *
 * It also demonstrates the pattern that all extending services should follow:
 *
 * - return `T` objects from public methods;
 * - use `private`/`protected` methods for any direct interfacing with the
 *   document database; and
 * - ensure that all public method returns are sanitised by passing through
 *   the `_basicDetails()` method (which must be implemented by each sub-class).
 *
 * Finally, it also demonstrates the code layout that all extending services
 * should follow:
 *
 * - define all public methods in CRUD order (followed by any that go beyond
 *   CRUD); then
 * - define all protected/private methods in the same order.
 *
 * @category Base
 * @category Services
 * @category Auth
 *
 * @module BaseServices
 */

import { Types } from 'mongoose';
import { DocumentType } from '@typegoose/typegoose';

import { AtLeast } from '../../typings';
import { isValidId } from './db';

/**
 * Provides base functionality that is common to all services.
 *
 * @category Base
 *
 * @abstract
 *
 * @typeParam T  The document class that is interfaced with via the service.
 */
abstract class Service<T> {
  /*eslint-disable @typescript-eslint/explicit-module-boundary-types */
  /**
   * The Mongoose model that is used to interface with the document database
   * collection for `T`.
   */
  protected _model;

  /**
   * Initialises the service.
   *
   * @param model  The Mongoose model interfaced with via the service.
   */
  constructor(model) {
    this._model = model;
  }
  /*eslint-enable @typescript-eslint/explicit-module-boundary-types */

  /**
   * Creates a new `T` object.
   *
   * @category CRUD
   * @category Base
   *
   * @async
   *
   * @param newDetails  The details of the new `T` object.
   * @returns  The newly-created `T` object.
   */
  async create(newDetails: Partial<T>): Promise<T> {
    const newDocument: DocumentType<T> = this._model({ ...newDetails });
    await newDocument.save();

    return this._basicDetails(newDocument);
  }

  /**
   * Gets a specific `T` object (by its ID).
   *
   * @category CRUD
   * @category Base
   *
   * @async
   *
   * @param id  The ID of the `T` object to retrieve.
   * @returns  The retrieved `T` object.
   */
  async get(id: Types.ObjectId): Promise<T> {
    if (!isValidId(id)) throw { code: 400, message: 'Invalid ID!' };

    return this._basicDetails(await this._getById(id));
  }

  /**
   * Gets all `T` objects.
   *
   * @category CRUD
   * @category Base
   *
   * @async
   *
   * @returns  The retrieved `T` bject(s).
   */
  async getAll(): Promise<T[]> {
    const documents: DocumentType<T>[] = await this._model.find();
    return documents.map((document) => this._basicDetails(document));
  }

  /**
   * Get a specific value for a specific `T` object.
   *
   * @category CRUD
   * @category Base
   *
   * @async
   *
   * @param id  The ID of the `T` object to query.
   * @param fieldName  The name of the field to query.
   * @returns  The retrieved value(s).
   */
  async getValue(id: Types.ObjectId, fieldName: string): Promise<unknown | unknown[]> {
    if (!isValidId(id)) throw { code: 400, message: 'Invalid ID!' };

    const document: DocumentType<T> = await this._getById(id);
    return document[fieldName];
  }

  /**
   * Updates a given `T` object. This method can perform full or partial updates.
   *
   * @category CRUD
   * @category Base
   *
   * @async
   *
   * @param updatedDetails  The new details of the `T` object.
   * @returns  The newly-updated `T` object.
   */
  async update(updatedDetails: Partial<T>): Promise<T> {
    const updatedDocument: DocumentType<T> = await this._getById(<Types.ObjectId>updatedDetails['id']);

    Object.assign(updatedDocument, updatedDetails);

    await updatedDocument.save();

    return this._basicDetails(updatedDocument);
  }

  /**
   * Deletes a given `T` object.
   *
   * @category CRUD
   * @category Base
   *
   * @async
   *
   * @param id  The ID of the `T` object to delete.
   * @returns  Whether the `T` object was successfully deleted or not.
   */
  async delete(id: Types.ObjectId): Promise<boolean> {
    if (!isValidId(id)) throw { code: 400, message: 'Invalid ID!' };

    return await this._deleteById(id);
  }

  /**
   * Deletes all of a given `T` object.
   *
   * @category CRUD
   * @category Base
   *
   * @async
   *
   * @returns  Whether the `T` objects were successfully deleted or not.
   */
  async deleteAll(): Promise<boolean> {
    return await this._model.collection.drop();
  }

  /**
   * Get a specific `T` document from the document database.
   *
   * @category CRUD
   * @category Base
   *
   * @async
   *
   * @param id  The ID of the `T` document to retrieve.
   * @returns  The retrieved document.
   */
  protected async _getById(id: Types.ObjectId): Promise<DocumentType<T>> {
    if (!isValidId(id)) throw { code: 400, message: 'Invalid ID!' };

    const document: DocumentType<T> = await this._model.findById(id);

    if (!document) throw 'No document found matching provided ID.';
    return document;
  }

  /**
   * Delete a specific `T` document from the document database.
   *
   * @category CRUD
   * @category Base
   *
   * @async
   *
   * @param id  The ID of the `T` document to delete.
   * @returns  Whether the document was successfully deleted or not.
   */
  protected async _deleteById(id: Types.ObjectId): Promise<boolean> {
    if (!isValidId(id)) throw { code: 400, message: 'Invalid ID!' };

    return !!(await this._model.deleteOne({ _id: id }));
  }

  /**
   * Serialise a `T` document into a `T` object.
   *
   * @category Sanitisation
   * @category Base
   *
   * @param document  The `T` document from the document database.
   * @returns  The `T` object.
   */
  protected abstract _basicDetails(document: DocumentType<T>): T;
}

/**
 * Provides base functionality that is common to all services that require user
 * authentication.
 *
 * @category Auth
 * @category Base
 *
 * @typeParam T  The document class that is interfaced with via the service.
 */
abstract class ServiceWithAuth<T extends { id: Types.ObjectId }> extends Service<T> {
  /*eslint-disable @typescript-eslint/explicit-module-boundary-types */
  /**
   * Initialises the service.
   *
   * @param model  The Mongoose model interfaced with via the service.
   */
  constructor(model) {
    super(model);
  }
  /*eslint-enable @typescript-eslint/explicit-module-boundary-types */

  /**
   * Updates a given `T` object. This method can perform full or partial updates.
   *
   * @category CRUD
   * @category Auth
   * @category Base
   *
   * @async
   *
   * @param userId  The ID of the requesting user.
   * @param updatedDetails  The new details of the `T` object.
   * @returns  The newly-updated `T` object.
   */
  async updateWithAuth(userId: Types.ObjectId, updatedDetails: AtLeast<T, 'id'>): Promise<T> {
    if (updatedDetails.id) await this._authorise(userId, new Types.ObjectId(updatedDetails.id));
    else throw { code: 404, message: 'No ID passed' };

    return await super.update(updatedDetails);
  }

  /**
   * Deletes a given `T` object.
   *
   * @category CRUD
   * @category Auth
   * @category Base
   *
   * @async
   *
   * @param userId  The ID of the requesting user.
   * @param id  The ID of the `T` object to delete.
   * @returns  Whether the `T` object was successfully deleted or not.
   */
  async deleteWithAuth(userId: Types.ObjectId, id: Types.ObjectId): Promise<boolean> {
    await this._authorise(userId, id);

    return await super.delete(id);
  }

  /**
   * The authorisation method that must be implemented by all extending classes.
   *
   * @category Base
   * @category Auth
   *
   * @param userId  The ID of the requesting user.
   * @param documentId  The ID of the object they are requesting upon.
   * @returns  Whether or not the user is authorised to perform the action.
   */
  protected abstract _authorise(userId: Types.ObjectId, documentId: Types.ObjectId): Promise<boolean>;
}

export { Service, ServiceWithAuth };
