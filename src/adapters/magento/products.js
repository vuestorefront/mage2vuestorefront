'use strict';

let AbstractMagentoAdapter = require('./abstract');

class ProductsAdapter extends AbstractMagentoAdapter{

  constructor(config){
    super(config);
    this.use_paging = true;
  }

  getEntityType(){
    return 'products';
  }

  getName(){
    return 'adapters/magento/ProductsAdapter';
  }

  prepareItems(items){
    this.total_count = items.totalCount;

    if(this.use_paging)
    {
      this.page_count = this.total_count / this.page_size;
    }

    return items.items;
  }

  getSourceData(context){

    if(context.page && context.page_size){

      this.use_paging = false;
      this.page = context.page;
      this.page_size = context.page_size
      this.page_count = 1; // process only one page - used for partitioning purposes

      logger.debug('Using specific paging options from adapter context: ' + context.page + ' / ' + context.page_size);


      return this.api.products.list('&searchCriteria[currentPage]=' + context.page + '&searchCriteria[pageSize]=' + context.page_size);

    }else if (this.use_paging){
      return this.api.products.list('&searchCriteria[currentPage]=' + this.page + '&searchCriteria[pageSize]=' + this.page_size);
    } else
      return this.api.products.list();
  }


  isFederated(){
    return true;
  }

  getTotalCount(){
      return this.api.products.list('&searchCriteria[currentPage]=1&searchCriteria[pageSize]=1');
  }

  getLabel(source_item){
    return '[(' + source_item.sku + ') ' + source_item.name + ']';
  }

}

module.exports = ProductsAdapter;
