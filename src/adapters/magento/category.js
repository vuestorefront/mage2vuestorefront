'use strict';

let AbstractMagentoAdapter = require('./abstract');
const CacheKeys = require('./cache_keys');
const util = require('util');

class CategoryAdapter extends AbstractMagentoAdapter {

  constructor(config) {
    super(config);
    this.preProcessItem = this.preProcessItem.bind(this);
    this._addSingleCategoryData = this._addSingleCategoryData.bind(this);
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
    return '[(' + source_item.id + ') ' + source_item.name + ']';
  }

  isFederated() {
    return false;
  }

  _addSingleCategoryData(item, result) {
    item.extendedCategoryData = result;
  }

  preProcessItem(item) {
    let inst = this;
    return new Promise((function (done, reject) {

      if(!item){
        return done(item);
      }
      
      if(inst.extendedCategories === true){
        inst.api.categories.getSingle(item.id).then(function(result) { 
          inst._addSingleCategoryData.bind(inst)(item, result); 
          const key = util.format(CacheKeys.CACHE_KEY_CATEGORY, item.id);
          logger.debug(util.format('Storing extended category data to cache under: %s', key));
          inst.cache.set(key, JSON.stringify(item));
          done(item); 
        }).catch(function (err) {
          logger.error(err);
          done(item);
        });
      } else {
        const key = util.format(CacheKeys.CACHE_KEY_CATEGORY, item.id);
        logger.debug(util.format('Storing category data to cache under: %s', key));
        this.cache.set(key, JSON.stringify(item));
        return done(item);
      }


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
