var express = require('express');
var router = express.Router();
var database = require('../database');

var parser = require('../search/data_parser')
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

function getRGB(colorcode,type){
  if (!colorcode) return 0;
  var cid = colorcode.split("")
  cid.shift()
  var c = "00"
  if (type == 'r') c = cid[0] + cid[1]
  if (type == 'g') c = cid[2] + cid[3]
  if (type == 'b') c = cid[4] + cid[5]
  return parseInt(c,16);
}

function urlLinker(text,domain){
  text = text.replaceAll(/(https?\:\/\/[A-Za-z0-9\-\_\.]+[\u0021-\u007E]*)/g,'<a href="$1" target="_blank" rel="nofollow">$1</a>')
  //text = text.replaceAll(/(\@[A-Za-z0-9]+)/g,'<a href="https://' + domain + '/$1" target="_blank" rel="nofollow">$1</a>')
  return text;
}

//
// searchページ
router.get('/', function (req, res, next) {
  var query = req.query.q
  if (query == null || query == undefined){
    query = ""
  }
  var sql = parser.parseInput(query)
  if (sql == null){
    res.render("search",{msg:"keyword not found",rows:[],query:query})
    return;
  }
  var db = null;
  if (false && sql.search_tag){
    db = database.select(
      'notes_accounts.domain',
      'notes_accounts.username',
      'notes_accounts.display_name',
      'notes_accounts.url as account_url',
      'notes_accounts.account_id',
      'notes.url',
      'notes.note',
      'notes.note_created_at'
    ).from('notes')
    .join('notes_accounts','notes.account_id','=','notes_accounts.id')
    .join('tag_note','notes.id','=','tag_note.note_id')
    .join('tags','tag_note.tag_id','=','tag_note.note_id')
    .whereRaw(sql.sql,sql.params)
    .orderBy('notes.note_created_at', 'desc')
    .limit(100).offset(0)
  }else{
    db = database.select(
      'notes_accounts.domain',
      'notes_accounts.username',
      'notes_accounts.display_name',
      'notes_accounts.account_url',
      'notes_accounts.account_id',
      'notes_domains.domain_name',
      'notes_domains.icon_url',
      'notes_domains.background_color',
      'notes.url',
      'notes.note',
      'notes.note_created_at'
    ).from('notes')
    .join('notes_accounts','notes.account_id','=','notes_accounts.id')
    .join('notes_domains','notes_accounts.domain_id','=','notes_domains.id')
    .whereRaw(sql.sql,sql.params)
    .orderBy('notes.note_created_at', 'desc')
    .limit(100).offset(0)
  }

  db.then(rows=>{
    res.render("search",{msg:"検索結果上位100件です",rows:rows,query:query,Moment:Moment,escapeHTML:escapeHTML,getRGB:getRGB,urlLinker:urlLinker})
  })
});

module.exports = router;
