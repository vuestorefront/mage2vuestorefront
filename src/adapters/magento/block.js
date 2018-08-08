'use strict';

let AbstractMagentoAdapter = require('./abstract');
const CacheKeys = require('./cache_keys');
const util = require('util');

class BlockAdapter extends AbstractMagentoAdapter {

    getEntityType() {
        return 'block';
    }

    getName() {
        return 'adapters/magento/BlockAdapter';
    }

    getSourceData(context) {
        // API return object {items: [item{}, item{}]}
        return this.api.block.list();
    }

    prepareItems(items) {
        if(!items)
          return items;

        let blocks = items.items;

        if (blocks.total_count)
          this.total_count = items.total_count;

        if (!Array.isArray(blocks))
          blocks = new Array(blocks);
        return blocks;
    }

    preProcessItem(item) {

        var inst = this

        return new Promise((function (done, reject) {

          return done(item);
        }).bind(this));

      }

    normalizeDocumentFormat(item) {
        return item;
    }
}

module.exports = BlockAdapter;
