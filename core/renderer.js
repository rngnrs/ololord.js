'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.reloadTemplates = exports.compileTemplates = exports.generateCustomCSSFiles = exports.generateCustomJavaScriptFile = exports.generateTemplatingJavaScriptFile = exports.rerender = undefined;

var rerender = exports.rerender = function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(what, not) {
    var routers;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return Tools.series(_controllers2.default.routers, function () {
              var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(router) {
                var paths;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        if (!(typeof router.paths !== 'function' || typeof router.render !== 'function')) {
                          _context.next = 2;
                          break;
                        }

                        return _context.abrupt('return');

                      case 2:
                        _context.next = 4;
                        return router.paths();

                      case 4:
                        paths = _context.sent;

                        paths = paths.filter(function (path) {
                          if (!what) {
                            return !not;
                          } else if (typeof what === 'string') {
                            return not ? path !== what : path === what;
                          } else if (what instanceof RegExp) {
                            return not ? !what.test(path) : what.test(path);
                          }
                        });

                        if (!(paths.length <= 0)) {
                          _context.next = 8;
                          break;
                        }

                        return _context.abrupt('return');

                      case 8:
                        return _context.abrupt('return', {
                          router: router,
                          paths: paths
                        });

                      case 9:
                      case 'end':
                        return _context.stop();
                    }
                  }
                }, _callee, this);
              }));

              return function (_x3) {
                return ref.apply(this, arguments);
              };
            }(), true);

          case 2:
            routers = _context4.sent;
            _context4.next = 5;
            return Tools.series(routers.filter(function (router) {
              return !!router;
            }), function () {
              var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(router) {
                var result;
                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                  while (1) {
                    switch (_context3.prev = _context3.next) {
                      case 0:
                        _context3.next = 2;
                        return router.router.render(router.paths);

                      case 2:
                        result = _context3.sent;
                        _context3.next = 5;
                        return Tools.series(result, function () {
                          var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(data, id) {
                            return regeneratorRuntime.wrap(function _callee2$(_context2) {
                              while (1) {
                                switch (_context2.prev = _context2.next) {
                                  case 0:
                                    _context2.next = 2;
                                    return Cache.writeFile(id, data);

                                  case 2:
                                    return _context2.abrupt('return', _context2.sent);

                                  case 3:
                                  case 'end':
                                    return _context2.stop();
                                }
                              }
                            }, _callee2, this);
                          }));

                          return function (_x5, _x6) {
                            return ref.apply(this, arguments);
                          };
                        }());

                      case 5:
                        return _context3.abrupt('return', _context3.sent);

                      case 6:
                      case 'end':
                        return _context3.stop();
                    }
                  }
                }, _callee3, this);
              }));

              return function (_x4) {
                return ref.apply(this, arguments);
              };
            }());

          case 5:
            return _context4.abrupt('return', _context4.sent);

          case 6:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function rerender(_x, _x2) {
    return ref.apply(this, arguments);
  };
}();

var generateTemplatingJavaScriptFile = exports.generateTemplatingJavaScriptFile = function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee5() {
    var models, fileNames, templateNames, template, string, stream;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            console.log('Generating templating JavaScript file...');
            models = JSON.stringify({
              base: MiscModel.base(),
              boards: MiscModel.boards(),
              notFoundImageFileNames: MiscModel.notFoundImageFileNames(),
              tr: MiscModel.translations()
            });
            _context5.next = 4;
            return _fs2.default.listTree(TEMPLATES_PATH, function (_, stat) {
              return stat.isFile();
            });

          case 4:
            fileNames = _context5.sent;
            templateNames = fileNames.filter(function (fileName) {
              return fileName.split('.').pop() === 'js' && 'index.js' !== fileName;
            }).map(function (fileName) {
              return fileName.substr(__dirname.length + 1);
            });
            _context5.next = 8;
            return _fs2.default.read(TEMPLATES_INDEX_PATH + '.template');

          case 8:
            template = _context5.sent;
            _context5.next = 11;
            return _fs2.default.write(TEMPLATES_INDEX_PATH, template.replace('{{models}}', models));

          case 11:
            string = '';
            stream = (0, _browserify2.default)({
              entries: TEMPLATES_INDEX_PATH,
              debug: false
            });

            templateNames.forEach(function (lib) {
              return stream.require('./views/' + lib);
            });
            stream = stream.bundle();
            stream.on('data', function (data) {
              string += data;
            });
            _context5.next = 18;
            return new Promise(function (resolve, reject) {
              stream.on('end', resolve);
              stream.on('error', reject);
            });

          case 18:
            string = string.split(APP_PATH).join('.');
            _context5.next = 21;
            return _fs2.default.write(__dirname + '/../public/js/templating.js', string);

          case 21:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));

  return function generateTemplatingJavaScriptFile() {
    return ref.apply(this, arguments);
  };
}();

