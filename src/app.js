var express = require('express');
var createError = require('http-errors');
var bodyParser = require('body-parser');
var path = require('path');
var logger = require('morgan');
var url = require('url')

var config = require('./settings');

var app = express();

// viewエンジン
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.enable("trust proxy")

// Httpヘッダー「Host」を強制的に自ドメインにする。
// (ローカル環境だとIPアドレスとなるため（暫定対応）)
app.use(function(req, res, next) {
  var relayUrl = url.parse(config.relay.url);
  req.headers['host'] = relayUrl.host;
  next();
});

// ログレベル
app.use(logger('combined'));
// パーサー
app.use(bodyParser.json({
  type: [
    'application/json',
    'application/activity+json'
  ],
  verify: function (req, res, buf, encoding) {
    // rawデータ取得
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8');
    }
  }
}));

// 静的ファイル
app.use(express.urlencoded({ extended: false }));
app.use("/static",express.static(path.join(__dirname, 'public/static')));

console.log("・relay")
console.log("　host: "+config.relay.url);
console.log("　privatekey: "+config.relay.privateKey);
console.log("　publickey: "+config.relay.publicKey);

console.log("・redis")
console.log("　host: "+config.redis.host);
console.log("　port: "+config.redis.port);

console.log("・database")
console.log("　host: "+config.database.connection.host);
console.log("　port: "+config.database.connection.port);
console.log("　name: "+config.database.connection.database);

// web_service
app.use('/', require('./routes/web_service'));

// ui
app.use('/ui', require('./routes/ui'));

// search
app.use('/search', require('./routes/search'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  var code = err.status || 500;
  console.log(err.message+". path:"+req.path + " code:" + code);
  console.log(err)

  res.status(code);
  res.send(createError(code).message);
});

module.exports = app;

