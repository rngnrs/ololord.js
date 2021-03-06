import _ from 'underscore';
import FS from 'q-io/fs';

import * as PostsModel from './posts';
import * as ThreadsModel from './threads';
import Board from '../boards/board';
import config from '../helpers/config';
import FSWatcher from '../helpers/fs-watcher';
import * as IPC from '../helpers/ipc';
import * as Permissions from '../helpers/permissions';
import * as Tools from '../helpers/tools';
import Channel from '../storage/channel';
import Hash from '../storage/hash';
import Key from '../storage/key';
import redisClient from '../storage/redis-client-factory';
import UnorderedSet from '../storage/unordered-set';

let BanExpiredChannel = new Channel(redisClient('BAN_EXPIRED'), `__keyevent@${config('system.redis.db')}__:expired`, {
  parse: false,
  stringify: false
});
let BannedUserIPs = new UnorderedSet(redisClient(), 'bannedUserIps', {
  parse: false,
  stringify: false
});
let RegisteredUserHashes = new Hash(redisClient(), 'registeredUserHashes', {
  parse: false,
  stringify: false
});
let RegisteredUserIPs = new UnorderedSet(redisClient(), 'registeredUserIps', {
  parse: false,
  stringify: false
});
let RegisteredUserLevels = new Hash(redisClient(), 'registeredUserLevels', {
  parse: false,
  stringify: false
});
let SuperuserHashes = new UnorderedSet(redisClient(), 'superuserHashes', {
  parse: false,
  stringify: false
});
let SynchronizationData = new Key(redisClient(), 'synchronizationData');
let UserBanPostNumbers = new Hash(redisClient(), 'userBanPostNumbers', {
  parse: number => +number,
  stringify: number => number.toString()
});
let UserBans = new Key(redisClient(), 'userBans');
let UserCaptchaQuotas = new Hash(redisClient(), 'captchaQuotas', {
  parse: quota => +quota,
  stringify: quota => quota.toString()
});
let UserPostNumbers = new UnorderedSet(redisClient(), 'userPostNumbers', {
  parse: number => +number,
  stringify: number => number.toString()
});

function transformIPBans(bans) {
  return _(bans).reduce((acc, ban, ip) => {
    ip = Tools.correctAddress(ip);
    if (ip) {
      acc[ip] = ban;
    }
    return acc;
  }, {});
}

let ipBans = FSWatcher.createWatchedResource(`${__dirname}/../../misc/user-bans.json`, (path) => {
  return transformIPBans(require(path));
}, async function(path) {
  let data = await FS.read(path);
  ipBans = transformIPBans(JSON.parse(data));
}) || {};

function transformGeoBans(bans) {
  return _(bans).reduce((acc, value, key) => {
    if (typeof value === 'string') {
      value = [value];
    }
    if (_(value).isArray()) {
      value = new Set(value.map(ip => Tools.correctAddress(ip)).filter(ip => !!ip));
    } else {
      value = !!value;
    }
    acc.set(key.toUpperCase(), value);
    return acc;
  }, new Map());
}

let geoBans = FSWatcher.createWatchedResource(`${__dirname}/../../misc/geo-bans.json`, (path) => {
  return transformGeoBans(require(path));
}, async function(path) {
  let data = await FS.read(path);
  geoBans = transformGeoBans(JSON.parse(data));
}) || new Map();

export async function getUserCaptchaQuota(boardName, userID) {
  let board = Board.board(boardName);
  if (!board) {
    return Promise.reject(new Error(Tools.translate('Invalid board')));
  }
  let quota = await UserCaptchaQuotas.getOne(userID);
  quota = Tools.option(quota, 'number', 0, { test: (q) => { return q >= 0; } });
  if (quota <= 0) {
    quota = await UserCaptchaQuotas.getOne(`${boardName}:${userID}`);
  }
  return Tools.option(quota, 'number', 0, { test: (q) => { return q >= 0; } });
}

