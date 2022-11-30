// /inbox

var Activity = require('../activitypub/activity');

var Worker = require('../worker')


module.exports = function(req, res, next){
  // ヘッダーの検証
  if (!req.headers['content-type'] || req.headers['content-type'] != "application/activity+json") {
    var error = new Error('Invalid Request: Not Allowed Content-Type.');
    error.status = 400;
    return next(error);
  }
  if (!req.headers['signature']) {
    var error = new Error('Invalid Request: Not found Signature header.');
    error.status = 400;
    return next(error);
  }
  if (!req.headers['digest']) {
    var error = new Error('Invalid Request: Not found Digest header.');
    error.status = 400;
    return next(error);
  }
  
  // Activity
  var activity = Activity.parse(req.rawBody);

  if (!activity || !activity.type){
    var error = new Error('Invalid Request: Not found type');
    error.status = 400;
    return next(error);
  }

  // リクエスト種別に応じて処理を分岐
  switch(activity.type) {
    case "Follow":
      console.log('queuing follow request. [actor:'+activity.actor+']');

      // キューに格納
      Worker.followQueue.add({
        client: {
          method: req.method,
          path: req.path,
          headers: req.headers,
          body: req.rawBody
        }
      });
      break;

    case "Undo":
      console.log('queuing unfollow request. [actor:'+activity.actor+']');

      // ここで良いのか……？
      // // キューに格納
      Worker.unfollowQueue.add({
        client: {
          method: req.method,
          path: req.path,
          headers: req.headers,
          body: req.rawBody
        }
      });

      break;
    
    case "Create":
    case "Update":
    case "Delete":
    case "Announce":
    case "Move":
      console.log('queuing forward request. [actor:'+activity.actor+']');

      /*
      // // キューに格納
      Worker.forwardQueue.add({
        client: {
          method: req.method,
          path: req.path,
          headers: req.headers,
          body: req.rawBody
        }
      });
      */
      break;
    
    case "Accept":
      break;

    default:

      var error = new Error('Invalid Request Type.');
      error.status = 400;
      return next(error);
  }
}
