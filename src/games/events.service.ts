/**
 * This module defines the events service, which processes all requests relating
 * to events.
 *
 * @category Events
 * @category Services
 *
 * @module EventsService
 */

import { Types } from 'mongoose';
import { DocumentType } from '@typegoose/typegoose';

import { Service } from '../_helpers';
import { EventClass, UserClass, GameClass } from '../models';
import { Event } from '../_helpers/db';
import { usersService, gamesService } from '../services';

/**
 * Represents the events service.
 *
 * @todo Extend `{@link ServiceWithAuth}`.
 */
export default class EventsService extends Service<EventClass> {
  /**
   * Initialise the superclass with the `Event` model.
   */
  constructor() {
    super(Event);
  }

  /**
   * Updates a given event. This method can perform full or partial updates.
   *
   * @category CRUD
   * @category Auth
   * @category Events
   *
   * @param userId  The ID of the requesting user.
   * @param newDetails  The updated details of the event.
   * @returns  The newly-updated event.
   */
  async updateWithAuth({
    userId,
    newDetails,
  }: {
    userId?: Types.ObjectId;
    newDetails: Record<string, unknown>;
  }): Promise<EventClass> {
    if (userId) await this._authorise(userId, <Types.ObjectId>newDetails['id']);

    return await this.update(newDetails);
  }

  /**
   * Deletes a given event.
   *
   * @category CRUD
   * @category Auth
   * @category Events
   *
   * @param userId  The ID of the requesting user.
   * @param id  The ID of the event to delete.
   * @returns  Whether the event was successfully deleted or not.
   */
  async deleteWithAuth({ userId, id }: { userId?: Types.ObjectId; id: Types.ObjectId }): Promise<boolean> {
    if (userId) await this._authorise(userId, id);

    return await this.delete(id);
  }

  /**
   * Authorise actions.
   *
   * @category Events
   * @category Auth
   *
   * @param userId  The ID of the user to authorise.
   * @param id  The ID of the event.
   * @returns  Whether the user is authorised to perform the action or not.
   */
  protected async _authorise(userId: Types.ObjectId, id: Types.ObjectId): Promise<boolean> {
    const user: UserClass = await usersService.get(userId);
    if (!user.isAdmin) {
      const event: EventClass = this._basicDetails(await this._getById(id));
      const game: GameClass = await gamesService.getByEvent({ eventId: event.id });
      if (game.owner != user.id) throw 'User does not have permission to update Event.';
    }
    return true;
  }

  /**
   * Serialise an event document into an event object.
   *
   * @category Sanitisation
   * @category Events
   *
   * @param document  The event document from the document database.
   * @returns  The event object.
   */
  protected _basicDetails(document: DocumentType<EventClass>): EventClass {
    const { id, turn, cost, asset, threatActor, securityAreas, game } = document;
    return { id, turn, cost, asset, threatActor, securityAreas, game };
  }
}