export async function setUserCaptchaQuota(boardName, userID, quota) {
  quota = Tools.option(quota, 'number', 0, { test: (q) => { return q >= 0; } });
  return await UserCaptchaQuotas.setOne(`${boardName}:${userID}`, quota);
}

export async function useCaptcha(boardName, userID) {
  let board = Board.board(boardName);
  if (!board) {
    return Promise.reject(new Error(Tools.translate('Invalid board')));
  }
  if (board.captchaQuota < 1) {
    return 0;
  }
  let key = userID;
  quota = await UserCaptchaQuotas.getOne(userID);
  quota = Tools.option(quota, 'number', 0, { test: (q) => { return q >= 0; } })
  if (quota <= 0) {
    key = `${boardName}:${userID}`;
  }
  let quota = await UserCaptchaQuotas.incrementBy(key, -1);
  if (+quota < 0) {
    return await UserCaptchaQuotas.setOne(key, 0);
  }
  return Tools.option(quota, 'number', 0, { test: (q) => { return q >= 0; } });
}

export async function getUserIP(boardName, postNumber) {
  let post = await PostsModel.getPost(boardName, postNumber);
  if (!post) {
    return Promise.reject(new Error(Tools.translate('No such post')));
  }
  return post.user.ip;
}

export async function getBannedUserBans(ip, boardNames) {
  ip = Tools.correctAddress(ip);
  if (!boardNames) {
    boardNames = Board.boardNames();
  } else if (!_(boardNames).isArray()) {
    boardNames = [boardNames];
  }
  let bans = await Tools.series(boardNames, async function(boardName) {
    return await UserBans.get(`${ip}:${boardName}`);
  }, {});
  return _(bans).pick(ban => !!ban);
}

export async function getBannedUsers(boardNames) {
  let ips = await BannedUserIPs.getAll();
  return await Tools.series(ips, async function(ip) {
    return await getBannedUserBans(ip, boardNames);
  }, {});
}

export async function getRegisteredUserLevel(hashpass, boardName) {
  if (!hashpass || !Tools.mayBeHashpass(hashpass)) {
    return Promise.reject(new Error(Tools.translate('Invalid hashpass')));
  }
  if (!Board.board(boardName)) {
    return Promise.reject(new Error(Tools.translate('Invalid board')));
  }
  let exists = await SuperuserHashes.contains(hashpass);
  if (exists) {
    return 'SUPERUSER';
  }
  let level = await RegisteredUserLevels.getOne(boardName, hashpass);
  return level || null;
}

export async function getRegisteredUserLevelByIp(ip, boardName) {
  ip = Tools.correctAddress(ip);
  if (!ip) {
    return Promise.reject(new Error(Tools.translate('Invalid IP address')));
  }
  let hashpass = await RegisteredUserHashes.getOne(ip);
  if (!hashpass) {
    return null;
  }
  return await getRegisteredUserLevel(hashpass, boardName);
}

export async function getRegisteredUserLevels(hashpass) {
  if (!hashpass || !Tools.mayBeHashpass(hashpass)) {
    return {};
  }
  let exists = await SuperuserHashes.contains(hashpass);
  if (exists) {
    return Board.boardNames().reduce((acc, boardName) => {
      acc[boardName] = 'SUPERUSER';
      return acc;
    }, {});
  }
  let levels = await RegisteredUserLevels.getAll(hashpass);
  return levels || {};
}

export async function getRegisteredUserLevelsByIp(ip) {
  ip = Tools.correctAddress(ip);
  if (!ip) {
    return {};
  }
  let hashpass = await RegisteredUserHashes.getOne(ip);
  if (!hashpass) {
    return {};
  }
  return await getRegisteredUserLevels(hashpass);
}

