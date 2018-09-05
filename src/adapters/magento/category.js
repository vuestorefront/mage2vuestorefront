'use strict';

let AbstractMagentoAdapter = require('./abstract');
const CacheKeys = require('./cache_keys');
const util = require('util');

const _normalizeExtendedData = function (result) {
  if (result.custom_attributes) {
    for (let customAttribute of result.custom_attributes) { // map custom attributes directly to document root scope
      result[customAttribute.attribute_code] = customAttribute.value;
    }
    delete result.custom_attributes;
  }
  
  return result
}

class CategoryAdapter extends AbstractMagentoAdapter {

  constructor (config) {
    super(config);
    this.extendedCategories = false;
  }

  getEntityType() {
    return 'category';
  }

  getName() {
    return 'adapters/magento/CategoryAdapter';
  }

  getSourceData(context) {
    this.extendedCategories = context.extendedCategories;
    return this.api.categories.list();
  }

  getLabel(source_item) {
    return `[(${source_item.id}) ${source_item.name}]`;
  }

  isFederated() {
    return false;
  }

  _addSingleCategoryData(item, result) {
    item = Object.assign(item, _normalizeExtendedData(result));
  }

  _extendSingleCategory(catToExtend) {
    return this.api.categories.getSingle(catToExtend.id).then(function(result) { 
      Object.assign(catToExtend, _normalizeExtendedData(result))
      logger.info('Subcategory data extended for children object', catToExtend.id, item.id)
    }).catch(function(err) {
      logger.error(err)
    });
  }

  _extendChildrenCategories(arr) {
    for (let i = 0, length = arr.length; i < length; i++) {
      const value = arr[i];
      if (Array.isArray(value.children_data)) {
        _extendChildrenCategories(value.children_data, result);
        subpromises.push(_extendSingleCategory(value));
      } else {
        subpromises.push(_extendSingleCategory(value));
      }
    }
    return result;
  };

  preProcessItem(item) {
    return new Promise((done, reject) => {

      if (!item) {
        return done(item);
      }
      
      if (this.extendedCategories === true) {

        this.api.categories.getSingle(item.id).then((result) => { 
          this._addSingleCategoryData(item, result); 
          
          const key = util.format(CacheKeys.CACHE_KEY_CATEGORY, item.id);
          logger.debug(`Storing extended category data to cache under: ${key}`);
          this.cache.set(key, JSON.stringify(item));

          const subpromises = []
          if (item.children_data && item.children_data.length) {
            _extendChildrenCategories(item.children_data)
            
            Promise.all(subpromises).then(function (results) {
              done(item)
            }).catch(function (err) {
              logger.error(err)
              done(item)
            })
          } else {
            done(item);
          }
        }).catch(function (err) {
          logger.error(err);
          done(item);
        });

      } else {
        const key = util.format(CacheKeys.CACHE_KEY_CATEGORY, item.id);
        logger.debug(`Storing category data to cache under: ${key}`);
        this.cache.set(key, JSON.stringify(item));
        return done(item);
      }

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

module.exports = CategoryAdapter;
