'use strict';

/**
 * Webhook API to add specific products or categories to be synchronized by the service
 */

let config = require('./config');
let logger = require('./log');

let auth = require('./api/auth.js')();

var express = require('express');
var app = express();
var body_parser = require('body-parser');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(body_parser.urlencoded({ extended: true }));
app.use(body_parser.json());

var port = process.env.PORT || 8080; // set our port

app.use(auth.initialize());

app.use('/auth', require('./api/routes/auth'));
app.use('/magento', require('./api/routes/magento'));
app.use('/products', require('./api/routes/products'));
app.use('/categories', require('./api/routes/categories'));


app.listen(port);
logger.info('Magic happens on port ' + port);
