var async = require("async");
var Player = (function () {
    function Player(canvas, dataURL, options) {
        var _this = this;
        this.entriesById = {};
        this.entriesByPath = {};
        this.resources = {};
        this.assetsById = {};
        this.outerAssetsById = {};
        this.tick = function (timestamp) {
            if (timestamp === void 0) { timestamp = 0; }
            _this.tickAnimationFrameId = requestAnimationFrame(_this.tick);
            _this.accumulatedTime += timestamp - _this.lastTimestamp;
            _this.lastTimestamp = timestamp;
            var _a = _this.gameInstance.tick(_this.accumulatedTime), updates = _a.updates, timeLeft = _a.timeLeft;
            _this.accumulatedTime = timeLeft;
            if (_this.gameInstance.exited) {
                cancelAnimationFrame(_this.tickAnimationFrameId);
                return;
            }
            if (updates > 0)
                _this.gameInstance.draw();
        };
        this.canvas = canvas;
        this.dataURL = dataURL;
        options.enableOnExit = true;
        this.gameInstance = new SupEngine.GameInstance(this.canvas, options);
    }
    Player.prototype.load = function (progressCallback, callback) {
        var _this = this;
        var progress = 0;
        var innerProgressCallback = function () {
            progress++;
            var total = _this.resourcesToLoad.length + _this.assetsToLoad.length;
            progressCallback(progress, total);
        };
        async.series([
            function (cb) { _this._loadManifest(cb); },
            function (cb) { _this._loadResources(innerProgressCallback, cb); },
            function (cb) { _this._loadAssets(innerProgressCallback, cb); },
            function (cb) { _this._initPlugins(cb); },
            function (cb) { _this._startPlugins(cb); },
            function (cb) { _this._lateStartPlugins(cb); }
        ], callback);
    };
    Player.prototype._loadManifest = function (callback) {
        var _this = this;
        this.getAssetData("project.json", "json", function (err, project) {
            if (err != null) {
                callback(new Error("Failed to load game manifest"));
                return;
            }
            _this.gameName = project.name;
            document.title = project.name;
            _this.resourcesToLoad = Object.keys(SupRuntime.resourcePlugins);
            _this.assetsToLoad = [];
            var walk = function (asset, parent) {
                if (parent === void 0) { parent = ""; }
                var children;
                if (asset.children != null) {
                    children = [];
                    for (var _i = 0, _a = asset.children; _i < _a.length; _i++) {
                        var child = _a[_i];
                        children.push(child.name);
                    }
                }
                var path = "" + parent + asset.name;
                _this.assetsToLoad.push({ id: asset.id, name: asset.name, path: path, storagePath: asset.id + "-" + path.replace(new RegExp("/", "g"), "__"), type: asset.type, children: children });
                parent += asset.name + "/";
                if (asset.children == null)
                    return;
                for (var _b = 0, _c = asset.children; _b < _c.length; _b++) {
                    var child = _c[_b];
                    walk(child, parent);
                }
            };
            for (var _i = 0, _a = project.assets; _i < _a.length; _i++) {
                var asset = _a[_i];
                walk(asset);
            }
            callback();
        });
    };
    Player.prototype._loadResources = function (progressCallback, callback) {
        var _this = this;
        if (this.resourcesToLoad.length === 0) {
            callback();
            return;
        }
        var resourcesLoaded = 0;
        var onResourceLoaded = function (err, resourceName, resource) {
            if (err != null) {
                callback(new Error("Failed to load resource " + resourceName + ": " + err.message));
                return;
            }
            _this.resources[resourceName] = resource;
            progressCallback();
            resourcesLoaded++;
            if (resourcesLoaded === _this.resourcesToLoad.length)
                callback();
        };
        // NOTE: Have to use .forEach because of TS4091 (closure references block-scoped variable)
        this.resourcesToLoad.forEach(function (resourceName) {
            var plugin = SupRuntime.resourcePlugins[resourceName];
            if (plugin == null) {
                // This resource isn't meant to be loaded at runtime, skip
                onResourceLoaded(null, resourceName, null);
                return;
            }
            plugin.loadResource(_this, resourceName, function (err, data) { onResourceLoaded(err, resourceName, data); });
        });
    };
    Player.prototype._loadAssets = function (progressCallback, callback) {
        var _this = this;
        if (this.gameInstance.threeRenderer == null) {
            callback(new Error("Failed to initialize renderer. Your device might not support WebGL."));
            return;
        }
        if (this.assetsToLoad.length === 0) {
            callback();
            return;
        }
        var assetsLoaded = 0;
        var onAssetLoaded = function (err, entry, asset) {
            if (err != null) {
                callback(new Error("Failed to load asset " + entry.path + ": " + err.message));
                return;
            }
            _this.entriesById[entry.id] = entry;
            _this.entriesByPath[entry.path] = entry;
            _this.assetsById[entry.id] = asset;
            progressCallback();
            assetsLoaded++;
            if (assetsLoaded === _this.assetsToLoad.length)
                callback();
        };
        // NOTE: Have to use .forEach because of TS4091 (closure references block-scoped variable)
        this.assetsToLoad.forEach(function (entry) {
            if (entry.children != null) {
                onAssetLoaded(null, entry, {});
                return;
            }
            var plugin = SupRuntime.plugins[entry.type];
            if (plugin == null || plugin.loadAsset == null) {
                console.warn("Don't know how to load assets of type \"" + entry.type + "\"");
                onAssetLoaded(null, entry, {});
                return;
            }
            plugin.loadAsset(_this, entry, function (err, data) { onAssetLoaded(err, entry, data); });
        });
    };
    Player.prototype._initPlugins = function (callback) {
        var _this = this;
        async.each(Object.keys(SupRuntime.plugins), function (name, cb) {
            var plugin = SupRuntime.plugins[name];
            if (plugin.init != null)
                plugin.init(_this, cb);
            else
                cb();
        }, callback);
    };
    Player.prototype._startPlugins = function (callback) {
        var _this = this;
        async.each(Object.keys(SupRuntime.plugins), function (name, cb) {
            var plugin = SupRuntime.plugins[name];
            if (plugin.start != null)
                plugin.start(_this, cb);
            else
                cb();
        }, callback);
    };
    Player.prototype._lateStartPlugins = function (callback) {
        var _this = this;
        async.each(Object.keys(SupRuntime.plugins), function (name, cb) {
            var plugin = SupRuntime.plugins[name];
            if (plugin.lateStart != null)
                plugin.lateStart(_this, cb);
            else
                cb();
        }, callback);
    };
    Player.prototype.run = function () {
        this.lastTimestamp = 0;
        this.accumulatedTime = 0;
        this.canvas.focus();
        this.tick();
    };
    Player.prototype.getAssetData = function (path, responseType, callback) {
        window.fetch("" + this.dataURL + path)
            .then(function (response) {
            if (responseType === "json")
                return response.json();
            else if (responseType === "text")
                return response.text();
            else
                return response.arrayBuffer();
        })
            .then(function (result) { callback(null, result); })
            .catch(function (err) { callback(new Error("Could not get " + path)); return; });
    };
    Player.prototype.getOuterAsset = function (assetId) {
        var outerAsset = this.outerAssetsById[assetId];
        var asset = this.assetsById[assetId];
        var entry = this.entriesById[assetId];
        if (outerAsset == null && asset != null) {
            if (entry.type == null) {
                outerAsset = { name: entry.name, path: entry.path, type: "folder", children: entry.children };
            }
            else {
                var plugin = SupRuntime.plugins[this.entriesById[assetId].type];
                outerAsset = this.outerAssetsById[assetId] =
                    // Temporary check until every asset is correctly handled
                    (plugin.createOuterAsset != null) ? plugin.createOuterAsset(this, asset) : asset;
                outerAsset.name = entry.name;
                outerAsset.path = entry.path;
                outerAsset.type = entry.type;
            }
        }
        return outerAsset;
    };
    Player.prototype.createActor = function () { throw new Error("Player.createActor should be defined by a scripting plugin"); };
    Player.prototype.createComponent = function () { throw new Error("Player.createComponent should be defined by a scripting plugin"); };
    return Player;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Player;
