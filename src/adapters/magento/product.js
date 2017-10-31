'use strict';

let AbstractMagentoAdapter = require('./abstract');
const util = require('util');
const CacheKeys = require('./cache_keys');
const Redis = require('redis');

class ProductAdapter extends AbstractMagentoAdapter {

  constructor(config) {
    super(config);
    this.use_paging = true;
    this.stock_sync = true;
    this.category_sync = true;
    this.configurable_sync = true;
    this.is_federated = true; // by default use federated behaviour
  }

  getEntityType() {
    return 'product';
  }

  getName() {
    return 'adapters/magento/ProductAdapter';
  }

  prepareItems(items) {

    if(!items)
      return null;

    this.total_count = items.total_count;

    if (this.use_paging) {
      this.page_count = this.total_count / this.page_size;
    }

    return items.items;
  }

  getFilterQuery(context) {

    let query = ''; console.log(typeof context.updated_after);

    if (context.skus)// pul individual products
    {
      if (!Array.isArray(context.skus))
        context.skus = new Array(context.skus);


      query += 'searchCriteria[filter_groups][0][filters][0][field]=sku&' +
        'searchCriteria[filter_groups][0][filters][0][value]=' + encodeURIComponent(context.skus.join(',')) + '&' +
        'searchCriteria[filter_groups][0][filters][0][condition_type]=in';

    } else if (context.updated_after && typeof context.updated_after == 'Date') {
      query += 'searchCriteria[filter_groups][0][filters][0][field]=updated_at&' +
        'searchCriteria[filter_groups][0][filters][0][value]=' + encodeURIComponent(context.updated_after.getTime()) + '&' +
        'searchCriteria[filter_groups][0][filters][0][condition_type]=gt';
    }
    return query;
  }

  getSourceData(context) {

    let query = this.getFilterQuery(context);

    if(typeof context.stock_sync !== 'undefined')
      this.stock_sync = context.stock_sync;

    if(typeof context.category_sync !== 'undefined')
      this.category_sync = context.category_sync;
      
    if(typeof context.configurable_sync !== 'undefined')
      this.configurable_sync = context.configurable_sync;

    if (context.for_total_count) { // get total counts
      return this.api.products.list('&searchCriteria[currentPage]=1&searchCriteria[pageSize]=1').catch(function (err) {
        throw new Error(err);
      });
    } else if (context.page && context.page_size) {

      this.use_paging = false;
      this.is_federated = true;
      this.page = context.page;
      this.page_size = context.page_size
      this.page_count = 1; // process only one page - used for partitioning purposes

      logger.debug('Using specific paging options from adapter context: ' + context.page + ' / ' + context.page_size);


      return this.api.products.list('&searchCriteria[currentPage]=' + context.page + '&searchCriteria[pageSize]=' + context.page_size + (query ? '&' + query : '')).catch(function (err) {
        throw new Error(err);
      });

    } else if (this.use_paging) {
      this.is_federated = false; // federated execution is not compliant with paging
      logger.debug('&searchCriteria[currentPage]=' + this.page + '&searchCriteria[pageSize]=' + this.page_size + (query ? '&' + query : ''));
      return this.api.products.list('&searchCriteria[currentPage]=' + this.page + '&searchCriteria[pageSize]=' + this.page_size + (query ? '&' + query : '')).catch(function (err) {
        throw new Error(err);
      });
    } else
      return this.api.products.list().catch(function (err) {
        throw new Error(err);
      });
  }


  getTotalCount(context) {

    context = context ? Object.assign(context, { for_total_count: 1 }) : { for_total_count: 1 };
    return this.getSourceData(context); //api.products.list('&searchCriteria[currentPage]=1&searchCriteria[pageSize]=1');
  }

  getLabel(source_item) {
    return '[(' + source_item.id + ' - ' + source_item.sku + ') ' + source_item.name + ']';
  }

