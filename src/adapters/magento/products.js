'use strict';

let AbstractMagentoAdapter = require('./abstract');

class ProductsAdapter extends AbstractMagentoAdapter{

  constructor(config){
    super(config);
    this.use_paging = true;
    this.is_federated = true; // by default use federated behaviour
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

  getFilterQuery(context){

    let query = ''; console.log(typeof context.updated_after);

    if(context.skus)// pul individual products
    {
      if(!Array.isArray(context.skus))
        context.skus = new Array(context.skus);


      query +=  'searchCriteria[filter_groups][0][filters][0][field]=sku&' +
                'searchCriteria[filter_groups][0][filters][0][value]=' +  encodeURIComponent(context.skus.join(',')) + '&' +
                'searchCriteria[filter_groups][0][filters][0][condition_type]=in';

    } else  if(context.updated_after && typeof context.updated_after == 'Date'){
      query +=  'searchCriteria[filter_groups][0][filters][0][field]=updated_at&' +
                'searchCriteria[filter_groups][0][filters][0][value]=' + encodeURIComponent(context.updated_after.getTime()) + '&' +
                'searchCriteria[filter_groups][0][filters][0][condition_type]=gt';
    }
    return query;
  }

  getSourceData(context){

    let query = this.getFilterQuery(context);

    if(context.for_total_count){ // get total counts
      return this.api.products.list('&searchCriteria[currentPage]=1&searchCriteria[pageSize]=1');
    } else if(context.page && context.page_size){

      this.use_paging = false;
      this.is_federated = true;
      this.page = context.page;
      this.page_size = context.page_size
      this.page_count = 1; // process only one page - used for partitioning purposes

      logger.debug('Using specific paging options from adapter context: ' + context.page + ' / ' + context.page_size);


      return this.api.products.list('&searchCriteria[currentPage]=' + context.page + '&searchCriteria[pageSize]=' + context.page_size + (query ? '&' + query : ''));

    }else if (this.use_paging){
      this.is_federated = false; // federated execution is not compliant with paging
      console.log('&searchCriteria[currentPage]=' + this.page + '&searchCriteria[pageSize]=' + this.page_size + (query ? '&' + query : ''));
      return this.api.products.list('&searchCriteria[currentPage]=' + this.page + '&searchCriteria[pageSize]=' + this.page_size + (query ? '&' + query : ''));
    } else
      return this.api.products.list();
  }


  getTotalCount(context){

      context = context ? Object.assign(context, { for_total_count: 1}) : { for_total_count: 1};
      return this.getSourceData(context); //api.products.list('&searchCriteria[currentPage]=1&searchCriteria[pageSize]=1');
  }

  getLabel(source_item){
    return '[(' + source_item.id +' - ' + source_item.sku + ') ' + source_item.name + ']';
  }

}

module.exports = ProductsAdapter;
