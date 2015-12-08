var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BaseRemoteClient_1 = require("./BaseRemoteClient");
var config_1 = require("./config");
var loadSystems_1 = require("./loadSystems");
var path = require("path");
var fs = require("fs");
var rimraf = require("rimraf");
var async = require("async");
var recursiveReaddir = require("recursive-readdir");
var _ = require("lodash");
var RemoteProjectClient = (function (_super) {
    __extends(RemoteProjectClient, _super);
    function RemoteProjectClient(server, id, socket) {
        var _this = this;
        _super.call(this, server, socket);
        // Manifest
        this.onSetManifestProperty = function (key, value, callback) {
            _this.server.data.manifest.setProperty(key, value, function (err, actualValue) {
                if (err != null) {
                    callback(err, null);
                    return;
                }
                _this.server.io.in("sub:manifest").emit("setProperty:manifest", key, actualValue);
                callback(null, actualValue);
            });
        };
        // Entries
        this.onAddEntry = function (name, type, options, callback) {
            if (!_this.errorIfCant("editAssets", callback))
                return;
            name = name.trim();
            if (name.length === 0) {
                callback("Entry name cannot be empty");
                return;
            }
            if (name.indexOf("/") !== -1) {
                callback("Entry name cannot contain slashes");
                return;
            }
            var entry = { id: null, name: name, type: type, diagnostics: [], dependentAssetIds: [] };
            if (options == null)
                options = {};
            _this.server.data.entries.add(entry, options.parentId, options.index, function (err, actualIndex) {
                if (err != null) {
                    callback(err, null);
                    return;
                }
                var onEntryCreated = function () {
                    _this.server.io.in("sub:entries").emit("add:entries", entry, options.parentId, actualIndex);
                    callback(null, entry.id);
                };
                if (entry.type != null) {
                    var assetClass = _this.server.system.data.assetClasses[entry.type];
                    var asset = new assetClass(entry.id, null, _this.server);
                    asset.init({ name: entry.name }, function () {
                        var assetPath = path.join(_this.server.projectPath, "assets/" + _this.server.data.entries.getStoragePathFromId(entry.id));
                        fs.mkdirSync(assetPath);
                        asset.save(assetPath, onEntryCreated);
                    });
                }
                else {
                    onEntryCreated();
                }
            });
        };
        this.onDuplicateEntry = function (newName, id, options, callback) {
            if (!_this.errorIfCant("editAssets", callback))
                return;
            var entryToDuplicate = _this.server.data.entries.byId[id];
            if (entryToDuplicate == null) {
                callback("Entry " + id + " doesn't exist");
                return;
            }
            if (entryToDuplicate.type == null) {
                callback("Entry to duplicate must be an asset");
                return;
            }
            var entry = {
                id: null, name: newName, type: entryToDuplicate.type,
                diagnostics: _.cloneDeep(entryToDuplicate.diagnostics),
                dependentAssetIds: []
            };
            if (options == null)
                options = {};
            _this.server.data.entries.add(entry, options.parentId, options.index, function (err, actualIndex) {
                if (err != null) {
                    callback(err);
                    return;
                }
                var newAssetPath = path.join(_this.server.projectPath, "assets/" + _this.server.data.entries.getStoragePathFromId(entry.id));
                _this.server.data.assets.acquire(id, null, function (err, referenceAsset) {
                    fs.mkdirSync(newAssetPath);
                    referenceAsset.save(newAssetPath, function (err) {
                        _this.server.data.assets.release(id, null);
                        if (err != null) {
                            _this.server.log("Failed to save duplicated asset at " + newAssetPath + " (duplicating " + id + ")");
                            _this.server.log(err.toString());
                            _this.server.data.entries.remove(entry.id, function (err) { if (err != null)
                                _this.server.log(err); });
                            callback("Could not save asset");
                            return;
                        }
                        _this.server.io.in("sub:entries").emit("add:entries", entry, options.parentId, actualIndex);
                        callback(null, entry.id);
                        return;
                    });
                });
            });
        };
        this.onMoveEntry = function (id, parentId, index, callback) {
            if (!_this.errorIfCant("editAssets", callback))
                return;
            var oldFullAssetPath = _this.server.data.entries.getStoragePathFromId(id, { includeId: false });
            _this.server.data.entries.move(id, parentId, index, function (err, actualIndex) {
                if (err != null) {
                    callback(err);
                    return;
                }
                _this.onEntryChangeFullPath(id, oldFullAssetPath);
                _this.server.io.in("sub:entries").emit("move:entries", id, parentId, actualIndex);
                callback(null);
            });
        };
        this.onTrashEntry = function (id, callback) {
            if (!_this.errorIfCant("editAssets", callback))
                return;
            var entry = _this.server.data.entries.byId[id];
            var trashedAssetFolder = _this.server.data.entries.getStoragePathFromId(id);
            var asset = null;
            var doTrashEntry = function () {
                // Clear all dependencies for this entry
                var dependentAssetIds = (entry != null) ? entry.dependentAssetIds : null;
                var dependencies = _this.server.data.entries.dependenciesByAssetId[id];
                if (dependencies != null) {
                    var removedDependencyEntryIds = [];
                    for (var _i = 0; _i < dependencies.length; _i++) {
                        var depId = dependencies[_i];
                        var depEntry = _this.server.data.entries.byId[depId];
                        if (depEntry == null)
                            continue;
                        var dependentAssetIds_1 = depEntry.dependentAssetIds;
                        var index = dependentAssetIds_1.indexOf(id);
                        if (index !== -1) {
                            dependentAssetIds_1.splice(index, 1);
                            removedDependencyEntryIds.push(depId);
                        }
                    }
                    if (removedDependencyEntryIds.length > 0) {
                        _this.server.io.in("sub:entries").emit("remove:dependencies", id, dependencies);
                    }
                    delete _this.server.data.entries.dependenciesByAssetId[id];
                }
                // Delete the entry
                _this.server.data.entries.remove(id, function (err) {
                    if (err != null) {
                        callback(err);
                        return;
                    }
                    _this.server.io.in("sub:entries").emit("trash:entries", id);
                    // Notify and clear all asset subscribers
                    var roomName = "sub:assets:" + id;
                    _this.server.io.in(roomName).emit("trash:assets", id);
                    // NOTE: "SocketIO.Namespace.adapter" is not part of the official documented API
                    // It does exist though: https://github.com/Automattic/socket.io/blob/3f72dd3322bcefff07b5976ab817766e421d237b/lib/namespace.js#L89
                    for (var socketId in _this.server.io.adapter.rooms[roomName]) {
                        var remoteClient = _this.server.clientsBySocketId[socketId];
                        remoteClient.socket.leave(roomName);
                        remoteClient.subscriptions.splice(remoteClient.subscriptions.indexOf(roomName), 1);
                    }
                    // Generate diagnostics for any assets depending on this entry
                    if (dependentAssetIds != null)
                        _this.server.markMissingDependency(dependentAssetIds, id);
                    // Skip asset destruction & release if trashing a folder
                    if (asset == null) {
                        callback(null);
                        return;
                    }
                    // NOTE: It is important that we destroy the asset after having removed its entry
                    // from the tree so that nobody can subscribe to it after it's been destroyed
                    asset.destroy(function () {
                        _this.server.data.assets.releaseAll(id);
                        _this.server.moveAssetFolderToTrash(trashedAssetFolder, function () { callback(null); });
                    });
                });
            };
            // Skip asset acquisition if trashing a folder
            if (entry.type == null) {
                doTrashEntry();
                return;
            }
            _this.server.data.assets.acquire(id, null, function (err, acquiredAsset) {
                if (err != null) {
                    callback("Could not acquire asset");
                    return;
                }
                asset = acquiredAsset;
                doTrashEntry();
            });
        };
        this.onSetEntryProperty = function (id, key, value, callback) {
            if (!_this.errorIfCant("editAssets", callback))
                return;
            if (key === "name" && value.indexOf("/") !== -1) {
                callback("Entry name cannot contain slashes");
                return;
            }
            var oldFullAssetPath = _this.server.data.entries.getStoragePathFromId(id, { includeId: false });
            _this.server.data.entries.setProperty(id, key, value, function (err, actualValue) {
                if (err != null) {
                    callback(err);
                    return;
                }
                if (key === "name")
                    _this.onEntryChangeFullPath(id, oldFullAssetPath);
                _this.server.io.in("sub:entries").emit("setProperty:entries", id, key, actualValue);
                callback(null);
            });
        };
        this.onEntryChangeFullPath = function (assetId, oldFullAssetPath) {
            var entry = _this.server.data.entries.byId[assetId];
            if (entry.type == null) {
                for (var _i = 0, _a = entry.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    _this.onEntryChangeFullPath(child.id, oldFullAssetPath + "__" + child.name);
                }
                return;
            }
            var mustScheduleSave = false;
            var scheduledSaveCallback = _this.server.scheduledSaveCallbacks[("assets:" + assetId)];
            if (scheduledSaveCallback != null && scheduledSaveCallback.timeoutId != null) {
                clearTimeout(scheduledSaveCallback.timeoutId);
                scheduledSaveCallback.timeoutId = null;
                scheduledSaveCallback.callback = null;
                mustScheduleSave = true;
            }
            var oldDirPath = path.join(_this.server.projectPath, "assets/" + assetId + "-" + oldFullAssetPath);
            var dirPath = path.join(_this.server.projectPath, "assets/" + _this.server.data.entries.getStoragePathFromId(assetId));
            fs.rename(oldDirPath, dirPath, function (err) {
                if (mustScheduleSave)
                    _this.server.scheduleAssetSave(assetId);
            });
        };
        // Assets
        this.onEditAsset = function (id, command) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            var callback = null;
            if (typeof args[args.length - 1] === "function")
                callback = args.pop();
            if (!_this.errorIfCant("editAssets", callback))
                return;
            var entry = _this.server.data.entries.byId[id];
            if (entry == null || entry.type == null) {
                callback("No such asset");
                return;
            }
            if (command == null) {
                callback("Invalid command");
                return;
            }
            var commandMethod = _this.server.system.data.assetClasses[entry.type].prototype[("server_" + command)];
            if (commandMethod == null) {
                callback("Invalid command");
                return;
            }
            // if (callback == null) { this.server.log("Ignoring edit:assets command, missing a callback"); return; }
            _this.server.data.assets.acquire(id, null, function (err, asset) {
                if (err != null) {
                    callback("Could not acquire asset");
                    return;
                }
                commandMethod.call.apply(commandMethod, [asset, _this].concat(args, [function (err) {
                    var callbackArgs = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                        callbackArgs[_i - 1] = arguments[_i];
                    }
                    _this.server.data.assets.release(id, null);
                    if (err != null) {
                        callback(err);
                        return;
                    }
                    (_a = _this.server.io.in("sub:assets:" + id)).emit.apply(_a, ["edit:assets", id, command].concat(callbackArgs));
                    // If the first parameter has an id, send it back to the client
                    // Useful so that they can grab the thing they created
                    // (It's a bit of a hack, but has proven useful)
                    callback(null, (callbackArgs[0] != null) ? callbackArgs[0].id : null);
                    var _a;
                }]));
            });
        };
        // Resources
        this.onEditResource = function (id, command) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            var callback = null;
            if (typeof args[args.length - 1] === "function")
                callback = args.pop();
            if (!_this.errorIfCant("editResources", callback))
                return;
            if (command == null) {
                callback("Invalid command");
                return;
            }
            var commandMethod = _this.server.system.data.resourceClasses[id].prototype[("server_" + command)];
            if (commandMethod == null) {
                callback("Invalid command");
                return;
            }
            // if (callback == null) { this.server.log("Ignoring edit:assets command, missing a callback"); return; }
            _this.server.data.resources.acquire(id, null, function (err, resource) {
                if (err != null) {
                    callback("Could not acquire resource");
                    return;
                }
                commandMethod.call.apply(commandMethod, [resource, _this].concat(args, [function (err) {
                    var callbackArgs = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                        callbackArgs[_i - 1] = arguments[_i];
                    }
                    _this.server.data.resources.release(id, null);
                    if (err != null) {
                        callback(err);
                        return;
                    }
                    (_a = _this.server.io.in("sub:resources:" + id)).emit.apply(_a, ["edit:resources", id, command].concat(callbackArgs));
                    // If the first parameter has an id, send it back to the client
                    // Useful so that they can grab the thing they created
                    // (It's a bit of a hack, but has proven useful)
                    callback(null, (callbackArgs[0] != null) ? callbackArgs[0].id : null);
                    var _a;
                }]));
            });
        };
        // Rooms
        this.onEditRoom = function (id, command) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            var callback = null;
            if (typeof args[args.length - 1] === "function")
                callback = args.pop();
            if (!_this.errorIfCant("editRooms", callback))
                return;
            if (command == null) {
                callback("Invalid command");
                return;
            }
            var commandMethod = SupCore.Data.Room.prototype[("server_" + command)];
            if (commandMethod == null) {
                callback("Invalid command");
                return;
            }
            // if (callback == null) { this.server.log("Ignoring edit:rooms command, missing a callback"); return; }
            _this.server.data.rooms.acquire(id, null, function (err, room) {
                if (err != null) {
                    callback("Could not acquire room");
                    return;
                }
                commandMethod.call.apply(commandMethod, [room, _this].concat(args, [function (err) {
                    var callbackArgs = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                        callbackArgs[_i - 1] = arguments[_i];
                    }
                    _this.server.data.rooms.release(id, null);
                    if (err != null) {
                        callback(err);
                        return;
                    }
                    (_a = _this.server.io.in("sub:rooms:" + id)).emit.apply(_a, ["edit:rooms", id, command].concat(callbackArgs));
                    callback(null, (callbackArgs[0] != null) ? callbackArgs[0].id : null);
                    var _a;
                }]));
            });
        };
        // Project
        this.onBuildProject = function (callback) {
            if (!_this.errorIfCant("buildProject", callback))
                return;
            // this.server.log("Building project...");
            var buildId = _this.server.nextBuildId;
            _this.server.nextBuildId++;
            var buildPath = _this.server.buildsPath + "/" + buildId;
            var exportedProject = { name: _this.server.data.manifest.pub.name, assets: _this.server.data.entries.getForStorage() };
            try {
                fs.mkdirSync(_this.server.buildsPath);
            }
            catch (e) { }
            try {
                fs.mkdirSync(buildPath);
            }
            catch (err) {
                callback("Could not create folder for build " + buildId);
                return;
            }
            fs.mkdirSync(buildPath + "/assets");
            var assetIdsToExport = [];
            _this.server.data.entries.walk(function (entry, parent) {
                if (entry.type != null)
                    assetIdsToExport.push(entry.id);
            });
            async.each(assetIdsToExport, function (assetId, cb) {
                var folderPath = buildPath + "/assets/" + _this.server.data.entries.getStoragePathFromId(assetId);
                fs.mkdir(folderPath, function (err) {
                    _this.server.data.assets.acquire(assetId, null, function (err, asset) {
                        asset.save(folderPath, function (err) {
                            _this.server.data.assets.release(assetId, null);
                            cb();
                        });
                    });
                });
            }, function (err) {
                if (err != null) {
                    callback("Could not export all assets");
                    return;
                }
                fs.mkdirSync(buildPath + "/resources");
                async.each(Object.keys(_this.server.system.data.resourceClasses), function (resourceName, cb) {
                    var folderPath = buildPath + "/resources/" + resourceName;
                    fs.mkdir(folderPath, function (err) {
                        _this.server.data.resources.acquire(resourceName, null, function (err, resource) {
                            resource.save(folderPath, function (err) {
                                _this.server.data.resources.release(resourceName, null);
                                cb();
                            });
                        });
                    });
                }, function (err) {
                    if (err != null) {
                        callback("Could not export all resources");
                        return;
                    }
                    var json = JSON.stringify(exportedProject, null, 2);
                    fs.writeFile(buildPath + "/project.json", json, { encoding: "utf8" }, function (err) {
                        if (err != null) {
                            callback("Could not save project.json");
                            return;
                        }
                        // this.server.log(`Done generating build ${buildId}...`);
                        // Collect paths to all build files
                        var files = [];
                        recursiveReaddir(buildPath, function (err, entries) {
                            for (var _i = 0; _i < entries.length; _i++) {
                                var entry = entries[_i];
                                var relativePath = path.relative(buildPath, entry);
                                if (path.sep === "\\")
                                    relativePath = relativePath.replace(/\\/g, "/");
                                files.push("/builds/" + _this.server.data.manifest.pub.id + "/" + buildId + "/" + relativePath);
                            }
                            files = files.concat(loadSystems_1.buildFilesBySystem[_this.server.system.name]);
                            callback(null, buildId.toString(), files);
                            // Remove an old build to avoid using too much disk space
                            var buildToDeleteId = buildId - config_1.default.maxRecentBuilds;
                            var buildToDeletePath = _this.server.buildsPath + "/" + buildToDeleteId;
                            rimraf(buildToDeletePath, function (err) {
                                if (err != null) {
                                    _this.server.log("Failed to remove build " + buildToDeleteId + ":");
                                    _this.server.log(err.toString());
                                }
                            });
                        });
                    });
                });
            });
        };
        this.onVacuumProject = function (callback) {
            if (!_this.errorIfCant("vacuumProject", callback))
                return;
            var trashedAssetsPath = path.join(_this.server.projectPath, "trashedAssets");
            fs.readdir(trashedAssetsPath, function (err, trashedAssetFolders) {
                if (err != null) {
                    if (err.code === "ENOENT")
                        trashedAssetFolders = [];
                    else
                        throw err;
                }
                var removedFolderCount = 0;
                async.each(trashedAssetFolders, function (trashedAssetFolder, cb) {
                    var folderPath = path.join(trashedAssetsPath, trashedAssetFolder);
                    rimraf(folderPath, function (err) {
                        if (err != null)
                            SupCore.log("Could not delete " + folderPath + ".\n" + err.stack);
                        else
                            removedFolderCount++;
                        cb();
                    });
                }, function () { callback(null, removedFolderCount); });
            });
        };
        this.id = id;
        this.socket.emit("welcome", this.id, { buildPort: config_1.default.buildPort, systemName: this.server.system.name });
        // Manifest
        this.socket.on("setProperty:manifest", this.onSetManifestProperty);
        // Entries
        this.socket.on("add:entries", this.onAddEntry);
        this.socket.on("duplicate:entries", this.onDuplicateEntry);
        this.socket.on("move:entries", this.onMoveEntry);
        this.socket.on("trash:entries", this.onTrashEntry);
        this.socket.on("setProperty:entries", this.onSetEntryProperty);
        // Assets
        this.socket.on("edit:assets", this.onEditAsset);
        // Resources
        this.socket.on("edit:resources", this.onEditResource);
        // Rooms
        this.socket.on("edit:rooms", this.onEditRoom);
        // Project
        this.socket.on("vacuum:project", this.onVacuumProject);
        this.socket.on("build:project", this.onBuildProject);
    }
    // TODO: Implement roles and capabilities
    RemoteProjectClient.prototype.can = function (action) { return true; };
    return RemoteProjectClient;
})(BaseRemoteClient_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RemoteProjectClient;
