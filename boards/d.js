var Board = require("./board");
var controller = require("../helpers/controller");
var Tools = require("../helpers/tools");

var board = new Board("d", Tools.translate.noop("Board /d/iscussion", "boardTitle"));

board.postExtraData = function(req, fields, files) {
    return req.headers["user-agent"] || null;
};

board.customPostBodyPart = function(n, _) {
    if (20 != n)
        return;
    return function(it, thread, post) {
        if (!post.extraData)
            return "";
        var model = {
            userAgent: post.extraData,
            post: post
        };
        return controller.sync(it.req, "dPostBodyPart", model);
    };
};

module.exports = board;
