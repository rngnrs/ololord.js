/*ololord global object*/

var lord = lord || {};

/*Classes*/

/*constructor*/ lord.AutoUpdateTimer = function(intervalSeconds, showCountdown) {
    this.intervalSeconds = intervalSeconds;
    this.showCountdown = showCountdown;
    this.updateTimer = null;
    this.countdownTimer = null;
    this.secondsLeft = 0;
};

/*private*/ lord.AutoUpdateTimer.prototype.createCountdownTimer = function() {
    this.secondsLeft = this.intervalSeconds;
    this.countdownTimer = setInterval((function() {
        this.secondsLeft -= 1;
        if (this.secondsLeft <= 0)
            this.secondsLeft = this.intervalSeconds;
        var _this = this;
        ["Top", "Bottom"].forEach(function(position) {
            $("#autoUpdate" + position).trigger("configure", { max: _this.intervalSeconds });
            $("#autoUpdate" + position).val(_this.intervalSeconds).trigger("change");
        });
        this.update();
    }).bind(this), lord.Second);
};

/*private*/ lord.AutoUpdateTimer.prototype.update = function() {
    if (this.secondsLeft <= 0)
        return;
    var _this = this;
    ["Top", "Bottom"].forEach(function(position) {
        $("#autoUpdate" + position).val(_this.secondsLeft).trigger("change");
    });
};

/*public*/ lord.AutoUpdateTimer.prototype.start = function() {
    if (this.updateTimer)
        return;
    this.updateTimer = setInterval((function() {
        var boardName = lord.data("boardName");
        var threadNumber = +lord.data("threadNumber");
        lord.updateThread(true);
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.createCountdownTimer();
        }
        this.update();
    }).bind(this), this.intervalSeconds * lord.Second);
    if (this.showCountdown)
        this.createCountdownTimer();
    this.update();
};

/*public*/ lord.AutoUpdateTimer.prototype.stop = function() {
    if (!this.updateTimer)
        return;
    clearInterval(this.updateTimer);
    this.updateTimer = null;
    if (this.countdownTimer) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        /*["Top", "Bottom"].forEach(function(position) {
            $("#autoUpdate" + position).trigger("configure", { max: 10 });
            $("#autoUpdate" + position).val(5).trigger("change");
        });*/
    }
    this.secondsLeft = 0;
    this.update();
};

/*Variables*/

lord.autoUpdateTimer = null;
lord.blinkTimer = null;
lord.pageVisible = "visible";
lord.loadingImage = null;

/*Functions*/

lord.addVisibilityChangeListener = function(callback) {
    if ("hidden" in document)
        document.addEventListener("visibilitychange", callback);
    else if ((hidden = "mozHidden") in document)
        document.addEventListener("mozvisibilitychange", callback);
    else if ((hidden = "webkitHidden") in document)
        document.addEventListener("webkitvisibilitychange", callback);
    else if ((hidden = "msHidden") in document)
        document.addEventListener("msvisibilitychange", callback);
    else if ("onfocusin" in document) //IE 9 and lower
        document.onfocusin = document.onfocusout = callback;
    else //All others
        window.onpageshow = window.onpagehide = window.onfocus = window.onblur = callback;
    if (document["hidden"] !== undefined) {
        callback({
            "type": document["hidden"] ? "blur" : "focus"
        });
    }
};

lord.visibilityChangeListener = function(e) {
    var v = "visible";
    var h = "hidden";
    var eMap = {
        "focus": v,
        "focusin": v,
        "pageshow": v,
        "blur": h,
        "focusout": h,
        "pagehide": h
    };
    e = e || window.event;
    if (e.type in eMap)
        lord.pageVisible = eMap[e.type];
    else
        lord.pageVisible = this["hidden"] ? "hidden" : "visible";
    if ("hidden" == lord.pageVisible)
        return;
    if (!lord.blinkTimer)
        return;
    clearInterval(lord.blinkTimer);
    lord.blinkTimer = null;
    var link = lord.id("favicon");
    var finame = link.href.split("/").pop();
    if ("favicon.ico" != finame)
        link.href = link.href.replace("img/favicon_newmessage.ico", "favicon.ico");
    if (document.title.substring(0, 2) == "* ")
        document.title = document.title.substring(2);
};

