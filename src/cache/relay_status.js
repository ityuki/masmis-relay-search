var redis = require('redis');

var config = require('../settings');

const relay_status_redis_prefix = "relay_status:"

var clientOption = {
  socket:{
    port: config.redis.port,
    host: config.redis.host
  },
  database: config.redis.db
}
if (config.redis.password){
  clientOption.password = config.redis.password
}

// callback(client)
async function run_redis(callback)
{
  var ret = null;
  var client = redis.createClient(clientOption)
  client.on('error', (err) => console.log('Redis Client Error', err));
  await client.connect();
  try{
    ret = await callback(client)
  }catch(e){
    await client.disconnect();
    throw e
  }
  await client.disconnect();
  return ret;
}

function getKeyName(id){ return relay_status_redis_prefix + ":status:" + id }
function getAllKeysPattern(){ return relay_status_redis_prefix + ":status:*" }

function get_return_obj(redis_data){
  return {
    updated_at: redis_data.updated_at ? new Date(parseInt(redis_data.updated_at)) : new Date(0),
    last_status: (!redis_data.count || redis_data.count == 0) ? true : false,
    count: redis_data.count ? 0 + parseInt(redis_data.count) : 0
  }
}

module.exports = {
  getStatus : async function(id){
    return await run_redis(async (client)=>{
      var r = await client.hGetAll(getKeyName(id));
      return get_return_obj(r);
    })
  },
  getAllStatus : async function(){
    return await run_redis(async (client)=>{
      var allkeys = await client.keys(getAllKeysPattern());
      var r = {}
      for (var keyname of allkeys){
        var id = keyname.split(":").pop();
        r[parseInt(id)] = get_return_obj(await client.hGetAll(keyname));
      }
      return r;
    })
  },
  setErrorStatus : async function(id){
    return await run_redis(async (client)=>{
      var r = await client.multi()
      .hSet(getKeyName(id),"updated_at",(new Date()).getTime())
      .HINCRBY(getKeyName(id),"count",1)
      .hGetAll(getKeyName(id))
      .exec();
      return get_return_obj(r[2]);
    })
  },
  resetErrorStatus : async function(id){
    return await run_redis(async (client)=>{
      var r = await client.multi()
      .hSet(getKeyName(id),"updated_at",(new Date()).getTime())
      .hSet(getKeyName(id),"count",0)
      .hGetAll(getKeyName(id))
      .exec();
      return get_return_obj(r[2]);
    })
  }
}

