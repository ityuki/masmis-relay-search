var express = require('express');
var createError = require('http-errors');

var app = express();

// web_service
app.use('/', require('./routes/web_service'));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  console.log(err.message+". path:"+req.path);

  res.status(err.status || 500);
  res.send(err.message);
});

module.exports = app;

