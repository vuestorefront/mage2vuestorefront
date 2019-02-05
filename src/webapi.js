'use strict';

/**
 * Webhook API to add specific products or categories to be synchronized by the service
 */

let logger = require('./log');
var express = require('express');
var app = express();
var body_parser = require('body-parser');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(body_parser.urlencoded({ extended: true }));
app.use(body_parser.json());

var port = process.env.PORT || 8080; // set our port
app.use('/magento', require('./api/routes/magento'));

app.listen(port);
logger.info('Magic happens on port ' + port);
