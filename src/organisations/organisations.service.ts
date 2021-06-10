/**
 * This module defines the organisations service, which processes all requests
 * relating to organisations.
 *
 * @category Organisations
 * @category Services
 *
 * @module OrganisationsService
 */

import { Types } from 'mongoose';
import { DocumentType } from '@typegoose/typegoose';

import { ServiceWithAuth, sizes, industries } from '../_helpers';
import { OrganisationClass, UserClass, ControlClass, ImplementedControl, EventClass } from '../models';
import { Organisation } from '../_helpers/db';
import { usersService, controlsService, eventsService, gamesService } from '../services';
//import { Asset } from '../../typings';

/**
 * Represents the organisations service.
 */
export default class OrganisationsService extends ServiceWithAuth<OrganisationClass> {
  /**
   * Initialise the superclass with the `Organisation` model.
   */
  constructor() {
    super(Organisation);
  }

  /**
   * Create a new organisation.
   *
   *
   * @category CRUD
   * @category Organisations
   *
   * @param newDetails  The details of the new organisation to create.
   * @returns  The newly-created organisation.
   *
   * @todo Remove once {@link Enums.industries} is refactored to make this
   * unnecessary.
   */
  async create(newDetails: OrganisationClass): Promise<OrganisationClass> {
    newDetails.industry = industries[newDetails.industry];
    newDetails.members = [newDetails.owner];

    return super.create(newDetails);
  }

  /**
   * Retrieve an organisation by its unique joining code.
   *
   * @category CRUD
   * @category Organisations
   *
   * @param joiningCode  The unique joining code to search for.
   * @param joiningPassword  The (optional) joining password that is required.
   * @returns  The requested organisation.
   */
  async getByJoiningCode(joiningCode: string, joiningPassword: string = undefined): Promise<OrganisationClass> {
    return await this._getByJoiningCode(joiningCode, joiningPassword);
  }

  /**
   * Retrieve an organisation by one of its members.
   *
   * @category CRUD
   * @category Organisations
   *
   * @param memberId  The ID of the member to search with.
   * @returns  The requested organisation.
   */
  async getByMember(memberId: Types.ObjectId): Promise<OrganisationClass> {
    return await this._getByMember(memberId);
  }

  /**
   * Retrieve a value from a given field on a given organisation.
   *
   * The base method has been extended to allow for handling reference
   * population.
   *
   * @category CRUD
   * @category Organisations
   *
   * @param id  The ID of the organisation to query.
   * @param fieldName  The name of the field to query.
   * @returns  The retrieved value(s).
   *
   * @todo Sanitise `members` and `controls`.
   */
  async getValue(id: Types.ObjectId, fieldName: string): Promise<unknown | unknown[]> {
    let organisation: DocumentType<OrganisationClass>;

    if (fieldName === 'members') {
      switch (fieldName) {
        case 'members':
          organisation = await Organisation.findById(id).populate({
            path: 'members',
            model: 'User',
          });
          return organisation['members'];
        default:
      }
    } else return await super.getValue(id, fieldName);
  }

  /**
   * Retrieve a list of controls still available to be implemented.
   *
   * @category Organisations
   *
   * @param id  The ID of the organisation to get new controls for.
   * @returns  The list of controls still to be implemented.
   */
  async getNewControls(id: Types.ObjectId): Promise<ControlClass[]> {
    return await gamesService.getNewControls(id);
  }

  /**
   * Add a new user to an organisation as a member.
   *
   * @category CRUD
   * @category Organisations
   *
   * @param joiningCode  The unique joining code to search for.
   * @param joiningPassword  The (optional) joining password that is required.
   * @param newMemberId  The ID of the new user to add.
   * @returns  The updated organisation.
   */
  async addMember({
    joiningCode,
    joiningPassword,
    newMemberId,
  }: {
    joiningCode: string;
    joiningPassword: string;
    newMemberId: Types.ObjectId;
  }): Promise<OrganisationClass> {
    const organisation: DocumentType<OrganisationClass> = await this._getByJoiningCode(joiningCode, joiningPassword);
    const user: UserClass = await usersService.get(newMemberId);

    if (!organisation.members.includes(user.id)) {
      console.log(`Adding user ${user.id} to organisation ${organisation.id}`);
      organisation.members.push(user.id);
      await organisation.save();
    } else console.debug(`User ${user.id} already in organisation ${organisation.id}`);

    return this._basicDetails(organisation);
  }

