'use strict';
const AbstractNosqlAdapter = require('./abstract');

class ElasticsearchAdapter extends AbstractNosqlAdapter{

  validateConfig(config){

    if(!config['db']['url'])
      throw Error('db.url must be set up in config');

  }

  constructor(app_config){
    super(app_config);
    
    this.config = app_config;
    this.db = null;
    this.validateConfig(this.config);

    logger.debug('Elasticsearch module initialized!');
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
 * @param {Function} done callback to be called after connection is established
 */
connect (done){
  this.db = new elasticsearch.Client({
    host: this.config.db.url,
    log: 'trace'
  });

  done(this.db);
}


}

module.exports = ElasticsearchAdapter;
