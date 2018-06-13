module.exports = {

  magento: {
    url:  process.env.MAGENTO_URL || 'http://magento2.demo-1.divante.pl/rest/',
    consumerKey: process.env.MAGENTO_CONSUMER_KEY || 'alva6h6hku9qxrpfe02c2jalopx7od1q',
    consumerSecret: process.env.MAGENTO_CONSUMER_SECRET || '9tgfpgoojlx9tfy21b8kw7ssfu2aynpm',
    accessToken: process.env.MAGENTO_ACCESS_TOKEN || 'rw5w0si9imbu45h3m9hkyrfr4gjina8q',
    accessTokenSecret: process.env.MAGENTO_ACCESS_TOKEN_SECRET || '00y9dl4vpxgcef3gn5mntbxtylowjcc9',
    storeId: process.env.MAGENTO_STORE_ID || 1,
    currencyCode: process.env.MAGENTO_CURRENCY_CODE || 'USD'
  },

  product: {
    expandConfigurableFilters: ['manufacturer'],
    synchronizeCatalogSpecialPrices: process.env.PRODUCTS_SPECIAL_PRICES || false,
  },

  kue: {}, // default KUE config works on local redis instance. See KUE docs for non standard redis connections

  db: {
/*    driver: 'mongo',
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/rcom' */
  
    driver: 'elasticsearch',
    url: process.env.DATABASE_URL || 'http://localhost:9200',
    indexName:  process.env.INDEX_NAME|| 'vue_storefront_catalog'
  },

  redis: {
    host: '127.0.0.1',
    port: 6379
  },

  passport: {
    jwtSecret: "MyS3cr3tK3Y",
    jwtSession: {
        session: false
      }
  }

}
