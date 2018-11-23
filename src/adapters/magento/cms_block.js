'use strict';

let AbstractMagentoAdapter = require('./abstract');

class BlockAdapter extends AbstractMagentoAdapter {
    constructor(config) {
        super(config);
        this.use_paging = false;
    }

    getEntityType() {
        return 'cms_block';
    }

    getName() {
        return 'adapters/magento/BlockAdapter';
    }

    getSourceData(context) {
        if (this.use_paging) {
            return this.api.blocks.list('&searchCriteria[currentPage]=' + this.page + '&searchCriteria[pageSize]=' + this.page_size + (query ? '&' + query : '')).catch((err) => {
                throw new Error(err);
            });
        }

        return this.api.blocks.list().catch((err) => {
            throw new Error(err);
        });
    }

    prepareItems(items) {
        if(!items) {
            return items;
        }

        if (items.total_count) {
            this.total_count = items.total_count;
        }

        if (items.items) {
            items = items.items; // this is an exceptional behavior for Magento2 api for lists
        }
        
        return items;
    }

    isFederated() {
        return false;
    }
    
    preProcessItem(item) {
        //
        return new Promise((done, reject) => {
            if (item) {
                item.type = 'cms_block'
            }
          
          return done(item);
        });
    }
    /**
     * We're transorming the data structure of item to be compliant with Smile.fr Elastic Search Suite
     * @param {object} item  document to be updated in elastic search
     */
    normalizeDocumentFormat(item) {
        return item;
    }
}

module.exports = BlockAdapter;
