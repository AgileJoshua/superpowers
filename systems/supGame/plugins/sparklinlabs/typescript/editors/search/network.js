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
