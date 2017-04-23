# datasync
Magento/Shopify/YouNameIt -> MongoDB sync

This is multi-process data synchronizator between Magento (and in further versions Shopify / other platforms) to local MongoDB database.

At this point synchronization works with following entities:
- Products
- Categories

Datasync uses oauth + magento2 rest API to get the data.
KUE is used for job queueing and multi-process/multi-tenant processing is enabled by default

Start MongoDB:
- docker-compose up

Install:
- npm install

Config -see: config.js or use following ENV variables: 
- MAGENTO_URL
- MAGENTO_CONSUMER_KEY
- MAGENTO_CONSUMER_SECRET
- MAGENTO_ACCESS_TOKEN
- MAGENTO_ACCESS_TOKEN_SECRET
- DATABASE_URL (default: 'mongodb://localhost:27017/rcom')


Run:
- cd src/
- node --harmony index.js products --partitions=10
- node --harmony index.js categories

Available options:
- partitions=10 - number of concurent processes
- adapter=magento - for now only Magento is supported
- command names: products / categories