export async function getRegisteredUser(hashpass) {
  let user = { hashpass: hashpass };
  let levels = await RegisteredUserLevels.getAll(hashpass);
  if (_(levels).isEmpty()) {
    return Promise.reject(new Error(Tools.translate('No user with this hashpass')));
  }
  user.levels = levels;
  let ips = await RegisteredUserIPs.getAll(hashpass);
  user.ips = ips || [];
  return user;
}

export async function getRegisteredUsers() {
  let keys = await RegisteredUserLevels.find();
  return await Tools.series(keys.map((key) => {
    return key.split(':')[1];
  }), async function(hashpass) {
    return await getRegisteredUser(hashpass);
  }, true);
}

async function processUserIPs(ips) {
  if (_(ips).isArray()) {
    ips = ips.map(ip => Tools.correctAddress(ip));
    if (ips.some(ip => !ip)) {
      return Promise.reject(new Error(Tools.translate('Invalid IP address')));
    }
  }
  return ips;
}

async function processRegisteredUserData(levels, ips) {
  if (_(levels).isEmpty()) {
    return Promise.reject(new Error(Tools.translate('Access level is not specified for any board')));
  }
  if (Object.keys(levels).some(boardName => !Board.board(boardName))) {
    return Promise.reject(new Error(Tools.translate('Invalid board')));
  }
  let invalidLevel = _(levels).some((level) => {
    return (Tools.compareRegisteredUserLevels(level, 'USER') < 0)
      || (Tools.compareRegisteredUserLevels(level, 'SUPERUSER') >= 0);
  });
  if (invalidLevel) {
    return Promise.reject(new Error(Tools.translate('Invalid access level')));
  }
  return await processUserIPs(ips);
}

async function addUserIPs(hashpass, ips) {
  //TODO: May be optimised (hmset)
  await Tools.series(ips, async function(ip) {
    await RegisteredUserHashes.setOne(ip, hashpass);
    await RegisteredUserIPs.addOne(ip, hashpass);
  });
}

async function removeUserIPs(hashpass) {
  let ips = await RegisteredUserIPs.getAll(hashpass);
  if (ips && ips.length > 0) {
    await RegisteredUserHashes.deleteSome(ips);
  }
  await RegisteredUserIPs.delete(hashpass);
}

export async function registerUser(hashpass, levels, ips) {
  ips = await processRegisteredUserData(levels, ips);
  let existingUserLevel = await RegisteredUserLevels.exists(hashpass);
  if (existingUserLevel) {
    return Promise.reject(new Error(Tools.translate('A user with this hashpass is already registered')));
  }
  let existingSuperuserHash = await SuperuserHashes.contains(hashpass);
  if (existingSuperuserHash) {
    return Promise.reject(new Error(Tools.translate('A user with this hashpass is already registered as superuser')));
  }
  await RegisteredUserLevels.setSome(levels, hashpass);
  if (_(ips).isArray()) {
    await addUserIPs(hashpass, ips);
  }
}

export async function updateRegisteredUser(hashpass, levels, ips) {
  ips = await processRegisteredUserData(levels, ips);
  let existingUserLevel = await RegisteredUserLevels.exists(hashpass);
  if (!existingUserLevel) {
    return Promise.reject(new Error(Tools.translate('No user with this hashpass')));
  }
  await RegisteredUserLevels.setSome(levels, hashpass);
  await removeUserIPs(hashpass);
  if (_(ips).isArray()) {
    await addUserIPs(hashpass, ips);
  }
}

export async function unregisterUser(hashpass) {
  let count = await RegisteredUserLevels.delete(hashpass);
  if (count <= 0) {
    return Promise.reject(new Error(Tools.translate('No user with this hashpass')));
  }
  await removeUserIPs(hashpass);
}

export async function addSuperuser(hashpass, ips) {
  if (!hashpass) {
    return Promise.reject(new Error(Tools.translate('Invalid hashpass')));
  }
  ips = await processUserIPs(ips);
  let existingUserLevel = await RegisteredUserLevels.exists(hashpass);
  if (existingUserLevel) {
    return Promise.reject(new Error(Tools.translate('A user with this hashpass is already registered')));
  }
  let count = await SuperuserHashes.addOne(hashpass);
  if (count <= 0) {
    return Promise.reject(new Error(Tools.translate('A user with this hashpass is already registered')));
  }
  if (_(ips).isArray()) {
    await addUserIPs(hashpass, ips);
  }
}

