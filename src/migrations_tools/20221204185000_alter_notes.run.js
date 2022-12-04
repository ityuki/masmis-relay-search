#!/usr/bin/env node

var path = require('path');
const { exit } = require('process');
var process = require('process');

require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
if (process.env.NODE_ENV){
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env.' + process.env.NODE_ENV) });
}

var database = require('../database');

async function main(){
  var rows = await database('notes').select().orderBy('id')
  for(var row of rows){
    console.log('note: notes -> note_norm:' + row['id'])
    await database('notes')
    .where({
      id: row['id']
    })
    .update({
      note_norm: row['note'].normalize('NFKC').toLowerCase()
    })
  }  
}

main().then(()=>{
  console.log("done")
  exit();
});



