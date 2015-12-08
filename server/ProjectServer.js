var fs = require("fs");
var path = require("path");
var async = require("async");
var paths = require("./paths");
var authenticate_1 = require("./authenticate");
var RemoteProjectClient_1 = require("./RemoteProjectClient");
var schemas = require("./schemas");
var migrateProject_1 = require("./migrateProject");
var saveDelay = 60;
var ProjectServer = (function () {
    function ProjectServer(globalIO, folderName, callback) {
        var _this = this;
        this.scheduledSaveCallbacks = {};
        this.nextClientId = 0;
        this.clientsBySocketId = {};
        this.scheduleAssetSave = function (id) {
            var item = _this.data.assets.byId[id];
            if (item == null) {
                SupCore.log("Tried to schedule an asset save for item with id " + id + " but the asset is not loaded.");
                SupCore.log(JSON.stringify(_this.data.entries.byId[id], null, 2));
                SupCore.log((new Error()).stack);
                return;
            }
            var assetPath = path.join(_this.projectPath, "assets/" + _this.data.entries.getStoragePathFromId(id));
            var saveCallback = item.save.bind(item, assetPath);
            _this.scheduleSave(saveDelay, "assets:" + id, saveCallback);
        };
        this.onAssetLoaded = function (assetId, item) {
            item.on("change", function () { _this.scheduleAssetSave(assetId); });
            item.on("setDiagnostic", function (diagnosticId, type, data) { _this.setDiagnostic(assetId, diagnosticId, type, data); });
            item.on("clearDiagnostic", function (diagnosticId) { _this.clearDiagnostic(assetId, diagnosticId); });
            item.on("addDependencies", function (dependencyEntryIds) { _this.addDependencies(assetId, dependencyEntryIds); });
            item.on("removeDependencies", function (dependencyEntryIds) { _this.removeDependencies(assetId, dependencyEntryIds); });
        };
        this.onRoomLoaded = function (roomId, item) {
            var roomPath = path.join(_this.projectPath, "rooms/" + roomId);
            var saveCallback = item.save.bind(item, roomPath);
            item.on("change", function () { _this.scheduleSave(saveDelay, "rooms:" + roomId, saveCallback); });
        };
        this.onResourceLoaded = function (resourceId, item) {
            var resourcePath = path.join(_this.projectPath, "resources/" + resourceId);
            var saveCallback = item.save.bind(item, resourcePath);
            item.on("change", function () { _this.scheduleSave(saveDelay, "resources:" + resourceId, saveCallback); });
            item.on("command", function (cmd) {
                var callbackArgs = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    callbackArgs[_i - 1] = arguments[_i];
                }
                (_a = _this.io.in("sub:resources:" + resourceId)).emit.apply(_a, ["edit:resources", resourceId, cmd].concat(callbackArgs));
                var _a;
            });
        };
        this.onAddSocket = function (socket) {
            var client = new RemoteProjectClient_1.default(_this, (_this.nextClientId++).toString(), socket);
            _this.clientsBySocketId[socket.id] = client;
        };
        this.scheduleSave = function (minimumSecondsElapsed, callbackName, callback) {
            // this.log(`Scheduling a save: ${callbackName}`);
            var scheduledCallback = _this.scheduledSaveCallbacks[callbackName];
            if (scheduledCallback != null && scheduledCallback.timeoutId != null)
                return;
            var errorCallback = function (err) {
                // this.log(`Save done! ${callbackName}`);
                if (err != null)
                    _this.log("Error in " + callbackName + ":\n" + err);
            };
            if (scheduledCallback == null || scheduledCallback.lastTime <= Date.now() - minimumSecondsElapsed * 1000) {
                _this.scheduledSaveCallbacks[callbackName] = { lastTime: Date.now(), timeoutId: null, callback: null };
                callback(errorCallback);
            }
            else {
                var delay = minimumSecondsElapsed * 1000 - (Date.now() - scheduledCallback.lastTime);
                var timeoutId = setTimeout(function () {
                    callback(errorCallback);
                    scheduledCallback.lastTime = Date.now();
                    scheduledCallback.timeoutId = null;
                    scheduledCallback.callback = null;
                }, delay);
                scheduledCallback.timeoutId = timeoutId;
                scheduledCallback.callback = callback;
            }
        };
        this.onManifestChanged = function () { _this.scheduleSave(saveDelay, "manifest", _this.saveManifest); };
        this.onEntriesChanged = function () { _this.scheduleSave(saveDelay, "entries", _this.saveEntries); };
        this.saveManifest = function (callback) {
            var manifestJSON = JSON.stringify(_this.data.manifest.pub, null, 2);
            fs.writeFile(path.join(_this.projectPath, "manifest.json"), manifestJSON, callback);
        };
        this.saveEntries = function (callback) {
            var entriesJSON = JSON.stringify(_this.data.entries.getForStorage(), null, 2);
            fs.writeFile(path.join(_this.projectPath, "newEntries.json"), entriesJSON, function () {
                fs.rename(path.join(_this.projectPath, "newEntries.json"), path.join(_this.projectPath, "entries.json"), callback);
            });
        };
        this.projectPath = path.join(paths.projects, folderName);
        this.data = {
            manifest: null,
            entries: null,
            assets: new SupCore.Data.Assets(this),
            rooms: new SupCore.Data.Rooms(this),
            resources: new SupCore.Data.Resources(this)
        };
        this.data.assets.on("itemLoad", this.onAssetLoaded);
        this.data.rooms.on("itemLoad", this.onRoomLoaded);
        this.data.resources.on("itemLoad", this.onResourceLoaded);
        var loadManifest = function (callback) {
            var done = function (data) {
                try {
                    _this.data.manifest = new SupCore.Data.ProjectManifest(data);
                }
                catch (err) {
                    callback(err);
                    return;
                }
                _this.data.manifest.on("change", _this.onManifestChanged);
                if (_this.data.manifest.migratedFromFormatVersion != null)
                    _this.data.manifest.emit("change");
                _this.system = SupCore.systems[_this.data.manifest.pub.system];
                _this.buildsPath = path.join(paths.builds, _this.data.manifest.pub.id);
                callback(null);
            };
            fs.readFile(path.join(_this.projectPath, "manifest.json"), { encoding: "utf8" }, function (err, manifestJSON) {
                if (err != null) {
                    callback(err);
                    return;
                }
                var manifestData;
                try {
                    manifestData = JSON.parse(manifestJSON);
                }
                catch (err) {
                    callback(err);
                    return;
                }
                try {
                    schemas.validate(manifestData, "projectManifest");
                }
                catch (err) {
                    callback(err);
                    return;
                }
                done(manifestData);
            });
        };
        var setupNextBuildId = function (callback) {
            fs.readdir(_this.buildsPath, function (err, entryIds) {
                if (err != null && err.code !== "ENOENT") {
                    callback(err);
                    return;
                }
                _this.nextBuildId = 0;
                if (entryIds != null) {
                    for (var _i = 0; _i < entryIds.length; _i++) {
                        var entryId = entryIds[_i];
                        var entryBuildId = parseInt(entryId, 10);
                        if (isNaN(entryBuildId))
                            continue;
                        _this.nextBuildId = Math.max(entryBuildId + 1, _this.nextBuildId);
                    }
                }
                callback(null);
            });
        };
        var loadEntries = function (callback) {
            fs.readFile(path.join(_this.projectPath, "entries.json"), { encoding: "utf8" }, function (err, entriesJSON) {
                if (err != null) {
                    callback(err);
                    return;
                }
                var entriesData;
                try {
                    entriesData = JSON.parse(entriesJSON);
                }
                catch (err) {
                    callback(err);
                    return;
                }
                try {
                    schemas.validate(entriesData, "projectEntries");
                }
                catch (err) {
                    callback(err);
                    return;
                }
                _this.data.entries = new SupCore.Data.Entries(entriesData, _this);
                _this.data.entries.on("change", _this.onEntriesChanged);
                callback(null);
            });
        };
        // migrate() is called after loadEntries()
        // because some migration code requires the entries to be loaded
        var migrate = function (callback) {
            migrateProject_1.default(_this, callback);
        };
        var serve = function (callback) {
            // Setup the project's namespace
            _this.io = globalIO.of("/project:" + _this.data.manifest.pub.id);
            _this.io.use(authenticate_1.default);
            _this.io.on("connection", _this.onAddSocket);
            callback(null);
        };
        // prepareAssets() and prepareResources() is called after serve()
        // because diagnostics rely on this.io being setup
        var prepareAssets = function (callback) {
            async.each(Object.keys(_this.data.entries.byId), function (assetId, cb) {
                // Ignore folders
                if (_this.data.entries.byId[assetId].type == null) {
                    cb();
                    return;
                }
                _this.data.assets.acquire(assetId, null, function (err, asset) {
                    if (err != null) {
                        cb(err);
                        return;
                    }
                    asset.restore();
                    _this.data.assets.release(assetId, null, { skipUnloadDelay: true });
                    cb();
                });
            }, callback);
        };
        var prepareResources = function (callback) {
            async.each(Object.keys(_this.system.data.resourceClasses), function (resourceName, cb) {
                _this.data.resources.acquire(resourceName, null, function (err, resource) {
                    if (err != null) {
                        cb(err);
                        return;
                    }
                    // resource.restore();
                    _this.data.resources.release(resourceName, null, { skipUnloadDelay: true });
                    cb();
                });
            }, callback);
        };
        async.series([loadManifest, setupNextBuildId, loadEntries, migrate, serve, prepareAssets, prepareResources], callback);
    }
    ProjectServer.prototype.log = function (message) {
        SupCore.log("[" + this.data.manifest.pub.id + " " + this.data.manifest.pub.name + "] " + message);
    };
    ProjectServer.prototype.save = function (callback) {
        var saveCallbacks = [];
        for (var callbackName in this.scheduledSaveCallbacks) {
            var callbackInfo = this.scheduledSaveCallbacks[callbackName];
            if (callbackInfo.timeoutId == null)
                continue;
            clearTimeout(callbackInfo.timeoutId);
            saveCallbacks.push(callbackInfo.callback);
        }
        this.scheduledSaveCallbacks = {};
        async.parallel(saveCallbacks, callback);
    };
    ProjectServer.prototype.moveAssetFolderToTrash = function (trashedAssetFolder, callback) {
        var assetsPath = path.join(this.projectPath, "assets");
        var trashedAssetsPath = path.join(this.projectPath, "trashedAssets");
        fs.mkdir(trashedAssetsPath, function (err) {
            if (err != null && err.code !== "EEXIST")
                throw err;
            var folderPath = path.join(assetsPath, trashedAssetFolder);
            var folderNumber = 0;
            var renameSuccessful = false;
            async.until(function () { return renameSuccessful; }, function (cb) {
                var newFolderPath = path.join(trashedAssetsPath, trashedAssetFolder);
                if (folderNumber > 0)
                    newFolderPath = newFolderPath + " (" + folderNumber + ")";
                fs.rename(folderPath, newFolderPath, function (err) {
                    if (err != null)
                        folderNumber++;
                    else
                        renameSuccessful = true;
                    cb();
                });
            }, callback);
        });
    };
    ProjectServer.prototype.removeRemoteClient = function (socketId) {
        delete this.clientsBySocketId[socketId];
    };
    ProjectServer.prototype.markMissingDependency = function (dependentAssetIds, missingAssetId) {
        for (var _i = 0; _i < dependentAssetIds.length; _i++) {
            var dependentAssetId = dependentAssetIds[_i];
            var missingAssetIds = [missingAssetId];
            var existingDiag = this.data.entries.diagnosticsByEntryId[dependentAssetId].byId["missingDependencies"];
            if (existingDiag != null) {
                missingAssetIds = missingAssetIds.concat(existingDiag.data.missingAssetIds);
            }
            ;
            this.setDiagnostic(dependentAssetId, "missingDependencies", "error", { missingAssetIds: missingAssetIds });
        }
    };
    ProjectServer.prototype.setDiagnostic = function (assetId, diagnosticId, type, data) {
        var _this = this;
        // console.log(`setDiagnostic ${assetId} ${diagnosticId} ${type}`);
        var diagnostics = this.data.entries.diagnosticsByEntryId[assetId];
        var newDiag = { id: diagnosticId, type: type, data: data };
        var existingDiag = diagnostics.byId[diagnosticId];
        if (existingDiag != null) {
            existingDiag.type = type;
            existingDiag.data = data;
            this.io.in("sub:entries").emit("set:diagnostics", assetId, newDiag);
            return;
        }
        diagnostics.add(newDiag, null, function (err) {
            _this.io.in("sub:entries").emit("set:diagnostics", assetId, newDiag);
        });
    };
    ProjectServer.prototype.clearDiagnostic = function (assetId, diagnosticId) {
        var _this = this;
        // console.log(`clearDiagnostic ${assetId} ${diagnosticId}`);
        var diagnostics = this.data.entries.diagnosticsByEntryId[assetId];
        diagnostics.remove(diagnosticId, function (err) {
            _this.io.in("sub:entries").emit("clear:diagnostics", assetId, diagnosticId);
        });
    };
    ProjectServer.prototype.addDependencies = function (assetId, dependencyEntryIds) {
        var addedDependencyEntryIds = [];
        var missingAssetIds = [];
        var assetDependencies = this.data.entries.dependenciesByAssetId[assetId];
        if (assetDependencies == null)
            assetDependencies = this.data.entries.dependenciesByAssetId[assetId] = [];
        for (var _i = 0; _i < dependencyEntryIds.length; _i++) {
            var depId = dependencyEntryIds[_i];
            assetDependencies.push(depId);
            var depEntry = this.data.entries.byId[depId];
            if (depEntry == null) {
                missingAssetIds.push(depId);
                continue;
            }
            var dependentAssetIds = depEntry.dependentAssetIds;
            if (dependentAssetIds.indexOf(assetId) === -1) {
                dependentAssetIds.push(assetId);
                addedDependencyEntryIds.push(depId);
            }
        }
        if (missingAssetIds.length > 0) {
            var existingDiag = this.data.entries.diagnosticsByEntryId[assetId].byId["missingDependencies"];
            if (existingDiag != null)
                missingAssetIds = missingAssetIds.concat(existingDiag.data.missingAssetIds);
            this.setDiagnostic(assetId, "missingDependencies", "error", { missingAssetIds: missingAssetIds });
        }
        if (addedDependencyEntryIds.length > 0) {
            this.io.in("sub:entries").emit("add:dependencies", assetId, addedDependencyEntryIds);
        }
    };
    ProjectServer.prototype.removeDependencies = function (assetId, dependencyEntryIds) {
        var removedDependencyEntryIds = [];
        var missingAssetIds = [];
        var assetDependencies = this.data.entries.dependenciesByAssetId[assetId];
        if (assetDependencies == null)
            assetDependencies = this.data.entries.dependenciesByAssetId[assetId] = [];
        for (var _i = 0; _i < dependencyEntryIds.length; _i++) {
            var depId = dependencyEntryIds[_i];
            assetDependencies.splice(assetDependencies.indexOf(depId), 1);
            var depEntry = this.data.entries.byId[depId];
            if (depEntry == null) {
                missingAssetIds.push(depId);
                continue;
            }
            var dependentAssetIds = depEntry.dependentAssetIds;
            var index = dependentAssetIds.indexOf(assetId);
            if (index !== -1) {
                dependentAssetIds.splice(index, 1);
                removedDependencyEntryIds.push(depId);
            }
        }
        if (missingAssetIds.length > 0) {
            var existingDiag = this.data.entries.diagnosticsByEntryId[assetId].byId["missingDependencies"];
            if (existingDiag != null) {
                for (var _a = 0; _a < missingAssetIds.length; _a++) {
                    var missingAssetId = missingAssetIds[_a];
                    var index = existingDiag.data.missingAssetIds.indexOf(missingAssetId);
                    if (index !== -1) {
                        existingDiag.data.missingAssetIds.splice(index, 1);
                    }
                }
                if (existingDiag.data.missingAssetIds.length === 0)
                    this.clearDiagnostic(assetId, "missingDependencies");
                else
                    this.setDiagnostic(assetId, "missingDependencies", "error", existingDiag.data);
            }
        }
        if (removedDependencyEntryIds.length > 0) {
            this.io.in("sub:entries").emit("remove:dependencies", assetId, removedDependencyEntryIds);
        }
        if (assetDependencies.length === 0) {
            delete this.data.entries.dependenciesByAssetId[assetId];
        }
    };
    return ProjectServer;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ProjectServer;
