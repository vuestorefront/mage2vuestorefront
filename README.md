# mage2vuestorefront
For those who would love to work with Magento on backend but use NoSQL power on the frontend. Two way / real time data synchronizer.

It's part of [vue-storefront project - first Progressive Web App for eCommerce](https://github.com/DivanteLtd/vue-storefront) with Magento2 support.

Some details about the rationale and our goals here: https://www.linkedin.com/pulse/magento2-nosql-database-pwa-support-piotr-karwatka

It synchronizes all the products, categories and links between products and categories.

This is multi-process data synchronizer between Magento (and in further versions Shopify / other platforms) to local MongoDB AND ElasticSearch databases.

At this point synchronization works with following entities:
- Tax Rules
- Products
- Categories
- Product-to-categories

Categories and Product-to-categories links are additionaly stored in Redis cache for rapid-requests (for example from your WebAPI). Our other project [vue-storefront-api](https://github.com/DivanteLtd/vue-storefront-api) exposes this databse to be used in PWA/JS webapps.

Datasync uses oauth + magento2 rest API to get the data.
KUE is used for job queueing and multi-process/multi-tenant processing is enabled by default
MongoDB OR ElastiCsearch is used for NoSQL database
Redis is used for KUE queue backend

By default all services are used without authorization and on default ports (check out config.js or ENV variables for change of this behavior). 

Start Elasticsearch and Redis:
- `docker-compose up`

Install:
- `cd src/`
- `npm install`

Config -see: config.js or use following ENV variables: 
- `MAGENTO_URL`
- `MAGENTO_CONSUMER_KEY`
- `MAGENTO_CONSUMER_SECRET`
- `MAGENTO_ACCESS_TOKEN`
- `MAGENTO_ACCESS_TOKEN_SECRET`
- `DATABASE_URL` (default: 'mongodb://localhost:27017/rcom')

Initially, run:
- `node --harmony cli.js initialindex` - creates all tax rules, attributes, categories, products and links between products and categories.

Commands supported:
- `node --harmony cli.js fullreindex` - synchronizes all attributes, categories, products and links between products and categories.
- Products 
  - `node --harmony cli.js products --partitions=10`
  - `node --harmony cli.js products --partitions=10 --initQueue=false` - run the products sync worker (product sync jobs should be populated eslewhere - it's used to run multi-tenant environment of workers)
  - `node --harmony cli.js products --partitions=10 --delta=true` - check products changed since last run (last run data is stored in mongodb); compared by updated_at field
- Product Categories: `node --harmony cli.js productcategories` - to synchronize the links between products and categories it *should be run before* products synchronization because it populates Redis cache assigments for product-to-category link
- Categories: `node --harmony cli.js categories`
- Attributes: `node --harmony cli.js attributes`
- Tax Rules: `node --harmony cli.js taxrules`
- Selected Sku: `node --harmony cli.js --adapter=magento --partitions=1 --skus=24-WG082-blue,24-WG082-pink products`  - to pull out only selected SKUs
- Product Worker: `node --harmony cli.js --adapter=magento --partitions=10 productsworker`  - run queue worker for pulling out individual products (jobs can be assigned by webapi.js microservice triggers; it can be called by webhook for example from within Magento2 plugin)
- Endpoint for adding queued tasks: `node --harmony webapi.js` - run localhost:3000 service endpoint for adding queue tasks

WebAPI:
- `node --harmony webapi.js`
- `curl localhost:8080/api/magento/products/pull/WT09-XS-Purple` - to schedule data refresh for SKU=WT09-XS-Purple
- `node --harmony cli.js productsworker` - to run pull request processor 

Available options:
- `partitions=10` - number of concurent processes, by default number of CPUs core given
- `adapter=magento` - for now only Magento is supported
- `delta` - sync products changed from last run
- command names: `products` / `categories` / `productsworker` / `productcategories`


