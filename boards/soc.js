var merge = require("merge");
var Util = require("util");
var uuid = require("uuid");

var Board = require("./board");
var controller = require("../helpers/controller");
var Database = require("../helpers/database");
var Tools = require("../helpers/tools");

var board = new Board("soc", Tools.translate.noop("Social life", "boardTitle"),
    { defaultUserName: Tools.translate.noop("Life of the party", "defaultUserName") });

board.actionRoutes = function() {
    var _this = this;
    return [{
        method: "post",
        path: "/like",
        handler: function(req, res) {
            var c = {};
            Tools.parseForm(req).then(function(result) {
                c.postNumber = +result.fields.postNumber;
                c.fields = result.fields;
                return Board.prototype.loadExtraData.call(_this, c.postNumber);
            }).then(function(extraData) {
                c.extraData = extraData || {
                    likes: [],
                    dislikes: []
                };
                var ind = c.extraData.likes.indexOf(req.ip);
                if (ind >= 0) {
                    c.extraData.likes.splice(ind, 1);
                } else {
                    ind = c.extraData.dislikes.indexOf(req.ip);
                    if (ind >= 0)
                        c.extraData.dislikes.splice(ind, 1);
                    c.extraData.likes.push(req.ip);
                }
                return Board.prototype.storeExtraData.call(_this, c.postNumber, c.extraData);
            }).then(function() {
                res.send({});
            }).catch(function(err) {
                controller.error(req, res, err, req.settings.mode.name != "ascetic");
            });
        }
    },
    {
        method: "post",
        path: "/dislike",
        handler: function(req, res) {
            var c = {};
            Tools.parseForm(req).then(function(result) {
                c.postNumber = +result.fields.postNumber;
                c.fields = result.fields;
                return Board.prototype.loadExtraData.call(_this, c.postNumber);
            }).then(function(extraData) {
                c.extraData = extraData || {
                    likes: [],
                    dislikes: []
                };
                var ind = c.extraData.dislikes.indexOf(req.ip);
                if (ind >= 0) {
                    c.extraData.dislikes.splice(ind, 1);
                } else {
                    ind = c.extraData.likes.indexOf(req.ip);
                    if (ind >= 0)
                        c.extraData.likes.splice(ind, 1);
                    c.extraData.dislikes.push(req.ip);
                }
                return Board.prototype.storeExtraData.call(_this, c.postNumber, c.extraData);
            }).then(function() {
                res.send({});
            }).catch(function(err) {
                controller.error(req, res, err, req.settings.mode.name != "ascetic");
            });
        }
    }];
};

board.extraScripts = function() {
    return [ { fileName: "soc.js" } ];
};

board.addTranslations = function(translate) {
    translate("Like", "likeText");
    translate("Dislike", "dislikeText");
};

board.renderPost = function(post, req) {
    return Board.prototype.renderPost.apply(this, arguments).then(function(post) {
        if (!post.extraData) {
            post.extraData = {
                likes: [],
                dislikes: []
            };
        }
        if (post.extraData.likes) {
            if (post.extraData.likes.indexOf(req.ip) >= 0)
                post.extraData.liked = true;
            post.extraData.likeCount = post.extraData.likes.length;
            delete post.extraData.likes;
        }
        if (post.extraData.dislikes) {
            if (post.extraData.dislikes.indexOf(req.ip) >= 0)
                post.extraData.disliked = true;
            post.extraData.dislikeCount = post.extraData.dislikes.length;
            delete post.extraData.dislikes;
        }
        return Promise.resolve(post);
    });
};

board.customPostHeaderPart = function(n, _) {
    if (120 != n)
        return;
    return function(it, thread, post) {
        var model = merge.clone(post.extraData || {
            likes: [],
            dislikes: [],
            likeCount: 0,
            dislikeCount: 0
        });
        model.post = post;
        return controller.sync(it.req, "socPostHeaderPart", model);
    };
};

module.exports = board;