var Queue = require('bull');

// 設定をロード
var config = require('./settings');

var redis_config = {
  redis: config.redis,
  defaultJobOptions:{
    removeOnComplete: true
  }
}

// 各キューを生成
var follow = new Queue('follow', redis_config);
var unfollow = new Queue('unfollow', redis_config);
var undo = new Queue('undo', redis_config);
var forward = new Queue('forward', redis_config);
var noteChange = new Queue('noteChange', redis_config);
var remoteFollow = new Queue('remoteFollow', redis_config);
var remoteUnFollow = new Queue('remoteUnFollow', redis_config);

// プロセス設定
follow.process(config.queue.pool.follow, require('./queues/follow'));
unfollow.process(config.queue.pool.unfollow, require('./queues/unfollow'));
undo.process(config.queue.pool.undo, require('./queues/undo'));
forward.process(config.queue.pool.forward, require('./queues/forward'));
noteChange.process(config.queue.pool.noteChange, require('./queues/note_change'));
/*
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

  // DB検索追加キュー
  noteChangeQueue: noteChange,

  // リモートフォローキュー
  remoteFollowQueue: remoteFollow,
  // リモートアンフォローキュー
  remoteUnFollowQueue: remoteUnFollow
};

