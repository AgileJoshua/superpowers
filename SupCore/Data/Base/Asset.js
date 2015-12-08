var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Hash_1 = require("./Hash");
var path = require("path");
var fs = require("fs");
var Asset = (function (_super) {
    __extends(Asset, _super);
    function Asset(id, pub, schema, server) {
        _super.call(this, pub, schema);
        this.id = id;
        this.server = server;
        if (this.server == null)
            this.setup();
    }
    Asset.prototype.init = function (options, callback) { this.setup(); callback(); };
    Asset.prototype.setup = function () { };
    Asset.prototype.restore = function () { };
    Asset.prototype.destroy = function (callback) { callback(); };
    Asset.prototype.load = function (assetPath) {
        var _this = this;
        fs.readFile(path.join(assetPath, "asset.json"), { encoding: "utf8" }, function (err, json) {
            if (err != null)
                throw err;
            var pub = JSON.parse(json);
            _this._onLoaded(assetPath, pub);
        });
    };
    Asset.prototype._onLoaded = function (assetPath, pub) {
        var _this = this;
        this.migrate(assetPath, pub, function (hasMigrated) {
            if (hasMigrated) {
                _this.pub = pub;
                _this.save(assetPath, function (err) {
                    _this.setup();
                    _this.emit("load");
                });
            }
            else {
                _this.pub = pub;
                _this.setup();
                _this.emit("load");
            }
        });
    };
    Asset.prototype.unload = function () { this.removeAllListeners(); };
    Asset.prototype.migrate = function (assetPath, pub, callback) { callback(false); };
    ;
    Asset.prototype.client_load = function () { };
    Asset.prototype.client_unload = function () { };
    Asset.prototype.save = function (assetPath, callback) {
        var json = JSON.stringify(this.pub, null, 2);
        fs.writeFile(path.join(assetPath, "asset.json"), json, { encoding: "utf8" }, callback);
    };
    Asset.prototype.server_setProperty = function (client, path, value, callback) {
        this.setProperty(path, value, function (err, actualValue) {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, path, actualValue);
        });
    };
    return Asset;
})(Hash_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Asset;
