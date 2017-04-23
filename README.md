# microservices/ mage2mongo
Magento/Shopify/YouNameIt -> MongoDB sync

For those who would love to work with Magento on backend but use NoSQL power on the frontend. Two way / real time data synchronizer.

This is multi-process data synchronizer between Magento (and in further versions Shopify / other platforms) to local MongoDB database.

At this point synchronization works with following entities:
- Products
- Categories

Datasync uses oauth + magento2 rest API to get the data.
KUE is used for job queueing and multi-process/multi-tenant processing is enabled by default

Start MongoDB:
- `docker-compose up`

Install:
- `npm install`

Config -see: config.js or use following ENV variables: 
- `MAGENTO_URL`
- `MAGENTO_CONSUMER_KEY`
- `MAGENTO_CONSUMER_SECRET`
- `MAGENTO_ACCESS_TOKEN`
- `MAGENTO_ACCESS_TOKEN_SECRET`
- `DATABASE_URL` (default: 'mongodb://localhost:27017/rcom')


Run:
- `cd src/` and then:
- `node --harmony cli.js products --partitions=10`
- `node --harmony cli.js products --partitions=10 --initQueue=false` - run the products sync worker (product sync jobs should be populated eslewhere - it's used to run multi-tenant environment of workers)
- `node --harmony cli.js products --partitions=10 --delta=true` - check products changed since last run (last run data is stored in mongodb); compared by updated_at field
- `node --harmony cli.js categories`
- `node --harmony cli.js --adapter=magento --partitions=1 --skus=24-WG082-blue,24-WG082-pink products`  - to pull out only selected SKUs
- `node --harmony cli.js --adapter=magento --partitions=10 productsworker`  - run queue worker for pulling out individual products (jobs can be assigned by webapi.js microservice triggers)
- `node --harmony webapi.js` - run localhost:3000 service endpoint for adding queue tasks

Available options:
- `partitions=10` - number of concurent processes, by default number of CPUs core given
- `adapter=magento` - for now only Magento is supported
- `delta` - sync products changed from last run
- command names: `products` / `categories` / `productsworker` 


