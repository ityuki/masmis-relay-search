var express = require('express');
var router = express.Router();
var database = require('../database');

var parser = require('../search/data_parser')
var Moment = require('moment')

//
// Topページ
router.get('/', function (req, res, next) {
  res.render("ui/index")
});

//
// search
router.get('/search', function (req, res, next) {
  var query = req.query.q
  if (query == null || query == undefined){
    query = ""
  }
  var sql = parser.parseInput(query)
  if (sql == null){
    res.render("ui/search",{msg:"keyword not found",rows:[],query:query})
    return;
  }
  var db = null;
  if (sql.search_tag){
    db = database.select(
      'notes_accounts.display_name',
      'notes_accounts.url',
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
      'notes_accounts.display_name',
      'notes_accounts.url as account_url',
      'notes.url',
      'notes.note',
      'notes.note_created_at'
    ).from('notes')
    .join('notes_accounts','notes.account_id','=','notes_accounts.id')
    .whereRaw(sql.sql,sql.params)
    .orderBy('notes.note_created_at', 'desc')
    .limit(100).offset(0)
  }

  db.then(rows=>{
    console.log(rows)
    res.render("ui/search",{msg:"検索結果上位100件です",rows:rows,query:query,Moment:Moment})
  })
});

module.exports = router;