export async function removeSuperuser(password, notHashpass) {
  if (!hashpass) {
    return Promise.reject(new Error(Tools.translate('Invalid hashpass')));
  }
  let count = await SuperuserHashes.deleteOne(hashpass);
  if (count <= 0) {
    return Promise.reject(new Error(Tools.translate('No user with this hashpass')));
  }
  await removeUserIPs();
}

export async function getSynchronizationData(key) {
  return await SynchronizationData.get(key);
}

export async function setSynchronizationData(key, data) {
  await SynchronizationData.set(data, key);
  await SynchronizationData.expire(config('server.synchronizationData.ttl'), key);
}

export async function getUserPostNumbers(ip, boardName) {
  ip = Tools.correctAddress(ip) || '*';
  boardName = boardName || '*';
  return await UserPostNumbers.find(`${ip}:${boardName}`);
}

export async function addUserPostNumber(ip, boardName, postNumber) {
  ip = Tools.correctAddress(ip);
  await UserPostNumbers.addOne(postNumber, `${ip}:${boardName}`);
}

export async function removeUserPostNumber(ip, boardName, postNumber) {
  ip = Tools.correctAddress(ip);
  await UserPostNumbers.deleteOne(postNumber, `${ip}:${boardName}`);
}

function checkGeoBan(geolocationInfo, ip) {
  let def = geoBans.get('*');
  if (def) {
    geolocationInfo = geolocationInfo || {};
  } else if (!geolocationInfo || !geolocationInfo.countryCode) {
    return;
  }
  let countryCode = geolocationInfo.countryCode;
  if (typeof countryCode !== 'string') {
    countryCode = '';
  }
  let user = geoBans.get(countryCode.toUpperCase());
  if (ip && ((typeof user === 'object' && user.has(ip)) || (typeof def === 'object' && def.has(ip)))) {
    return;
  }
  if (typeof user === 'boolean' && !user) {
    return;
  }
  if (!user && !def) {
    return;
  }
  return Promise.reject(new Error(Tools.translate('Posting is disabled for this country')));
}

export async function checkUserBan(ip, boardNames, { write, geolocationInfo } = {}) {
  ip = Tools.correctAddress(ip);
  let ban = ipBans[ip];
  if (ban && (write || 'NO_ACCESS' === ban.level)) {
    return Promise.reject({ ban: ban });
  }
  if (boardNames) {
    let bans = await getBannedUserBans(ip, boardNames);
    ban = _(bans).find((ban) => { return ban && (write || 'NO_ACCESS' === ban.level); });
    if (ban) {
      return Promise.reject({ ban: ban });
    }
  }
  if (geolocationInfo) {
    return checkGeoBan(geolocationInfo, ip);
  }
}