var generateCustomJavaScriptFile = exports.generateCustomJavaScriptFile = function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee6() {
    var exists;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            console.log('Checking custom JavaScript file existence...');
            _context6.next = 3;
            return _fs2.default.exists(__dirname + '/../public/js/custom.js');

          case 3:
            exists = _context6.sent;

            if (exists) {
              _context6.next = 9;
              break;
            }

            console.log('Creating dummy custom JavaScript file...');
            _context6.next = 8;
            return Cache.writeFile('js/custom.js', '');

          case 8:
            return _context6.abrupt('return', _context6.sent);

          case 9:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  return function generateCustomJavaScriptFile() {
    return ref.apply(this, arguments);
  };
}();

var generateCustomCSSFiles = exports.generateCustomCSSFiles = function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee9() {
    var list, types;
    return regeneratorRuntime.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            console.log('Checking custom CSS files existence...');
            _context9.next = 3;
            return Tools.series(['combined', 'desktop', 'mobile'], function () {
              var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee7(type) {
                var exists;
                return regeneratorRuntime.wrap(function _callee7$(_context7) {
                  while (1) {
                    switch (_context7.prev = _context7.next) {
                      case 0:
                        _context7.next = 2;
                        return _fs2.default.exists(__dirname + '/../public/css/custom-base-' + type + '.css');

                      case 2:
                        exists = _context7.sent;
                        return _context7.abrupt('return', {
                          type: type,
                          exists: exists
                        });

                      case 4:
                      case 'end':
                        return _context7.stop();
                    }
                  }
                }, _callee7, this);
              }));

              return function (_x7) {
                return ref.apply(this, arguments);
              };
            }(), true);

          case 3:
            list = _context9.sent;
            types = list.filter(function (item) {
              return !item.exists;
            }).map(function (item) {
              return item.type;
            });

            if (!(types.length > 0)) {
              _context9.next = 9;
              break;
            }

            console.log('Creating dummy custom CSS file(s)...');
            _context9.next = 9;
            return Tools.series(types, function () {
              var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee8(type) {
                return regeneratorRuntime.wrap(function _callee8$(_context8) {
                  while (1) {
                    switch (_context8.prev = _context8.next) {
                      case 0:
                        _context8.next = 2;
                        return Cache.writeFile('css/custom-base-' + type + '.css', '');

                      case 2:
                      case 'end':
                        return _context8.stop();
                    }
                  }
                }, _callee8, this);
              }));

              return function (_x8) {
                return ref.apply(this, arguments);
              };
            }());

          case 9:
          case 'end':
            return _context9.stop();
        }
      }
    }, _callee9, this);
  }));

  return function generateCustomCSSFiles() {
    return ref.apply(this, arguments);
  };
}();

