/// <reference path="../../../../typings/tsd.d.ts" />
/// <reference path="../../../../typings/github-electron/github-electron-renderer.d.ts" />
/// <reference path="../../SupRuntime/SupRuntime.d.ts" />
/// <reference path="../../../../SupCore/SupCore.d.ts" />
var async = require("async");
var querystring = require("querystring");
SupCore.system = new SupCore.System("");
// In app, open links in a browser window
var playerWindow;
if (window.process) {
    var nodeRequire = require;
    playerWindow = nodeRequire("remote").getCurrentWindow();
    document.body.addEventListener("click", function (event) {
        if (event.target.tagName !== "A")
            return;
        event.preventDefault();
        nodeRequire("shell").openExternal(event.target.href);
    });
}
var qs = querystring.parse(window.location.search.slice(1));
document.body.addEventListener("keydown", function (event) {
    if (event.keyCode === window["KeyEvent"].DOM_VK_F12) {
        if (qs.project != null && playerWindow != null)
            playerWindow.toggleDevTools();
    }
});
// Prevent keypress events from leaking out to a parent window
// They might trigger scrolling for instance
document.body.addEventListener("keypress", function (event) { event.preventDefault(); });
var progressBar = document.querySelector("progress");
var loadingElt = document.getElementById("loading");
var canvas = document.querySelector("canvas");
if (qs.debug != null && playerWindow != null)
    playerWindow.openDevTools();
var player;
var onLoadProgress = function (value, max) {
    progressBar.value = value;
    progressBar.max = max;
};
var onLoaded = function (err) {
    if (err != null) {
        console.error(err);
        var aElt = loadingElt.querySelector("a");
        aElt.parentElement.removeChild(aElt);
        var errorElt = document.createElement("div");
        errorElt.className = "error";
        errorElt.textContent = err.message;
        loadingElt.appendChild(errorElt);
        return;
    }
    setTimeout(function () {
        loadingElt.classList.remove("start");
        loadingElt.classList.add("end");
        setTimeout(function () {
            loadingElt.parentElement.removeChild(loadingElt);
            player.run();
            return;
        }, (qs.project == null) ? 500 : 0);
    }, (qs.project == null) ? 500 : 0);
};
// Load plugins
window.fetch("plugins.json").then(function (response) { return response.json(); }).then(function (pluginsInfo) {
    async.each(pluginsInfo.list, function (pluginName, pluginCallback) {
        async.series([
            function (cb) {
                var apiScript = document.createElement("script");
                apiScript.src = "plugins/" + pluginName + "/api.js";
                apiScript.addEventListener("load", function () { return cb(null, null); });
                apiScript.addEventListener("error", function (err) { return cb(null, null); });
                document.body.appendChild(apiScript);
            },
            function (cb) {
                var componentsScript = document.createElement("script");
                componentsScript.src = "plugins/" + pluginName + "/components.js";
                componentsScript.addEventListener("load", function () { return cb(null, null); });
                componentsScript.addEventListener("error", function () { return cb(null, null); });
                document.body.appendChild(componentsScript);
            },
            function (cb) {
                var runtimeScript = document.createElement("script");
                runtimeScript.src = "plugins/" + pluginName + "/runtime.js";
                runtimeScript.addEventListener("load", function () { return cb(null, null); });
                runtimeScript.addEventListener("error", function () { return cb(null, null); });
                document.body.appendChild(runtimeScript);
            }
        ], pluginCallback);
    }, function (err) {
        if (err != null)
            console.log(err);
        // Load game
        var buildPath = (qs.project != null) ? "/builds/" + qs.project + "/" + qs.build + "/" : "./";
        player = new SupRuntime.Player(canvas, buildPath, { debug: qs.debug != null });
        player.load(onLoadProgress, onLoaded);
    });
});
loadingElt.classList.add("start");
