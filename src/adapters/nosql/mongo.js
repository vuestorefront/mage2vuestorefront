'use strict';
const AbstractNosqlAdapter = require('./abstract');

/**
 * @deprecated This module hasn't been updated till ElasticSearch support got introduced. The data format is not compliant with ES module
 */
class MongoAdapter extends AbstractNosqlAdapter{

  validateConfig(config){

    if(!config['db']['url'])
      throw Error('db.url must be set up in config');

  }

  constructor(app_config){
    super(app_config);

    this.config = app_config;
    this.db = null;
    this.validateConfig(this.config);

    logger.debug('Mongo module initialized!');
    
  }


  /**
   * Close the nosql database connection - abstract to the driver
   */
  close(){
    this.db.close();
  }

/**
 * Update single document in database
 * @param {object} item document to be updated in database
 */
  updateDocument(collectionName, item) {

    this.db.collection(collectionName).findAndModify(
      this.getWhereQuery(item), // query
      [['_id','asc']],  // sort order
      {$set: item }, // replacement, replaces only the field "hi" TODO: Apply the very same format ElasticSearch module have
      { upsert: true }, // options
      function(err, object) {
          if (err){
              logger.warn(err.message);  // returns error if no matching object found
          }
        });


  }

    /**
   * Update multiple documents in database
   * @param {array} items to be updated
   */
  updateDocumentBulk(collectionName, items) {
    for (let doc of items) {
      this.updateDocument(collectionName, doc); // TODO: use native Mongodb bulk update's support
     }
  }
  
/**
 * Connect / prepare driver
 * @param {Function} done callback to be called after connection is established
 */
  connect (done){
    MongoClient.connect(this.config.db.url, (err, db) => {
      done(db);
    });
  }


}

module.exports = MongoAdapter;
