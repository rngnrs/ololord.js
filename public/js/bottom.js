/*ololord global object*/

var lord = lord || {};

/*Variables*/

lord.models = {};
lord.partials = {};
lord.templates = {};

/**/

(function() {
    var xhr = new XMLHttpRequest();
    xhr.open("get", "/" + lord.data("sitePathPrefix", lord.queryOne("head")) + "misc/base.json", false);
    xhr.send(null);
    if (xhr.status === 200)
        lord.id("model-base").innerHTML = "<![CDATA[" + xhr.responseText + "]]>";
    ["base", "boards", "tr", "partials", "templates"].forEach(function(modelName) {
        var html = lord.id("model-" + modelName).innerHTML;
        lord.models[modelName] = JSON.parse(html.substr(9, html.length - 12)); //NOTE: Removing CDATA wrapper
    });
    lord.model("partials").forEach(function(partialName) {
        var html = lord.id("partial-" + partialName).innerHTML;
        lord.partials[partialName] = html.substr(9, html.length - 12); //NOTE: Removing CDATA wrapper
    });
    lord.model("templates").forEach(function(templateName) {
        var html = lord.id("template-" + templateName).innerHTML;
        lord.templates[templateName] = doT.template(html.substr(9, html.length - 12), { //NOTE: Removing CDATA wrapper
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
        }, lord.partials);
    });
    var settings = lord.settings();
    lord.createStylesheetLink(settings.style.name + ".css", true);
    var defaultStylesheet = lord.id("defaultStylesheet");
    defaultStylesheet.parentNode.removeChild(defaultStylesheet);
    lord.createStylesheetLink("3rdparty/highlight.js/" + settings.codeStyle.name + ".css", true);
})();
