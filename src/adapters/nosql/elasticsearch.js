'use strict';
const AbstractNosqlAdapter = require('./abstract');
const elasticsearch = require('elasticsearch');
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
      this.db.search({ // requires ES 5.5
        index: this.config.db.indexName,
        type: collectionName,
          body: queryBody
      }, function (error, response) {
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

    this.db.update({
      index: this.config.db.indexName,
      id: item.id,
      type: collectionName,
      body: {
        // put the partial document under the `doc` key
        upsert: itemtbu,
        doc: itemtbu

      }
    }, function (error, response) {
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
      this.db.deleteByQuery({ // requires ES 5.5
        index: this.config.db.indexName,
        conflicts: 'proceed',
        type: collectionName,
         body: {
          query: {
            bool: {
              must_not: {
                term: { tsk: transactionKey }
              }
            }
          }
        }
      }, function (error, response) {
        if (error) throw new Error(error);
        logger.info(response);
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
      requests.push({
        update: {
          _index: this.config.db.indexName,
          _id: doc.id,
          _type: collectionName,
        }
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
        host: this.config.db.url,
        log: 'error',
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