var compileTemplates = exports.compileTemplates = function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee13() {
    var list, fileNames, includes;
    return regeneratorRuntime.wrap(function _callee13$(_context13) {
      while (1) {
        switch (_context13.prev = _context13.next) {
          case 0:
            console.log('Compiling templates...');
            _context13.next = 3;
            return _fs2.default.list(TEMPLATES_PATH);

          case 3:
            list = _context13.sent;
            _context13.next = 6;
            return Tools.series(list.filter(function (entry) {
              return !EXCLUDED_SOURCE_TEMPLATE_FILES.has(entry);
            }), function () {
              var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee10(entry) {
                return regeneratorRuntime.wrap(function _callee10$(_context10) {
                  while (1) {
                    switch (_context10.prev = _context10.next) {
                      case 0:
                        _context10.next = 2;
                        return _fs2.default.removeTree(TEMPLATES_PATH + '/' + entry);

                      case 2:
                        return _context10.abrupt('return', _context10.sent);

                      case 3:
                      case 'end':
                        return _context10.stop();
                    }
                  }
                }, _callee10, this);
              }));

              return function (_x9) {
                return ref.apply(this, arguments);
              };
            }());

          case 6:
            _context13.next = 8;
            return _fs2.default.listTree(TEMPLATES_SOURCE_PATH, function (_, stat) {
              return stat.isFile();
            });

          case 8:
            fileNames = _context13.sent;

            fileNames = fileNames.map(function (fileName) {
              return fileName.substr(__dirname.length + 6);
            });
            _context13.next = 12;
            return Tools.series(fileNames, function () {
              var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee11(fileName) {
                var content;
                return regeneratorRuntime.wrap(function _callee11$(_context11) {
                  while (1) {
                    switch (_context11.prev = _context11.next) {
                      case 0:
                        if (/\.def(\.dot|\.jst)?$/.test(fileName)) {
                          _context11.next = 2;
                          break;
                        }

                        return _context11.abrupt('return');

                      case 2:
                        _context11.next = 4;
                        return _fs2.default.read(TEMPLATES_SOURCE_PATH + '/' + fileName);

                      case 4:
                        content = _context11.sent;
                        return _context11.abrupt('return', {
                          name: fileName.split('.').slice(0, -1).join('.'),
                          content: content
                        });

                      case 6:
                      case 'end':
                        return _context11.stop();
                    }
                  }
                }, _callee11, this);
              }));

              return function (_x10) {
                return ref.apply(this, arguments);
              };
            }(), true);

          case 12:
            includes = _context13.sent;

            includes = includes.filter(function (item) {
              return !!item;
            }).reduce(function (acc, item) {
              acc[item.name] = item.content;
              return acc;
            }, {});
            _context13.next = 16;
            return Tools.series(fileNames, function () {
              var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee12(fileName) {
                var compiled, string, moduleName;
                return regeneratorRuntime.wrap(function _callee12$(_context12) {
                  while (1) {
                    switch (_context12.prev = _context12.next) {
                      case 0:
                        if (/\.jst(\.dot|\.def)?$/.test(fileName)) {
                          _context12.next = 2;
                          break;
                        }

                        return _context12.abrupt('return');

                      case 2:
                        compiled = '(function(){';
                        _context12.next = 5;
                        return _fs2.default.read(TEMPLATES_SOURCE_PATH + '/' + fileName);

                      case 5:
                        string = _context12.sent;
                        moduleName = fileName.split('.').shift().replace(ILLEGAL_CHARACTERS_REGEXP, '_');

                        compiled += _dot2.default.template(string, DOT_SETTINGS, includes).toString().replace('anonymous', moduleName);
                        compiled += 'var itself=' + moduleName + ', _encodeHTML=(' + ENCODE_HTML_SOURCE + '());';
                        compiled += 'module.exports=itself;})()';

                        if (!(fileName.split('/').length > 1)) {
                          _context12.next = 13;
                          break;
                        }

                        _context12.next = 13;
                        return _fs2.default.makeTree(TEMPLATES_PATH + '/' + fileName.split('/').slice(0, -1).join('/'));

                      case 13:
                        _context12.next = 15;
                        return _fs2.default.write(TEMPLATES_PATH + '/' + fileName.split('.').slice(0, -1).join('.') + '.js', compiled);

                      case 15:
                      case 'end':
                        return _context12.stop();
                    }
                  }
                }, _callee12, this);
              }));

              return function (_x11) {
                return ref.apply(this, arguments);
              };
            }());

          case 16:
          case 'end':
            return _context13.stop();
        }
      }
    }, _callee13, this);
  }));

  return function compileTemplates() {
    return ref.apply(this, arguments);
  };
}();

var reloadTemplates = exports.reloadTemplates = function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee14() {
    var fileNames;
    return regeneratorRuntime.wrap(function _callee14$(_context14) {
      while (1) {
        switch (_context14.prev = _context14.next) {
          case 0:
            _context14.prev = 0;
            _context14.next = 3;
            return _fs2.default.listTree(TEMPLATES_PATH, function (_1, stat) {
              return stat.isFile();
            });

          case 3:
            fileNames = _context14.sent;

            templates = fileNames.filter(function (fileName) {
              return fileName.split('.').pop() === 'js' && fileName.split('/').pop() !== 'index.js';
            }).map(function (fileName) {
              return fileName.substr(__dirname.length + 2).split('.').slice(0, -1).join('.');
            }).reduce(function (acc, templateName) {
              var id = '../views/' + templateName + '.js';
              if (require.cache.hasOwnProperty(id)) {
                delete require.cache[require.resolve(id)];
              }
              acc[templateName] = require(id);
              return acc;
            }, {});
            _context14.next = 10;
            break;

          case 7:
            _context14.prev = 7;
            _context14.t0 = _context14['catch'](0);

            _logger2.default.error(_context14.t0.stack || _context14.t0);

          case 10:
          case 'end':
            return _context14.stop();
        }
      }
    }, _callee14, this, [[0, 7]]);
  }));

  return function reloadTemplates() {
    return ref.apply(this, arguments);
  };
}();

