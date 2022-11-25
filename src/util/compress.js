const Buffer = require('buffer').Buffer;
const zlib = require('zlib');

module.exports = {
  comp : function(text){
    return zlib.gzipSync(text);
  },
  comp64 : function(text){
    return this.comp(text).toString('base64');
  },
  decomp : function(buffer){
    return zlib.unzipSync(buffer);
  },
  decomp64 : function(b64){
    this.decomp(Buffer.from(b64, 'base64'));
  }
};

