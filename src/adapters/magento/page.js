'use strict';

let AbstractMagentoAdapter = require('./abstract');
const CacheKeys = require('./cache_keys');
const util = require('util');

class PageAdapter extends AbstractMagentoAdapter {

    getEntityType() {
        return 'page';
    }

    getName() {
        return 'adapters/magento/PageAdapter';
    }

    getSourceData(context) {
        return this.api.page.list();
    }

    prepareItems(items) {
        if(!items)
          return items;

        let pages = items.items;

        if (pages.total_count)
          this.total_count = pages.total_count;

        if (!Array.isArray(pages))
          pages = new Array(pages);

        return pages;
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

module.exports = PageAdapter;
