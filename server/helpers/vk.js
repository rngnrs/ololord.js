'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _http = require('q-io/http');

var _http2 = _interopRequireDefault(_http);

var _tools = require('../helpers/tools');

var Tools = _interopRequireWildcard(_tools);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

var VK_API_CALL_TIMEOUT = Tools.MINUTE;

exports.default = function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(method, params) {
    var response, data;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (method) {
              _context.next = 2;
              break;
            }

            return _context.abrupt('return', Promise.reject(new Error(Tools.translate('Invalid VK API method'))));

          case 2:
            params = params || {};
            params.access_token = (0, Tools.default)('site.vkontakte.accessToken');
            params = (0, _underscore2.default)(params).map(function (value, key) {
              if (!(0, _underscore2.default)(value).isArray()) {
                value = [value];
              }
              return value.map(function (v) {
                return key + '=' + value;
              }).join('&');
            }).join('&');
            _context.next = 7;
            return _http2.default.request({
              url: 'https://api.vk.com/method/' + method + '?' + params,
              method: 'POST',
              timeout: VK_API_CALL_TIMEOUT
            });

          case 7:
            response = _context.sent;

            if (!(200 !== response.status)) {
              _context.next = 10;
              break;
            }

            return _context.abrupt('return', Promise.reject(new Error(Tools.translate('Failed to call VK API method'))));

          case 10:
            _context.next = 12;
            return response.body.read();

          case 12:
            data = _context.sent;
            _context.prev = 13;
            return _context.abrupt('return', Promise.resolve(JSON.parse(data.toString())));

          case 17:
            _context.prev = 17;
            _context.t0 = _context['catch'](13);
            return _context.abrupt('return', Promise.reject(_context.t0));

          case 20:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[13, 17]]);
  }));

  return function (_x, _x2) {
    return ref.apply(this, arguments);
  };
}();
//# sourceMappingURL=vk.js.map
