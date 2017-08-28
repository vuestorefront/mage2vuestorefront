'use strict';

var CommandRouter = require('command-router');
let AdapterFactory = require('./adapters/factory');


let cli = CommandRouter();
let config = require('./config');
let logger = require('./log');
let factory = new AdapterFactory(config);


// for partitioning purposes
let cluster = require('cluster')
let numCPUs = require('os').cpus().length;

let kue = require('kue');
let queue = kue.createQueue();



cli.option({
  name: 'adapter',
  default: 'magento',
  type: String
});

cli.option({
  name: 'partitions',
  default: numCPUs,
  type: Number
});

cli.option({
  name: 'partitionSize',
  default: 50,
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
* Sync categories
*/
cli.command('categories', function () {
  let adapter = factory.getAdapter(cli.options.adapter, 'category');
  adapter.run({
    done_callback: () => {
      logger.info('Task done!');
      process.exit(0);
    }
  });

});

/**
* Sync product-category-links
*/
cli.command('productcategories', function () {
  let adapter = factory.getAdapter(cli.options.adapter, 'productcategories');
  adapter.run({
    done_callback: () => {
      logger.info('Task done!');
      process.exit(0);
    }
  });

});


/**
* Sync products worker
*/
cli.command('productsworker', function () {

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


});


/**
* Sync products
*/
cli.command('products', function () {

  let adapter = factory.getAdapter(cli.options.adapter, 'product');
  let updated_after = new Date(cli.options.updated_after);


  if (cli.options.partitions > 1 && adapter.isFederated()) // standard case
  {
    let partition_count = cli.options.partitions;

    logger.info('Running in MPM (Multi Process Mode) with partitions count = ' + partition_count);

    adapter.getTotalCount({ updated_after: updated_after }).then((result) => {

      let total_count = result.total_count;
      let page_size = cli.options.partitionSize;
      let page_count = parseInt(total_count / page_size);

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
            page_size: job.data.page_size, page: job.data.page, updated_after: job.data.updated_after, done_callback: () => {
              logger.info('Task done!');
              return done();
            }

          });
        } else return done();

      });


    });

  } else {
    logger.info('Running in SPM (Single Process Mode)');

    let context = { updated_after: updated_after };

    if (cli.options.skus) {
      context.skus = cli.options.skus.split(','); // update individual producs
    }

    adapter.run(context);
  }

});



cli.on('notfound', function (action) {
  logger.error('I don\'t know how to: ' + action)
  process.exit(1)
});


// RUN
cli.parse(process.argv);
