var merge = require("merge");
var Util = require("util");
var uuid = require("uuid");

var Board = require("./board");
var controller = require("../helpers/controller");
var Database = require("../helpers/database");
var Tools = require("../helpers/tools");

board = new Board("rpg", Tools.translate.noop("Role-playing games", "boardTitle"));

board.routes = function() {
    return [{
        method: "get",
        path: "/openVoting.html",
        handler: function(req, res) {
            var model = {};
            model.title = Tools.translate("Open voting", "pageTitle");
            model.opened = true;
            model.postNumber = req.query.postNumber;
            model.showSubmitButton = true;
            model = merge.recursive(model, controller.boardModel("rpg"));
            controller(req, "openCloseVoting", model).then(function(data) {
                res.send(data);
            }).catch(function(err) {
                controller.error(req, res, err);
            });
        }
    },
    {
        method: "get",
        path: "/closeVoting.html",
        handler: function(req, res) {
            var model = {};
            model.title = Tools.translate("Close voting", "pageTitle");
            model.opened = false;
            model.postNumber = req.query.postNumber;
            model.showSubmitButton = true;
            model = merge.recursive(model, controller.boardModel("rpg"));
            controller(req, "openCloseVoting", model).then(function(data) {
                res.send(data);
            }).catch(function(err) {
                controller.error(req, res, err);
            });
        }
    }];
};

var contains = function(variants, id) {
    for (var i = 0; i < variants.length; ++i) {
        if (variants[i].id == id)
            return true;
    }
    return false;
};

board.actionRoutes = function() {
    return [{
        method: "post",
        path: "/vote",
        handler: function(req, res) {
            var c = {};
            Tools.parseForm(req).then(function(result) {
                c.postNumber = +result.fields.postNumber;
                c.fields = result.fields;
                return Board.prototype.loadExtraData.call(board, c.postNumber);
            }).then(function(extraData) {
                if (!extraData)
                    return Promise.reject("This post does not have voting");
                if (extraData.disabled)
                    return Promise.reject("This voting is disabled");
                c.extraData = extraData;
                return Database.db.sismember("voteUsers:" + c.postNumber, req.ip);
            }).then(function(isMember) {
                if (isMember)
                    return Promise.reject("You have already voted");
                var variants = [];
                if (c.extraData.multiple) {
                    var err = false;
                    Tools.forIn(c.fields, function(_, name) {
                        if (err)
                            return;
                        if (name.substr(0, 12) != "voteVariant_")
                            return;
                        var id = name.substr(12);
                        if (!contains(c.extraData.variants, id)) {
                            err = true;
                            return;
                        }
                        variants.push(id);
                    });
                    if (err)
                        return Promise.reject("Invalid variant");
                } else {
                    var id = c.fields.voteGroup;
                    if (!contains(c.extraData.variants, id))
                        return Promise.reject("Invalid variant");
                    variants.push(id);
                }
                if (variants.length < 1)
                    return Promise.reject("No variant selected");
                variants = variants.filter(function(id, index) {
                    return variants.indexOf(id) == index;
                });
                var promises = variants.map(function(id) {
                    return Database.db.sadd("voteVariantUsers:" + c.postNumber + ":" + id, req.ip);
                });
                return Promise.all(promises);
            }).then(function() {
                return Database.db.sadd("voteUsers:" + c.postNumber, req.ip);
            }).then(function() {
                res.send({});
            }).catch(function(err) {
                controller.error(req, res, err, req.settings.mode.name != "ascetic");
            });
        }
    },
    {
        method: "post",
        path: "/unvote",
        handler: function(req, res) {
            var c = {};
            Tools.parseForm(req).then(function(result) {
                c.postNumber = +result.fields.postNumber;
                c.fields = result.fields;
                return board.loadExtraData(c.postNumber);
            }).then(function(extraData) {
                if (!extraData)
                    return Promise.reject("This post does not have voting");
                if (extraData.disabled)
                    return Promise.reject("This voting is disabled");
                c.extraData = extraData;
                return Database.db.sismember("voteUsers:" + c.postNumber, req.ip);
            }).then(function(isMember) {
                if (!isMember)
                    return Promise.reject("You have not voted yet");
                var variants = [];
                c.extraData.variants.forEach(function(variant) {
                    if (!variant.users)
                        return;
                    if (variant.users.indexOf(req.ip) >= 0)
                        variants.push(variant.id);
                });
                if (variants.length < 1)
                    return Promise.reject("Internal error");
                var promises = variants.map(function(id) {
                    return Database.db.srem("voteVariantUsers:" + c.postNumber + ":" + id, req.ip);
                });
                return Promise.all(promises);
            }).then(function() {
                return Database.db.srem("voteUsers:" + c.postNumber, req.ip);
            }).then(function() {
                res.send({});
            }).catch(function(err) {
                controller.error(req, res, err, req.settings.mode.name != "ascetic");
            });
        }
    },
    {
        method: "post",
        path: "/setVotingOpened",
        handler: function(req, res) {
            var c = {};
            Tools.parseForm(req).then(function(result) {
                c.password = Tools.password(result.fields.password);
                c.opened = "true" == result.fields.opened;
                return Database.getPost("rpg", +result.fields.postNumber);
            }).then(function(post) {
                c.post = post;
                if ((!c.password || c.password != post.user.password)
                    && (!req.hashpass || req.hashpass != post.user.hashpass)
                    && (Database.compareRegisteredUserLevels(req.level, post.user.level) <= 0)) {
                    return Promise.reject("Not enough rights");
                }
                return Board.prototype.loadExtraData.call(board, post.number);
            }).then(function(extraData) {
                if (!extraData)
                    return Promise.reject("This post does not have voting");
                extraData.disabled = !c.opened;
                return Board.prototype.storeExtraData.call(board, c.post.number, extraData);
            }).then(function(result) {
                res.send({});
            }).catch(function(err) {
                controller.error(req, res, err, req.settings.mode.name != "ascetic");
            });
        }
    }];
};