lord.blinkFaviconNewMessage = function() {
    var link = lord.id("favicon");
    var finame = link.href.split("/").pop();
    if ("favicon.ico" == finame)
        link.href = link.href.replace("favicon.ico", "img/favicon_newmessage.ico");
    else
        link.href = link.href.replace("img/favicon_newmessage.ico", "favicon.ico");
};

lord.updateThread = function(silent) {
    var boardName = lord.data("boardName");
    var threadNumber = +lord.data("threadNumber");
    var posts = lord.query(".opPost:not(.temporary), .post:not(.temporary)");
    if (!posts)
        return;
    var lastPost = posts[posts.length - 1];
    var lastPostNumber = +lord.data("number", lastPost);
    var popup;
    var c = {};
    var query = "boardName=" + boardName + "&threadNumber=" + threadNumber + "&lastPostNumber=" + lastPostNumber;
    return lord.getModel("misc/tr").then(function(model) {
        c.tr = model.tr;
        if (!silent) {
            var span = lord.node("span");
            if (!lord.loadingImage) {
                lord.loadingImage = lord.node("img");
                lord.loadingImage.src = "/" + lord.data("sitePathPrefix") + "img/loading.gif";
            }
            span.appendChild(lord.loadingImage.cloneNode(true));
            span.appendChild(lord.node("text", " " + c.tr.loadingPostsText));
            popup = lord.showPopup(span, {
                type: "node",
                classNames: "noNewPostsPopup",
                timeout: lord.Billion
            });
        }
        return lord.getModel("api/lastPosts", query);
    }).then(function(posts) {
        if (lord.checkError(posts))
            return Promise.reject(posts);
        if (popup) {
            var txt = (posts.length >= 1) ? c.tr.newPostsText : c.tr.noNewPostsText;
            if (posts.length >= 1)
                txt += " " + posts.length;
            popup.resetText(txt, {classNames: "noNewPostsPopup"});
            popup.resetTimeout();
        }
        if (posts.length < 1)
            return;
        c.sequenceNumber = posts[posts.length - 1].sequenceNumber;
        var promises = posts.map(function(post) {
            return lord.createPostNode(post, true);
        });
        return Promise.all(promises);
    }).then(function(posts) {
        if (!posts)
            return;
        var before = lord.id("afterAllPosts");
        posts.forEach(function(post) {
            if (lord.id(post.id))
                return;
            document.body.insertBefore(post, before);
        });
        return lord.getModel("misc/board/" + boardName);
    }).then(function(model) {
        if (!model)
            return;
        var board = model.board;
        var bumpLimitReached = c.sequenceNumber >= board.bumpLimit;
        var postLimitReached = c.sequenceNumber >= board.postLimit;
        if (postLimitReached) {
            var pl = lord.nameOne("insteadOfPostLimitReached");
            if (pl) {
                var div = lord.node("div");
                div.className = "theMessage";
                var h2 = lord.node("h2");
                h2.className = "postLimitReached";
                h2.appendChild(lord.node("text", c.tr.postLimitReachedText));
                div.appendChild(h2);
                pl.parentNode.replaceChild(div, pl);
            }
            var bl = lord.nameOne("insteadOfBumpLimitReached");
            if (bl)
                bl.parentNode.removeChild(bl);
            bl = lord.nameOne("bumpLimitReached");
            if (bl)
                bl.parentNode.removeChild(bl);
            lord.query(".createAction").forEach(function(act) {
                act.parentNode.removeChild(act);
            });
        }
        if (!postLimitReached && bumpLimitReached) {
            var bl = lord.nameOne("insteadOfBumpLimitReached");
            if (bl) {
                var div = lord.node("div");
                div.className = "theMessage";
                div.setAttribute("name", "bumpLimitReached");
                var h3 = lord.node("h3");
                h3.className = "bumpLimitReached";
                h3.appendChild(lord.node("text", c.tr.bumpLimitReachedText));
                div.appendChild(h3);
                bl.parentNode.replaceChild(div, bl);
            }
        }
        if ("hidden" == lord.pageVisible) {
            if (!lord.blinkTimer) {
                lord.blinkTimer = setInterval(lord.blinkFaviconNewMessage, 500);
                document.title = "* " + document.title;
            }
            if (lord.notificationsEnabled()) {
                var subject = lord.queryOne(".theTitle > h1").textContent;
                var title = "[" + subject + "] " + c.tr.newPostsText + " " + res.length;
                var sitePathPrefix = lord.data("sitePathPrefix");
                var icon = "/" + sitePathPrefix + "favicon.ico";
                var p = res[0];
                if (p.files && p.files.length > 0)
                    icon = "/" + sitePathPrefix + boardName + "/" + p.files[0].thumbName;
                lord.showNotification(title, p.rawPostText.substr(0, 300), icon);
            }
        }
    }).catch(function(err) {
        if (popup)
            popup.hide();
        lord.handleError(err);
    });
};

