var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var SupData = require("./index");
var Entries = (function (_super) {
    __extends(Entries, _super);
    function Entries(pub, server) {
        var _this = this;
        _super.call(this, pub, Entries.schema);
        this.server = server;
        this.diagnosticsByEntryId = {};
        this.dependenciesByAssetId = {};
        this.walk(function (node, parentNode) {
            if (node.type == null)
                return;
            if (node.diagnostics == null)
                node.diagnostics = [];
            _this.diagnosticsByEntryId[node.id] = new SupData.Diagnostics(node.diagnostics);
            if (node.dependentAssetIds == null)
                node.dependentAssetIds = [];
        });
    }
    Entries.prototype.add = function (node, parentId, index, callback) {
        var _this = this;
        var assetClass = this.server.system.data.assetClasses[node.type];
        if (node.type != null && assetClass == null) {
            callback("Invalid asset type");
            return;
        }
        _super.prototype.add.call(this, node, parentId, index, function (err, actualIndex) {
            if (err != null) {
                callback(err);
                return;
            }
            var siblings = _this.pub;
            if (parentId != null)
                siblings = (_this.byId[parentId] != null) ? _this.byId[parentId].children : null;
            node.name = SupData.ensureUniqueName(node.id, node.name, siblings);
            if (node.type != null) {
                var diagnostics = new SupData.Diagnostics(node.diagnostics);
                _this.diagnosticsByEntryId[node.id] = diagnostics;
                node.diagnostics = diagnostics.pub;
            }
            else
                node.children = [];
            callback(null, actualIndex);
        });
    };
    Entries.prototype.client_add = function (node, parentId, index) {
        _super.prototype.client_add.call(this, node, parentId, index);
        this.diagnosticsByEntryId[node.id] = new SupData.Diagnostics(node.diagnostics);
    };
    Entries.prototype.move = function (id, parentId, index, callback) {
        var node = this.byId[id];
        if (node == null) {
            callback("Invalid node id: " + id);
            return;
        }
        // Check that the requested parent is indeed a folder
        var siblings = this.pub;
        if (parentId != null)
            siblings = (this.byId[parentId] != null) ? this.byId[parentId].children : null;
        if (siblings == null) {
            callback("Invalid parent node id: " + parentId);
            return;
        }
        if (SupData.hasDuplicateName(node.id, node.name, siblings)) {
            callback("There's already an entry with this name in this folder");
            return;
        }
        _super.prototype.move.call(this, id, parentId, index, callback);
    };
    Entries.prototype.remove = function (id, callback) {
        var node = this.byId[id];
        if (node == null) {
            callback("Invalid node id: " + id);
            return;
        }
        if (node.type == null && node.children.length !== 0) {
            callback("The folder must be empty");
            return;
        }
        _super.prototype.remove.call(this, id, callback);
    };
    Entries.prototype.setProperty = function (id, key, value, callback) {
        if (key === "name") {
            if (typeof (value) !== "string") {
                callback("Invalid value");
                return;
            }
            value = value.trim();
            var siblings = (this.parentNodesById[id] != null) ? this.parentNodesById[id].children : this.pub;
            if (SupData.hasDuplicateName(id, value, siblings)) {
                callback("There's already an entry with this name in this folder");
                return;
            }
        }
        _super.prototype.setProperty.call(this, id, key, value, callback);
    };
    Entries.prototype.getForStorage = function () {
        var entries = [];
        var entriesById = {};
        this.walk(function (entry, parentEntry) {
            var savedEntry = { id: entry.id, name: entry.name, type: entry.type };
            if (entry.children != null)
                savedEntry.children = [];
            entriesById[savedEntry.id] = savedEntry;
            if (parentEntry == null)
                entries.push(savedEntry);
            else
                entriesById[parentEntry.id].children.push(savedEntry);
        });
        return entries;
    };
    Entries.prototype.getStoragePathFromId = function (id, options) {
        if (options === void 0) { options = { includeId: true }; }
        var fullStoragePath = this.getPathFromId(id).replace(new RegExp("/", "g"), "__");
        if (options.includeId)
            fullStoragePath = id + "-" + fullStoragePath;
        return fullStoragePath;
    };
    Entries.schema = {
        name: { type: "string", minLength: 1, maxLength: 80, mutable: true },
        type: { type: "string?" },
        diagnostics: { type: "array?" },
        dependentAssetIds: { type: "array", items: { type: "string" } }
    };
    return Entries;
})(SupData.Base.TreeById);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Entries;