board.extraScripts = function() {
    return [ { fileName: "rpg.js" } ];
};

board.addTranslations = function(translate) {
    translate("Voting is closed", "voteClosedText");
    translate("vote count:", "voteCountText");
    translate("Vote", "voteActionText");
    translate("Take vote back", "unvoteActionText");
    translate("Close voting", "closeVoteActionText");
    translate("Open voting", "openVoteActionText");
    translate("Vote:", "postFormLabelVote");
    translate("Text:", "voteTextText");
    translate("Multiple variants allowed:", "multipleVoteVariantsText");
    translate("Add variant", "addVoteVariantText");
};

var extraData = function(req, fields, edit) {
    var variants = [];
    Tools.forIn(fields, function(value, key) {
        if (key.substr(0, 12) != "voteVariant_")
            return;
        if (!value)
            return;
        var id = key.substr(12);
        variants.push({
            text: value,
            id: ((edit && id && isNaN(+id)) ? id : null)
        });
    });
    if (variants.length < 1)
        return Promise.resolve(null);
    var p;
    if (fields.thread) {
        p = Database.getPost(fields.board, +fields.thread);
    } else {
        p = Promise.resolve();
    }
    return p.then(function(opPost) {
        if (opPost && (req.ip != opPost.user.ip && (!req.hashpass || req.hashpass != opPost.user.hashpass)))
            return Promise.reject("Attempt to attach voting while not being the OP");
        if (!fields.voteText)
            return Promise.reject("No vote text provided");
        return Promise.resolve({
            variants: variants,
            multiple: ("true" == fields.multipleVoteVariants),
            text: fields.voteText
        });
    });
};

board.postExtraData = function(req, fields, files, oldPost) {
    var oldData = oldPost ? oldPost.extraData : null;
    var newData;
    return extraData(req, fields, oldPost).then(function(data) {
        newData = data;
        if (!newData)
            return Promise.resolve(null);
        if (!oldData)
            return Promise.resolve(newData);
        var variants = [];
        var ids = [];
        for (var i = 0; i < newData.variants.length; ++i) {
            var variant = newData.variants[i];
            var id = variant.id;
            if (id) {
                var exists = oldData.variants.reduce(function(exists, oldVariant) {
                    if (exists)
                        return exists;
                    if (oldVariant.id != variant.id)
                        return false;
                    oldVariant.text = variant.text;
                    return true;
                }, false);
                if (!exists)
                    return Promise.reject("Invalid vote ID");
            } else {
                id = uuid.v1();
                variants.push({
                    text: variant.text,
                    id: id
                });
            }
            ids.push(id);
        }
        variants = oldData.variants.concat(variants);
        for (var i = variants.length - 1; i >= 0; --i) {
            if (ids.indexOf(variants[i].id) < 0)
                variants.splice(i, 1);
        }
        if (variants.length < 1)
            return Promise.resolve(null);
        newData.variants = variants;
        newData.users = oldData.users;
        return Promise.resolve(newData);
    });
};

