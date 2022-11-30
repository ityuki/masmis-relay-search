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
  var activity = new Activity(config.relay);
  
  // Signatation Params
  var client = job.data.client;
  var signParams = Signature.parseSignParams(client);

  console.log('start follow queue process. keyId='+signParams['keyId']);

  //
  accountCache(signParams['keyId'],'relay')
    .then(function(account) {
      
      // Signatureの正当性チェック
      if (!Signature.verifyRequest(account['public_key'], client)) {
        console.log('Invalid signature. keyId='+signParams['keyId']);
  
        // 拒否応答
        return subscriptionMessage.sendActivity(
          account['shared_inbox_url'], activity.reject(signParams['keyId'], client.body));
      }

      // 承認応答
      console.log('Send Accept Activity. target='+account['shared_inbox_url']);
      return subscriptionMessage.sendActivity(
        account['shared_inbox_url'], activity.accept(client.body));
    })
    .then(function(account) {
      // 処理終了
      done();
      // 
      return Promise.resolve(account);
    })
    .catch(function(err) {
      console.log(err);
      done(err);
    });
};
