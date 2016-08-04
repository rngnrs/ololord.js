import _ from 'underscore';
import Redis from 'ioredis';

import config from '../helpers/config';

let client = null;

function createOptions() {
  return {
    host: config('system.redis.host'),
    port: config('system.redis.port'),
    family: config('system.redis.family'),
    password: config('system.redis.password'),
    db: config('system.redis.db')
  }
  };

export default function(force) {
  let redisNodes = config('system.redis.nodes');
  if (client && !force) {
    return client;
  }
  if (_.isArray(redisNodes) && redisNodes.length > 0) {
    var c = new Redis.Cluster(redisNodes, {
      clusterRetryStrategy: config('system.redis.clusterRetryStrategy', (times) => {
          return Math.min(100 + times * 2, 2000);
      }),
      enableReadyCheck: config('system.redis.enableReadyCheck'),
      scaleReads: config('system.redis.scaleReads'),
      maxRedirections: config('system.redis.maxRedirections'),
      retryDelayOnFailover: config('system.redis.retryDelayOnFailover'),
      retryDelayOnClusterDown: config('system.redis.retryDelayOnClusterDown'),
      retryDelayOnTryAgain: config('system.redis.retryDelayOnTryAgain'),
      redisOptions: createOptions()
    });
  } else {
    var c = new Redis(createOptions());
  }
  if (!client) {
    client = c;
  }
  return c;
}
