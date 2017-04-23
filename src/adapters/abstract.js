'use strict';

let MongoClient = require('mongodb').MongoClient;

class AbstractAdapter{

  validateConfig(config){

    if(!config['db']['url'])
      throw Error('db.url must be set up in config');

  }

  constructor(app_config){
    this.config = app_config;
    this.db = null;
    this.total_count = 0;
    this.page_count = 0;
    this.page_size = 50;
    this.page = 0;

    this.use_paging = false;

    this.validateConfig(this.config);
    this.processItems = this.processItems.bind(this);
  }

  isValidFor (entity_type){
    throw Error('isValidFor must be implemented in specific class');
  }



  run (context){

    MongoClient.connect(this.config.db.url, (err, db) => {
       logger.info("Connected correctly to server");

       this.db = db;

       this.onDone = context.done_callback ? context.done_callback : () => {};
       this.getSourceData(context).then(this.processItems);

     });


  }

  prepareItems(items){
    if(!Array.isArray(items))
      items = new Array(items);

    return items;
  }

  isFederated(){
    return false;
  }

  processItems(items, level){

    if(isNaN(level))
      level = 0;

    items = this.prepareItems(items);

    let count =  items.length;
    let index = 0;


    let db = this.db;
    if(!db)
      throw new Error('No MongoDb connection established!');

    items.map( (item) => {

      logger.info('Importing ' + index + ' of ' + count + ' - ' + this.getLabel(item));

        db.collection(this.getCollectionName()).findAndModify(
        this.getWhereQuery(item), // query
        [['_id','asc']],  // sort order
        {$set: item }, // replacement, replaces only the field "hi"
        { upsert: true }, // options
        function(err, object) {
            if (err){
                logger.warn(err.message);  // returns error if no matching object found
            }
          });

          if(item.childrenData && item.childrenData.length > 0){
            logger.log('--L:' + level + ' Processing child items ...');
            this.processItems(item.childrenData, level + 1);
          }

          if(index == (count-1)) // page done!
          {
            logger.debug('--L:' + level +  ' Level done!');

            if(level == 0){

              if(this.use_paging  && !this.isFederated()){

                  if(this.page >= this.page_count){
                    logger.info('All pages processed!');
                    db.close();

                    this.onDone(this);
                  } else  {

                    this.page ++;
                    logger.debug('Switching page to ' + this.page);

                    this.getSourceData({}).then(this.processItems);
                }

              } else {
                logger.info('All records processed!');
                db.close();

                return this.onDone(this);

              }

            }
          }

          index ++;
      })

  }

}

module.exports = AbstractAdapter;
