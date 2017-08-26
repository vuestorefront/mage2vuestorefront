'use strict';

let AbstractMagentoAdapter = require('./abstract');

let sha1 = require('sha1');
var queue = require('queue')

var q = queue({ concurrency: 4 });


const MAX_PRODUCTS_IN_CAT = 100000;

/**
 * This adapter retrieves and stores all product / category links from Magento2
 */
class ProductcategoriesAdapter extends AbstractMagentoAdapter {


  constructor(config) {
    super(config);
    this.update_document = false; // this adapter works on categories but doesn't update them itself but is focused on category links instead!
    this.preProcessItem = this.preProcessItem.bind(this);
    this._storeCatLinks = this._storeCatLinks.bind(this);
    this.store_separate_productcategories = false; // if this option is true then store separate productcategories

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
    return '[(' + source_item.id + ') ' + source_item.name + ']';
  }


  /**
   * Process category link product/category
   * @param {Object} result 
   */
  _storeCatLinks(item, result) {
    let index = 0;
    let length = result.length; 


    if (this.store_separate_productcategories) {
      for (let catLink of result) {

        //      logger.debug('(' +index +'/' + length +  ') Storing categoryproduct link for ' + catLink.sku +' - ' + catLink.category_id);
        catLink.id = catLink.category_id * MAX_PRODUCTS_IN_CAT + index;

        index++;

        catLink = this.normalizeDocumentFormat(catLink);
      }

      logger.debug('Performing bulk update ...');
      this.db.updateDocumentBulk('productcategories', result); // TODO: add support for BULK operations and DELETE 
    } else {

      // TODO: update products to set valid category
      item.products = result;
      this.db.updateDocument('category', item); 
      logger.debug('Updating category object for ' + item.id);

    }
  }

  /**
   * Get the product category links for this specific category and update the products
   * @param {Object} item 
   */
  preProcessItem(item) {

    let inst = this;
    q.push(function () {
      return inst.api.categoryProducts.list(item.id).then(inst._storeCatLinks.bind(inst, item)).catch(function (err) {
        logger.error(err);
      });
    });

  }

  /**
   * Default done callback called after all main items are processed by processItems
   */
  defaultDoneCallback() {
    logger.info('Please wait while product links are getting processed and stored ... ');

    q.start(function (err) {
      if (err) throw err
      logger.info('all done:', results)
    });
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