  /**
   * Remove an existing member from an organisation.
   *
   * @category CRUD
   * @category Organisations
   *
   * @param ownerId  The ID of the user who owns the organisation. If none is
   *   specified, the value of `memberId` will be used for authorisation (i.e.,
   *   it will be assumed that the requester is requesting their own removal).
   * @param organisationId  The ID of the organisation to remove the member from.
   * @param memberId  The ID of the user to remove as a member.
   * @returns  Whether the member was successfully removed or not.
   *
   * @todo Replace {@link _authoriseRemoveMember} call with {@link _authorise}.
   */
  async removeMember({
    ownerId,
    organisationId,
    memberId,
  }: {
    ownerId?: Types.ObjectId;
    organisationId: Types.ObjectId;
    memberId: Types.ObjectId;
  }): Promise<boolean> {
    await this._authoriseRemoveMember({ ownerId, organisationId, memberId });

    const organisation: DocumentType<OrganisationClass> = await this._getById(organisationId);

    const memberToRemove: UserClass = await usersService.get(memberId);

    if (organisation.members.includes(memberToRemove.id)) {
      console.log(`Removing user ${memberToRemove.id} from organisation ${organisation.id}`);
      organisation.members = organisation.members.filter((member: UserClass) => member.id !== memberToRemove.id);
      return !!(await organisation.save());
    } else throw 'User is not a member of Organisation.';
  }

  /**
   * Implement a new control for an organisation.
   *
   * @category CRUD
   * @category Organisations
   *
   * @param organisationId  The ID of the organisation to add the control to.
   * @param newControlId  The ID of the new control to add.
   * @returns  The updated organisation.
   *
   * @todo Replace `control['_id']` with `control.id`.
   */
  async addControl({
    organisationId,
    newControlId,
  }: {
    organisationId: Types.ObjectId;
    newControlId: Types.ObjectId;
  }): Promise<OrganisationClass> {
    const organisation: DocumentType<OrganisationClass> = await this._getById(organisationId);
    const control: ControlClass = await controlsService.get(newControlId);

    control['_id'] = control.id;

    // Should organisations be able to go into the red? atm they can.
    organisation.controls.push({ ...control, mitigation: 0.0, turnImplemented: 0 });

    organisation.balance -= control.cost;
    organisation.markModified('controls');

    await organisation.save();

    return this._basicDetails(organisation);
  }

  /**
   * Remove an existing control from an organisation.
   *
   * @category CRUD
   * @category Organisations
   *
   * @param organisationId  The ID of the organisation to remove the control from.
   * @param newControlId  The ID of the implemented control to remove.
   * @returns  Whether the control was successfully removed or not.
   */
  async removeControl({
    organisationId,
    controlId,
  }: {
    organisationId: Types.ObjectId;
    controlId: Types.ObjectId;
  }): Promise<boolean> {
    const organisation: DocumentType<OrganisationClass> = await this._getById(organisationId);
    const controlToRemove: ControlClass = await controlsService.get(controlId);

    if (organisation.controls.find((control) => control.id === controlToRemove.id)) {
      console.log(`Removing control ${controlToRemove.id} from organisation ${organisation.id}`);
      organisation.controls = organisation.controls.filter(
        (control: ImplementedControl) => control.id !== controlToRemove.id,
      );
      return !!(await organisation.save());
    } else throw 'Organisation has not implemented control.';
  }

  /**
   * Get the enum of possible organisation size values (see {@link Enums.sizes}).
   *
   * @category Organisations
   *
   * @returns  The list of possible organisation size values.
   */
  static getSizes(): string[] {
    return sizes;
  }

  /**
   * Get the enum of possible organisation industry classifications (see
   * {@link Enums.industries}).
   *
   * @category Organisations
   *
   * @returns  The list of possible industry classification values.
   */
  static getIndustries(): Record<string, string> {
    return industries;
  }

  /**
   * Simulate an event occuring to an organisation.
   *
   * This event will have a cost and security area(s) defined, and this function
   * will test the event against the organisation's implemented controls to
   * determine any mitigation.
   *
   * @category Organisations
   *
   * @param organisationId  The ID of the organisation to simulate the event
   *   against.
   * @param eventId  The ID of the event to simulate against the organisation.
   * @returns  The updated organisation.
   *
   * @todo Move to {@link SimulationsService}?
   * @todo Handle control testing in {@link SimulationsService}.
   * @todo Use `.id` instead of `['id']`.
   */
  async simulateEvent({
    organisationId,
    eventId,
  }: {
    organisationId: Types.ObjectId;
    eventId: Types.ObjectId;
  }): Promise<OrganisationClass> {
    const organisation: DocumentType<OrganisationClass> = await this._getById(organisationId);

    const event: EventClass = await eventsService.get(eventId);
    let mitigated = false;
    let mitigatedBy, mitigatedCost;
    for (const control of organisation.controls) {
      for (const controlSecurityAreaId of control.securityAreas) {
        for (const eventSecurityArea of event.securityAreas) {
          if (control.asset === event.asset && String(controlSecurityAreaId) === String(eventSecurityArea['id']))
            mitigated = true;
        }
      }

      if (mitigated) {
        mitigatedBy = control.id;
        mitigatedCost = event.cost - event.cost * control.effectiveness;
        control.mitigation += event.cost - mitigatedCost;
        break;
      }
    }
    if (mitigated) organisation.markModified('controls');

    organisation.events.push({ ...event, mitigated, mitigatedBy, mitigatedCost });
    organisation.markModified('events');

    organisation.balance -= mitigatedCost || event.cost;

    await organisation.save();

    return this._basicDetails(organisation);
  }

