var express = require('express');
var router = express.Router();
var database = require('../database');
var accountStatus = require('../cache/relay_status');
var Moment = require('moment')

function escapeHTML( text )
{
    var replacement = function( ch )
    {
        var characterReference = {
            '"':'&quot;',
            '&':'&amp;',
            '\'':'&#39;',
            '<':'&lt;',
            '>':'&gt;'
        };

        return characterReference[ ch ];
    }

    return text.replace( /["&'<>]/g, replacement );
}

//
// Topページ
router.get('/', function (req, res, next) {
  res.render("ui/index")
});

// 利用規約
router.get('/tos', function (req, res, next) {
  res.render("ui/tos")
});

// 検索の使い方
router.get('/search_help', function (req, res, next) {
  res.render("ui/search_help")
});

// リレー情報
router.get('/relay', function (req, res, next) {
  database.select(
    'id',
    'domain',
    'account_status',
    'actor_type',
    'username',
    'created_at'
  )
  .from('accounts')
  .where({account_type:'relay'})
  .orderBy('domain','asc')
  .orderBy('actor_type','asc')
  .orderBy('username','asc')
  .then(async (rows)=>{
    var stats = await accountStatus.getAllStatus();
    res.render("ui/relay",{rows:rows, stats:stats,Moment:Moment})
  })
});


module.exports = router;
