/**
 * This module defines the controls service, which processes all requests
 * relating to controls.
 *
 * @category Controls
 * @category Services
 *
 * @module ControlsService
 */

import { DocumentType } from '@typegoose/typegoose';

import { Service } from '../_helpers';
import { ControlClass } from '../models';
import { Control } from '../_helpers/db';
import { Asset } from '../../typings';

/**
 * Represents the controls service.
 */
export default class ControlsService extends Service<ControlClass> {
  /**
   * Initialise the superclass with the `Control` model.
   */
  constructor() {
    super(Control);
  }

  /**
   * Filters out any assets that do not have controls available.
   *
   * @category Controls
   *
   * @param assets  The assets to filter.
   * @param source  Optional. The source to limit assets to. Default 'original'.
   * @returns  The list of assets with controls available.
   */
  async filterAssetsWithControls(assets: Asset[], source = 'original'): Promise<Asset[]> {
    const assetsList: Asset[] = [];

    for (const asset of assets) {
      const hasControls = !!(await Control.find({ asset: asset.slug, source }).countDocuments());
      if (hasControls) assetsList.push(asset);
    }

    return assetsList;
  }

  /**
   * Serialise a control document into a control object.
   *
   * @category Sanitisation
   * @category Controls
   *
   * @param document  The control document from the document database.
   * @returns  The control object.
   */
  protected _basicDetails(document: DocumentType<ControlClass>): ControlClass {
    const {
      id,
      number,
      name,
      summary,
      description,
      effect,
      cost,
      asset,
      source,
      img,
      securityAreas,
      effectiveness,
    } = document;
    return { id, number, name, summary, description, effect, cost, asset, source, img, securityAreas, effectiveness };
  }
}
