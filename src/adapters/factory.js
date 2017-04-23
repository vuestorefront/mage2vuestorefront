'use strict';

class AdapterFactory {

  constructor(app_config){
    this.config = app_config;
  }

   getAdapter(platform_type, entity_type){

    let adapter_class = require('./' + platform_type + '/' + entity_type);

    if(!adapter_class)
      throw new Error('Invalid adapter ' + platform_type + ' / ' + entity_type);
    else{


      let adapter_instance = new adapter_class(this.config);

      if(!(typeof adapter_instance.isValidFor == 'function') || !adapter_instance.isValidFor(entity_type))
        throw new Error('Not valid adapter class or adapter is not valid for ' + entity_type);

      return adapter_instance;

    }

  }

}

module.exports = AdapterFactory;
