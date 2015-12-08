var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var path = require("path");
var fs = require("fs");
// Reference to THREE, client-side only
var THREE;
if (global.window != null && window.SupEngine != null)
    THREE = SupEngine.THREE;
var TileSetAsset = (function (_super) {
    __extends(TileSetAsset, _super);
    function TileSetAsset(id, pub, server) {
        _super.call(this, id, pub, TileSetAsset.schema, server);
    }
    TileSetAsset.prototype.init = function (options, callback) {
        var _this = this;
        this.server.data.resources.acquire("tileMapSettings", null, function (err, tileMapSettings) {
            _this.pub = {
                formatVersion: TileSetAsset.currentFormatVersion,
                image: new Buffer(0),
                grid: tileMapSettings.pub.grid,
                tileProperties: {}
            };
            _super.prototype.init.call(_this, options, callback);
        });
    };
    TileSetAsset.prototype.load = function (assetPath) {
        var _this = this;
        var pub;
        fs.readFile(path.join(assetPath, "tileset.json"), { encoding: "utf8" }, function (err, json) {
            if (err != null && err.code === "ENOENT") {
                fs.readFile(path.join(assetPath, "asset.json"), { encoding: "utf8" }, function (err, json) {
                    fs.rename(path.join(assetPath, "asset.json"), path.join(assetPath, "tileset.json"), function (err) {
                        pub = JSON.parse(json);
                        fs.readFile(path.join(assetPath, "image.dat"), function (err, buffer) {
                            pub.image = buffer;
                            _this._onLoaded(assetPath, pub);
                        });
                    });
                });
            }
            else {
                pub = JSON.parse(json);
                fs.readFile(path.join(assetPath, "image.dat"), function (err, buffer) {
                    pub.image = buffer;
                    _this._onLoaded(assetPath, pub);
                });
            }
        });
    };
    TileSetAsset.prototype.migrate = function (assetPath, pub, callback) {
        if (pub.formatVersion === TileSetAsset.currentFormatVersion) {
            callback(false);
            return;
        }
        if (pub.formatVersion == null) {
            // NOTE: gridSize was split into grid.width and .height in Superpowers 0.8
            if (pub["gridSize"] != null) {
                pub.grid = { width: pub["gridSize"], height: pub["gridSize"] };
                delete pub["gridSize"];
            }
            pub.formatVersion = 1;
        }
        callback(true);
    };
    TileSetAsset.prototype.client_load = function () { this._loadTexture(); };
    TileSetAsset.prototype.client_unload = function () { this._unloadTexture(); };
    TileSetAsset.prototype.save = function (assetPath, callback) {
        var buffer = this.pub.image;
        delete this.pub.image;
        var json = JSON.stringify(this.pub, null, 2);
        this.pub.image = buffer;
        fs.writeFile(path.join(assetPath, "tileset.json"), json, { encoding: "utf8" }, function () {
            fs.writeFile(path.join(assetPath, "image.dat"), buffer, callback);
        });
    };
    TileSetAsset.prototype._loadTexture = function () {
        this._unloadTexture();
        var buffer = this.pub.image;
        if (buffer.byteLength === 0)
            return;
        var image = new Image;
        var texture = this.pub.texture = new THREE.Texture(image);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        var typedArray = new Uint8Array(buffer);
        var blob = new Blob([typedArray], { type: "image/*" });
        image.src = this.url = URL.createObjectURL(blob);
        if (!image.complete)
            image.addEventListener("load", function () { texture.needsUpdate = true; });
    };
    TileSetAsset.prototype._unloadTexture = function () {
        if (this.url != null)
            URL.revokeObjectURL(this.url);
        if (this.pub.texture != null)
            this.pub.texture.dispose();
        this.url = null;
        this.pub.texture = null;
    };
    TileSetAsset.prototype.server_upload = function (client, image, callback) {
        if (!(image instanceof Buffer)) {
            callback("Image must be an ArrayBuffer", null);
            return;
        }
        this.pub.image = image;
        callback(null, image);
        this.emit("change");
    };
    TileSetAsset.prototype.client_upload = function (image) {
        this.pub.image = image;
        this._loadTexture();
    };
    TileSetAsset.prototype.server_addTileProperty = function (client, tile, name, callback) {
        if (typeof (tile) !== "object" ||
            tile.x == null || typeof (tile.x) !== "number" ||
            tile.y == null || typeof (tile.y) !== "number") {
            callback("Invalid tile location", null, null);
            return;
        }
        if (typeof (name) !== "string") {
            callback("Invalid property name", null, null);
            return;
        }
        var properties = {};
        properties[name] = "";
        var violation = SupCore.Data.Base.getRuleViolation(properties, TileSetAsset.schema["tileProperties"].values, true);
        if (violation != null) {
            callback("Invalid property: " + SupCore.Data.Base.formatRuleViolation(violation), null, null);
            return;
        }
        if (this.pub.tileProperties[(tile.x + "_" + tile.y)] != null &&
            this.pub.tileProperties[(tile.x + "_" + tile.y)][name] != null) {
            callback("Property " + name + " already exists", null, null);
            return;
        }
        if (this.pub.tileProperties[(tile.x + "_" + tile.y)] == null)
            this.pub.tileProperties[(tile.x + "_" + tile.y)] = {};
        this.pub.tileProperties[(tile.x + "_" + tile.y)][name] = "";
        callback(null, tile, name);
        this.emit("change");
    };
    TileSetAsset.prototype.client_addTileProperty = function (tile, name) {
        if (this.pub.tileProperties[(tile.x + "_" + tile.y)] == null)
            this.pub.tileProperties[(tile.x + "_" + tile.y)] = {};
        this.pub.tileProperties[(tile.x + "_" + tile.y)][name] = "";
    };
    TileSetAsset.prototype.server_renameTileProperty = function (client, tile, name, newName, callback) {
        if (typeof (tile) !== "object" ||
            tile.x == null || typeof (tile.x) !== "number" ||
            tile.y == null || typeof (tile.y) !== "number") {
            callback("Invalid tile location", null, null, null);
            return;
        }
        if (typeof (name) !== "string") {
            callback("Invalid property name", null, null, null);
            return;
        }
        if (typeof (newName) !== "string") {
            callback("Invalid new property name", null, null, null);
            return;
        }
        if (this.pub.tileProperties[(tile.x + "_" + tile.y)] == null) {
            callback("Tile " + tile.x + "_" + tile.y + " doesn't have any property", null, null, null);
            return;
        }
        var properties = {};
        properties[newName] = "";
        var violation = SupCore.Data.Base.getRuleViolation(properties, TileSetAsset.schema["tileProperties"].values, true);
        if (violation != null) {
            callback("Invalid property: " + SupCore.Data.Base.formatRuleViolation(violation), null, null, null);
            return;
        }
        if (this.pub.tileProperties[(tile.x + "_" + tile.y)][name] == null) {
            callback("Property " + name + " doesn't exists", null, null, null);
            return;
        }
        if (this.pub.tileProperties[(tile.x + "_" + tile.y)][newName] != null) {
            callback("Property " + newName + " already exists", null, null, null);
            return;
        }
        this.pub.tileProperties[(tile.x + "_" + tile.y)][newName] = this.pub.tileProperties[(tile.x + "_" + tile.y)][name];
        delete this.pub.tileProperties[(tile.x + "_" + tile.y)][name];
        callback(null, tile, name, newName);
        this.emit("change");
    };
    TileSetAsset.prototype.client_renameTileProperty = function (tile, name, newName) {
        this.pub.tileProperties[(tile.x + "_" + tile.y)][newName] = this.pub.tileProperties[(tile.x + "_" + tile.y)][name];
        delete this.pub.tileProperties[(tile.x + "_" + tile.y)][name];
    };
    TileSetAsset.prototype.server_deleteTileProperty = function (client, tile, name, callback) {
        if (typeof (tile) !== "object" ||
            tile.x == null || typeof (tile.x) !== "number" ||
            tile.y == null || typeof (tile.y) !== "number") {
            callback("Invalid tile location", null, null);
            return;
        }
        if (this.pub.tileProperties[(tile.x + "_" + tile.y)] == null) {
            callback("Tile " + tile.x + "_" + tile.y + " doesn't have any property", null, null);
            return;
        }
        if (typeof (name) !== "string") {
            callback("Invalid property name", null, null);
            return;
        }
        if (this.pub.tileProperties[(tile.x + "_" + tile.y)][name] == null) {
            callback("Property " + name + " doesn't exists", null, null);
            return;
        }
        delete this.pub.tileProperties[(tile.x + "_" + tile.y)][name];
        if (Object.keys(this.pub.tileProperties[(tile.x + "_" + tile.y)]).length === 0)
            delete this.pub.tileProperties[(tile.x + "_" + tile.y)];
        callback(null, tile, name);
        this.emit("change");
    };
    TileSetAsset.prototype.client_deleteTileProperty = function (tile, name) {
        delete this.pub.tileProperties[(tile.x + "_" + tile.y)][name];
        if (Object.keys(this.pub.tileProperties[(tile.x + "_" + tile.y)]).length === 0)
            delete this.pub.tileProperties[(tile.x + "_" + tile.y)];
    };
    TileSetAsset.prototype.server_editTileProperty = function (client, tile, name, value, callback) {
        if (typeof (tile) !== "object" ||
            tile.x == null || typeof (tile.x) !== "number" ||
            tile.y == null || typeof (tile.y) !== "number") {
            callback("Invalid tile location", null, null, null);
            return;
        }
        if (this.pub.tileProperties[(tile.x + "_" + tile.y)] == null) {
            callback("Tile " + tile.x + "_" + tile.y + " doesn't have any property", null, null, null);
            return;
        }
        if (typeof (name) !== "string") {
            callback("Invalid property name", null, null, null);
            return;
        }
        if (this.pub.tileProperties[(tile.x + "_" + tile.y)][name] == null) {
            callback("Property " + name + " doesn't exists", null, null, null);
            return;
        }
        if (typeof (value) !== "string") {
            callback("Invalid property value", null, null, null);
            return;
        }
        var properties = {};
        properties[name] = value;
        var violation = SupCore.Data.Base.getRuleViolation(properties, TileSetAsset.schema["tileProperties"].values, true);
        if (violation != null) {
            callback("Invalid property: " + SupCore.Data.Base.formatRuleViolation(violation), null, null, null);
            return;
        }
        this.pub.tileProperties[(tile.x + "_" + tile.y)][name] = value;
        callback(null, tile, name, value);
        this.emit("change");
    };
    TileSetAsset.prototype.client_editTileProperty = function (tile, name, value) {
        this.pub.tileProperties[(tile.x + "_" + tile.y)][name] = value;
    };
    TileSetAsset.currentFormatVersion = 1;
    TileSetAsset.schema = {
        formatVersion: { type: "integer" },
        image: { type: "buffer" },
        grid: {
            type: "hash",
            properties: {
                width: { type: "integer", min: 1, mutable: true },
                height: { type: "integer", min: 1, mutable: true }
            }
        },
        tileProperties: {
            type: "hash",
            values: {
                type: "hash",
                keys: { minLength: 1, maxLength: 80 },
                values: { type: "string", minLength: 0, maxLength: 80 }
            }
        }
    };
    return TileSetAsset;
})(SupCore.Data.Base.Asset);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TileSetAsset;
