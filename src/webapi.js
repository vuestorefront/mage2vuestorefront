'use strict';

let AdapterFactory = require('./adapters/factory');
let config = require('./config');
let logger = require('./log');
let factory = new AdapterFactory(config);

let kue = require('kue');
let queue = kue.createQueue();

var express    = require('express');        // call express
var app        = express();                 // define our app using express
var body_parser = require('body-parser');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(body_parser.urlencoded({ extended: true }));
app.use(body_parser.json());

var port = process.env.PORT || 8080;        // set our port

var router = express.Router();              // get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/magento/products/pull/:skus', function(req, res) { // TODO: add api key middleware

  let skus_array = req.params.skus.split(',') ;
  queue.createJob('product', { skus: skus_array, adapter: 'magento' }).save();

  res.json({ status: 'done', message: 'Products ' + skus_array + ' scheduled to be refreshed'})


});

app.use(function (req, res, next) {
  console.log('Time:', Date.now())
  next()
});

app.use('/api', router);
app.listen(port);
logger.info('Magic happens on port ' + port);
