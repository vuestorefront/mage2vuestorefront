'use strict';

let AbstractMagentoAdapter = require('./abstract');

class PageAdapter extends AbstractMagentoAdapter {
    constructor(config) {
        super(config);
        this.use_paging = false;
    }

    getEntityType() {
        return 'cms_page';
    }

    getName() {
        return 'adapters/magento/PageAdapter';
    }

    getSourceData(context) {
        if (this.use_paging) {
            return this.api.pages.list('&searchCriteria[currentPage]=' + this.page + '&searchCriteria[pageSize]=' + this.page_size + (query ? '&' + query : '')).catch((err) => {
                throw new Error(err);
            });
        }

        return this.api.pages.list().catch((err) => {
            throw new Error(err);
        });
    }

    prepareItems(items) {
        if(!items)
          return items;

        if (items.total_count)
          this.total_count = items.total_count;

        if (items.items) {
          items = items.items; // this is an exceptional behavior for Magento2 api for lists
        }

        return items;
    }

    preProcessItem(item) {

        return new Promise((done, reject) => {
            if (item) {
                item.type = 'cms_page'
            }
          
          return done(item);
        });

    }

    normalizeDocumentFormat(item) {
        return item;
    }
}

module.exports = PageAdapter;
