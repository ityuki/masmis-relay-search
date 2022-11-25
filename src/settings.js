var Url = require('url');

var relayUrl = Url.parse((process.env.RELAY_URL) ? process.env.RELAY_URL : "https://127.0.0.1:3000");

module.exports = {

  // relay server setting
  relay: {
    url: relayUrl.href.substring(0, relayUrl.href.length-1),
    actor: relayUrl.href+'actor',
    keyId: relayUrl.href+'actor#main-key',
    account: 'acct:relay@'+relayUrl.host,
    privateKey: (process.env.PRIVATE_KEY) ? process.env.PRIVATE_KEY : "not private key.",
    publicKey: (process.env.PUBLIC_KEY) ? process.env.PUBLIC_KEY : "not public key."
  },
  // redis
  redis: {
    host: (process.env.REDIS_HOST) ? process.env.REDIS_HOST : "127.0.0.1",
    port: (process.env.REDIS_PORT) ? Number(process.env.REDIS_PORT) : 6379,
    password: ''
  },

  // database
  database: {
    client: 'pg',
    connection: {
      host:     (process.env.DB_HOST) ? process.env.DB_HOST : "127.0.0.1",
      port:     (process.env.DB_PORT) ? Number(process.env.DB_PORT) : 5432,
      database: (process.env.DB_NAME) ? process.env.DB_NAME : "postgres",
      user:     (process.env.DB_USER) ? process.env.DB_USER : "postgres",
      password: (process.env.DB_PASS) ? process.env.DB_PASS : "postgres"
    },
    pool: {
      min: 10,
      max: 50
    },
    migrations: {
      directory:'./migrations',
      tableName: 'knex_migrations'
    }
  },
  // process queue
  queue: {
    pool:{
      follow: (process.env.QUEUE_POOL_FOLLOW) ? Number(process.env.QUEUE_POOL_FOLLOW): 1,
      unfollow: (process.env.QUEUE_POOL_UNFOLLOW) ? Number(process.env.QUEUE_POOL_UNFOLLOW): 1,
      undo: (process.env.QUEUE_POOL_UNDO) ? Number(process.env.QUEUE_POOL_UNDO): 1,
      forward: (process.env.QUEUE_POOL_FORWARD) ? Number(process.env.QUEUE_POOL_FORWARD): 5,
      remoteFollow: (process.env.QUEUE_POOL_REMOTE_FOLLOW) ? Number(process.env.QUEUE_POOL_REMOTE_FOLLOW): 1,
      remoteUnFollow: (process.env.QUEUE_POOL_REMOTE_UNFOLLOW) ? Number(process.env.QUEUE_POOL_REMOTE_UNFOLLOW): 1
    }
  }

};
