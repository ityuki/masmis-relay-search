var axios = require('axios');

var Activity = require('../activitypub/activity');
var Signature = require('../utils/signature');
var compress = require('../utils/compress');

var accountCache = require('../cache/account');
var database = require('../database');
var config = require('../settings');

//
//
module.exports = function(job, done) {
      
  // Signatation Params
  var client = job.data.client;
  var activity_type = job.data.activity.type;
  var signParams = Signature.parseSignParams(client);

  // 転送Activity
  var forwardActivity = Activity.parse(client.body);
  // ブーストActivity
  var activity = new Activity(config.relay);
  var boastActivity = activity.announce(client.body);

  console.log('start note_change queue process. keyId='+signParams['keyId'] + " activity_type=" + activity_type);
  //console.log(forwardActivity)

  // リクエスト元の公開鍵取得
  accountCache(signParams['keyId'],'followers')
    .then(function(account) {
        
      // Signatureの正当性チェック
      if (!Signature.verifyRequest(account['public_key'], client)) {
         //var activity = new Activity(config.relay);

         // 拒否応答せず無視
         // subscriptionMessage.sendActivity(
         //  account['shared_inbox_url'], activity.reject(signParams['keyId'], client.body));

         throw new Error('Invalid signature. keyId='+signParams['keyId']);
      } else {

         // アカウントを返却
         return Promise.resolve(account);
      }
    })
    .then(function(account) {

      // アカウント情報確認・追加
      // タグ登録も
      return new Promise((resolve,reject)=>{
        database.transaction(async trx=>{
          // ユーザ確認
          console.log("notes_accounts verification url=" + account['url']);
          var user = await trx('notes_accounts').select()
                          .where({
                            url: account['url']
                          });
          // ユーザ登録
          if (user.length == 0 || ((new Date()).getTime() - (new Date(user['updated_at'])).getTime()) > 7 * 24 * 60 * 60 * 1000){ // 7day
            // upsert
            var newuser = await accountRequest(account['url']);
            if (user.length == 0){
              // insert
              console.log("notes_accounts user insert");
              user = await trx('notes_accounts').insert(newuser).returning("*");
            }else{
              // update
              console.log("notes_accounts user update");
              user = await trx('notes_accounts')
              .update(newuser)
              .where({
                id: user[0]['id']
              })
            }
          }
          // タグ登録
          if (forwardActivity.object.tag && forwardActivity.object.tag.length > 0){
            console.log("tags update");
            for(var tag of forwardActivity.object.tag){
              var tags = await trx('tags').select().where({name:tag.name});
              if (tags.length == 0){
                await trx('tags').insert({
                  name: tag.name,
                  url: tag.href,
                  type: tag.type,
                  data_json: compress.comp(JSON.stringify(tag))
                })
              }
            }
          }
          return resolve(user);
        })
        .catch((e)=>{reject(e);})
      })
    })
    .then(function(user) {
      switch(activity_type){
        case "Create":
          // notesに追加
          if (forwardActivity.object.type == "Note" &&  forwardActivity.object.content != ""){
            var nonhtml_content = forwardActivity.object.content.replace(/\<.*?\>/g,'')
            var nohtml_summary = forwardActivity.object.summary
            if (!nohtml_summary){
              nohtml_summary = ""
            }else{
              nohtml_summary = nohtml_summary.replace(/\<.*?\>/g,'') + " "
            }
            database('notes').insert({
              account_id: user.id,
              url: forwardActivity.object.id,
              note: nohtml_summary + nonhtml_content,
              sensitive: forwardActivity.object.sensitive,
              media_attachments: (forwardActivity.object.attachment && forwardActivity.object.attachment.length > 0)?true:false,
              language: null,
              application_name: null,
              note_created_at: forwardActivity.object.published
            })
            .returning('*')
            .then((note)=>{
              if (forwardActivity.object.tag && forwardActivity.object.tag.length > 0){
                database.transaction(async trx=>{
                  for(var tag of forwardActivity.object.tag){
                    var id = (await trx('tags').select(["id"]).where({name:tag.name}))[0]['id'];
                    await trx('tag_note').insert({
                      tag_id: id,
                      note_id: note[0]['id']
                    })
                  }  
                })
              }
              return Promise.resolve(user);
            })
            .catch((e)=>{Promise.reject(e);})
          }else{
            return Promise.resolve(user);
          }
          break;
        case "Delete":
          // 存在したらdelete
          {
            var url = forwardActivity.object.id
            database.transaction(async trx=>{
              var note = await trx("notes").select().where({url:url})
              if (note.length > 0){
                // タグ関連付け削除
                await trx('tag_note').delete().where({note_id: note[0]['id'] })
                // ノート削除
                await trx('notes').delete().where({id: note[0]['id']})
                // ユーザは面倒なので削除しない
              }
            })
            .then(()=>{
              return Promise.resolve(user);
            })
            .catch((e)=>{Promise.reject(e);})
          }
          break;
        case "Update":
        case "Announce":
        case "Move":
          return Promise.resolve(user);
        }
    })
    .then(function(user) {
      // 処理終了
      console.log('end note_change queue process. keyId='+signParams['keyId'] + " activity_type=" + activity_type);
      return done();
    })
    .catch(function(err) {
      done(err);
    });
};

// アカウント情報取得
var accountRequest = async function(keyId) {

  var options = {
    url: keyId,
    method: 'GET',
    headers: {'Accept': 'application/activity+json, application/ld+json'},
    json: true
  };

  return axios(options)
    .then(function(res) {

      //console.log("accountRequest");
      //console.log(res.data)

      if (!res.data.preferredUsername || res.data.preferredUsername == ""){
            throw new Error('require data is null or blank');
          }



      // レコード作成
      return [
          {
          'username': res.data.preferredUsername,
          'domain': res.request.host,
          
          'display_name': (res.data.name)?res.data.name:'',
          'bot': (!res.data.bot || res.data.bot == false) ? false : true,

          'url': keyId
        }
      ];
    })
    .catch(function(err) {
      return err;
    });
};

