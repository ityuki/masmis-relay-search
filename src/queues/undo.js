var Activity = require('../activitypub/activity');
var SubscriptionMessage = require('../activitypub/subscription_message');
var Signature = require('../utils/signature');

var accountCache = require('../cache/account');

var config = require('../settings');

const jobOptions = {
  removeOnComplete: true
}

//
//
module.exports = function(job, done) {

  //
  var subscriptionMessage = new SubscriptionMessage(config.relay.actor, config.relay.privateKey);
  var activity = new Activity(config.relay);
  
  // Signatation Params
  var client = job.data.client;
  var signParams = Signature.parseSignParams(client);

  console.log('start undo queue process. keyId='+signParams['keyId']);

  //
  accountCache(signParams['keyId'],'relay')
    .then(function(account) {
      
      // Signatureの正当性チェック
      if (!Signature.verifyRequest(account['public_key'], client)) {
        console.log('Invalid signature. keyId='+signParams['keyId']);
  
         // 拒否応答せず無視
         // subscriptionMessage.sendActivity(
         //  account['shared_inbox_url'], activity.reject(signParams['keyId'], client.body));

         throw new Error('Invalid signature. keyId='+signParams['keyId']);
      }

      // 宛先切り分け
      var Worker = require('../worker')

      var body = Activity.parse(client.body)
      if (body.object && body.object.type && body.object.type == "Follow"){
        // unfollowと判断
        console.log("undo check.. unfollow")
        Worker.unfollowQueue.add({
          client: client
        },jobOptions);
      }else{
        // relay対象と判断
        console.log("undo check.. other")
        // 怖いので今のところ何もしない
      }
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
