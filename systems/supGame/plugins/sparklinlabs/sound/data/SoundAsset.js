var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var path = require("path");
var fs = require("fs");
var SoundAsset = (function (_super) {
    __extends(SoundAsset, _super);
    function SoundAsset(id, pub, server) {
        _super.call(this, id, pub, SoundAsset.schema, server);
    }
    SoundAsset.prototype.init = function (options, callback) {
        this.pub = { formatVersion: SoundAsset.currentFormatVersion, sound: new Buffer(0), streaming: false };
        _super.prototype.init.call(this, options, callback);
    };
    SoundAsset.prototype.load = function (assetPath) {
        var _this = this;
        var pub;
        fs.readFile(path.join(assetPath, "sound.json"), { encoding: "utf8" }, function (err, json) {
            // NOTE: "asset.json" was renamed to "sound.json" in Superpowers 0.11
            if (err != null && err.code === "ENOENT") {
                fs.readFile(path.join(assetPath, "asset.json"), { encoding: "utf8" }, function (err, json) {
                    fs.rename(path.join(assetPath, "asset.json"), path.join(assetPath, "sound.json"), function (err) {
                        pub = JSON.parse(json);
                        fs.readFile(path.join(assetPath, "sound.dat"), function (err, buffer) {
                            pub.sound = buffer;
                            _this._onLoaded(assetPath, pub);
                        });
                    });
                });
            }
            else {
                pub = JSON.parse(json);
                fs.readFile(path.join(assetPath, "sound.dat"), function (err, buffer) {
                    pub.sound = buffer;
                    _this._onLoaded(assetPath, pub);
                });
            }
        });
    };
    SoundAsset.prototype.migrate = function (assetPath, pub, callback) {
        if (pub.formatVersion === SoundAsset.currentFormatVersion) {
            callback(false);
            return;
        }
        if (pub.formatVersion == null) {
            if (pub.streaming == null)
                pub.streaming = false;
            pub.formatVersion = 1;
        }
        callback(true);
    };
    SoundAsset.prototype.save = function (assetPath, callback) {
        var buffer = this.pub.sound;
        delete this.pub.sound;
        var json = JSON.stringify(this.pub, null, 2);
        this.pub.sound = buffer;
        fs.writeFile(path.join(assetPath, "sound.json"), json, { encoding: "utf8" }, function () {
            fs.writeFile(path.join(assetPath, "sound.dat"), buffer, callback);
        });
    };
    SoundAsset.prototype.server_upload = function (client, sound, callback) {
        if (!(sound instanceof Buffer)) {
            callback("Sound must be an ArrayBuffer");
            return;
        }
        this.pub.sound = sound;
        callback(null, sound);
        this.emit("change");
    };
    SoundAsset.prototype.client_upload = function (sound) {
        this.pub.sound = sound;
    };
    SoundAsset.currentFormatVersion = 1;
    SoundAsset.schema = {
        formatVersion: { type: "integer" },
        sound: { type: "buffer" },
        streaming: { type: "boolean", mutable: true }
    };
    return SoundAsset;
})(SupCore.Data.Base.Asset);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SoundAsset;