lord.setAutoUpdateEnabled = function(enabled) {
    if (enabled) {
        var intervalSeconds = lord.getLocalObject("autoUpdateInterval", 15);
        var showCountdown = lord.getLocalObject("showAutoUpdateTimer", true);
        lord.autoUpdateTimer = new lord.AutoUpdateTimer(intervalSeconds, showCountdown);
        lord.autoUpdateTimer.start();
    } else if (lord.autoUpdateTimer) {
        lord.autoUpdateTimer.stop();
        lord.autoUpdateTimer = null;
    }
    var list = lord.getLocalObject("autoUpdate", {});
    var threadNumber = +lord.data("threadNumber");
    list[threadNumber] = enabled;
    lord.setLocalObject("autoUpdate", list);
};

lord.downloadThread = function() {
    var as = lord.query(".postFile > .postFileFile > a");
    if (!as || as.length < 1)
        return;
    var cancel = false;
    var zip = new JSZip();
    var progressBar = new lord.OverlayProgressBar({
        max: as.length,
        cancelCallback: function() {
            cancel = true;
        },
        finishCallback: function() {
            progressBar.hide();
            saveAs(zip.generate({ "type": "blob" }), document.title + ".zip");
        }
    });
    var last = 0;
    var append = function(i) {
        if (cancel) {
            progressBar.hide();
            return;
        }
        var a = as[i];
        JSZipUtils.getBinaryContent(a.href, function (err, data) {
            if (!err) {
                zip.file(a.href.split("/").pop(), data, {
                    "binary": true
                });
            }
            progressBar.progress(progressBar.value + 1);
            if (last < as.length - 1)
                append(++last);
        });
    };
    progressBar.show();
    append(last);
    if (as.length > 1)
        append(++last);
};

lord.initializeOnLoadThread = function() {
    ["Top", "Bottom"].forEach(function(position) {
        $("#autoUpdate" + position).knob({
            readOnly: true,
            thickness: 0.5,
            displayInput: false,
            max: 1,
            height: 22,
            width: 22
        });
        $("#autoUpdate" + position).val(1).trigger("change");
        var parent = $("#autoUpdate" + position).parent();
        parent.addClass("buttonImage");
        var canvas = parent.find("canvas");
        canvas.click(function(e) {
            var list = lord.getLocalObject("autoUpdate", {});
            var threadNumber = +lord.data("threadNumber");
            var enabled = !list[threadNumber];
            list[threadNumber] = enabled;
            lord.setLocalObject("autoUpdate", list);
            lord.setAutoUpdateEnabled(enabled);
        });
        canvas.css({ marginBottom: -5 });
        lord.getModel("misc/tr").then(function(model) {
            parent.attr("title", model.tr.autoUpdateText);
        }).catch(lord.handleError);
    });
    lord.addVisibilityChangeListener(lord.visibilityChangeListener);
    var enabled = lord.getLocalObject("autoUpdate", {})[+lord.data("threadNumber")];
    if (true === enabled || (false !== enabled && lord.getLocalObject("autoUpdateThreadsByDefault", false)))
        lord.setAutoUpdateEnabled(true);
    var hash = lord.hash();
    if (hash.substring(0, 1) === "i") {
        hash = hash.substring(1);
        if (isNaN(+hash))
            return;
        lord.showHidePostForm("Top");
        lord.insertPostNumber(hash);
    }
};

window.addEventListener("load", function load() {
    window.removeEventListener("load", load, false);
    lord.initializeOnLoadThread();
}, false);
