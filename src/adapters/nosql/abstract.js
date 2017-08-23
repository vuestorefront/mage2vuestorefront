'use strict';

class AbstractNosqlAdapter{

  validateConfig(config){

    if(!config['db']['url'])
      throw Error('db.url must be set up in config');

  }

  constructor(app_config){
    this.config = app_config;
    this.db = null;
    this.validateConfig(this.config);
  }

  /**
   * Get where query to identify the base record
   * @param {Object} source_item 
   */
  getWhereQuery(source_item){
    return { id: source_item.id }; 
  }

  /**
   * Close the nosql database connection - abstract to the driver
   */
  close(){
    throw new Error('Needs implementation!');
  }

/**
 * Update single document in database
 * @param {object} item document to be updated in database
 */
  updateDocument(collectionName, item) {
    throw new Error('Needs implementation!');
  }

  
/**
 * Connect / prepare driver
 */
  connect (done){
    throw new Error('Needs implementation!');
  }


}

module.exports = AbstractNosqlAdapter;
