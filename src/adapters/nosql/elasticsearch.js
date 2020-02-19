'use strict';
const AbstractNosqlAdapter = require('./abstract');
const elasticsearch = require('@elastic/elasticsearch');
const AgentKeepAlive = require('agentkeepalive');
const AgentKeepAliveHttps = require('agentkeepalive').HttpsAgent;


class ElasticsearchAdapter extends AbstractNosqlAdapter {

  validateConfig(config) {

    if (!config['db']['url'])
      throw Error('db.url must be set up in config');

    if (!config['db']['indexName'])
      throw Error('db.indexName must be set up in config');

  }

  constructor(app_config) {
    super(app_config);

    this.config = app_config;
    this.db = null;
    this.validateConfig(this.config);

    logger.debug('Elasticsearch module initialized!');
    this.updateDocument.bind(this);
  }

  /**
   * Get physical Elastic index name; since 7.x we're adding an entity name to get real index: vue_storefront_catalog_product, vue_storefront_catalog_category and so on
   * @param {*} baseIndexName 
   * @param {*} config 
   */
  getPhysicalIndexName(collectionName, config) {
    if (parseInt(config.elasticsearch.apiVersion) >= 6) {
      return `${config.db.indexName}_${collectionName}`
    } else {
      return config.db.indexName
    }
  }

  /**
   * Get physical Elastic type name; since 7.x index can have one type _doc
   * @param {*} baseIndexName 
   * @param {*} config 
   */
  getPhysicalTypeName(collectionName, config) {
    if (parseInt(config.elasticsearch.apiVersion) >= 6) {
      return `_doc`
    } else {
      return collectionName
    }
  }  

  /**
   * Close the nosql database connection - abstract to the driver
   */
  close() { // switched to global singleton
    //this.db.close();
  }

  /**
   * Get documents
   * @param collectionName collection name
   * @param query query object
  */  
  getDocuments(collectionName, queryBody) {
    return new Promise((resolve, reject) => {
      const searchQueryBody = {
        index: this.getPhysicalIndexName(collectionName, this.config),
        body: queryBody
      }
      if (parseInt(this.config.elasticsearch.apiVersion) < 6)
       searchQueryBody.type  = this.getPhysicalTypeName(collectionName, this.config)

      this.db.search(searchQueryBody, function (error, { body: response }) {
        if (error) reject(error);
        if (response.hits && response.hits.hits) {
          resolve(response.hits.hits.map(h => h._source))
        } else {
          reject(new Error('Invalid Elastic response'))
        }
      });
    })
  }

  /**
   * Update single document in database
   * @param {object} item document to be updated in database
   */
  updateDocument(collectionName, item) {
    const itemtbu = item;
    const updateRequestBody = {
      index: this.getPhysicalIndexName(collectionName, this.config),
      id: item.id,
      body: {
        // put the partial document under the `doc` key
        upsert: itemtbu,
        doc: itemtbu

      }
    }
    if (parseInt(this.config.elasticsearch.apiVersion) < 6)
      updateRequestBody.type = this.getPhysicalTypeName(collectionName, this.config)

    this.db.update(updateRequestBody, function (error, response) {
      if (error)
        throw new Error(error);
    });
  }

  /**
  * Remove records other than <record>.tsk = "transactionKey"
  * @param {String} collectionName
  * @param {int} transactionKey transaction key - which is usually a timestamp
  */
  cleanupByTransactionkey(collectionName, transactionKey) {

    if (transactionKey) {
      const query = {
        index: this.getPhysicalIndexName(collectionName, this.config),
        conflicts: 'proceed',
        body: {
          query: {
            bool: {
              must_not: {
                term: { tsk: transactionKey }
              }
            }
          }
        }
      };
      if (parseInt(this.config.elasticsearch.apiVersion) < 6)
        query.type = this.getPhysicalTypeName(collectionName, this.config)

      this.db.deleteByQuery(query, function (error, response) {
        if (error) throw new Error(error);
      });
    }
  }

  /**
   * Update multiple documents in database
   * @param {array} items to be updated
   */
  updateDocumentBulk(collectionName, items) {

    let requests = new Array();
    let index = 0;
    let bulkSize = 500;

    for (let doc of items) {
      const query = {
        _index: this.getPhysicalIndexName(collectionName, this.config),
        _id: doc.id,
      };
      if (parseInt(this.config.elasticsearch.apiVersion) < 6)
        query.type = this.getPhysicalTypeName(collectionName, this.config)

      requests.push({
        update: query
      });

      requests.push({

        // put the partial document under the `doc` key
        doc: doc,
        "doc_as_upsert": true

      });

      if ((index % bulkSize) == 0) {
        logger.debug('Splitting bulk query ' + index);
        this.db.bulk({
          body: requests
        }, function (error, response) {
          if (error)
            throw new Error(error);
        });

        requests = new Array();
      }

      index++;
    }

  }

  /**
   * Connect / prepare driver
   * @param {Function} done callback to be called after connection is established
   */
  connect(done) {

    if (!global.es) {
      this.db = new elasticsearch.Client({
        node: this.config.db.url,
        log: 'debug',
        apiVersion: this.config.elasticsearch.apiVersion,

        maxRetries: 10,
        keepAlive: true,
        maxSockets: 10,
        minSockets: 10,
        requestTimeout: 1800000,        

        createNodeAgent: function (connection, config) {
          if (connection.useSsl) {
            return new AgentKeepAliveHttps(connection.makeAgentConfig(config));
          }
          return new AgentKeepAlive(connection.makeAgentConfig(config));
        }

      });
      global.es = this.db;
    } else
      this.db = global.es;

    done(this.db);
  }

}

module.exports = ElasticsearchAdapter;