export async function checkUserPermissions(req, boardName, postNumber, permission, password) {
  let board = Board.board(boardName);
  if (!board) {
    return Promise.reject(new Error(Tools.translate('Invalid board')));
  }
  let post = await PostsModel.getPost(boardName, postNumber);
  if (!post) {
    return Promise.reject(new Error(Tools.translate('Not such post: $[1]', '', `/${boardName}/${postNumber}`)));
  }
  let { user, threadNumber } = post;
  if (req.isSuperuser()) {
    return;
  }
  if (Tools.compareRegisteredUserLevels(req.level(boardName), Permissions[permission]()) >= 0) {
    if (Tools.compareRegisteredUserLevels(req.level(boardName), 'USER') > 0
      && Tools.compareRegisteredUserLevels(req.level(boardName), user.level) > 0) {
      return;
    }
    if (req.hashpass && req.hashpass === user.hashpass) {
      return;
    }
    if (password && password === user.password) {
      return;
    }
  }
  if (!board.opModeration) {
    return Promise.reject(new Error(Tools.translate('Not enough rights')));
  }
  let thread = await ThreadsModel.getThread(boardName, threadNumber);
  if (!thread) {
    return Promise.reject(new Error(Tools.translate('Not such thread: $[1]', '', `/${boardName}/${threadNumber}`)));
  }
  if (thread.user.ip !== req.ip && (!req.hashpass || req.hashpass !== thread.user.hashpass)) {
    return Promise.reject(new Error(Tools.translate('Not enough rights')));
  }
  if (Tools.compareRegisteredUserLevels(req.level(boardName), user.level) >= 0) {
    return;
  }
  if (req.hashpass && req.hashpass === user.hashpass) {
    return;
  }
  if (password && password === user.password) {
    return;
  }
  return Promise.reject(new Error(Tools.translate('Not enough rights')));
}

export async function updatePostBanInfo(boardName, postNumber) {
  if (!Board.board(boardName)) {
    return Promise.reject(new Error(Tools.translate('Invalid board')));
  }
  postNumber = Tools.option(postNumber, 'number', 0, { test: Tools.testPostNumber });
  if (!postNumber) {
    return;
  }
  let post = await PostsModel.getPost(boardName, postNumber);
  if (!post) {
    return;
  }
  await IPC.render(boardName, post.threadNumber, postNumber, 'edit');
}

export async function banUser(ip, newBans) {
  ip = Tools.correctAddress(ip);
  if (!ip) {
    return Promise.reject(new Error(Tools.translate('Invalid IP address')));
  }
  let oldBans = await getBannedUserBans(ip);
  await Tools.series(Board.boardNames(), async function(boardName) {
    let key = `${ip}:${boardName}`;
    let ban = newBans[boardName];
    if (ban) {
      await UserBans.set(ban, key);
      if (ban.expiresAt) {
        await UserBans.expire(Math.ceil((+ban.expiresAt - +Tools.now()) / 1000), key);
      }
      if (ban.postNumber) {
        await UserBanPostNumbers.setOne(key, ban.postNumber);
        await updatePostBanInfo(boardName, ban.postNumber);
      }
    } else {
      ban = oldBans[boardName];
      if (!ban) {
        return;
      }
      await UserBans.delete(key);
      if (ban.postNumber) {
        UserBanPostNumbers.deleteOne(ban.postNumber, key);
        await updatePostBanInfo(boardName, ban.postNumber);
      }
    }
  });
  await BannedUserIPs[_(newBans).isEmpty() ? 'deleteOne' : 'addOne'](ip);
}

async function updateBanOnMessage(message) {
  try {
    let ip = Tools.correctAddress(message.split(':').slice(1, -1).join(':'));
    if (!ip) {
      throw new Error(Tools.translate('Invalid IP address'));
    }
    let boardName = message.split(':').pop();
    if (!Board.board(boardName)) {
      throw new Error(Tools.translate('Invalid board'));
    }
    let postNumber = await UserBanPostNumbers.getOne(message);
    postNumber = Tools.option(postNumber, 'number', 0, { test: Tools.testPostNumber });
    if (!postNumber) {
      throw new Error(Tools.translate('Invalid post number'));
    }
    await UserBanPostNumbers.deleteOne(message);
    let keys = await UserBans.find(`${ip}:*`);
    if (!keys || keys.length <= 0) {
      await BannedUserIPs.deleteOne(ip);
    }
    await updatePostBanInfo(boardName, postNumber);
  } catch (err) {
    Logger.error(err.stack || err);
  }
}

export async function initializeUserBansMonitoring() {
  //NOTE: Enabling "key expired" notifications
  await redisClient().config('SET', 'notify-keyspace-events', 'Ex');
  await BanExpiresChannel.subscribe(updateBanOnMessage);
}