  /**
   * 
   * @param {Object} item 
   */
  preProcessItem(item) {

    return new Promise((function (done, reject) {
      // TODO: add denormalization of productcategories into product categories
      // DO NOT use "productcategories" type but rather do search categories with assigned products

      let subSyncPromises = []

// TODO: Refactor the following to "Chain of responsibility"
// STOCK SYNC      
      if(inst.stock_sync) {
        logger.info('Product sub-stage 1: Geting stock items for ' + item.sku);
        subSyncPromises.push(inst.api.stockItems.list(item.sku).then(function(result) { 
          console.log(result) // TODO: store stock items in redis for quick checks via API?
          return item
        }))
      }

// CONFIGURABLE AND BUNDLE SYNC
      if(inst.configurable_sync && (item.type_id == 'configurable' || item.type_id == 'bundle')){
        logger.info('Product sub-stage 2: Geting product options for ' + item.sku);
        
        //      q.push(function () {
        subSyncPromises.push(inst.api.configurableChildren.list(item.sku).then(function(result) { 
          

          item.configurable_children = new Array()
          for(let prOption of result) {
            item.configurable_children.push({
              sku: prOption.sku,
              name: prOption.name,
              price: prOption.price,
              custom_attributes: prOption.custom_attributes
            });
            if(item.price  == 0) // if price is zero fix it with first children
              item.price = prOption.price;
          }

          inst.api.configurableOptions.list(item.sku).then(function(result) { 
            item.configurable_options = result;

            return(item);
          }).catch(function (err) {
            logger.error(err);
            return(item);
          })

          }).catch(function (err) {
          logger.error(err);
          return(item);
        }));
        
        
      } 

// CATEGORIES SYNC      
      subSyncPromises.push(new Promise((resolve, reject) => {
        logger.info('Product sub-stage 3: Geting product categories for ' + item.sku);
        
        const key = util.format(CacheKeys.CACHE_KEY_PRODUCT_CATEGORIES, item.sku); // store under SKU of the product the categories assigned

        if(inst.category_sync) {
          item.category = new Array();

          const inst = this;
          this.cache.smembers(key, function (err, categories) {
            if (categories == null) {
              resolve(item);
            }
            else {

              let catPromises = new Array();
              for (let catId of categories) {

                catPromises.push(
                  new Promise(function (resolve, reject) {

                    let cat = inst.cache.get(util.format(CacheKeys.CACHE_KEY_CATEGORY, catId), function (err, serializedCat) {
                      let cat = JSON.parse(serializedCat); // category object
                      if (cat != null) {
                        resolve({
                          category_id: cat.id,
                          name: cat.name
                        })
                      } else
                        resolve(null);
                    });

                  }));

              }

              Promise.all(catPromises).then(function (values) {
                if(inst.category_sync) // TODO: refactor the code above to not get cache categorylinks when no category_sync required
                  item.category = values; // here we get configurable options
                  resolve(item)
              });

            }

          })
        }
      }))


      Promise.all(subSyncPromises).then(items=> {
        logger.info('Product sub-stages done for ' + item.sku);
        done(item) // all subpromises return refernce to the product
      });
      

    }).bind(this));


  }

  /**
   * We're transorming the data structure of item to be compliant with Smile.fr Elastic Search Suite
   * @param {object} item  document to be updated in elastic search
   */
  normalizeDocumentFormat(item) {
    let prices = new Array();

    /*for (let priceTag of item.tier_prices) {
      prices.push({
        "price": priceTag.value,
        "original_price": priceTag.original_price,
        "customer_group_id": priceTag.customerGroupId,
        "qty": priceTag.qty
      });
    }*/


    let resultItem = Object.assign(item, {
//      "price": prices, // ES stores prices differently
// TODO: HOW TO GET product stock from Magento API call for product?
    });

    for (let customAttribute of item.custom_attributes) { // map custom attributes directly to document root scope
      resultItem[customAttribute.attribute_code] = customAttribute.value;
    }
    resultItem.custom_attributes = null;
    return resultItem;

  }


}

module.exports = ProductAdapter;
