'use strict';
const AbstractNosqlAdapter = require('./abstract');
const elasticsearch = require('elasticsearch');
const AgentKeepAlive = require('agentkeepalive');


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
  close() {
    return;
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
    this.db = new elasticsearch.Client({
      host: this.config.db.url,
      log: 'error',

      maxRetries: 10,
      keepAlive: true,
      maxSockets: 10,
      minSockets: 10,
      requestTimeout: 1800000,
      createNodeAgent: function (connection, config) {
        return new AgentKeepAlive(connection.makeAgentConfig(config));
      }

    });

    done(this.db);
  }


}

module.exports = ElasticsearchAdapter;
