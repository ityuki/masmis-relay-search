//var fetch = require('node-fetch');

var database = require('../database');
var cache = require('../cache');
var compress = require('../utils/compress');

module.exports = async function(keyId,account_type) {

  return new Promise(function(resolve, reject) {

    if (cache.has(keyId)) {
      console.log('has cache. ['+keyId+']');

      // キャッシュがあればそれで
      return cache.get(keyId);
    } else {
      console.log('no cache. ['+keyId+']');

      // DB
      return database('accounts').select()
        .where({url: keyId})
        .then(function(rows) {
          if (rows.length == 0) {
            console.log('no found. ['+keyId+']');

            // Httpリクエストで取得する
            return accountRequest(keyId,account_type);
          } else {
            console.log('found. ['+keyId+']');

            // 取得したものを返却
            return Promise.resolve(rows);
          }
        })
        .then(function(rows) {

          //console.log(rows)

          if (!rows[0]['id']) {
            // DBに登録
            return new Promise((resolve,reject)=>{
              var row = rows[0];
              try{
                database.transaction(async trx =>{
                  var rows2 = await trx('accounts').select()
                              .where({
                                'username': row['username'],
                                'domain': row['domain'],
                                'account_type': account_type,
                              })
                  if (rows2.length == 0){
                    // 追加
                    var rows = await trx('accounts')
                              .insert(row)
                              .returning('*')
                    return rows;
                  }else{
                    return rows2;
                  }
                }).then((rows)=>{
                  resolve(rows);
                }).catch((e)=>{
                  reject(e);
                });
              }catch(e){
                reject(e)
              }
            })
          } else {
            // 取得したものを返却
            return Promise.resolve(rows);
          }
        })
        .then(function(rows) {

          // キャッシュに保存
          cache.set(keyId, rows[0]);

          // 取得したアカウントをコールバックに返却
          return rows[0];
        })
    }
  });
};


var axios = require('axios');

//
// アカウント情報取得
var accountRequest = function(keyId,account_type) {

  var options = {
    url: keyId,
    method: 'GET',
    headers: {'Accept': 'application/activity+json, application/ld+json'},
    json: true
  };

  // fetchにするとawait res.jsonしないとエラーになるので、とりあえずaxiosで行く
  // fetchとaxios混じってて気持ち悪いけど……。
  // あと、res.request.hostが取れなさそう
  //return fetch(keyId,options)
  return axios(options)
    .then(function(res) {

      //var data = await res.json();
      //console.log("accountRequest");
      //console.log(res)
      //console.log(res.data)
      //console.log(data)

      if (!res.data.preferredUsername || res.data.preferredUsername == "" ||
          !res.data.id || res.data.id == "" ||
          !res.data.inbox || res.data.inbox == "" ||
          !res.data.outbox || res.data.outbox == ""){
            throw new Error('require data is null or blank');
          }



      // レコード作成
      return [
          {
          'username': res.data.preferredUsername,
          'domain': res.request.host,
          'private_key': '',
          'public_key': (res.data.publicKey)?res.data.publicKey.publicKeyPem:'',
          
          'display_name': (res.data.name)?res.data.name:'',
          'note': (res.data.summary)?res.data.summary:'',
          'uri': res.data.id,
          'url': keyId,
          'avatar_remote_url': (res.data.icon)?res.data.icon.url:'',
          'header_remote_url': (res.data.image)?res.data.image.url:'',
          
          'inbox_url': res.data.inbox,
          'outbox_url': res.data.outbox,
          'shared_inbox_url': (res.data.endpoints)?res.data.endpoints.sharedInbox:'',
          'shared_outbox_url': '',
          'followers_url': res.data.followers,
          'following_url': res.data.following,
          
          'actor_type': res.data.type,
          'discoverable': true,

          'account_type': account_type,
          'account_status': 1,

          'data_json': compress.comp(JSON.stringify(res.data))
        }
      ];
    })
    .catch(function(err) {
      return err;
    });
};

