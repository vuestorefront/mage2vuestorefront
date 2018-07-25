'use strict';

let AbstractMagentoAdapter = require('./abstract');
const util = require('util');
const CacheKeys = require('./cache_keys');
const Redis = require('redis');
const moment = require('moment')
const _ = require('lodash')

/*
 * serial executes Promises sequentially.
 * @param {funcs} An array of funcs that return promises.
 * @example
 * const urls = ['/url1', '/url2', '/url3']
 * serial(urls.map(url => () => $.ajax(url)))
 *     .then(console.log.bind(console))
 */
const serial = funcs =>
funcs.reduce((promise, func) =>
    promise.then(result => func().then(Array.prototype.concat.bind(result))), Promise.resolve([]))

class ProductAdapter extends AbstractMagentoAdapter {

  constructor(config) {
    super(config);
    this.use_paging = true;
    this.stock_sync = true;
    this.custom_sync = true;
    this.media_sync = true;
    this.category_sync = true;
    this.links_sync = true;
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

    let query = ''; 

    if (context.skus)// pul individual products
    {
      if (!Array.isArray(context.skus))
        context.skus = new Array(context.skus);


      query += 'searchCriteria[filter_groups][0][filters][0][field]=sku&' +
        'searchCriteria[filter_groups][0][filters][0][value]=' + encodeURIComponent(context.skus.join(',')) + '&' +
        'searchCriteria[filter_groups][0][filters][0][condition_type]=in';

    } else if (context.updated_after && typeof context.updated_after == 'object') {
      query += 'searchCriteria[filter_groups][0][filters][0][field]=updated_at&' +
        'searchCriteria[filter_groups][0][filters][0][value]=' + encodeURIComponent(moment(context.updated_after).utc().format()) + '&' +
        'searchCriteria[filter_groups][0][filters][0][condition_type]=gt';
    }
    return query;
  }

  getSourceData(context) {
    if (this.config.product && this.config.product.synchronizeCatalogSpecialPrices) {
      const inst = this
      return new Promise((resolve, reject) => {
        
        this.getProductSourceData(context).then((result) => {
          // download rendered list items
          const products = result.items
          let skus = products.map((p) => { return p.sku })

          if (products.length === 1) { // single product - download child data
            const childSkus = _.flattenDeep(products.map((p) => { return (p.configurable_children) ? p.configurable_children.map((cc) => { return cc.sku }) : null }))
            skus = _.union(skus, childSkus)
          }        
          const query = '&searchCriteria[filter_groups][0][filters][0][field]=sku&' +
          'searchCriteria[filter_groups][0][filters][0][value]=' + encodeURIComponent(skus.join(',')) + '&' +
          'searchCriteria[filter_groups][0][filters][0][condition_type]=in';          

          this.api.products.renderList(query, inst.config.magento.storeId, inst.config.magento.currencyCode).then(renderedProducts => {
            context.renderedProducts = renderedProducts
            for(let product of result.items) {
              const productAdditionalInfo = renderedProducts.items.find(p => p.id === product.id)

              if (productAdditionalInfo && productAdditionalInfo.price_info) {
                delete productAdditionalInfo.price_info.formatted_prices
                delete productAdditionalInfo.price_info.extension_attributes
                // delete productAdditionalInfo.price_info.special_price
                product = Object.assign(product, productAdditionalInfo.price_info)

                if (product.final_price < product.price) {
                  product.special_price = product.final_price
                }

                if(inst.config.product.renderCatalogRegularPrices) {
                  product.price = product.regular_price
                }
                
              }
            }
            resolve(result)
          })
        })


      })
    } else {
      return this.getProductSourceData(context)
    }
  }

