var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var path = require("path");
var fs = require("fs");
var async = require("async");
var SpriteAnimations_1 = require("./SpriteAnimations");
// Reference to THREE, client-side only
var THREE;
if (global.window != null && window.SupEngine != null)
    THREE = SupEngine.THREE;
var SpriteAsset = (function (_super) {
    __extends(SpriteAsset, _super);
    function SpriteAsset(id, pub, server) {
        _super.call(this, id, pub, SpriteAsset.schema, server);
    }
    SpriteAsset.prototype.init = function (options, callback) {
        var _this = this;
        this.server.data.resources.acquire("spriteSettings", null, function (err, spriteSettings) {
            _this.pub = {
                formatVersion: SpriteAsset.currentFormatVersion,
                maps: { map: new Buffer(0) },
                filtering: spriteSettings.pub.filtering,
                pixelsPerUnit: spriteSettings.pub.pixelsPerUnit,
                framesPerSecond: spriteSettings.pub.framesPerSecond,
                opacity: null,
                alphaTest: spriteSettings.pub.alphaTest,
                frameOrder: "rows",
                grid: { width: 100, height: 100 },
                origin: { x: 0.5, y: 0.5 },
                animations: [],
                advancedTextures: false,
                mapSlots: {
                    map: "map",
                    light: null,
                    specular: null,
                    alpha: null,
                    normal: null
                }
            };
            _this.server.data.resources.release("spriteSettings", null);
            _super.prototype.init.call(_this, options, callback);
        });
    };
    SpriteAsset.prototype.setup = function () {
        this.animations = new SpriteAnimations_1.default(this.pub.animations);
    };
    SpriteAsset.prototype.load = function (assetPath) {
        var _this = this;
        var pub;
        var loadMaps = function () {
            var mapsName = pub.maps;
            // NOTE: Support for multiple maps was introduced in Superpowers 0.11
            if (mapsName == null)
                mapsName = ["map"];
            pub.maps = {};
            async.series([
                function (callback) {
                    async.each(mapsName, function (key, cb) {
                        fs.readFile(path.join(assetPath, "map-" + key + ".dat"), function (err, buffer) {
                            // TODO: Handle error but ignore ENOENT
                            if (err != null) {
                                // NOTE: image.dat was renamed to "map-map.dat" in Superpowers 0.11
                                if (err.code === "ENOENT" && key === "map") {
                                    fs.readFile(path.join(assetPath, "image.dat"), function (err, buffer) {
                                        pub.maps[key] = buffer;
                                        fs.writeFile(path.join(assetPath, "map-" + key + ".dat"), buffer);
                                        fs.unlink(path.join(assetPath, "image.dat"));
                                        cb();
                                    });
                                }
                                else
                                    cb();
                                return;
                            }
                            pub.maps[key] = buffer;
                            cb();
                        });
                    }, function (err) { callback(err, null); });
                }
            ], function (err) { _this._onLoaded(assetPath, pub); });
        };
        fs.readFile(path.join(assetPath, "sprite.json"), { encoding: "utf8" }, function (err, json) {
            // NOTE: "asset.json" was renamed to "sprite.json" in Superpowers 0.11
            if (err != null && err.code === "ENOENT") {
                fs.readFile(path.join(assetPath, "asset.json"), { encoding: "utf8" }, function (err, json) {
                    fs.rename(path.join(assetPath, "asset.json"), path.join(assetPath, "sprite.json"), function (err) {
                        pub = JSON.parse(json);
                        loadMaps();
                    });
                });
            }
            else {
                pub = JSON.parse(json);
                loadMaps();
            }
        });
    };
    SpriteAsset.prototype.migrate = function (assetPath, pub, callback) {
        if (pub.formatVersion === SpriteAsset.currentFormatVersion) {
            callback(false);
            return;
        }
        if (pub.formatVersion == null) {
            // NOTE: Opacity setting was introduced in Superpowers 0.8
            if (typeof pub.opacity === "undefined")
                pub.opacity = 1;
            // NOTE: Support for multiple maps was introduced in Superpowers 0.11
            if (pub.frameOrder == null)
                pub.frameOrder = "rows";
            if (pub.advancedTextures == null) {
                pub.advancedTextures = false;
                pub.mapSlots = {
                    map: "map",
                    light: null,
                    specular: null,
                    alpha: null,
                    normal: null
                };
            }
            // NOTE: Animation speed was introduced in Superpowers 0.12
            for (var _i = 0, _a = pub.animations; _i < _a.length; _i++) {
                var animation = _a[_i];
                if (animation.speed == null)
                    animation.speed = 1;
            }
            pub.formatVersion = 1;
        }
        callback(true);
    };
    SpriteAsset.prototype.client_load = function () {
        this.mapObjectURLs = {};
        this._loadTextures();
    };
    SpriteAsset.prototype.client_unload = function () {
        this._unloadTextures();
    };
    SpriteAsset.prototype.save = function (assetPath, saveCallback) {
        var maps = this.pub.maps;
        var mapsName = [];
        for (var key in maps) {
            if (maps[key] != null)
                mapsName.push(key);
        }
        this.pub.maps = mapsName;
        var json = JSON.stringify(this.pub, null, 2);
        this.pub.maps = maps;
        async.series([
            function (callback) { fs.writeFile(path.join(assetPath, "sprite.json"), json, { encoding: "utf8" }, function (err) { callback(err, null); }); },
            function (callback) {
                async.each(mapsName, function (key, cb) {
                    var value = maps[key];
                    if (value == null) {
                        fs.unlink(path.join(assetPath, "map-" + key + ".dat"), function (err) {
                            if (err != null && err.code !== "ENOENT") {
                                cb(err);
                                return;
                            }
                            cb();
                        });
                        return;
                    }
                    fs.writeFile(path.join(assetPath, "map-" + key + ".dat"), value, cb);
                }, function (err) { callback(err, null); });
            }
        ], function (err) { saveCallback(err); });
    };
    SpriteAsset.prototype._unloadTextures = function () {
        for (var textureName in this.pub.textures)
            this.pub.textures[textureName].dispose();
        for (var key in this.mapObjectURLs) {
            URL.revokeObjectURL(this.mapObjectURLs[key]);
            delete this.mapObjectURLs[key];
        }
    };
    SpriteAsset.prototype._loadTextures = function () {
        var _this = this;
        this._unloadTextures();
        this.pub.textures = {};
        Object.keys(this.pub.maps).forEach(function (key) {
            var buffer = _this.pub.maps[key];
            if (buffer == null || buffer.byteLength === 0)
                return;
            var texture = _this.pub.textures[key];
            var image = (texture != null) ? texture.image : null;
            if (image == null) {
                image = new Image;
                texture = _this.pub.textures[key] = new THREE.Texture(image);
                if (_this.pub.filtering === "pixelated") {
                    texture.magFilter = THREE.NearestFilter;
                    texture.minFilter = THREE.NearestFilter;
                }
                var typedArray = new Uint8Array(buffer);
                var blob = new Blob([typedArray], { type: "image/*" });
                image.src = _this.mapObjectURLs[key] = URL.createObjectURL(blob);
            }
            if (!image.complete) {
                image.addEventListener("load", function () {
                    // Three.js might resize our texture to make its dimensions power-of-twos
                    // because of WebGL limitations (see https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL#Non_power-of-two_textures)
                    // so we store its original, non-power-of-two size for later use
                    texture.size = { width: image.width, height: image.height };
                    texture.needsUpdate = true;
                });
            }
        });
    };
    SpriteAsset.prototype.client_setProperty = function (path, value) {
        _super.prototype.client_setProperty.call(this, path, value);
        switch (path) {
            case "filtering":
                for (var textureName in this.pub.textures) {
                    var texture = this.pub.textures[textureName];
                    if (this.pub.filtering === "pixelated") {
                        texture.magFilter = THREE.NearestFilter;
                        texture.minFilter = THREE.NearestFilter;
                    }
                    else {
                        texture.magFilter = THREE.LinearFilter;
                        texture.minFilter = THREE.LinearMipMapLinearFilter;
                    }
                    texture.needsUpdate = true;
                }
                break;
        }
    };
    SpriteAsset.prototype.server_setMaps = function (client, maps, callback) {
        if (maps == null || typeof maps !== "object") {
            callback("Maps must be an object");
            return;
        }
        for (var key in maps) {
            var value = maps[key];
            if (this.pub.maps[key] == null) {
                callback("The map " + key + " doesn't exist");
                return;
            }
            if (value != null && !(value instanceof Buffer)) {
                callback("Value for " + key + " must be an ArrayBuffer or null");
                return;
            }
        }
        for (var key in maps)
            this.pub.maps[key] = maps[key];
        callback(null, maps);
        this.emit("change");
    };
    SpriteAsset.prototype.client_setMaps = function (maps) {
        for (var key in maps)
            this.pub.maps[key] = maps[key];
        this._loadTextures();
    };
    SpriteAsset.prototype.server_newMap = function (client, name, callback) {
        if (name == null || typeof name !== "string") {
            callback("Name of the map must be a string", null);
            return;
        }
        if (this.pub.maps[name] != null) {
            callback("The map " + name + " already exists", null);
            return;
        }
        this.pub.maps[name] = new Buffer(0);
        callback(null, name);
        this.emit("change");
    };
    SpriteAsset.prototype.client_newMap = function (name) {
        this.pub.maps[name] = new Buffer(0);
    };
    SpriteAsset.prototype.server_deleteMap = function (client, name, callback) {
        if (name == null || typeof name !== "string") {
            callback("Name of the map must be a string", null);
            return;
        }
        if (this.pub.maps[name] == null) {
            callback("The map " + name + " doesn't exist", null);
            return;
        }
        if (this.pub.mapSlots["map"] === name) {
            callback("The main map can't be deleted", null);
            return;
        }
        this.client_deleteMap(name);
        callback(null, name);
        this.emit("change");
    };
    SpriteAsset.prototype.client_deleteMap = function (name) {
        for (var slotName in this.pub.mapSlots) {
            var map = this.pub.mapSlots[slotName];
            if (map === name)
                this.pub.mapSlots[slotName] = null;
        }
        //NOTE: do not delete, the key must exist so the file can be deleted from the disk when the asset is saved
        this.pub.maps[name] = null;
    };
    SpriteAsset.prototype.server_renameMap = function (client, oldName, newName, callback) {
        if (oldName == null || typeof oldName !== "string") {
            callback("Name of the map must be a string", null, null);
            return;
        }
        if (newName == null || typeof newName !== "string") {
            callback("New name of the map must be a string", null, null);
            return;
        }
        if (this.pub.maps[newName] != null) {
            callback("The map " + newName + " already exists", null, null);
            return;
        }
        this.client_renameMap(oldName, newName);
        callback(null, oldName, newName);
        this.emit("change");
    };
    SpriteAsset.prototype.client_renameMap = function (oldName, newName) {
        this.pub.maps[newName] = this.pub.maps[oldName];
        this.pub.maps[oldName] = null;
        for (var slotName in this.pub.mapSlots) {
            var map = this.pub.mapSlots[slotName];
            if (map === oldName)
                this.pub.mapSlots[slotName] = newName;
        }
    };
    SpriteAsset.prototype.server_setMapSlot = function (client, slot, map, callback) {
        if (slot == null || typeof slot !== "string") {
            callback("Name of the slot must be a string", null, null);
            return;
        }
        if (map != null && typeof map !== "string") {
            callback("Name of the map must be a string", null, null);
            return;
        }
        if (map != null && this.pub.maps[map] == null) {
            callback("The map " + map + " doesn't exist", null, null);
            return;
        }
        if (slot === "map" && map == null) {
            callback("The main map can't be empty", null, null);
            return;
        }
        this.pub.mapSlots[slot] = map;
        callback(null, slot, map);
        this.emit("change");
    };
    SpriteAsset.prototype.client_setMapSlot = function (slot, map) {
        this.pub.mapSlots[slot] = map;
    };
    SpriteAsset.prototype.server_newAnimation = function (client, name, callback) {
        var _this = this;
        var animation = { id: null, name: name, startFrameIndex: 0, endFrameIndex: 0, speed: 1 };
        this.animations.add(animation, null, function (err, actualIndex) {
            if (err != null) {
                callback(err);
                return;
            }
            animation.name = SupCore.Data.ensureUniqueName(animation.id, animation.name, _this.animations.pub);
            callback(null, animation, actualIndex);
            _this.emit("change");
        });
    };
    SpriteAsset.prototype.client_newAnimation = function (animation, actualIndex) {
        this.animations.client_add(animation, actualIndex);
    };
    SpriteAsset.prototype.server_deleteAnimation = function (client, id, callback) {
        var _this = this;
        this.animations.remove(id, function (err) {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, id);
            _this.emit("change");
        });
    };
    SpriteAsset.prototype.client_deleteAnimation = function (id) {
        this.animations.client_remove(id);
        return;
    };
    SpriteAsset.prototype.server_moveAnimation = function (client, id, newIndex, callback) {
        var _this = this;
        this.animations.move(id, newIndex, function (err, actualIndex) {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, id, actualIndex);
            _this.emit("change");
        });
    };
    SpriteAsset.prototype.client_moveAnimation = function (id, newIndex) {
        this.animations.client_move(id, newIndex);
    };
    SpriteAsset.prototype.server_setAnimationProperty = function (client, id, key, value, callback) {
        var _this = this;
        if (key === "name") {
            if (typeof (value) !== "string") {
                callback("Invalid value");
                return;
            }
            value = value.trim();
            if (SupCore.Data.hasDuplicateName(id, value, this.animations.pub)) {
                callback("There's already an animation with this name");
                return;
            }
        }
        this.animations.setProperty(id, key, value, function (err, actualValue) {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, id, key, actualValue);
            _this.emit("change");
        });
    };
    SpriteAsset.prototype.client_setAnimationProperty = function (id, key, actualValue) {
        this.animations.client_setProperty(id, key, actualValue);
    };
    SpriteAsset.currentFormatVersion = 1;
    SpriteAsset.schema = {
        formatVersion: { type: "integer" },
        maps: {
            type: "hash",
            values: {
                type: "buffer",
            }
        },
        filtering: { type: "enum", items: ["pixelated", "smooth"], mutable: true },
        pixelsPerUnit: { type: "number", minExcluded: 0, mutable: true },
        framesPerSecond: { type: "number", minExcluded: 0, mutable: true },
        opacity: { type: "number?", min: 0, max: 1, mutable: true },
        alphaTest: { type: "number", min: 0, max: 1, mutable: true },
        frameOrder: { type: "enum", items: ["rows", "columns"], mutable: true },
        grid: {
            type: "hash",
            properties: {
                width: { type: "integer", min: 1, mutable: true },
                height: { type: "integer", min: 1, mutable: true }
            }
        },
        origin: {
            type: "hash",
            properties: {
                x: { type: "number", min: 0, max: 1, mutable: true },
                y: { type: "number", min: 0, max: 1, mutable: true }
            }
        },
        animations: { type: "array" },
        advancedTextures: { type: "boolean", mutable: true },
        mapSlots: {
            type: "hash",
            properties: {
                map: { type: "string?", mutable: true },
                light: { type: "string?", mutable: true },
                specular: { type: "string?", mutable: true },
                alpha: { type: "string?", mutable: true },
                normal: { type: "string?", mutable: true }
            }
        }
    };
    return SpriteAsset;
})(SupCore.Data.Base.Asset);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SpriteAsset;
