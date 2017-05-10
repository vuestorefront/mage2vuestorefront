'use strict';
let express = require('express');
let router = express.Router();
let q2m = require('query-to-mongo');
let MongoClient = require('mongodb').MongoClient;
let config = require('../../config');
let auth = require('../auth')();

router.get('/browse', /*auth.authenticate(),*/ function(req, res) {
  MongoClient.connect(config.db.url, (err, db) => {

    var collection = db.collection('products')
    var query = q2m(req.query);
    console.log(query);


    collection.find(query.criteria, query.options).toArray(function(err, results) {
      res.json(results);
    })

  });
});




module.exports = router;
