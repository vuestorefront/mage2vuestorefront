'use strict';

let AbstractMagentoAdapter = require('./abstract');

let queue = require('queue');
let util = require('util');
let q = queue({ concurrency: 4 });

const ProductCategoriesModes = {
  SEPARATE_ELASTICSEARCH: 1,
  UPDATE_CATEGORY: 2,
  SEPARATE_REDIS: 3
}

const CacheKeys = require('./cache_keys');

/**
 * This adapter retrieves and stores all product / category links from Magento2
 */
class ProductcategoriesAdapter extends AbstractMagentoAdapter {

  constructor(config) {
    super(config);
    this.update_document = false; // this adapter works on categories but doesn't update them itself but is focused on category links instead!
    this._productHisto = new Set();

    this.mode = ProductCategoriesModes.SEPARATE_REDIS;

    this.catLinkQueue = new Array();
  }

  getEntityType() {
    return 'productcategories';
  }

  getName() {
    return 'adapters/magento/ProductcategoryAdapter';
  }

  getSourceData(context) {
    return this.api.categories.list();
  }

  getLabel(source_item) {
    return `[(${source_item.id}) ${source_item.name}]`;
  }

  /**
   * Process category link product/category
   * @param {Object} result 
   */
  _storeCatLinks(item, result) {
    let index = 0;
    let length = result.length;

    switch (this.mode) {
      case ProductCategoriesModes.SEPARATE_ELASTICSEARCH: {
        for (let catLink of result) {
          // logger.debug('(' +index +'/' + length +  ') Storing categoryproduct link for ' + catLink.sku +' - ' + catLink.category_id);
          catLink.id = catLink.category_id * MAX_PRODUCTS_IN_CAT + index;

          index++;

          catLink = this.normalizeDocumentFormat(catLink);
        }

        logger.debug('Performing bulk update...');
        this.db.updateDocumentBulk('productcategories', result); // TODO: add support for BULK operations and DELETE 
      }

      case ProductCategoriesModes.UPDATE_CATEGORY: {
        // TODO: update products to set valid category
        item.products = result;
        this.db.updateDocument('category', item);
        logger.debug(`Updating category object for ${item.id}`);
      }

      default: { // update in redis = ProductCategoriesModes.SEPARATE_REDIS
        logger.debug(`Storing category assigments in REDIS cache for ${item.id}`);

        for (let catLink of result) {
          const key = util.format(CacheKeys.CACHE_KEY_PRODUCT_CATEGORIES_TEMPORARY, catLink.sku); // store under SKU of the product the categories assigned

          this.cache.sadd(key, catLink.category_id); // add categories to sets
          this._productHisto.add(catLink.sku);
        }
      }
    }

    logger.info(`The task count still is = ${this.tasks_count}`);
  }

  /**
   * Get the product category links for this specific category and update the products
   * @param {Object} item 
   */
  preProcessItem(item) {
    return new Promise((done, reject) => {
// q.push(() => {
      this.api.categoryProducts.list(item.id).then((result) => {
        this._storeCatLinks(item, result);
        done(item);
      }).catch((err) => {
        logger.error(err);
        done(item);
      });
  // });
    });
  }

  /**
   * Default done callback called after all main items are processed by processItems
   */
  defaultDoneCallback() {
    logger.info('Renaming the cache key to production! ');

    for(let sku of this._productHisto){
      const origKey = util.format(CacheKeys.CACHE_KEY_PRODUCT_CATEGORIES_TEMPORARY, sku); 
      const destKey = util.format(CacheKeys.CACHE_KEY_PRODUCT_CATEGORIES, sku); 
      // logger.debug(util.format('Moving %s to %s', origKey, destKey));

      this.cache.rename(origKey, destKey);
    }

    logger.info('Publishing cache keys to production finished!');

  /*  q.start((err) => {
      if (err) throw err
      logger.info('all done:', results)
    });*/
  }

  isFederated() {
    return false;
  }

  /**
   * We're transorming the data structure of item to be compliant with Smile.fr Elastic Search Suite
   * @param {object} item  document to be updated in elastic search
   */
  normalizeDocumentFormat(item) {
    return item;
  }

}

module.exports = ProductcategoriesAdapter;
