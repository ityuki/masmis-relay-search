var express = require('express');
var router = express.Router();
var path = require("path");
var xmlBuilder = require('xmlbuilder');

var config = require('../settings');

var Actor = require('../activitypub/actor');

var route_inbox = require('./inbox');

//
// Topページ
router.get('/', function (req, res, next) {
  res.redirect("/ui/");
});

// robots.txt
router.get('/robots.txt', function (req, res, next) {
  res.sendFile(path.join(__dirname, '../public/robots.txt'));
});

// favicon.ico
router.get('/favicon.ico', function (req, res, next) {
  res.sendFile(path.join(__dirname, '../public/favicon.ico'));
});

// favicon.png
router.get('/favicon.png', function (req, res, next) {
  res.sendFile(path.join(__dirname, '../public/favicon.png'));
});

// Webfinger
router.get('/.well-known/webfinger', function (req, res, next) {

  if (!req.query.resource) {
    var error = new Error('Resource query parameter not present.');
    error.status = 400;
    return next(error);
  }
  if (req.query.resource != config.relay.account) {
    var error = new Error('Resource not found.');
    error.status = 404;
    return next(error);
  }

  var obj = {
    'subject': config.relay.account,
    'links': [
      {
        'rel':  'self',
        'type': 'application/activity+json',
        'href': config.relay.actor
      },
    ]
  };

  res.set('Content-Type', 'application/json').json(obj);
});
router.get('/.well-known/host-meta', function(req, res, next) {

  var xml = xmlBuilder.create('XRD', {'xmlns': 'http://docs.oasis-open.org/ns/xri/xrd-1.0'})
    .ele('Link', {'rel': 'lrdd', 'type':'application/xrd+xml', 'template': config.relay.url+'/.well-known/webfinger?resource='+config.relay.account})
  .end({ pretty: true});

  res.set('Content-Type', 'application/xml').send(xml).end();
});

// Actor
router.get('/actor', function (req, res, next) {

  //
  var actor = new Actor(config.relay);

  //
  res.set('Content-Type', 'application/activity+json')
    .send(JSON.stringify(actor.myself(config.relay.publicKey)))
    .end();
});

// Status
router.get('/status', function(req, res, next) {

  res.set('Content-Type', 'application/json')
    .end();
});

// inbox
router.post('(/||//)inbox', function (req, res, next) {

  var inbox_status = route_inbox(req, res, next)

  if (inbox_status){
    return inbox_status;
  }

  res.status(202).end();
});

router.post('(/|//)outbox', function (req, res, next) {

  res.status(202).end();
});


module.exports = router;
