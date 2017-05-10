'use strict';

let express = require('express');
let auth = require("../auth.js")();
let users = require("../users.js");
let config = require("../../config.js");
let router = express.Router();
let jwt = require("jwt-simple");


router.post("/token", function(req, res) {
    if (req.body.email && req.body.password) {
        var email = req.body.email;
        var password = req.body.password;
        var user = users.find(function(u) { // TODO: refactor to use db for auth
            return u.email === email && u.password === password;
        });
        if (user) {
            var payload = {
                id: user.id
            };
            var token = jwt.encode(payload, config.passport.jwtSecret);
            res.json({
                token: token
            });
        } else {
            res.sendStatus(401);
        }
    } else {
        res.sendStatus(401);
    }
});


module.exports = router;
