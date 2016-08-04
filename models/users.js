'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getUserPostNumbers = exports.getSynchronizationData = exports.getRegisteredUsers = exports.getRegisteredUser = exports.getBannedUsers = exports.getBannedUserBans = exports.getUserIP = exports.getUserCaptchaQuota = undefined;

var getUserCaptchaQuota = exports.getUserCaptchaQuota = function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(boardName, userIp) {
    var board, quota;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            board = _board2.default.board(boardName);

            if (board) {
              _context.next = 3;
              break;
            }

            return _context.abrupt('return', Promise.reject(Tools.translate('Invalid board')));

          case 3:
            quota = UserCaptchaQuotas.getOne(boardName + ':' + userIp);
            return _context.abrupt('return', Tools.option(quota, 'number', 0, { test: function test(q) {
                return q >= 0;
              } }));

          case 5:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getUserCaptchaQuota(_x, _x2) {
    return ref.apply(this, arguments);
  };
}();

var getUserIP = exports.getUserIP = function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(boardName, postNumber) {
    var post;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return PostsModel.getPost(boardName, postNumber);

          case 2:
            post = _context2.sent;

            if (post) {
              _context2.next = 5;
              break;
            }

            return _context2.abrupt('return', Promise.reject(Tools.translate('No such post')));

          case 5:
            return _context2.abrupt('return', post.user.ip);

          case 6:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function getUserIP(_x3, _x4) {
    return ref.apply(this, arguments);
  };
}();

var getBannedUserBans = exports.getBannedUserBans = function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(ip, boardNames) {
    var bans;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            ip = Tools.correctAddress(ip);
            if (!boardNames) {
              boardNames = _board2.default.boardNames();
            } else if (!(0, _underscore2.default)(boardNames).isArray()) {
              boardNames = [boardNames];
            }
            _context4.next = 4;
            return Tools.series(boardNames, function () {
              var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(boardName) {
                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                  while (1) {
                    switch (_context3.prev = _context3.next) {
                      case 0:
                        _context3.next = 2;
                        return UserBans.get(ip + ':' + boardName);

                      case 2:
                        return _context3.abrupt('return', _context3.sent);

                      case 3:
                      case 'end':
                        return _context3.stop();
                    }
                  }
                }, _callee3, this);
              }));

              return function (_x7) {
                return ref.apply(this, arguments);
              };
            }(), {});

          case 4:
            bans = _context4.sent;
            return _context4.abrupt('return', (0, _underscore2.default)(bans).pick(function (ban) {
              return !!ban;
            }));

          case 6:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function getBannedUserBans(_x5, _x6) {
    return ref.apply(this, arguments);
  };
}();

var getBannedUsers = exports.getBannedUsers = function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(boardNames) {
    var ips;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.next = 2;
            return BannedUserIPs.getAll();

          case 2:
            ips = _context6.sent;
            _context6.next = 5;
            return Tools.series(ips, function () {
              var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(ip) {
                return regeneratorRuntime.wrap(function _callee5$(_context5) {
                  while (1) {
                    switch (_context5.prev = _context5.next) {
                      case 0:
                        _context5.next = 2;
                        return getBannedUserBans(ip, boardNames);

                      case 2:
                        return _context5.abrupt('return', _context5.sent);

                      case 3:
                      case 'end':
                        return _context5.stop();
                    }
                  }
                }, _callee5, this);
              }));

              return function (_x9) {
                return ref.apply(this, arguments);
              };
            }(), {});

          case 5:
            return _context6.abrupt('return', _context6.sent);

          case 6:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  return function getBannedUsers(_x8) {
    return ref.apply(this, arguments);
  };
}();

var getRegisteredUser = exports.getRegisteredUser = function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee7(hashpass) {
    var user, levels, ips;
    return regeneratorRuntime.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            user = { hashpass: hashpass };
            _context7.next = 3;
            return RegisteredUserLevels.getAll(hashpass);

          case 3:
            levels = _context7.sent;

            if (!(0, _underscore2.default)(levels).isEmpty()) {
              _context7.next = 6;
              break;
            }

            return _context7.abrupt('return', Promise.reject(Tools.translate('No user with this hashpass')));

          case 6:
            user.levels = levels;
            _context7.next = 9;
            return RegisteredUserIPs.getAll(hashpass);

          case 9:
            ips = _context7.sent;

            user.ips = ips || [];
            return _context7.abrupt('return', user);

          case 12:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, this);
  }));

  return function getRegisteredUser(_x10) {
    return ref.apply(this, arguments);
  };
}();