  /**
   * Simulate the start of a new turn occuring to an organisation.
   *
   * At the start of a new turn, any unspent money is added to the organisation's
   * balance. Investment is also earned on this balance.
   *
   * @category Organisations
   *
   * @param organisationId  The ID of the organisation to simulate.
   * @param moneyPerTurn  The amount of money that the organisation should
   *   receive.
   * @returns  The updated organisation.
   *
   * @todo Move to {@link SimulationsService}.
   */
  async simulateNewTurn({
    organisationId,
    moneyPerTurn,
  }: {
    organisationId: Types.ObjectId;
    moneyPerTurn: number;
  }): Promise<OrganisationClass> {
    const organisation: DocumentType<OrganisationClass> = await this._getById(organisationId);
    organisation.balance += moneyPerTurn;

    await organisation.save();

    return this._basicDetails(organisation);
  }

  async saveBalance(organisationId: Types.ObjectId, currentTurn: number): Promise<void> {
    const organisation: DocumentType<OrganisationClass> = await this._getById(organisationId);

    if (organisation.pastBalances[currentTurn - 1]) throw { code: 500, message: 'Past balance already set!' };
    organisation.pastBalances.push(organisation.balance);

    await organisation.save();
  }

  /**
   * Retrieve an organisation from the document database by joining code.
   *
   * @category CRUD
   * @category Organisations
   *
   * @param joiningCode  The unique joining code to search for.
   * @param joiningPassword  The (optional) joining password that is required.
   */
  protected async _getByJoiningCode(
    joiningCode: string,
    joiningPassword: string = undefined,
  ): Promise<DocumentType<OrganisationClass>> {
    const organisation: DocumentType<OrganisationClass> = await Organisation.findOne({
      joiningCode: joiningCode,
      joiningPassword: joiningPassword,
    });

    if (!organisation) throw 'No organisation found for joining code.';

    return organisation;
  }

  /**
   * Retrieve an organisation from the document database by user.
   *
   * @category CRUD
   * @category Organisations
   *
   * @param memberId  The ID of the user to search for.
   * @param joiningPassword  The (optional) joining password that is required.
   * @returns  The retrieved organisation document.
   */
  protected async _getByMember(memberId: Types.ObjectId): Promise<DocumentType<OrganisationClass>> {
    const organisation: DocumentType<OrganisationClass> = await Organisation.findOne({ members: { $in: [memberId] } });

    if (!organisation) throw 'No organisation found for member ID.';

    return organisation;
  }

  /**
   * Authorise actions.
   *
   * @category Organisations
   * @category Auth
   *
   * @param userId  The ID of the user to authorise.
   * @param id  The ID of the organisation.
   * @returns  Whether the user is authorised to perform the action or not.
   */
  protected async _authorise(userId: Types.ObjectId, id: Types.ObjectId): Promise<boolean> {
    const user: UserClass = await usersService.get(userId);
    if (!user.isAdmin) {
      const organisation: OrganisationClass = this._basicDetails(await this._getById(id));
      if (String(organisation.owner) !== String(user.id)) throw 'User does not have permission to update Organisation.';
    }
    return true;
  }

  /**
   * Authorise member removal actions.
   *
   * @category Organisations
   * @category Auth
   *
   * @param ownerId  The ID of the user to authorise. If none is specified, the
   *   value of `memberId` will be used for authorisation (i.e., it will be
   *   assumed that the requester is requesting their own removal).
   * @param organisationId  The ID of the organisation.
   * @param memberId  The ID of the user to remove as a member.
   * @returns  Whether the user is authorised to perform the action or not.
   *
   * @todo Roll this into the normal {@link _authorise} method.
   */
  protected async _authoriseRemoveMember({
    ownerId,
    organisationId,
    memberId,
  }: {
    ownerId?: Types.ObjectId;
    organisationId: Types.ObjectId;
    memberId: Types.ObjectId;
  }): Promise<void> {
    const callerId: Types.ObjectId = ownerId || memberId;
    const requestingUser: UserClass = await usersService.get(callerId);
    const organisation: DocumentType<OrganisationClass> = await this._getById(organisationId);
    if (ownerId) {
      if (organisation.owner != requestingUser.id) throw 'User does not have permission to remove member.';
    }

    // check that the member to remove exists
    await usersService.get(memberId);
  }

  /**
   * Serialise a user document into a user object.
   *
   * @category Sanitisation
   * @category Organisations
   *
   * @param document  The organisation document from the document database.
   * @returns  The organisation object.
   */
  protected _basicDetails(document: DocumentType<OrganisationClass>): OrganisationClass {
    const { _id, __v, id, name, balance, size, industry, members, controls, events, joiningCode, owner } = document;
    return {
      _id,
      __v,
      id,
      name,
      balance,
      pastBalances: [],
      size,
      industry,
      members,
      controls,
      events,
      joiningCode,
      owner,
    };
  }
}
