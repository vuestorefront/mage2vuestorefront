
export TIME_TO_EXIT=2000
export VS_INVALIDATE_CACHE_URL=http://localhost:3000/invalidate?key=aeSu7aip&tag=
export VS_INVALIDATE_CACHE=1
export PRODUCTS_SPECIAL_PRICES=true
export MAGENTO_CONSUMER_KEY=byv3730rhoulpopcq64don8ukb8lf2gq
export MAGENTO_CONSUMER_SECRET=u9q4fcobv7vfx9td80oupa6uhexc27rb
export MAGENTO_ACCESS_TOKEN=040xx3qy7s0j28o3q0exrfop579cy20m
export MAGENTO_ACCESS_TOKEN_SECRET=7qunl3p505rubmr7u1ijt7odyialnih9
export SEO_USE_URL_DISPATCHER=1

echo 'Italian store - it'
export MAGENTO_URL=http://demo-magento2.vuestorefront.io/rest/it
export INDEX_NAME=vue_storefront_catalog_it

node --harmony cli.js blocks
node --harmony cli.js pages
node --harmony cli.js reviews
node --harmony cli.js categories --removeNonExistent=true --extendedCategories=true
node --harmony cli.js productcategories
node --harmony cli.js attributes --removeNonExistent=true
node --harmony cli.js taxrule --removeNonExistent=true
node --harmony cli.js products --removeNonExistent=true --partitions=1



