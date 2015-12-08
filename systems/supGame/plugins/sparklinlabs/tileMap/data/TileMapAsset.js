var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var TileMapLayers_1 = require("./TileMapLayers");
var path = require("path");
var fs = require("fs");
var TileMapAsset = (function (_super) {
    __extends(TileMapAsset, _super);
    function TileMapAsset(id, pub, server) {
        _super.call(this, id, pub, TileMapAsset.schema, server);
    }
    TileMapAsset.prototype.init = function (options, callback) {
        var _this = this;
        this.server.data.resources.acquire("tileMapSettings", null, function (err, tileMapSettings) {
            _this.pub = {
                formatVersion: TileMapAsset.currentFormatVersion,
                tileSetId: null,
                pixelsPerUnit: tileMapSettings.pub.pixelsPerUnit,
                width: tileMapSettings.pub.width, height: tileMapSettings.pub.height,
                layerDepthOffset: tileMapSettings.pub.layerDepthOffset,
                layers: []
            };
            _super.prototype.init.call(_this, options, function () {
                _this.layers.add(_this.createEmptyLayer("Layer"), null, function (err, index) {
                    if (err != null) {
                        callback(err);
                        return;
                    }
                    callback(null);
                });
            });
        });
    };
    TileMapAsset.prototype.load = function (assetPath) {
        var _this = this;
        var pub;
        fs.readFile(path.join(assetPath, "tilemap.json"), { encoding: "utf8" }, function (err, json) {
            if (err != null && err.code === "ENOENT") {
                fs.readFile(path.join(assetPath, "asset.json"), { encoding: "utf8" }, function (err, json) {
                    fs.rename(path.join(assetPath, "asset.json"), path.join(assetPath, "tilemap.json"), function (err) {
                        pub = JSON.parse(json);
                        _this._onLoaded(assetPath, pub);
                    });
                });
            }
            else {
                pub = JSON.parse(json);
                _this._onLoaded(assetPath, pub);
            }
        });
    };
    TileMapAsset.prototype.migrate = function (assetPath, pub, callback) {
        if (pub.formatVersion === TileMapAsset.currentFormatVersion) {
            callback(false);
            return;
        }
        if (pub.formatVersion == null) {
            // NOTE: Legacy stuff from Superpowers 0.4
            if (typeof pub.tileSetId === "number")
                pub.tileSetId = pub.tileSetId.toString();
            // NOTE: Migration from Superpowers 0.13.1
            for (var _i = 0, _a = pub.layers; _i < _a.length; _i++) {
                var layer = _a[_i];
                for (var index = 0; index < layer.data.length; index++) {
                    if (layer.data[index][0] === -1)
                        layer.data[index] = 0;
                }
            }
            pub.formatVersion = 1;
        }
        callback(true);
    };
    TileMapAsset.prototype.save = function (assetPath, callback) {
        var json = JSON.stringify(this.pub, null);
        fs.writeFile(path.join(assetPath, "tilemap.json"), json, { encoding: "utf8" }, callback);
    };
    TileMapAsset.prototype.setup = function () {
        this.layers = new TileMapLayers_1.default(this.pub.layers);
    };
    TileMapAsset.prototype.restore = function () {
        if (this.pub.tileSetId != null)
            this.emit("addDependencies", [this.pub.tileSetId]);
    };
    TileMapAsset.prototype.server_changeTileSet = function (client, tileSetId, callback) {
        if (tileSetId != null) {
            if (typeof (tileSetId) !== "string") {
                callback("tileSetId must be a string or null", null);
                return;
            }
            var entry = this.server.data.entries.byId[tileSetId];
            if (entry == null) {
                callback("Invalid tileSetId", null);
                return;
            }
            if (entry.type !== "tileSet") {
                callback("Invalid asset type", null);
                return;
            }
        }
        if (this.pub.tileSetId != null)
            this.emit("removeDependencies", [this.pub.tileSetId]);
        if (tileSetId != null)
            this.emit("addDependencies", [tileSetId]);
        this.pub.tileSetId = tileSetId;
        callback(null, tileSetId);
        this.emit("change");
    };
    TileMapAsset.prototype.client_changeTileSet = function (tileSetId) {
        this.pub.tileSetId = tileSetId;
    };
    TileMapAsset.prototype.server_resizeMap = function (client, width, height, callback) {
        if (typeof width !== "number" || width < 0) {
            callback("width must be positive integer", null, null);
            return;
        }
        if (typeof height !== "number" || height < 0) {
            callback("height must be positive integer", null, null);
            return;
        }
        if (width === this.pub.width && height === this.pub.height)
            return;
        this.client_resizeMap(width, height);
        callback(null, width, height);
        this.emit("change");
    };
    TileMapAsset.prototype.client_resizeMap = function (width, height) {
        if (width !== this.pub.width) {
            for (var row = this.pub.height; row > 0; row--) {
                for (var _i = 0, _a = this.pub.layers; _i < _a.length; _i++) {
                    var layer = _a[_i];
                    if (width > this.pub.width)
                        for (var i = 0; i < width - this.pub.width; i++)
                            layer.data.splice(row * this.pub.width, 0, 0);
                    else
                        layer.data.splice((row - 1) * this.pub.width + width, this.pub.width - width);
                }
            }
            this.pub.width = width;
        }
        if (height !== this.pub.height) {
            for (var _b = 0, _c = this.pub.layers; _b < _c.length; _b++) {
                var layer = _c[_b];
                if (height > this.pub.height)
                    for (var i = 0; i < (height - this.pub.height) * this.pub.width; i++)
                        layer.data.splice(this.pub.height * this.pub.width, 0, 0);
                else
                    layer.data.splice(height * this.pub.width, (this.pub.height - height) * this.pub.width);
            }
            this.pub.height = height;
        }
    };
    TileMapAsset.prototype.server_moveMap = function (client, horizontalOffset, verticalOffset, callback) {
        if (typeof horizontalOffset !== "number") {
            callback("horizontalOffset must be an integer", null, null);
            return;
        }
        if (typeof verticalOffset !== "number") {
            callback("verticalOffset must be an integer", null, null);
            return;
        }
        if (horizontalOffset === 0 && verticalOffset === 0)
            return;
        this.client_moveMap(horizontalOffset, verticalOffset);
        callback(null, horizontalOffset, verticalOffset);
        this.emit("change");
    };
    TileMapAsset.prototype.client_moveMap = function (horizontalOffset, verticalOffset) {
        if (horizontalOffset !== 0) {
            for (var row = this.pub.height; row > 0; row--) {
                for (var _i = 0, _a = this.pub.layers; _i < _a.length; _i++) {
                    var layer = _a[_i];
                    if (horizontalOffset > 0) {
                        layer.data.splice(row * this.pub.width - horizontalOffset, horizontalOffset);
                        for (var i = 0; i < horizontalOffset; i++)
                            layer.data.splice((row - 1) * this.pub.width, 0, 0);
                    }
                    else {
                        for (var i = 0; i < -horizontalOffset; i++)
                            layer.data.splice(row * this.pub.width, 0, 0);
                        layer.data.splice((row - 1) * this.pub.width, -horizontalOffset);
                    }
                }
            }
        }
        if (verticalOffset !== 0) {
            for (var _b = 0, _c = this.pub.layers; _b < _c.length; _b++) {
                var layer = _c[_b];
                if (verticalOffset > 0) {
                    layer.data.splice((this.pub.height - verticalOffset) * this.pub.width - 1, verticalOffset * this.pub.width);
                    for (var i = 0; i < verticalOffset * this.pub.width; i++)
                        layer.data.splice(0, 0, 0);
                }
                else {
                    for (var i = 0; i < -verticalOffset * this.pub.width; i++)
                        layer.data.splice(this.pub.height * this.pub.width, 0, 0);
                    layer.data.splice(0, -verticalOffset * this.pub.width);
                }
            }
        }
    };
    TileMapAsset.prototype.server_editMap = function (client, layerId, edits, callback) {
        if (typeof layerId !== "string" || this.layers.byId[layerId] == null) {
            callback("no such layer", null, null);
            return;
        }
        if (!Array.isArray(edits)) {
            callback("edits must be an array", null, null);
            return;
        }
        for (var _i = 0; _i < edits.length; _i++) {
            var edit = edits[_i];
            var x = edit.x;
            var y = edit.y;
            var tileValue = edit.tileValue;
            if (x == null || typeof x != "number" || x < 0 || x >= this.pub.width) {
                callback("x must be an integer between 0 && " + (this.pub.width - 1), null, null);
                return;
            }
            if (y == null || typeof y != "number" || y < 0 || y >= this.pub.height) {
                callback("y must be an integer between 0 && " + (this.pub.height - 1), null, null);
                return;
            }
            if (tileValue === 0)
                continue;
            if (!Array.isArray(tileValue) || tileValue.length != 5) {
                callback("tileValue must be an array with 5 items", null, null);
                return;
            }
            if (typeof tileValue[0] != "number" || tileValue[0] < -1) {
                callback("tileX must be an integer greater than -1", null, null);
                return;
            }
            if (typeof tileValue[1] != "number" || tileValue[1] < -1) {
                callback("tileY must be an integer greater than -1", null, null);
                return;
            }
            if (typeof tileValue[2] != "boolean") {
                callback("flipX must be a boolean", null, null);
                return;
            }
            if (typeof tileValue[3] != "boolean") {
                callback("flipY must be a boolean", null, null);
                return;
            }
            if (typeof tileValue[4] != "number" || [0, 90, 180, 270].indexOf(tileValue[4]) == -1) {
                callback("angle must be an integer in [0, 90, 180, 270]", null, null);
                return;
            }
        }
        this.client_editMap(layerId, edits);
        callback(null, layerId, edits);
        this.emit("change");
    };
    TileMapAsset.prototype.client_editMap = function (layerId, edits) {
        for (var _i = 0; _i < edits.length; _i++) {
            var edit = edits[_i];
            var index = edit.y * this.pub.width + edit.x;
            this.layers.byId[layerId].data[index] = edit.tileValue;
        }
    };
    TileMapAsset.prototype.createEmptyLayer = function (layerName) {
        var newLayer = {
            id: null,
            name: layerName,
            data: []
        };
        for (var y = 0; y < this.pub.height; y++) {
            for (var x = 0; x < this.pub.width; x++) {
                var index = y * this.pub.width + x;
                newLayer.data[index] = 0;
            }
        }
        return newLayer;
    };
    TileMapAsset.prototype.server_newLayer = function (client, layerName, index, callback) {
        var _this = this;
        var newLayer = this.createEmptyLayer(layerName);
        this.layers.add(newLayer, index, function (err, actualIndex) {
            if (err != null) {
                callback(err, null, null);
                return;
            }
            callback(null, newLayer, actualIndex);
            _this.emit("change");
        });
    };
    TileMapAsset.prototype.client_newLayer = function (newLayer, actualIndex) {
        this.layers.client_add(newLayer, actualIndex);
    };
    TileMapAsset.prototype.server_renameLayer = function (client, layerId, newName, callback) {
        var _this = this;
        if (typeof layerId != "string" || this.layers.byId[layerId] == null) {
            callback("no such layer", null, null);
            return;
        }
        this.layers.setProperty(layerId, "name", newName, function (err) {
            if (err != null) {
                callback(err, null, null);
                return;
            }
            callback(null, layerId, newName);
            _this.emit("change");
        });
    };
    TileMapAsset.prototype.client_renameLayer = function (layerId, newName) {
        this.layers.client_setProperty(layerId, "name", newName);
    };
    TileMapAsset.prototype.server_deleteLayer = function (client, layerId, callback) {
        var _this = this;
        if (typeof layerId !== "string" || this.layers.byId[layerId] == null) {
            callback("no such layer", null, null);
            return;
        }
        if (this.pub.layers.length === 1) {
            callback("Last layer can't be deleted", null, null);
            return;
        }
        this.layers.remove(layerId, function (err, index) {
            if (err != null) {
                callback(err, null, null);
                return;
            }
            callback(null, layerId, index);
            _this.emit("change");
        });
    };
    TileMapAsset.prototype.client_deleteLayer = function (layerId) {
        this.layers.client_remove(layerId);
    };
    TileMapAsset.prototype.server_moveLayer = function (client, layerId, layerIndex, callback) {
        var _this = this;
        if (typeof layerId !== "string" || this.layers.byId[layerId] == null) {
            callback("no such layer", null, null);
            return;
        }
        if (typeof layerIndex !== "number") {
            callback("index must be an integer", null, null);
            return;
        }
        this.layers.move(layerId, layerIndex, function (err, index) {
            if (err != null) {
                callback(err, null, null);
                return;
            }
            callback(null, layerId, index);
            _this.emit("change");
        });
    };
    TileMapAsset.prototype.client_moveLayer = function (layerId, layerIndex) {
        this.layers.client_move(layerId, layerIndex);
    };
    TileMapAsset.currentFormatVersion = 1;
    TileMapAsset.schema = {
        formatVersion: { type: "integer" },
        tileSetId: { type: "string?" },
        pixelsPerUnit: { type: "number", minExcluded: 0, mutable: true },
        width: { type: "integer", min: 1 },
        height: { type: "integer", min: 1 },
        layerDepthOffset: { type: "number", mutable: true },
        layers: { type: "array" },
    };
    return TileMapAsset;
})(SupCore.Data.Base.Asset);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TileMapAsset;
