var io = require("socket.io-client");
var querystring = require("querystring");
var cookies = require("js-cookie");
exports.cookies = cookies;
/* tslint:disable:no-unused-variable */
var ProjectClient_1 = require("./ProjectClient");
exports.ProjectClient = ProjectClient_1.default;
var setupHotkeys_1 = require("./setupHotkeys");
exports.setupHotkeys = setupHotkeys_1.default;
var table = require("./table");
exports.table = table;
var dialogs = require("./dialogs/index");
exports.dialogs = dialogs;
/* tslint:enable:no-unused-variable */
exports.isApp = window.navigator.userAgent.indexOf("Electron") !== -1;
exports.query = querystring.parse(window.location.search.slice(1));
// Refuses filesystem-unsafe characters
// See http://superuser.com/q/358855
exports.namePattern = "[^\\\\/:*?\"<>|\\[\\]]+";
exports.namePatternDescription = "The following characters cannot be used: \\, /, :, *, ?, \", <, >, |, [ and ].";
// Initialize empty system
SupCore.system = new SupCore.System("");
exports.plugins = {};
function registerPlugin(context, name, content) {
    if (exports.plugins[context] == null)
        exports.plugins[context] = {};
    if (exports.plugins[context][name] != null) {
        console.error("SupClient.registerPlugin: Tried to register two or more plugins named \"" + name + "\"");
        return;
    }
    exports.plugins[context][name] = { path: exports.activePluginPath, content: content };
}
exports.registerPlugin = registerPlugin;
// Plugins list
function connect(projectId, options) {
    if (options == null)
        options = {};
    if (options.reconnection == null)
        options.reconnection = false;
    var namespace = (projectId != null) ? "project:" + projectId : "hub";
    var supServerAuth = cookies.get("supServerAuth");
    var socket = io.connect(window.location.protocol + "//" + window.location.host + "/" + namespace, { transports: ["websocket"], reconnection: options.reconnection, query: { supServerAuth: supServerAuth } });
    socket.on("welcome", function (clientId, config) {
        SupCore.system.name = config.systemName;
    });
    return socket;
}
exports.connect = connect;
function onAssetTrashed() {
    document.body.innerHTML = "";
    var h1 = document.createElement("h1");
    h1.textContent = "This asset has been trashed.";
    var div = document.createElement("div");
    div.className = "superpowers-error";
    div.appendChild(h1);
    document.body.appendChild(div);
}
exports.onAssetTrashed = onAssetTrashed;
function onDisconnected() {
    document.body.innerHTML = "";
    var h1 = document.createElement("h1");
    h1.textContent = "You were disconnected.";
    var button = document.createElement("button");
    button.textContent = "Reconnect";
    button.addEventListener("click", function () { location.reload(); });
    var div = document.createElement("div");
    div.className = "superpowers-error";
    div.appendChild(h1);
    div.appendChild(button);
    document.body.appendChild(div);
}
exports.onDisconnected = onDisconnected;
function getTreeViewInsertionPoint(treeView) {
    var selectedElt = treeView.selectedNodes[0];
    var parentId;
    var index;
    if (selectedElt != null) {
        if (selectedElt.classList.contains("group")) {
            parentId = selectedElt.dataset.id;
        }
        else {
            if (selectedElt.parentElement.classList.contains("children")) {
                parentId = selectedElt.parentElement.previousSibling.dataset.id;
            }
            index = 1;
            while (selectedElt.previousSibling != null) {
                selectedElt = selectedElt.previousSibling;
                if (selectedElt.tagName === "LI")
                    index++;
            }
        }
    }
    return { parentId: parentId, index: index };
}
exports.getTreeViewInsertionPoint = getTreeViewInsertionPoint;
function getTreeViewDropPoint(dropInfo, treeById) {
    var parentId;
    var index;
    var parentNode;
    var targetEntryId = dropInfo.target.dataset.id;
    switch (dropInfo.where) {
        case "inside":
            {
                parentNode = treeById.byId[targetEntryId];
                index = parentNode.children.length;
            }
            break;
        case "above":
        case "below":
            {
                var targetNode = treeById.byId[targetEntryId];
                parentNode = treeById.parentNodesById[targetNode.id];
                index = (parentNode != null) ? parentNode.children.indexOf(targetNode) : treeById.pub.indexOf(targetNode);
                if (dropInfo.where === "below")
                    index++;
            }
            break;
    }
    if (parentNode != null)
        parentId = parentNode.id;
    return { parentId: parentId, index: index };
}
exports.getTreeViewDropPoint = getTreeViewDropPoint;
function getListViewDropIndex(dropInfo, listById, reversed) {
    if (reversed === void 0) { reversed = false; }
    var targetEntryId = dropInfo.target.dataset.id;
    var targetNode = listById.byId[targetEntryId];
    var index = listById.pub.indexOf(targetNode);
    if (!reversed && dropInfo.where === "below")
        index++;
    if (reversed && dropInfo.where === "above")
        index++;
    return index;
}
exports.getListViewDropIndex = getListViewDropIndex;
function findEntryByPath(entries, path) {
    var parts = (typeof path === "string") ? path.split("/") : path;
    var foundEntry;
    entries.every(function (entry) {
        if (entry.name === parts[0]) {
            if (parts.length === 1) {
                foundEntry = entry;
                return false;
            }
            if (entry.children == null)
                return true;
            foundEntry = findEntryByPath(entry.children, parts.slice(1));
            return false;
        }
        else
            return true;
    });
    return foundEntry;
}
exports.findEntryByPath = findEntryByPath;
