var axios = require('axios');

var Activity = require('../activitypub/activity');
var Signature = require('../utils/signature');
var compress = require('../utils/compress');

var accountCache = require('../cache/account');
var database = require('../database');
var config = require('../settings');
const { redis } = require('../settings');

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
          // トランザクション外で実行
          var user = await database('notes_accounts').select()
                          .where({
                            url: account['url']
                          });
          // ユーザ登録
          //if (user.length == 0 || ((new Date()).getTime() - (new Date(user['updated_at'])).getTime()) > 7 * 24 * 60 * 60 * 1000){ // 7day
          if (false || user.length == 0 || 
            !user[0]['account_id'] ||
            !user[0]['domain_id'] ||
            //!user[0]['display_name'] || // display_nameは空許与
            ((new Date()).getTime() - (new Date(user[0]['updated_at'])).getTime()) > 7 * 24 * 60 * 60 * 1000){ // 7day
            // upsert
            // domain update含む
            var newuser = await accountRequestAddDomain(account['url'],trx);
            newuser[0]['updated_at'] = new Date()
            // トランザクション内で実行
            var user = await trx('notes_accounts').select()
                            .where({
                              url: account['url']
                            });
            if (user.length == 0){
              // insert
              console.log("notes_accounts user insert");
              user = await trx('notes_accounts').insert(newuser).returning("*");
            }else{
              // update
              console.log("notes_accounts user update");
              var r = await trx('notes_accounts')
              .update(newuser[0],Object.keys(newuser[0]))
              .where({
                id: user[0]['id']
              });
              newuser[0]['id'] = user[0]['id']
              user = newuser
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
          if (forwardActivity.object.type == "Note"){
            // public messageに限定
            var public_message = false;
            for(var to of forwardActivity.object.to){
              if (to == 'https://www.w3.org/ns/activitystreams#Public'){
                public_message = true;
              }
            }
            if (public_message){
              var nonhtml_content = forwardActivity.object.content.replace(/\<br\>/g,"\n").replace(/\<.*?\>/g,'')
              var nohtml_summary = forwardActivity.object.summary
              if (!nohtml_summary){
                nohtml_summary = ""
              }else{
                nohtml_summary = nohtml_summary.replace(/\<.*?\>/g,'') + " "
              }
              database('notes').insert({
                account_id: user[0]['id'],
                url: forwardActivity.object.id,
                note: nohtml_summary + nonhtml_content,
                note_norm: (nohtml_summary + nonhtml_content).normalize('NFKC').toLowerCase(),
                sensitive: forwardActivity.object.sensitive,
                media_attachments: (forwardActivity.object.attachment && forwardActivity.object.attachment.length > 0)?true:false,
                language: null,
                application_name: null,
                note_created_at: forwardActivity.object.published,
                data_json: compress.comp(JSON.stringify(job.data))
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
      console.log(err)
      done(err);
    });
};

var accountRequestAddDomain = async function(keyId,trx) {
  var account = await accountRequest(keyId);
  // トランザクション外で実行
  var domain = await database('notes_domains').select()
  .where({
    domain: account[0]['domain']
  });
  if (false || domain.length == 0 ||
    ((new Date()).getTime() - (new Date(domain[0]['updated_at'])).getTime()) > 7 * 24 * 60 * 60 * 1000){ // 7day
    var newdomain = await manifestRequest(account[0]['domain']);
    newdomain[0]['updated_at'] = new Date()
    // トランザクション内で実行
    var domain = await trx('notes_domains').select()
                    .where({
                      domain: account[0]['domain']
                    });
    if (domain.length == 0){
      // insert
      console.log("notes_domains domain insert");
      domain = await trx('notes_domains').insert(newdomain).returning("*");
    }else{
      // update
      console.log("notes_domains domain update");
      var r = await trx('notes_domains')
      .update(newdomain[0],Object.keys(newdomain[0]))
      .where({
        domain: account['domain']
      });
      newdomain[0]['id'] = domain[0]['id']
      domain = newdomain
    }
  }
  account[0]['domain_id'] = domain[0]['id']
  return account;
}

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

          'account_id': res.data.id,
          'account_url': res.data.url,

          'url': keyId
        }
      ];
    })
    .catch(function(err) {
      return err;
    });
};

var manifestRequest = async function(domain_name) {
  var options = {
    url: "https://" + domain_name + "/manifest.json",
    method: 'GET',
    headers: {'Accept': 'application/json'},
    json: true
  };

  return axios(options)
    .then(function(res) {

      //console.log("manifestRequest");
      //console.log(res.data)
      var name = res.data.name;
      if (res.data.short_name && res.data.short_name != ""){
        name = res.data.short_name;
      }
      var icon_url = null;
      if (res.data.icons){
        var size = null;
        for(var icon of res.data.icons){
          if (!icon || !icon.src || icon.src == "") continue;
          var icon_src = icon.src;
          if (icon_src.startsWith("https://" + domain_name + "/")){
            // DO NOTHING
          }else if(icon_src.startsWith("/")){
            icon_src = "https://" + domain_name + icon_src;
          }else{
            continue;
          }
          if (icon_url == null) icon_url = icon_src;
          if (!icon.sizes) continue;
          var sz = icon.sizes.split("x");
          if (sz.length != 2) continue;
          if (size == null){
            size = sz;
            icon_url = icon_src;
          }
          if (size[0] > sz[0] || size[1] > sz[1]){
            size = sz;
            icon_url = icon_src;
          }
        }
      }
      var background_color = null;
      if (res.data.background_color){
        if (res.data.background_color.search(/^\#[0-9A-Fa-f]{6}$/) == 0){
          background_color = res.data.background_color;          
        }
      }

      // レコード作成
      return [
          {
          'domain': domain_name,
          'domain_name': name,
          'icon_url': icon_url,
          'background_color': background_color
        }
      ];
    })
    .catch(function(err) {
      // return err;
      return [
        {
        'domain': domain_name,
        'domain_name': null,
        'icon_url': null,
        'background_color': null
      }
    ];
  });
}