exports.render = render;

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _browserify = require('browserify');

var _browserify2 = _interopRequireDefault(_browserify);

var _dot = require('dot');

var _dot2 = _interopRequireDefault(_dot);

var _fs = require('q-io/fs');

var _fs2 = _interopRequireDefault(_fs);

var _merge = require('merge');

var _merge2 = _interopRequireDefault(_merge);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _controllers = require('../controllers');

var _controllers2 = _interopRequireDefault(_controllers);

var _misc = require('../models/misc');

var MiscModel = _interopRequireWildcard(_misc);

var _cache = require('../helpers/cache');

var Cache = _interopRequireWildcard(_cache);

var _config = require('../helpers/config');

var _config2 = _interopRequireDefault(_config);

var _logger = require('../helpers/logger');

var _logger2 = _interopRequireDefault(_logger);

var _tools = require('../helpers/tools');

var Tools = _interopRequireWildcard(_tools);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

var TEMPLATES_SOURCE_PATH = __dirname + '/../src/views';
var TEMPLATES_PATH = __dirname + '/../views';
var TEMPLATES_INDEX_PATH = TEMPLATES_PATH + '/index.js';
var APP_PATH = __dirname.split('/').slice(0, -1).join('/');
var DOT_SETTINGS = {
  evaluate: /\{\{([\s\S]+?)\}\}/g,
  interpolate: /\{\{=([\s\S]+?)\}\}/g,
  encode: /\{\{!([\s\S]+?)\}\}/g,
  use: /\{\{#([\s\S]+?)\}\}/g,
  define: /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g,
  conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
  iterate: /\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
  varname: 'it',
  strip: false,
  append: true,
  selfcontained: false
};
var EXCLUDED_SOURCE_TEMPLATE_FILES = new Set(['index.js.template', '.gitignore']);
var ENCODE_HTML_SOURCE = _dot2.default.encodeHTMLSource.toString();
var ILLEGAL_CHARACTERS_REGEXP = /[^a-zA-Z\$_]/gi;

var templates = {};

function render(templateName, model) {
  var template = templates[templateName];
  if (!template) {
    _logger2.default.error(Tools.translate('Invalid template: $[1]', '', templateName));
    return '';
  }
  var baseModel = MiscModel.base();
  baseModel.templateName = templateName;
  var o = MiscModel.boards();
  baseModel.boards = o.boards;
  baseModel.boardGroups = o.boardGroups;
  baseModel.banner = (0, _underscore2.default)((0, _underscore2.default)(baseModel.boards.filter(function (board) {
    return board.bannerFileNames.length > 0;
  }).map(function (board) {
    return board.bannerFileNames.map(function (fileName) {
      return {
        boardName: board.name,
        boardTitle: board.title,
        fileName: fileName
      };
    });
  })).flatten()).sample();
  baseModel._ = _underscore2.default;
  baseModel.compareRegisteredUserLevels = Tools.compareRegisteredUserLevels;
  baseModel.isImageType = Tools.isImageType;
  baseModel.isAudioType = Tools.isAudioType;
  baseModel.isVideoType = Tools.isVideoType;
  baseModel.escaped = Tools.escaped;
  baseModel.escapedSelector = Tools.escapedSelector;
  baseModel.translate = Tools.translate;
  var timeOffset = (0, _config2.default)('site.timeOffset');
  var locale = (0, _config2.default)('site.locale');
  var format = (0, _config2.default)('site.dateFormat');
  baseModel.formattedDate = function (date) {
    return (0, _moment2.default)(date).utcOffset(timeOffset).locale(locale).format(format);
  };
  try {
    return template(_merge2.default.recursive(baseModel, model || {}));
  } catch (err) {
    _logger2.default.error(err.stack || err);
    return '';
  }
}
//# sourceMappingURL=renderer.js.map
