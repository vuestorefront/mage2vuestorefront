'use strict';

let AbstractMagentoAdapter = require('./abstract');

class CategoriesAdapter extends AbstractMagentoAdapter{

  getEntityType(){
    return 'categories';
  }

  getName(){
    return 'adapters/magento/CategoriesAdapter';
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



}

module.exports = CategoriesAdapter;
