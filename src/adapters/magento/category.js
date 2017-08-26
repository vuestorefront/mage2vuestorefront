'use strict';

let AbstractMagentoAdapter = require('./abstract');

class CategoryAdapter extends AbstractMagentoAdapter{

  getEntityType(){
    return 'category';
  }

  getName(){
    return 'adapters/magento/CategoryAdapter';
  }


  getSourceData(context){
    return this.api.categories.list();
  }

  getLabel(source_item){
    return '[(' + source_item.id + ') ' + source_item.name + ']';
  }

  isFederated(){
    return false;
  }

  /**
   * We're transorming the data structure of item to be compliant with Smile.fr Elastic Search Suite
   * @param {object} item  document to be updated in elastic search
   */
  normalizeDocumentFormat(item) {
    return item;
  }

}

module.exports = CategoryAdapter;
