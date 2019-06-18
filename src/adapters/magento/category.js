'use strict';

let AbstractMagentoAdapter = require('./abstract');
const CacheKeys = require('./cache_keys');
const util = require('util');
const request = require('request');
const _slugify = require('../../helpers/slugify')

const _normalizeExtendedData = function (result, generateUrlKey = true, config = null) {
  if (result.custom_attributes) {
    for (let customAttribute of result.custom_attributes) { // map custom attributes directly to document root scope
      result[customAttribute.attribute_code] = customAttribute.value;
    }
    delete result.custom_attributes;
  }
  if (generateUrlKey) {
    result.url_key = _slugify(result.name) + '-' + result.id;
  }
  result.slug = result.url_key
  if (config.seo.useUrlDispatcher) {
    result.url_path = config.seo.categoryUrlPathMapper(result)
  } else {
    result.url_path = result.url_key;
  }
  return result
}

class CategoryAdapter extends AbstractMagentoAdapter {

  constructor (config) {
    super(config);
    this.extendedCategories = false;
    this.generateUniqueUrlKeys = true;
  }

  getEntityType() {
    return 'category';
  }

  getName() {
    return 'adapters/magento/CategoryAdapter';
  }

  getSourceData(context) {
    this.generateUniqueUrlKeys = context.generateUniqueUrlKeys;
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
    item = Object.assign(item, _normalizeExtendedData(result, this.generateUniqueUrlKeys, this.config));
  }

  _extendSingleCategory(rootId, catToExtend) {
    const generateUniqueUrlKeys = this.generateUniqueUrlKeys
    const config = this.config
    return this.api.categories.getSingle(catToExtend.id).then(function(result) {
      Object.assign(catToExtend, _normalizeExtendedData(result, generateUniqueUrlKeys, config))
      logger.info(`Subcategory data extended for ${rootId}, children object ${catToExtend.id}`)
    }).catch(function(err) {
      logger.error(err)
    });
  }

  _extendChildrenCategories(rootId, children, result, subpromises) {
    for (const child of children) {
      if (Array.isArray(child.children_data)) {
        this._extendChildrenCategories(rootId, child.children_data, result, subpromises);
        subpromises.push(this._extendSingleCategory(rootId, child));
      } else {
        subpromises.push(this._extendSingleCategory(rootId, child));
      }
    }
    return result;
  };

  preProcessItem(item) {
    return new Promise((done, reject) => {

      if (!item) {
        return done(item);
      }

      if (!item.url_key || this.generateUniqueUrlKeys) {
        item.url_key = _slugify(item.name) + '-' + item.id
      }
      item.slug = item.url_key;
      if (this.config.seo.useUrlDispatcher) {
        item.url_path = this.config.seo.categoryUrlPathMapper(item)
      } else {               
        item.url_path = item.url_key;
      }

      if (this.extendedCategories) {

        this.api.categories.getSingle(item.id).then((result) => {
          this._addSingleCategoryData(item, result);

          const key = util.format(CacheKeys.CACHE_KEY_CATEGORY, item.id);
          logger.debug(`Storing extended category data to cache under: ${key}`);
          this.cache.set(key, JSON.stringify(item));

          const subpromises = []
          if (item.children_data && item.children_data.length) {
            this._extendChildrenCategories(item.id, item.children_data, result, subpromises)

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
   * We're transforming the data structure of item to be compliant with Smile.fr Elastic Search Suite
   * @param {object} item  document to be updated in elastic search
   */
  normalizeDocumentFormat(item) {
    if (this.config.vuestorefront && this.config.vuestorefront.invalidateCache) {
      request(this.config.vuestorefront.invalidateCacheUrl + 'C' + item.id, {}, (err, res, body) => {
        if (err) { return console.error(err); }
        console.log(body);
      });
    }
    return item;
  }
}

module.exports = CategoryAdapter;
