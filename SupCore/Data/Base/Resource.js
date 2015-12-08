var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Hash_1 = require("./Hash");
var path = require("path");
var fs = require("fs");
var Resource = (function (_super) {
    __extends(Resource, _super);
    function Resource(pub, schema, server) {
        _super.call(this, pub, schema);
        this.server = server;
        if (server == null)
            this.setup();
    }
    Resource.prototype.init = function (callback) { this.setup(); callback(); };
    Resource.prototype.setup = function () { };
    Resource.prototype.load = function (resourcePath) {
        var _this = this;
        fs.readFile(path.join(resourcePath, "resource.json"), { encoding: "utf8" }, function (err, json) {
            if (err != null) {
                if (err.code === "ENOENT") {
                    _this.init(function () { _this._onLoaded(resourcePath, _this.pub, true); });
                    return;
                }
                throw err;
            }
            var pub = JSON.parse(json);
            _this._onLoaded(resourcePath, pub, false);
        });
    };
    Resource.prototype._onLoaded = function (resourcePath, pub, justCreated) {
        var _this = this;
        if (justCreated) {
            this.pub = pub;
            this.save(resourcePath, function (err) {
                _this.setup();
                _this.emit("load");
            });
            return;
        }
        this.migrate(resourcePath, pub, function (hasMigrated) {
            if (hasMigrated) {
                _this.pub = pub;
                _this.save(resourcePath, function (err) {
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
    Resource.prototype.unload = function () { this.removeAllListeners(); };
    Resource.prototype.migrate = function (resourcePath, pub, callback) { callback(false); };
    ;
    Resource.prototype.save = function (resourcePath, callback) {
        var json = JSON.stringify(this.pub, null, 2);
        fs.mkdir(path.join(resourcePath), function (err) {
            if (err != null && err.code !== "EEXIST") {
                callback(err);
                return;
            }
            fs.writeFile(path.join(resourcePath, "resource.json"), json, { encoding: "utf8" }, callback);
        });
    };
    Resource.prototype.server_setProperty = function (client, path, value, callback) {
        this.setProperty(path, value, function (err, actualValue) {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, path, actualValue);
        });
    };
    return Resource;
})(Hash_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Resource;
