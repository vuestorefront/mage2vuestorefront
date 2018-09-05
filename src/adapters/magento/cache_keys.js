var config = require('../../config')

module.exports = {
  CACHE_KEY_CATEGORY: config.db.indexName + '_cat_%s',
  CACHE_KEY_PRODUCT: config.db.indexName + '_prd_%s',
  CACHE_KEY_PRODUCT_CATEGORIES: config.db.indexName + '_prd_cat_%s',
  CACHE_KEY_PRODUCT_CATEGORIES_TEMPORARY: config.db.indexName + '_prd_cat_ts_%s',
  CACHE_KEY_ATTRIBUTE: config.db.indexName + '_attr_%s',
  CACHE_KEY_STOCKITEM: config.db.indexName + '_stock_%s'
}
