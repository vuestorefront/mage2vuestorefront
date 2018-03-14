'use strict';

var CommandRouter = require('command-router');
let AdapterFactory = require('./adapters/factory');


const TIME_TO_EXIT = 30000; // wait 30s before quiting after task is done

let cli = CommandRouter();
let config = require('./config');
let logger = require('./log');
let factory = new AdapterFactory(config);


// for partitioning purposes
let cluster = require('cluster')
let numCPUs = require('os').cpus().length;

let kue = require('kue');
let queue = kue.createQueue(config.kue); 

/**
 * Re-index categories
 */
function commandCategories(next, reject) {
  let adapter = factory.getAdapter(cli.options.adapter, 'category');
  let tsk = new Date().getTime();

  adapter.run({
    transaction_key: tsk,
    done_callback: () => {

      if(cli.options.removeNonExistient){
        adapter.cleanUp(tsk);
      }

      if(!next){
        logger.info('Task done! Exiting in 30s ...');
        setTimeout(process.exit, TIME_TO_EXIT); // let ES commit all changes made
      } else next();
    }
  });
}

/**
 * Re-index tax rulles
 */
function commandTaxRules(next, reject) {
  let adapter = factory.getAdapter(cli.options.adapter, 'taxrule');
  let tsk = new Date().getTime();

  adapter.run({
    transaction_key: tsk,
    done_callback: () => {

      if(cli.options.removeNonExistient){
        adapter.cleanUp(tsk);
      }

      if(!next){
        logger.info('Task done! Exiting in 30s ...');
        setTimeout(process.exit, TIME_TO_EXIT); // let ES commit all changes made
      } else next();
    }
  });
}

/**
 * Re-index attributes
 */
function commandAttributes(next, reject) {
  let adapter = factory.getAdapter(cli.options.adapter, 'attribute');
  let tsk = new Date().getTime();

  adapter.run({
    transaction_key: tsk,
    done_callback: () => {

      if(cli.options.removeNonExistient){
        adapter.cleanUp(tsk);
      }

      if(!next){
        logger.info('Task done! Exiting in 30s ...');
        setTimeout(process.exit, TIME_TO_EXIT); // let ES commit all changes made
      } else next();
    }
  });
}

function commandCleanup(){
  let adapter = factory.getAdapter(cli.options.adapter, cli.options.cleanupType);
  let tsk = cli.options.transactionKey;

  if(tsk){ 
    logger.info('Cleaning up for TRANSACTION KEY = ' + tsk);
    adapter.connect
    adapter.cleanUp(tsk);
  } else 
  logger.error('No "transactionKey" given as a parameter');

  
}

/**
 * Reindex product-categories links
 */
function commandProductCategories(next, reject) {
  let adapter = factory.getAdapter(cli.options.adapter, 'productcategories');
  adapter.run({
    done_callback: () => {

      if(!next) {
        logger.info('Task done! Exiting in 30s ...');
        setTimeout(process.exit, 30000); // let ES commit all changes made
      } else {
        logger.debug('Stepping to next action');
        next();
      }
    }
  });
}

/**
 * Run worker listening to "product" command on KUE queue
 */
function commandProductsworker() {

  logger.info('Starting `productsworker` worker. Waiting for jobs ...');
  let partition_count = cli.options.partitions;

  // TODO: separte the execution part to run in multi-tenant env
  queue.process('product', partition_count, (job, done) => {

    if (job && job.data.skus) {

      logger.info('Starting product pull job for ' + job.data.skus.join(','));

      let adapter = factory.getAdapter(job.data.adapter ? job.data.adapter : cli.options.adapter, 'product'); // to avoid multi threading mongo error

      adapter.run({
        skus: job.data.skus, done_callback: () => {
          logger.info('Task done!');
          return done();
        }

      });
    } else return done();

  });
}

/**
 * Re-index products. It can reindex products based on "updateAfter=" cmdline parameter, it can be parametrized by "partitionSize" - page size of resuts, "partitions" - number of parallel processes. 
 * It can also index individual SKUs (cmdline paramtere name skus= comma separated product SKUs)
 */
