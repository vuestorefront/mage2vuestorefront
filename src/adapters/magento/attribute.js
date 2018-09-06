'use strict';

let AbstractMagentoAdapter = require('./abstract');
const CacheKeys = require('./cache_keys');
const util = require('util');

class AttributeAdapter extends AbstractMagentoAdapter {

  getEntityType() {
    return 'attribute';
  }

  getName() {
    return 'adapters/magento/AttributeAdapter';
  }

  getSourceData(context) {
    return this.api.attributes.list();
  }

  /**  Regarding Magento2 api docs and reality we do have an exception here that items aren't listed straight in the response but under "items" key */
  prepareItems(items) {
    if(!items)
      return items;
 
    if (items.total_count)
      this.total_count = items.total_count;
    
    if(items.items)
      items = items.items; // this is an exceptional behavior for Magento2 api  for attributes

    return items;
  }

  getLabel(source_item) {
    return `[(${source_item.attribute_code}) ${source_item.default_frontend_label}]`;
  }

  isFederated() {
    return false;
  }

  preProcessItem(item) {
    return new Promise((done, reject) => {
      if (item) {
        item.id = item.attribute_id;
        // store the item into local redis cache
        let key = util.format(CacheKeys.CACHE_KEY_ATTRIBUTE, item.attribute_code);
        logger.debug(`Storing attribute data to cache under: ${key}`);
        this.cache.set(key, JSON.stringify(item));

        key = util.format(CacheKeys.CACHE_KEY_ATTRIBUTE, item.attribute_id); // store under attribute id as an second option
        logger.debug(`Storing attribute data to cache under: ${key}`);
        this.cache.set(key, JSON.stringify(item));
      }

      return done(item);
    });
  }

  /**
   * We're transorming the data structure of item to be compliant with Smile.fr Elastic Search Suite
   * @param {object} item  document to be updated in elastic search
   */
  normalizeDocumentFormat(item) {
    return item;
  }
}

module.exports = AttributeAdapter;
