
export TIME_TO_EXIT=2000
export VS_INVALIDATE_CACHE_URL=http://localhost:3000/invalidate?key=aeSu7aip&tag=
export VS_INVALIDATE_CACHE=1
export PRODUCTS_SPECIAL_PRICES=true
export MAGENTO_MSI_ENABLED=true
export MAGENTO_MSI_STOCK_ID=1
export MAGENTO_CONSUMER_KEY=byv3730rhoulpopcq64don8ukb8lf2gq
export MAGENTO_CONSUMER_SECRET=u9q4fcobv7vfx9td80oupa6uhexc27rb
export MAGENTO_ACCESS_TOKEN=040xx3qy7s0j28o3q0exrfop579cy20m
export MAGENTO_ACCESS_TOKEN_SECRET=7qunl3p505rubmr7u1ijt7odyialnih9

echo 'Default store - in our case United States / en'
export MAGENTO_URL=http://demo-magento2.vuestorefront.io/rest

node --harmony cli.js products --removeNonExistent=true --partitions=1