  getProductSourceData(context) {

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
    const inst = this;
    for (let customAttribute of item.custom_attributes) { // map custom attributes directly to document root scope
      item[customAttribute.attribute_code] = customAttribute.value;
    }
    item.custom_attributes = null;    
    
    return new Promise((function (done, reject) {
      // TODO: add denormalization of productcategories into product categories
      // DO NOT use "productcategories" type but rather do search categories with assigned products

      let subSyncPromises = []
      const config = inst.config

// TODO: Refactor the following to "Chain of responsibility"
// STOCK SYNC      
      if(inst.stock_sync) {
        logger.info('Product sub-stage 1: Geting stock items for ' + item.sku);
        subSyncPromises.push(() => { return inst.api.stockItems.list(item.sku).then(function(result) { 
          item.stock = result

          const key = util.format(CacheKeys.CACHE_KEY_STOCKITEM, item.id);
          logger.debug(util.format('Storing stock data to cache under: %s', key));
          inst.cache.set(key, JSON.stringify(result));
            
          return item
        })})
      }
// MEDIA SYNC
      if(inst.media_sync){
        logger.info('Product sub-stage 2: Geting media gallery' + item.sku);
        subSyncPromises.push(() => { return inst.api.productMedia.list(item.sku).then(function(result) { 
          let media_gallery = []
          for (let mediaItem of result){
            if (!mediaItem.disabled) {
              media_gallery.push({
                image: mediaItem.file,
                pos: mediaItem.position,
                typ: mediaItem.media_type,
                lab: mediaItem.label
              })
            }
          }
          item.media_gallery = media_gallery
          return item
        })})        
      }

// CUSTOM OPTIONS SYNC
      if(inst.custom_sync){
        logger.info('Product sub-stage 3: Geting product custom options' + item.sku);
        subSyncPromises.push(() => { return inst.api.customOptions.list(item.sku).then(function(result) { 
          if(result && result.length > 0) {
            item.custom_options = result
            logger.info('Found custom options for', item.sku, result.length)
          }
          return item
        })})        
      }      

// BUNDLE OPTIONS SYNC
      if(inst.custom_sync && item.type_id == 'bundle'){
        logger.info('Product sub-stage 4: Geting bundle custom options' + item.sku);
        subSyncPromises.push(() => { return inst.api.bundleOptions.list(item.sku).then(function(result) { 
          if(result && result.length > 0) {
            item.bundle_options = result
            logger.info('Found bundle options for', item.sku, result.length)
          }
          return item
        })})        
      }          

// PRODUCT LINKS - as it seems magento returns these links anyway in the "product_links"
/* if(inst.links_sync){
  logger.info('Product sub-stage 5: Geting product links' + item.sku);
  item.links = {}
  
  subSyncPromises.push(() => {  return new Promise (function(opResolve, opReject) {
      return inst.api.productLinks.types().then(function(result) { 
      if(result && result.length > 0) {
        let subPromises = []
        for (const linkType of result) {
          logger.info('Getting the product links', item.sku, linkType.name)
          subPromises.push(inst.api.productLinks.list(item.sku, linkType.name).then(function(links) { 
            if(links && links.length > 0) {
              item.links[linkType.name] = links.map((r) => { return { sku: r.linked_product_sku, pos: r.position } })
              logger.info('Found related products for', item.sku, item.links[linkType.name])
            }
            return item
          }))
        }
        Promise.all(subPromises).then(function (res) {
          logger.info('Product links expanded!')
          opResolve(item)                  
        }).catch(function(err) {
          logger.error(err)
          opResolve(item)
        })
      } else {
        opResolve (item)
      }
      return item
    })
  })})
} */        

// CONFIGURABLE AND BUNDLE SYNC
      if(inst.configurable_sync && (item.type_id == 'configurable' || item.type_id == 'bundle')){
        logger.info('Product sub-stage 6: Geting product options for ' + item.sku);
        
        //      q.push(function () {
        subSyncPromises.push(() => { return new Promise (function(opResolve, opReject) { inst.api.configurableChildren.list(item.sku).then(function(result) { 
          

          item.configurable_children = new Array()
          for(let prOption of result) {
            let confChild = {
              sku: prOption.sku,
              id: prOption.id,
              status: prOption.status,
              visibility: prOption.visibility,
              name: prOption.name,
              price: prOption.price,
              // custom_attributes: prOption.custom_attributes
            };

            if (prOption.custom_attributes) {
              for (let opt of prOption.custom_attributes) {
                confChild[opt.attribute_code] = opt.value
              }
            }
            const context = inst.current_context
            if (context.renderedProducts && context.renderedProducts.items.length) {
              const renderedProducts = context.renderedProducts
              const subProductAdditionalInfo = renderedProducts.items.find(p => p.id === confChild.id)

              if (subProductAdditionalInfo && subProductAdditionalInfo.price_info) {
                delete subProductAdditionalInfo.price_info.formatted_prices
                delete subProductAdditionalInfo.price_info.extension_attributes
                // delete subProductAdditionalInfo.price_info.special_price // always empty :-(
                confChild = Object.assign(confChild, subProductAdditionalInfo.price_info)
                if (confChild.final_price < confChild.price) {
                  confChild.special_price = confChild.final_price
                }
                if(config.product.renderCatalogRegularPrices) {
                  confChild.price = confChild.regular_price
                }
                
              }
            }

            item.configurable_children.push(confChild);
            if(item.price  == 0) // if price is zero fix it with first children
              item.price = prOption.price;
          }

// EXPAND CONFIGURABLE CHILDREN ATTRS          
          if (config.product && config.product.expandConfigurableFilters) {
            for (const attrToExpand of config.product.expandConfigurableFilters){
              const expandedSet = new Set()
              if (item[attrToExpand]) {
                expandedSet.add(item[attrToExpand])
              }
              for (const confChild of item.configurable_children) {
                if (confChild[attrToExpand]) {
                  expandedSet.add(confChild[attrToExpand])
                }
              }
              if (expandedSet.size > 0) {
                item[attrToExpand + '_options'] = Array.from(expandedSet)
              }
            }
          }

            inst.api.configurableOptions.list(item.sku).then(function(result) { 
              item.configurable_options = result;

            
              let subPromises = []
              for (let option of item.configurable_options) {
                let atrKey = util.format(CacheKeys.CACHE_KEY_ATTRIBUTE, option.attribute_id);
  
                subPromises.push(new Promise (function (resolve, reject) { 
                  logger.info('Configurable options for ' + atrKey)
                  inst.cache.get(atrKey, function (err, serializedAtr) {
                    let atr = JSON.parse(serializedAtr); // category object
                    if (atr != null) {
                      option.attribute_code = atr.attribute_code;
                      logger.info('Product options for ' + atr.attribute_code + ' for ' + item.sku + ' set');
                      item[atr.attribute_code + '_options'] = option.values.map((el) => { return el.value_index } )
                    }
                    resolve(item)  
                  })
                }))
              }
  
              Promise.all(subPromises).then(function (res) {
                logger.info('Configurable options expanded!')
                opResolve(item)                  
              })
                            
            }).catch(function (err) {
              logger.error(err);
              opResolve(item)                  
            })

          }).catch(function (err) {
          logger.error(err);
          opResolve(item)                  
        })})

      })

        
      } 

// CATEGORIES SYNC      
      subSyncPromises.push(() => { return new Promise((resolve, reject) => {
        logger.info('Product sub-stage 6: Geting product categories for ' + item.sku);
        
        const key = util.format(CacheKeys.CACHE_KEY_PRODUCT_CATEGORIES, item.sku); // store under SKU of the product the categories assigned

        if(inst.category_sync) {
          item.category = new Array();

          const catBinder = function (categories) {

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
          if (item.category_ids && Array.isArray(item.category_ids) && item.category_ids.length > 0) {
            const catIdsArray = item.category_ids.map(item => { return parseInt(item)})
            console.log('Using category_ids binding for', item.sku, catIdsArray)
            catBinder(catIdsArray)
          } else {
            this.cache.smembers(key, function (err, categories) {
              if (categories == null) {
                resolve(item);
              }
              else {
                catBinder(categories)
              }

            })
          }
        }
      })})

      serial(subSyncPromises)
      .then((res) => { 
        logger.info('Product sub-stages done for ' + item.sku)
        return done(item) // all subpromises return refernce to the product
      }).catch(err=> {
        logger.error(err);
        return done(item)
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
    return resultItem;

  }


}

module.exports = ProductAdapter;
