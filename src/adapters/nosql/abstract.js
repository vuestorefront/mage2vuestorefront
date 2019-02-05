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
    this.updateDocument.bind(this);
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
    throw new Error('close needs implementation!');
  }

/**
 * Update single document in database
 * @param {object} item document to be updated in database
 */
  updateDocument(collectionName, item) {
    throw new Error('updateDocument needs implementation!');
  }

  /**
   * Get documents
   * @param collectionName collection name
   * @param query query object
   */  
  getDocuments(collectionName, query) {
    throw new Error('getDocum ent needs implementation!');
  }
  /**
   * Update multiple documents in database
   * @param {array} items to be updated
   */
  updateDocumentBulk(collectionName, items){
    throw new Error('updateDocumentBulk needs implementation!');
  }

   /**
   * Remove records other than <record>.tsk = "transactionKey"
   * @param {String} collectionName
   * @param {int} transactionKey transaction key - which is usualy a timestamp
   */
  cleanupByTransactionkey(collectionName, transactionKey){
    throw new Error('cleanupByTransactionkey needs implementation!');
  }
  
/**
 * Connect / prepare driver
 */
  connect (done){
    throw new Error('connect needs implementation!');
  }

}

module.exports = AbstractNosqlAdapter;
