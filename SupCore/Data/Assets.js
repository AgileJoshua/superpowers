var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var SupData = require("./index");
var fs = require("fs");
var path = require("path");
var Assets = (function (_super) {
    __extends(Assets, _super);
    function Assets(server) {
        _super.call(this);
        this.server = server;
    }
    Assets.prototype.acquire = function (id, owner, callback) {
        if (this.server.data.entries.byId[id] == null || this.server.data.entries.byId[id].type == null) {
            callback(new Error("Invalid asset id: " + id), null);
            return;
        }
        _super.prototype.acquire.call(this, id, owner, callback);
    };
    Assets.prototype._load = function (id) {
        var _this = this;
        var entry = this.server.data.entries.byId[id];
        var assetClass = this.server.system.data.assetClasses[entry.type];
        if (assetClass == null)
            throw new Error("No data plugin for asset type \"" + entry.type + "\"");
        var asset = new assetClass(id, null, this.server);
        // NOTE: The way assets are laid out on disk was changed in Superpowers 0.11
        var oldDirPath = path.join(this.server.projectPath, "assets/" + id);
        fs.stat(oldDirPath, function (err, stats) {
            var dirPath = path.join(_this.server.projectPath, "assets/" + _this.server.data.entries.getStoragePathFromId(id));
            if (stats == null)
                asset.load(dirPath);
            else {
                fs.rename(oldDirPath, dirPath, function (err) {
                    if (err != null)
                        throw err;
                    asset.load(dirPath);
                });
            }
        });
        return asset;
    };
    return Assets;
})(SupData.Base.Dictionary);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Assets;
