(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require("../window");
var port = (window.location.port.length === 0) ? "80" : window.location.port;
document.querySelector(".server-name").textContent = window.location.hostname + " on port " + port;
document.querySelector("form.login").addEventListener("submit", onFormSubmit);
var serverPasswordElt = document.querySelector(".server-password");
var usernameElt = document.querySelector(".username");
var supServerAuth = SupClient.cookies.getJSON("supServerAuth");
// NOTE: Superpowers used to store auth info in local storage
if (supServerAuth == null) {
    var supServerAuthJSON = localStorage.getItem("supServerAuth");
    if (supServerAuthJSON != null)
        supServerAuth = JSON.parse(supServerAuthJSON);
}
if (supServerAuth != null) {
    serverPasswordElt.value = supServerAuth.serverPassword;
    usernameElt.value = supServerAuth.username;
}
var redirect = SupClient.query.redirect;
if (redirect == null)
    redirect = "/";
function onFormSubmit(event) {
    event.preventDefault();
    SupClient.cookies.set("supServerAuth", { serverPassword: serverPasswordElt.value, username: usernameElt.value }, { expires: 7 });
    window.location.replace(redirect);
}

},{"../window":2}],2:[function(require,module,exports){
if (SupClient.isApp) {
    var nodeRequire = require;
    var remote = nodeRequire("remote");
    var win = remote.getCurrentWindow();
    function onMinimizeWindowClick() { win.minimize(); }
    function onMaximizeWindowClick() {
        var maximized = screen.availHeight <= win.getSize()[1];
        if (maximized)
            win.unmaximize();
        else
            win.maximize();
    }
    function onCloseWindowClick() { window.close(); }
    document.querySelector(".controls .minimize").addEventListener("click", onMinimizeWindowClick);
    document.querySelector(".controls .maximize").addEventListener("click", onMaximizeWindowClick);
    document.querySelector(".controls .close").addEventListener("click", onCloseWindowClick);
    var link = document.querySelector("a.superpowers");
    if (link != null)
        link.addEventListener("click", function (event) {
            event.preventDefault();
            var shell = nodeRequire("shell");
            shell.openExternal(event.target.href);
        });
}

},{}]},{},[1]);
