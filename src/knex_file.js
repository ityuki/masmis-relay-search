var path = require('path');
var process = require('process');

require('dotenv').config({ path: path.resolve(process.cwd(), '../.env') });
if (process.env.NODE_ENV){
  require('dotenv').config({ path: path.resolve(process.cwd(), '../.env.' + process.env.NODE_ENV) });
}

var config = require('./settings')

module.exports = {
  production: config.database
}

