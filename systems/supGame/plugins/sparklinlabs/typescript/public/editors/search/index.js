(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require("./ui");
require("./network");

},{"./network":2,"./ui":3}],2:[function(require,module,exports){
var ui_1 = require("./ui");
exports.data = {};
exports.socket = SupClient.connect(SupClient.query.project);
exports.socket.on("connect", onConnected);
exports.socket.on("disconnect", SupClient.onDisconnected);
function onConnected() {
    exports.data.assetsById = {};
    exports.data.projectClient = new SupClient.ProjectClient(exports.socket);
    exports.data.projectClient.subEntries(entriesSubscriber);
}
var entriesSubscriber = {
    onEntriesReceived: function (entries) {
        entries.walk(function (entry) {
            if (entry.type !== "script")
                return;
            exports.data.projectClient.subAsset(entry.id, "script", scriptSubscriber);
        });
    },
    onEntryAdded: function (newEntry, parentId, index) {
        if (newEntry.type !== "script")
            return;
        exports.data.projectClient.subAsset(newEntry.id, "script", scriptSubscriber);
    },
    onEntryMoved: function (id, parentId, index) {
        var entry = exports.data.projectClient.entries.byId[id];
        if (entry.type !== "script")
            return;
        var nameElt = document.querySelector("span[data-id='" + id + "']");
        if (nameElt != null) {
            var tableElt = document.querySelector("table[data-id='" + id + "']");
            var name_1 = exports.data.projectClient.entries.getPathFromId(id);
            nameElt.textContent = tableElt.children.length + " results in \"" + name_1 + ".ts\"";
        }
    },
    onSetEntryProperty: function (id, key, value) {
        var entry = exports.data.projectClient.entries.byId[id];
        if (entry.type !== "script" || key !== "name")
            return;
        var nameElt = document.querySelector("span[data-id='" + id + "']");
        if (nameElt != null) {
            var tableElt = document.querySelector("table[data-id='" + id + "']");
            var name_2 = exports.data.projectClient.entries.getPathFromId(id);
            nameElt.textContent = tableElt.children.length + " results in \"" + name_2 + ".ts\"";
        }
    },
    onEntryTrashed: function (id) {
        if (exports.data.assetsById[id] != null)
            delete exports.data.assetsById[id];
        var nameElt = document.querySelector("span[data-id='" + id + "']");
        var tableElt = document.querySelector("table[data-id='" + id + "']");
        if (nameElt != null)
            nameElt.parentElement.removeChild(nameElt);
        if (tableElt != null)
            tableElt.parentElement.removeChild(tableElt);
    },
};
var scriptSubscriber = {
    onAssetReceived: function (err, asset) {
        exports.data.assetsById[asset.id] = asset;
        ui_1.searchAsset(asset.id);
    },
    onAssetEdited: function (id, command) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        if (command === "editText")
            ui_1.searchAsset(id);
    },
    onAssetTrashed: function (id) { },
};

},{"./ui":3}],3:[function(require,module,exports){
var network_1 = require("./network");
SupClient.setupHotkeys();
var ui = {};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ui;
ui.resultsPane = document.querySelector(".results");
ui.searchInput = document.querySelector(".search input");
ui.searchInput.focus();
ui.searchInput.addEventListener("keydown", function (event) { if (event.keyCode === 13)
    search(); });
ui.matchCaseCheckbox = document.getElementById("match-case-checkbox");
document.querySelector(".search button").addEventListener("click", function (event) { search(); });
ui.statusSpan = document.querySelector(".search span");
// Handle request from another tab
ui.searchInput.value = SupClient.query["text"] != null ? SupClient.query["text"] : "";
search();
window.addEventListener("message", function (event) {
    if (event.data.type === "activate")
        ui.searchInput.focus();
    if (event.data.text != null) {
        ui.searchInput.value = event.data.text;
        search();
    }
});
function escapeRegExp(text) { return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"); }
function search() {
    while (ui.resultsPane.children.length !== 0) {
        var child = ui.resultsPane.children[0];
        child.parentElement.removeChild(child);
    }
    ui.searchRegExp = null;
    ui.textToSearch = ui.searchInput.value;
    if (ui.textToSearch.length > 0) {
        ui.searchRegExp = new RegExp(escapeRegExp(ui.textToSearch), "g" + (ui.matchCaseCheckbox.checked ? "" : "i"));
    }
    for (var assetId in network_1.data.assetsById)
        searchAsset(assetId);
}
function searchAsset(assetId) {
    var asset = network_1.data.assetsById[assetId];
    var name = network_1.data.projectClient.entries.getPathFromId(assetId);
    var results = [];
    if (ui.searchRegExp != null) {
        var match;
        while ((match = ui.searchRegExp.exec(asset.pub.draft)) != null) {
            results.push(match.index);
        }
    }
    var nameElt = document.querySelector("span[data-id='" + assetId + "']");
    var tableElt = document.querySelector("table[data-id='" + assetId + "']");
    if (results.length === 0) {
        if (nameElt != null)
            nameElt.parentElement.removeChild(nameElt);
        if (tableElt != null)
            tableElt.parentElement.removeChild(tableElt);
        refreshStatus();
        return;
    }
    if (nameElt == null) {
        nameElt = document.createElement("span");
        nameElt.dataset["id"] = assetId;
        ui.resultsPane.appendChild(nameElt);
        nameElt.addEventListener("click", function (event) {
            var tableElt = document.querySelector("table[data-id='" + event.target.dataset.id + "']");
            tableElt.classList.toggle("collapsed");
        });
    }
    nameElt.textContent = results.length + " result" + (results.length > 1 ? "s" : "") + " in \"" + name + ".ts\"";
    if (tableElt == null) {
        tableElt = document.createElement("table");
        tableElt.dataset["id"] = assetId;
        ui.resultsPane.appendChild(tableElt);
        tableElt.addEventListener("click", function (event) {
            var target = event.target;
            while (true) {
                if (target.tagName === "TBODY")
                    return;
                if (target.tagName === "TR")
                    break;
                target = target.parentElement;
            }
            var id = target.dataset["id"];
            var line = target.dataset["line"];
            var ch = target.dataset["ch"];
            if (window.parent != null)
                window.parent.postMessage({ type: "openEntry", id: id, options: { line: line, ch: ch } }, window.location.origin);
        });
    }
    else {
        while (tableElt.children.length !== 0) {
            var child = tableElt.children[0];
            child.parentElement.removeChild(child);
        }
    }
    var textParts = asset.pub.draft.split("\n");
    var previousLine = -1;
    var rankInLine;
    for (var _i = 0; _i < results.length; _i++) {
        var result = results[_i];
        var position = 0;
        var line = 0;
        while (position + textParts[line].length <= result) {
            position += textParts[line].length + 1;
            line += 1;
        }
        if (line === previousLine) {
            rankInLine += 1;
        }
        else {
            previousLine = line;
            rankInLine = 0;
        }
        var column = result - position;
        var rowElt = document.createElement("tr");
        tableElt.appendChild(rowElt);
        var dataset = rowElt.dataset;
        dataset.id = assetId;
        dataset.line = line;
        dataset.ch = column;
        var lineElt = document.createElement("td");
        rowElt.appendChild(lineElt);
        lineElt.textContent = (line + 1).toString();
        var textElt = document.createElement("td");
        rowElt.appendChild(textElt);
        var startElt = document.createElement("span");
        startElt.textContent = textParts[line].slice(0, column);
        textElt.appendChild(startElt);
        var wordElt = document.createElement("span");
        wordElt.textContent = textParts[line].slice(column, column + ui.textToSearch.length);
        textElt.appendChild(wordElt);
        var endElt = document.createElement("span");
        endElt.textContent = textParts[line].slice(column + ui.textToSearch.length);
        textElt.appendChild(endElt);
    }
    refreshStatus();
}
exports.searchAsset = searchAsset;
function refreshStatus() {
    var results = 0;
    var files = 0;
    for (var index = 1; index < ui.resultsPane.children.length; index += 2) {
        results += ui.resultsPane.children[index].children.length;
        files += 1;
    }
    if (results === 0)
        ui.statusSpan.textContent = "No results found";
    else {
        var resultPlurial = results > 1 ? "s" : "";
        var filePlurial = files > 1 ? "s" : "";
        ui.statusSpan.textContent = results + " result" + resultPlurial + " found in " + files + " file" + filePlurial;
    }
}

},{"./network":2}]},{},[1]);
