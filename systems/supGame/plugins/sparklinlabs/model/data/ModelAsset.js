var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var path = require("path");
var fs = require("fs");
var async = require("async");
// Reference to THREE, client-side only
var THREE;
if (global.window != null && window.SupEngine != null)
    THREE = SupEngine.THREE;
var ModelAnimations_1 = require("./ModelAnimations");
var ModelAsset = (function (_super) {
    __extends(ModelAsset, _super);
    function ModelAsset(id, pub, server) {
        _super.call(this, id, pub, ModelAsset.schema, server);
    }
    ModelAsset.prototype.init = function (options, callback) {
        this.pub = {
            formatVersion: ModelAsset.currentFormatVersion,
            unitRatio: 1,
            upAxisMatrix: null,
            attributes: {
                position: null,
                index: null,
                color: null,
                uv: null,
                normal: null,
                skinIndex: null,
                skinWeight: null
            },
            bones: null,
            maps: { map: new Buffer(0) },
            filtering: "pixelated",
            wrapping: "clampToEdge",
            animations: [],
            opacity: null,
            advancedTextures: false,
            mapSlots: {
                map: "map",
                light: null,
                specular: null,
                alpha: null,
                normal: null
            }
        };
        _super.prototype.init.call(this, options, callback);
    };
    ModelAsset.prototype.setup = function () {
        this.animations = new ModelAnimations_1.default(this.pub.animations);
    };
    ModelAsset.prototype.load = function (assetPath) {
        var _this = this;
        var pub;
        var loadAttributesMaps = function () {
            var mapNames = pub.maps;
            // NOTE: "diffuse" was renamed to "map" in Superpowers 0.11
            if (pub.formatVersion == null && mapNames.length === 1 && mapNames[0] === "diffuse")
                mapNames[0] = "map";
            pub.maps = {};
            pub.attributes = {};
            async.series([
                function (callback) {
                    async.each(Object.keys(ModelAsset.schema["attributes"].properties), function (key, cb) {
                        fs.readFile(path.join(assetPath, "attr-" + key + ".dat"), function (err, buffer) {
                            // TODO: Handle error but ignore ENOENT
                            if (err != null) {
                                cb();
                                return;
                            }
                            pub.attributes[key] = buffer;
                            cb();
                        });
                    }, function (err) { callback(err, null); });
                },
                function (callback) {
                    async.each(mapNames, function (key, cb) {
                        fs.readFile(path.join(assetPath, "map-" + key + ".dat"), function (err, buffer) {
                            // TODO: Handle error but ignore ENOENT
                            if (err != null) {
                                // NOTE: "diffuse" was renamed to "map" in Superpowers 0.11
                                if (err.code === "ENOENT" && key === "map") {
                                    fs.readFile(path.join(assetPath, "map-diffuse.dat"), function (err, buffer) {
                                        fs.rename(path.join(assetPath, "map-diffuse.dat"), path.join(assetPath, "map-map.dat"), function (err) {
                                            pub.maps[key] = buffer;
                                            cb();
                                        });
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
        fs.readFile(path.join(assetPath, "model.json"), { encoding: "utf8" }, function (err, json) {
            // NOTE: "asset.json" was renamed to "model.json" in Superpowers 0.11
            if (err != null && err.code === "ENOENT") {
                fs.readFile(path.join(assetPath, "asset.json"), { encoding: "utf8" }, function (err, json) {
                    fs.rename(path.join(assetPath, "asset.json"), path.join(assetPath, "model.json"), function (err) {
                        pub = JSON.parse(json);
                        loadAttributesMaps();
                    });
                });
            }
            else {
                pub = JSON.parse(json);
                loadAttributesMaps();
            }
        });
    };
    ModelAsset.prototype.migrate = function (assetPath, pub, callback) {
        if (pub.formatVersion === ModelAsset.currentFormatVersion) {
            callback(false);
            return;
        }
        if (pub.formatVersion == null) {
            // NOTE: New settings introduced in Superpowers 0.8
            if (typeof pub.opacity === "undefined")
                pub.opacity = 1;
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
            if (pub.unitRatio == null)
                pub.unitRatio = 1;
            // NOTE: Filtering and wrapping were introduced in Superpowers 0.13
            if (pub.filtering == null)
                pub.filtering = "pixelated";
            if (pub.wrapping == null)
                pub.wrapping = "clampToEdge";
            if (pub.animations == null)
                pub.animations = [];
            pub.formatVersion = 1;
        }
        callback(true);
    };
    ModelAsset.prototype.client_load = function () {
        this.mapObjectURLs = {};
        this._loadTextures();
    };
    ModelAsset.prototype.client_unload = function () {
        this._unloadTextures();
    };
    ModelAsset.prototype.save = function (assetPath, saveCallback) {
        var attributes = this.pub.attributes;
        var maps = this.pub.maps;
        this.pub.attributes = [];
        for (var key in attributes) {
            if (attributes[key] != null)
                this.pub.attributes.push(key);
        }
        this.pub.maps = [];
        for (var mapName in maps) {
            if (maps[mapName] != null)
                this.pub.maps.push(mapName);
        }
        var json = JSON.stringify(this.pub, null, 2);
        this.pub.attributes = attributes;
        this.pub.maps = maps;
        async.series([
            function (callback) { fs.writeFile(path.join(assetPath, "model.json"), json, { encoding: "utf8" }, function (err) { callback(err, null); }); },
            function (callback) {
                async.each(Object.keys(ModelAsset.schema["attributes"].properties), function (key, cb) {
                    var value = attributes[key];
                    if (value == null) {
                        fs.unlink(path.join(assetPath, "attr-" + key + ".dat"), function (err) {
                            if (err != null && err.code !== "ENOENT") {
                                cb(err);
                                return;
                            }
                            cb();
                        });
                        return;
                    }
                    fs.writeFile(path.join(assetPath, "attr-" + key + ".dat"), value, cb);
                }, function (err) { callback(err, null); });
            },
            function (callback) {
                async.each(Object.keys(maps), function (mapName, cb) {
                    var value = maps[mapName];
                    if (value == null) {
                        fs.unlink(path.join(assetPath, "map-" + mapName + ".dat"), function (err) {
                            if (err != null && err.code !== "ENOENT") {
                                cb(err);
                                return;
                            }
                            cb();
                        });
                        return;
                    }
                    fs.writeFile(path.join(assetPath, "map-" + mapName + ".dat"), value, cb);
                }, function (err) { callback(err, null); });
            }
        ], function (err) { saveCallback(err); });
    };
    ModelAsset.prototype._unloadTextures = function () {
        for (var textureName in this.pub.textures)
            this.pub.textures[textureName].dispose();
        for (var key in this.mapObjectURLs) {
            URL.revokeObjectURL(this.mapObjectURLs[key]);
            delete this.mapObjectURLs[key];
        }
    };
    ModelAsset.prototype._loadTextures = function () {
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
                if (_this.pub.wrapping === "repeat") {
                    texture.wrapS = SupEngine.THREE.RepeatWrapping;
                    texture.wrapT = SupEngine.THREE.RepeatWrapping;
                }
                else if (_this.pub.wrapping === "mirroredRepeat") {
                    texture.wrapS = SupEngine.THREE.MirroredRepeatWrapping;
                    texture.wrapT = SupEngine.THREE.MirroredRepeatWrapping;
                }
                var typedArray = new Uint8Array(buffer);
                var blob = new Blob([typedArray], { type: "image/*" });
                image.src = _this.mapObjectURLs[key] = URL.createObjectURL(blob);
            }
            if (!image.complete) {
                image.addEventListener("load", function () { texture.needsUpdate = true; });
            }
        });
    };
    ModelAsset.prototype.client_setProperty = function (path, value) {
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
            case "wrapping":
                for (var textureName in this.pub.textures) {
                    var texture = this.pub.textures[textureName];
                    if (value === "clampToEdge") {
                        texture.wrapS = SupEngine.THREE.ClampToEdgeWrapping;
                        texture.wrapT = SupEngine.THREE.ClampToEdgeWrapping;
                    }
                    else if (value === "repeat") {
                        texture.wrapS = SupEngine.THREE.RepeatWrapping;
                        texture.wrapT = SupEngine.THREE.RepeatWrapping;
                    }
                    else if (value === "mirroredRepeat") {
                        texture.wrapS = SupEngine.THREE.MirroredRepeatWrapping;
                        texture.wrapT = SupEngine.THREE.MirroredRepeatWrapping;
                    }
                    texture.needsUpdate = true;
                }
                break;
        }
    };
    ModelAsset.prototype.server_setModel = function (client, upAxisMatrix, attributes, bones, callback) {
        // Validate up matrix
        if (upAxisMatrix != null) {
            var violation = SupCore.Data.Base.getRuleViolation(upAxisMatrix, ModelAsset.schema["upAxisMatrix"], true);
            if (violation != null) {
                callback("Invalid up axis matrix: " + SupCore.Data.Base.formatRuleViolation(violation));
                return;
            }
        }
        // Validate attributes
        if (attributes == null || typeof attributes !== "object") {
            callback("Attributes must be an object");
            return;
        }
        for (var key in attributes) {
            var value = attributes[key];
            if (ModelAsset.schema["attributes"].properties[key] == null) {
                callback("Unsupported attribute type: " + key);
                return;
            }
            if (value != null && !(value instanceof Buffer)) {
                callback("Value for " + key + " must be an ArrayBuffer or null");
                return;
            }
        }
        // Validate bones
        if (bones != null) {
            var violation = SupCore.Data.Base.getRuleViolation(bones, ModelAsset.schema["bones"], true);
            if (violation != null) {
                callback("Invalid bones: " + SupCore.Data.Base.formatRuleViolation(violation));
                return;
            }
        }
        // Apply changes
        this.pub.upAxisMatrix = upAxisMatrix;
        this.pub.attributes = attributes;
        this.pub.bones = bones;
        callback(null, upAxisMatrix, attributes, bones);
        this.emit("change");
    };
    ModelAsset.prototype.client_setModel = function (upAxisMatrix, attributes, bones) {
        this.pub.upAxisMatrix = upAxisMatrix;
        this.pub.attributes = attributes;
        this.pub.bones = bones;
    };
    ModelAsset.prototype.server_setMaps = function (client, maps, callback) {
        if (maps == null || typeof maps !== "object") {
            callback("Maps must be an object");
            return;
        }
        for (var mapName in maps) {
            var value = maps[mapName];
            if (this.pub.maps[mapName] == null) {
                callback("The map " + mapName + " doesn't exist");
                return;
            }
            if (value != null && !(value instanceof Buffer)) {
                callback("Value for " + mapName + " must be an ArrayBuffer or null");
                return;
            }
        }
        for (var mapName in maps)
            this.pub.maps[mapName] = maps[mapName];
        callback(null, maps);
        this.emit("change");
    };
    ModelAsset.prototype.client_setMaps = function (maps) {
        for (var mapName in maps)
            this.pub.maps[mapName] = maps[mapName];
        this._loadTextures();
    };
    ModelAsset.prototype.server_newMap = function (client, name, callback) {
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
    ModelAsset.prototype.client_newMap = function (name) {
        this.pub.maps[name] = new Buffer(0);
    };
    ModelAsset.prototype.server_deleteMap = function (client, name, callback) {
        if (name == null || typeof name !== "string") {
            callback("Name of the map must be a string", null);
            return;
        }
        if (this.pub.maps[name] == null) {
            callback("The map " + name + " doesn't exist", null);
            return;
        }
        this.client_deleteMap(name);
        callback(null, name);
        this.emit("change");
    };
    ModelAsset.prototype.client_deleteMap = function (name) {
        for (var slotName in this.pub.mapSlots) {
            var map = this.pub.mapSlots[slotName];
            if (map === name)
                this.pub.mapSlots[slotName] = null;
        }
        // NOTE: do not delete, the key must exist so the file can be deleted from the disk when the asset is saved
        this.pub.maps[name] = null;
    };
    ModelAsset.prototype.server_renameMap = function (client, oldName, newName, callback) {
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
    ModelAsset.prototype.client_renameMap = function (oldName, newName) {
        this.pub.maps[newName] = this.pub.maps[oldName];
        this.pub.maps[oldName] = null;
        for (var slotName in this.pub.mapSlots) {
            var map = this.pub.mapSlots[slotName];
            if (map === oldName)
                this.pub.mapSlots[slotName] = newName;
        }
    };
    ModelAsset.prototype.server_setMapSlot = function (client, slot, map, callback) {
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
        this.pub.mapSlots[slot] = map;
        callback(null, slot, map);
        this.emit("change");
    };
    ModelAsset.prototype.client_setMapSlot = function (slot, map) {
        this.pub.mapSlots[slot] = map;
    };
    // Animations
    ModelAsset.prototype.server_newAnimation = function (client, name, duration, keyFrames, callback) {
        var _this = this;
        if (duration == null)
            duration = 0;
        if (keyFrames == null)
            keyFrames = [];
        var animation = { name: name, duration: duration, keyFrames: keyFrames };
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
    ModelAsset.prototype.client_newAnimation = function (animation, actualIndex) {
        this.animations.client_add(animation, actualIndex);
    };
    ModelAsset.prototype.server_deleteAnimation = function (client, id, callback) {
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
    ModelAsset.prototype.client_deleteAnimation = function (id) {
        this.animations.client_remove(id);
    };
    ModelAsset.prototype.server_moveAnimation = function (client, id, newIndex, callback) {
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
    ModelAsset.prototype.client_moveAnimation = function (id, newIndex) {
        this.animations.client_move(id, newIndex);
    };
    ModelAsset.prototype.server_setAnimationProperty = function (client, id, key, value, callback) {
        var _this = this;
        if (key === "name") {
            if (typeof value !== "string") {
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
    ModelAsset.prototype.client_setAnimationProperty = function (id, key, actualValue) {
        this.animations.client_setProperty(id, key, actualValue);
    };
    ModelAsset.prototype.server_setAnimation = function (client, id, duration, keyFrames, callback) {
        var violation = SupCore.Data.Base.getRuleViolation(duration, ModelAnimations_1.default.schema.duration, true);
        if (violation != null) {
            callback("Invalid duration: " + SupCore.Data.Base.formatRuleViolation(violation));
            return;
        }
        violation = SupCore.Data.Base.getRuleViolation(keyFrames, ModelAnimations_1.default.schema.keyFrames, true);
        if (violation != null) {
            callback("Invalid duration: " + SupCore.Data.Base.formatRuleViolation(violation));
            return;
        }
        var animation = this.animations.byId[id];
        if (animation == null) {
            callback("Invalid animation id: " + id);
            return;
        }
        animation.duration = duration;
        animation.keyFrames = keyFrames;
        callback(null, id, duration, keyFrames);
        this.emit("change");
    };
    ModelAsset.prototype.client_setAnimation = function (id, duration, keyFrames) {
        var animation = this.animations.byId[id];
        animation.duration = duration;
        animation.keyFrames = keyFrames;
    };
    ModelAsset.currentFormatVersion = 1;
    ModelAsset.schema = {
        formatVersion: { type: "integer" },
        unitRatio: { type: "number", minExcluded: 0, mutable: true },
        upAxisMatrix: { type: "array", length: 16, items: { type: "number" } },
        attributes: {
            type: "hash",
            properties: {
                position: { type: "buffer?", mutable: true },
                index: { type: "buffer?", mutable: true },
                color: { type: "buffer?", mutable: true },
                uv: { type: "buffer?", mutable: true },
                normal: { type: "buffer?", mutable: true },
                skinIndex: { type: "buffer?", mutable: true },
                skinWeight: { type: "buffer?", mutable: true }
            }
        },
        bones: {
            type: "array",
            items: {
                type: "hash",
                properties: {
                    name: { type: "string", minLength: 1, maxLength: 80 },
                    parentIndex: { type: "integer?" },
                    matrix: { type: "array", length: 16, items: { type: "number" } }
                }
            }
        },
        // TODO: Material
        maps: {
            type: "hash",
            values: { type: "buffer?" }
        },
        filtering: { type: "enum", items: ["pixelated", "smooth"], mutable: true },
        wrapping: { type: "enum", items: ["clampToEdge", "repeat", "mirroredRepeat"], mutable: true },
        animations: { type: "array" },
        opacity: { type: "number?", min: 0, max: 1, mutable: true },
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
    return ModelAsset;
})(SupCore.Data.Base.Asset);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ModelAsset;
