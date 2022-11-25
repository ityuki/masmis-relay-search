var express = require('express');
var router = express.Router();

//
// Topページ
router.get('/', function (req, res, next) {
  res.render("ui/index")
});

module.exports = router;
