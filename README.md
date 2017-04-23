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

Run:
- cd src/
- node --harmony index.js products --partitions=10
