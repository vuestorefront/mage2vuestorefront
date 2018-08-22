#!/bin/sh
set -e
export MAGENTO_URL=http://magento2.demo-1.divante.pl/rest/
export MAGENTO_CONSUMER_KEY=alva6h6hku9qxrpfe02c2jalopx7od1q
export MAGENTO_CONSUMER_SECRET=9tgfpgoojlx9tfy21b8kw7ssfu2aynpm
export MAGENTO_ACCESS_TOKEN=rw5w0si9imbu45h3m9hkyrfr4gjina8q
export MAGENTO_ACCESS_TOKEN_SECRET=00y9dl4vpxgcef3gn5mntbxtylowjcc9
export MAGENTO_STORE_ID=1
export MAGENTO_CURRENCY_CODE=USD
export PRODUCTS_SPECIAL_PRICES=false
export PRODUCTS_RENDER_PRICES=false
export DATABASE_URL=http://es1:9200
export INDEX_NAME=vue_storefront_catalog
export MAGENTO_CONSUMER_KEY=vue_storefront_catalog
export REDIS_URL=redis
export REDIS_PORT=6379
sleep 10s && yarn run webapi & yarn run worker