board.storeExtraData = function(postNumber, extraData) {
    if (Util.isNullOrUndefined(extraData))
        return Promise.resolve();
    var users = extraData.users;
    if (extraData.users)
        delete extraData.users;
    var variantUsers = {};
    Tools.forIn(extraData.variants, function(variant) {
        if (!variant.users)
            return;
        variantUsers[variant.id] = variant.users;
        delete variant.users;
    });
    return Board.prototype.storeExtraData.apply(board, arguments).then(function() {
        if (!users)
            return Promise.resolve();
        return Database.db.sadd("voteUsers:" + postNumber, users);
    }).then(function() {
        var promises = [];
        Tools.forIn(variantUsers, function(list, id) {
            if (!list || list.length < 1)
                return;
            promises.push(Database.db.sadd("voteVariantUsers:" + postNumber + ":" + id, list));
        });
        return Promise.all(promises);
    });
};

board.loadExtraData = function(postNumber) {
    var c = {};
    return Board.prototype.loadExtraData.apply(board, arguments).then(function(extraData) {
        c.extraData = extraData;
        return Database.db.smembers("voteUsers:" + postNumber);
    }).then(function(users) {
        if (c.extraData && users)
            c.extraData.users = users;
        var promises = [];
        Tools.forIn(c.extraData ? c.extraData.variants : {}, function(variant) {
            var key = "voteVariantUsers:" + postNumber + ":" + variant.id;
            promises.push(Database.db.smembers(key).then(function(list) {
                if (list)
                    variant.users = list;
                return Promise.resolve();
            }));
        });
        return Promise.all(promises);
    }).then(function() {
        return Promise.resolve(c.extraData);
    });
};

board.removeExtraData = function(postNumber) {
    var c = {};
    return Board.prototype.loadExtraData.apply(board, arguments).then(function(extraData) {
        c.extraData = extraData;
        return Database.db.del("voteUsers:" + postNumber);
    }).then(function() {
        var promises = [];
        Tools.forIn(c.extraData ? c.extraData.variants : {}, function(_, id) {
            promises.push(Database.db.del("voteVariantUsers:" + postNumber + ":" + id));
        });
        return Promise.all(promises);
    }).then(function() {
        return Board.prototype.removeExtraData.apply(board, arguments);
    });
};

board.renderPost = function(post, req) {
    return Board.prototype.renderPost.apply(board, arguments).then(function(post) {
        if (!post.extraData)
            return Promise.resolve(post);
        if (post.extraData.variants) {
            post.extraData.variants.forEach(function(variant) {
                if (!variant.users)
                    return;
                if (variant.users.indexOf(req.ip) >= 0)
                    variant.ownIp = true;
                variant.voteCount = variant.users.length;
                delete variant.users;
            });
        }
        if (post.extraData.users) {
            if (post.extraData.users.indexOf(req.ip) >= 0)
                post.extraData.voted = true;
            delete post.extraData.users;
        }
        return Promise.resolve(post);
    });
};

board.customPostBodyPart = function(n, _) {
    if (20 != n)
        return;
    return function(it, thread, post) {
        if (!post.extraData)
            return "";
        var model = merge.clone(post.extraData);
        model.post = post;
        return controller.sync(it.req, "rpgPostBodyPart", model);
    };
};

board.customPostFormField = function(n, req, thread) {
    if (50 != n)
        return;
    if (thread) {
        var user = thread.opPost.user;
        if (user.ip != req.ip && (!req.hashpass || user.hashpass != req.hashpass))
            return;
    }
    var _this = this;
    return function(it) {
        var model = {
            site: it.site,
            tr: merge.clone(it.tr),
            board: merge.clone(it.board),
            minimalisticPostform: it.minimalisticPostform
        };
        return controller.sync(it.req, "rpgPostFormField", model);
    };
};

board.customEditPostDialogPart = function(n, req) {
    if (50 != n)
        return;
    return function(it, thread, post) {
        var model = post.extraData ? merge.clone(post.extraData) : {};
        model.thread = thread;
        model.post = post;
        return controller.sync(it.req, "rpgEditPostDialogPart", model);
    };
};

module.exports = board;