'use strict';

class AdapterFactory {

  constructor (app_config) {
    this.config = app_config;
  }

   getAdapter (adapter_type, driver) {

    let adapter_class = require('./' + adapter_type + '/' + driver);

    if (!adapter_class) {
      throw new Error(`Invalid adapter ${adapter_type} / ${driver}`);
    } else {
      let adapter_instance = new adapter_class(this.config);

      if((typeof adapter_instance.isValidFor == 'function') && !adapter_instance.isValidFor(driver))
        throw new Error(`Not valid adapter class or adapter is not valid for ${driver}`);

      return adapter_instance;
    }
  }
}

module.exports = AdapterFactory;