var getRegisteredUsers = exports.getRegisteredUsers = function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee9() {
    var keys;
    return regeneratorRuntime.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            _context9.next = 2;
            return RegisteredUserLevels.find();

          case 2:
            keys = _context9.sent;
            _context9.next = 5;
            return Tools.series(keys.map(function (key) {
              return key.split(':')[1];
            }), function () {
              var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee8(hashpass) {
                return regeneratorRuntime.wrap(function _callee8$(_context8) {
                  while (1) {
                    switch (_context8.prev = _context8.next) {
                      case 0:
                        _context8.next = 2;
                        return getRegisteredUser(hashpass);

                      case 2:
                        return _context8.abrupt('return', _context8.sent);

                      case 3:
                      case 'end':
                        return _context8.stop();
                    }
                  }
                }, _callee8, this);
              }));

              return function (_x11) {
                return ref.apply(this, arguments);
              };
            }(), true);

          case 5:
            return _context9.abrupt('return', _context9.sent);

          case 6:
          case 'end':
            return _context9.stop();
        }
      }
    }, _callee9, this);
  }));

  return function getRegisteredUsers() {
    return ref.apply(this, arguments);
  };
}();

var getSynchronizationData = exports.getSynchronizationData = function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee10(key) {
    return regeneratorRuntime.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            _context10.next = 2;
            return SynchronizationData.get(key);

          case 2:
            return _context10.abrupt('return', _context10.sent);

          case 3:
          case 'end':
            return _context10.stop();
        }
      }
    }, _callee10, this);
  }));

  return function getSynchronizationData(_x12) {
    return ref.apply(this, arguments);
  };
}();

var getUserPostNumbers = exports.getUserPostNumbers = function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee11(ip, boardName) {
    return regeneratorRuntime.wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            ip = Tools.correctAddress(ip) || '*';
            boardName = boardName || '*';
            _context11.next = 4;
            return UserPostNumbers.find(ip + ':' + boardName);

          case 4:
            return _context11.abrupt('return', _context11.sent);

          case 5:
          case 'end':
            return _context11.stop();
        }
      }
    }, _callee11, this);
  }));

  return function getUserPostNumbers(_x13, _x14) {
    return ref.apply(this, arguments);
  };
}();

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _posts = require('./posts');

var PostsModel = _interopRequireWildcard(_posts);

var _clientFactory = require('../storage/client-factory');

var _clientFactory2 = _interopRequireDefault(_clientFactory);

var _hash = require('../storage/hash');

var _hash2 = _interopRequireDefault(_hash);

var _key = require('../storage/key');

var _key2 = _interopRequireDefault(_key);

var _unorderedSet = require('../storage/unordered-set');

var _unorderedSet2 = _interopRequireDefault(_unorderedSet);

var _board = require('../boards/board');

var _board2 = _interopRequireDefault(_board);

var _tools = require('../helpers/tools');

var Tools = _interopRequireWildcard(_tools);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

var BannedUserIPs = new _unorderedSet2.default((0, _clientFactory2.default)(), 'bannedUserIps', {
  parse: false,
  stringify: false
});
var RegisteredUserIPs = new _unorderedSet2.default((0, _clientFactory2.default)(), 'registeredUserIps', {
  parse: false,
  stringify: false
});
var RegisteredUserLevels = new _hash2.default((0, _clientFactory2.default)(), 'registeredUserLevels', {
  parse: false,
  stringify: false
});
var SynchronizationData = new _key2.default((0, _clientFactory2.default)(), 'synchronizationData');
var UserBans = new _key2.default((0, _clientFactory2.default)(), 'userBans');
var UserCaptchaQuotas = new _hash2.default((0, _clientFactory2.default)(), 'captchaQuotas', {
  parse: function parse(quota) {
    return +quota;
  },
  stringify: function stringify(quota) {
    return quota.toString();
  }
});
var UserPostNumbers = new _key2.default((0, _clientFactory2.default)(), 'userPostNumbers', {
  parse: function parse(number) {
    return +number;
  },
  stringify: function stringify(number) {
    return number.toString();
  }
});
//# sourceMappingURL=users.js.map
