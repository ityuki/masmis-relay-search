var Activity = require('../activitypub/activity');
var SubscriptionMessage = require('../activitypub/subscription_message');
var Signature = require('../utils/signature');

var accountCache = require('../cache/account');
var database = require('../database');
var config = require('../settings');

//
//
module.exports = function(job, done) {

  //
  var subscriptionMessage = new SubscriptionMessage(config.relay.actor, config.relay.privateKey);
      
  // Signatation Params
  var client = job.data.client;
  var signParams = Signature.parseSignParams(client);

  // 転送Activity
  var forwardActivity = Activity.parse(client.body);
  // ブーストActivity
  var activity = new Activity(config.relay);
  var boastActivity = activity.announce(client.body);

  console.log('start forward queue process. keyId='+signParams['keyId']);

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

      // トランザクション外で実行
      database('accounts')
      .select([
        'id',
        'domain',
        'created_at',
        'updated_at',
        'account_status',
        'username',
        'uri',
        'url',
        'inbox_url',
        'shared_inbox_url'
      ])
      .whereNot({'domain': account['domain']})
      .where({
        'account_type': 'relay',
        'account_status': 1
      }).then(rows=>{
        for(idx in rows) {

          // 単純フォーワード
          console.log('Forward Activity.'
          +' form='+account['uri']+' to='+rows[idx]['inbox_url']);

          subscriptionMessage
            .sendActivity(rows[idx]['inbox_url'], forwardActivity)
            .then(function(res) {

              // 配信成功を結果ログに記録
            })
            .catch(function(err) {
              console.log(err.message);

              // 配信失敗を結果ログに記録

              // 配送不能ドメインのステータスを変更
              if (err.code == 'ETIMEDOUT') {
                // タイムアウトはビジー状態として処理
                return;
              } else if (err.code == 'ERR_BAD_RESPONSE'
                  && err.response.status >= 500) {
                // 一時的な配送エラーとして処理
                return;
              } else {
                // 失敗
                // トランザクション外で実行
                database('accounts')
                .where({
                  'inbox_url': err.config.url
                })
                .update({
                  'account_status': 0
                }).catch(function(err) {
                  console.log(err.message);
                });
              }
            });
          }

          return Promise.resolve(account);
        });

      // 
      return Promise.resolve(account);
    })
    .then(function(account) {

      // タグ付き投稿であるか確認
      if (!forwardActivity.object.tag) {
        return Promise.resolve(account);
      }

      // タグ登録
      //for(idx in forwardActivity.object.tag) {
      //  console.log('insert hashtag.['+forwardActivity.object.tag[idx].name+']');

      //  database('tags').insert({
      //    type: forwardActivity.object.tag[idx].type,
      //    href: forwardActivity.object.tag[idx].href,
      //    name: forwardActivity.object.tag[idx].name
      //  });

      //}

      // 
      return Promise.resolve(account);
    })
    .then(function(account) {

      // ドメインの配信状況更新
      database('accounts')
      .where({
        'domain':account['domain'],
        'account_type': 'relay'
      })
      .update({
        'status': 1
      })

      // 
      return Promise.resolve(account);
    })
    .then(function(account) {
      // 処理終了
      console.log('end forward queue process. keyId='+signParams['keyId']);
      return done();
    })
    .catch(function(err) {
      done(err);
    });
};

