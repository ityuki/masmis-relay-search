
module.exports = {
  build : function(domain){
    if (!domain || domain == null || domain == "") return domain;
    var sp = domain.split(".");
    return sp.reverse().join(".");
  },
  debuild : function(domain){
    return this.build(domain); // :)
  }
};

