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
  name: 'initQueue',
	default: true,
	type: Boolean
});

/**
* Sync categories
*/
cli.command('categories', function(){
  let adapter = factory.getAdapter(cli.options.adapter, 'categories');
  adapter.run({});

});

/**
* Sync products
*/
cli.command('products', function(){

  let adapter = factory.getAdapter(cli.options.adapter, 'products');


  if(cli.options.partitions > 1 && adapter.isFederated()) // standard case
  {
    let partition_count = cli.options.partitions;
    logger.info('Running in MPM (Multi Process Mode) with partitions count = ' + partition_count);

    adapter.getTotalCount().then(function(result){

      let total_count = result.totalCount;
      let page_size = cli.options.partitionSize;
      let page_count = total_count / page_size;

      if(cli.options.initQueue){
        logger.info('Propagating job queue ... ');

        for(let i = 0; i<page_count; i++){
          logger.debug('Adding job for: ' + i + ' / ' + page_size);
          queue.createJob('products', { page_size: page_size, page: i }).save();
        }
      } else {
        logger.info('Not propagating queue - only execution mode!');
      }

      // TODO: separte the execution part to run in multi-tenant env
      queue.process('products', partition_count, (job,done) => {

        let adapter = factory.getAdapter(cli.options.adapter, 'products'); // to avoid multi threading mongo error
        if(job && job.data.page && job.data.page_size ){
          logger.info('Processing job: ' + job.data.page);
          adapter.run({ page_size: job.data.page_size, page: job.data.page, done_callback: ()=> {
              logger.info('Task done!');
              return done();
            }

          });
        } else return done();

      });


    });

  } else {
    logger.info('Running in SPM (Single Process Mode)');
    adapter.run({});
  }

});



cli.on('notfound', function(action){
  logger.error('I don\'t know how to: ' + action)
  process.exit(1)
});


// RUN
cli.parse(process.argv);
