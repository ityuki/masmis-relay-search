var Queue = require('bull');

// 設定をロード
var config = require('./settings');

var redis_config = {redis: config.redis }

// 各キューを生成
var follow = new Queue('follow', redis_config);
var unfollow = new Queue('unfollow', redis_config);
var undo = new Queue('undo', redis_config);
var forward = new Queue('forward', redis_config);
var remoteFollow = new Queue('remoteFollow', redis_config);
var remoteUnFollow = new Queue('remoteUnFollow', redis_config);

// プロセス設定
follow.process(require('./queues/follow'));
/*
unfollow.process(require('./queues/unfollow));
undo.process(require('./queues/undo'));
forward.process(config.queue.pool, require('./queues/forward'));
remoteFollow.process(require('./queues/remote_follow'));
remoteUnFollow.process(require('./queues/remote_unfollow'));
*/

//
module.exports = {
  // フォローキュー
  followQueue: follow,
  // アンフォローキュー
  unfollowQueue: unfollow,
  // アンドゥーキュー
  undoQueue: undo,
  // フォーワードキュー
  forwardQueue: forward,

  // リモートフォローキュー
  remoteFollowQueue: remoteFollow,
  // リモートアンフォローキュー
  remoteUnFollowQueue: remoteUnFollow
};

