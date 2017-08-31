'use strict';

let AbstractMagentoAdapter = require('./abstract');
const CacheKeys = require('./cache_keys');
const util = require('util');

class CategoryAdapter extends AbstractMagentoAdapter {


  getEntityType() {
    return 'category';
  }

  getName() {
    return 'adapters/magento/CategoryAdapter';
  }


  getSourceData(context) {
    return this.api.categories.list();
  }

  getLabel(source_item) {
    return '[(' + source_item.id + ') ' + source_item.name + ']';
  }

  isFederated() {
    return false;
  }

  preProcessItem(item) {

    return new Promise((function (done, reject) {
      // store the item into local redis cache
      const key = util.format(CacheKeys.CACHE_KEY_CATEGORY, item.id);
      logger.debug(util.format('Storing category data to cache under: %s', key));
      this.cache.set(key, JSON.stringify(item));

      return done(item);
    }).bind(this));

  }

  /**
   * We're transorming the data structure of item to be compliant with Smile.fr Elastic Search Suite
   * @param {object} item  document to be updated in elastic search
   */
  normalizeDocumentFormat(item) {
    return item;
  }

}

module.exports = CategoryAdapter;