function commandProducts() {
  let adapter = factory.getAdapter(cli.options.adapter, 'product');
  let updated_after = new Date(cli.options.updated_after);
  let tsk = new Date().getTime();


  if (cli.options.partitions > 1 && adapter.isFederated()) // standard case
  {
    let partition_count = cli.options.partitions;

    logger.info('Running in MPM (Multi Process Mode) with partitions count = ' + partition_count);

    adapter.getTotalCount({ updated_after: updated_after }).then((result) => {

      let total_count = result.total_count;
      let page_size = cli.options.partitionSize;
      let page_count = parseInt(total_count / page_size);

      let transaction_key = new Date().getTime();

      if (cli.options.initQueue) {
        logger.info('Propagating job queue ... ');

        for (let i = 0; i < page_count; i++) {
          logger.debug('Adding job for: ' + i + ' / ' + page_count + ', page_size = ' + page_size);
          queue.createJob('products', { page_size: page_size, page: i, updated_after: updated_after }).save();
        }
      } else {
        logger.info('Not propagating queue - only worker mode!');
      }

      // TODO: separte the execution part to run in multi-tenant env
      queue.process('products', partition_count, (job, done) => {

        let adapter = factory.getAdapter(cli.options.adapter, 'product'); // to avoid multi threading mongo error
        if (job && job.data.page && job.data.page_size) {
          logger.info('Processing job: ' + job.data.page);

          adapter.run({
            transaction_key: transaction_key, page_size: job.data.page_size, page: job.data.page, updated_after: job.data.updated_after, done_callback: () => {
              logger.info('Task done!');
              return done();
            }

          });
        } else return done();

      });

      if (cli.options.initQueue) // if this is not true it meant that process is runing to process the queue in the loop and shouldnt be "killed"
      {
        setInterval(function () {
          queue.inactiveCount(function (err, total) { // others are activeCount, completeCount, failedCount, delayedCount
            if (total == 0) {

              if(cli.options.removeNonExistient){
                logger.info('CleaningUp products!');
                let adapter = factory.getAdapter(cli.options.adapter, 'product'); // to avoid multi threading mongo error
                adapter.cleanUp(transaction_key);              
              }
              
              logger.info('Queue processed. Exiting!');
              setTimeout(process.exit, TIME_TO_EXIT); // let ES commit all changes made
      
            }
          });
        }, 2000);
      }

    });

  } else {
    logger.info('Running in SPM (Single Process Mode)');

    let context = { updated_after: updated_after,
      transaction_key: tsk,
      done_callback: () => {
        
              if(cli.options.removeNonExistient){
                adapter.cleanUp(tsk);
              }
              logger.info('Task done! Exiting in 30s ...');
              setTimeout(process.exit, TIME_TO_EXIT); // let ES commit all changes made
            }

          };

    if (cli.options.skus) {
      context.skus = cli.options.skus.split(','); // update individual producs
    }

    adapter.run(context);
  }

}


/**
 * Full reindex; The sequence is important becasue commands operate on some cachce resources - especially for product/category assigments
 */
function commandFullreindex() {
  Promise.all(
   [
    new Promise(commandAttributes), // 0. It stores attributes in redis cache
    new Promise(commandCategories), //1. It stores categories in redis cache
    new Promise(commandProductCategories) // 2. It stores product/cateogry links in redis cache
   ]).then(function(results){
     logger.info('Starting full products reindex!');
     commandProducts(); //3. It indexes all the products
   }).catch(function (err) {
     logger.error(err);
     process.exit(1)
   });
}

cli.option({
  name: 'adapter',
  default: 'magento',
  type: String
});

/**
 * When using "cleanup" command this parameter sets the right adapter to be used
 */
cli.option({
  name: 'cleanupType',
  default: 'product',
  type: String
});


/**
 * used by "categories" and "products" actions. Means that products and categories that are non existient in specific API feed are removed from Mongo/ElasticSearch
 */
cli.option({
  name: 'removeNonExistient',
  default: false,
  type: Boolean
});


cli.option({
  name: 'transactionKey',
  default: 0,
  type: Number
});

cli.option({
  name: 'partitions',
  default: 1,
  type: Number
});

cli.option({
  name: 'partitionSize',
  default: 200,
  type: Number
});

cli.option({
  name: 'updatedAfter',
  default: '1970-01-01 00:00:00',
  type: String
});

cli.option({
  name: 'initQueue',
  default: true,
  type: Boolean
});

cli.option({ // check only records modified from the last run - can be executed for example in cron to pull out the fresh data from Magento
  name: 'delta',
  default: true,
  type: Boolean
});

cli.option({ // check only records modified from the last run - can be executed for example in cron to pull out the fresh data from Magento
  name: 'skus',
  default: '',
  type: String
});


/**
 * Reindex products, categories and productcategorylinks
 */
cli.command('fullreindex', function () {
  cli.options.removeNonExistient = true; // as it's full reindex so we'll remove products and categories non existing in the feed from database
  commandFullreindex();
})


/**
* Sync categories
*/
cli.command('categories', function () {
  commandCategories();
});

/**
* Sync categories
*/
cli.command('taxrule', function () {
  commandTaxRules();
});


/**
* Sync attributes
*/
cli.command('attributes', function () {
  commandAttributes();
});

/**
* Sync product-category-links
*/
cli.command('productcategories', function () {
  commandProductCategories();
});


/**
* Sync products worker
*/
cli.command('productsworker', function () {
  commandProductsworker();
});


/**
* Sync products
*/
cli.command('products', function () {
  commandProducts();
});

/**
* Cleanup the entity given by parameter "cleanupType" = product|category with parameter "transactionKey"
*/
cli.command('cleanup', function () {
  commandCleanup();
});


cli.on('notfound', function (action) {
  logger.error('I don\'t know how to: ' + action)
  process.exit(1)
});


process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});


// RUN
cli.parse(process.argv);
