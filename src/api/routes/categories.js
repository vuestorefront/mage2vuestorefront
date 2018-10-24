'use strict';
let express = require('express');
let router = express.Router();
let config = require('../../config');
let MongoClient = require('mongodb').MongoClient;
let q2m = require('query-to-mongo');
let auth = require('../auth')();

router.get('/browse', auth.authenticate(), function(req, res) {

  MongoClient.connect(config.db.url, (err, db) => {

    var collection = db.collection('categories')
    var query = q2m(req.query);
    console.log(query);


    collection.find(query.criteria, query.options).toArray(function(err, results) {
      res.json(results);
    })

  });
});

module.exports = router;
