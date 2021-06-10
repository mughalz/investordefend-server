/**
 * This module defines the security areas service, which processes all requests
 * relating to security areas.
 *
 * @category Security Areas
 * @category Services
 *
 * @module SecurityAreasService
 */

import { DocumentType } from '@typegoose/typegoose';

import { Service } from '../_helpers';
import { SecurityAreaClass } from '../models';
import { SecurityArea, Settings } from '../_helpers/db';

/**
 * Represents the security areas service.
 */
export default class SecurityAreasService extends Service<SecurityAreaClass> {
  /**
   * Initialise the superclass with the `Security Area` Model.
   */
  constructor() {
    super(SecurityArea);
  }

  /**
   * Get the enum of possible security area/control source values.
   *
   * @category Security Areas
   * @category Controls
   *
   * @returns  The list of possible security area/control source values.
   */
  static async getSources(): Promise<Record<string, string>> {
    const sources = await Settings.findOne({ key: 'sources' });
    return sources.value;
  }

  /**
   * Get all security areas with a given source.
   *
   * @category Security Areas
   *
   * @param source  The source to search for.
   * @returns  The list of all security areas.
   */
  async getAllBySource(source = 'original'): Promise<SecurityAreaClass[]> {
    const securityAreas: DocumentType<SecurityAreaClass>[] = await this._getAllBySource(source);
    return securityAreas.filter((securityArea) => this._basicDetails(securityArea));
  }

  /**
   * Get all security area documents from the document database with the given
   * source.
   *
   * @category CRUD
   * @category Base
   *
   * @param source  The source to filter documents by.
   * @returns  The retrieved documents.
   */
  protected async _getAllBySource(source: string): Promise<DocumentType<SecurityAreaClass>[]> {
    const documents: DocumentType<SecurityAreaClass>[] = await SecurityArea.find({ source });

    if (!documents) throw { code: 404, message: 'No documents found matching provided source.' };

    return documents;
  }

  /**
   * Serialise a security area document into a security area object.
   *
   * @category Sanitisation
   * @category Security Areas
   *
   * @param document  The security area document from the document database.
   * @returns  The security area object.
   */
  protected _basicDetails(document: DocumentType<SecurityAreaClass>): SecurityAreaClass {
    const { id, number, name, summary, description, source } = document;
    return { id, number, name, summary, description, source };
  }
}
