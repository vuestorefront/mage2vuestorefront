var config = require('../../config')
module.exports= { 
    CACHE_KEY_CATEGORY: config.db.indexName + 'cat_%s',
    CACHE_KEY_PRODUCT: config.db.indexName + 'prd_%s',
    CACHE_KEY_PRODUCT_CATEGORIES: config.db.indexName + 'prd_cat_%s',
    CACHE_KEY_PRODUCT_CATEGORIES_TEMPORARY: config.db.indexName + 'prd_cat_ts_%s',
    CACHE_KEY_ATTRIBUTE: config.db.indexName + 'attr_%s',
    CACHE_KEY_STOCKITEM: config.db.indexName + 'stock_%s'
}
