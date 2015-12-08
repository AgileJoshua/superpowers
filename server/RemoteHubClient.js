var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var async = require("async");
var fs = require("fs");
var path = require("path");
var paths = require("./paths");
var BaseRemoteClient_1 = require("./BaseRemoteClient");
;
var RemoteHubClient = (function (_super) {
    __extends(RemoteHubClient, _super);
    function RemoteHubClient(server, socket) {
        var _this = this;
        _super.call(this, server, socket);
        this.server = server;
        this.onAddProject = function (details, callback) {
            if (!_this.errorIfCant("editProjects", callback))
                return;
            var formatVersion = SupCore.Data.ProjectManifest.currentFormatVersion;
            var templatePath;
            if (details.template != null) {
                templatePath = path.join(paths.userData, "/systems/" + details.system + "/templates/" + details.template);
                formatVersion = JSON.parse(fs.readFileSync(path.join(templatePath, "manifest.json"), { encoding: "utf8" })).formatVersion;
            }
            var manifest = {
                id: null,
                name: details.name,
                description: details.description,
                system: details.system,
                formatVersion: formatVersion
            };
            var projectFolder = manifest.name.toLowerCase().slice(0, 32).replace(/[^a-z0-9]/g, "-");
            var originalProjectFolder = projectFolder;
            var projectFolderNumber = 1;
            while (true) {
                try {
                    fs.mkdirSync(path.join(paths.projects, projectFolder));
                }
                catch (e) {
                    projectFolder = originalProjectFolder + "-" + projectFolderNumber++;
                    continue;
                }
                break;
            }
            var projectPath = path.join(paths.projects, projectFolder);
            var onFoldersCreated = function (err) {
                if (err != null) {
                    callback("The project could not be created, folders creation has failed: " + err.message);
                    return;
                }
                var sortedIndex = 0;
                for (var _i = 0, _a = _this.server.data.projects.pub; _i < _a.length; _i++) {
                    var item = _a[_i];
                    if (SupCore.Data.Projects.sort(manifest, item) < 0)
                        break;
                    sortedIndex++;
                }
                _this.server.data.projects.add(manifest, sortedIndex, function (err, actualIndex) {
                    if (err != null) {
                        callback(err);
                        return;
                    }
                    var writeTemplate = function (callback) {
                        var copyRecursively = function (currentPath, callback) {
                            fs.readdir(path.join(templatePath, currentPath), function (err, files) {
                                if (err != null) {
                                    callback(err);
                                    return;
                                }
                                async.each(files, function (file, callback) {
                                    fs.lstat(path.join(templatePath, currentPath, file), function (err, stats) {
                                        if (err != null) {
                                            callback(err);
                                            return;
                                        }
                                        var filePath = path.join(currentPath, file);
                                        if (stats.isDirectory()) {
                                            fs.mkdir(path.join(projectPath, filePath), function (err) {
                                                if (err != null) {
                                                    callback(err);
                                                    return;
                                                }
                                                copyRecursively(filePath, callback);
                                            });
                                        }
                                        else {
                                            fs.readFile(path.join(templatePath, filePath), function (err, data) {
                                                fs.writeFile(path.join(projectPath, filePath), data, callback);
                                            });
                                        }
                                    });
                                }, callback);
                            });
                        };
                        copyRecursively("", callback);
                    };
                    var writeEntries = function (callback) {
                        var entriesJSON = JSON.stringify([], null, 2);
                        fs.writeFile(path.join(projectPath, "entries.json"), entriesJSON, { encoding: "utf8" }, callback);
                    };
                    var writeManifest = function (callback) {
                        var manifestJSON = JSON.stringify(manifest, null, 2);
                        fs.writeFile(path.join(projectPath, "manifest.json"), manifestJSON, { encoding: "utf8" }, callback);
                    };
                    var loadProject = function (callback) { _this.server.loadProject(projectFolder, callback); };
                    var tasks = [writeManifest, _this.writeIcon.bind(_this, projectPath, details.icon), loadProject];
                    tasks.splice(0, 0, details.template != null ? writeTemplate : writeEntries);
                    async.series(tasks, function (err) {
                        if (err != null) {
                            SupCore.log("Error while creating project:\n" + err);
                            return;
                        }
                        _this.server.io.in("sub:projects").emit("add:projects", manifest, actualIndex);
                        callback(null, manifest.id);
                    });
                });
            };
            if (details.template != null)
                onFoldersCreated(null);
            else {
                async.each(["public", "assets", "trashedAssets", "rooms", "resources"], function (folder, cb) {
                    fs.mkdir(path.join(projectPath, folder), cb);
                }, onFoldersCreated);
            }
        };
        this.writeIcon = function (projectPath, icon, callback) {
            if (icon == null) {
                callback();
                return;
            }
            fs.mkdir(path.join(projectPath, "public"), function (err) {
                if (err != null && err.code !== "EEXIST") {
                    callback(err);
                    return;
                }
                fs.writeFile(path.join(projectPath, "public/icon.png"), icon, callback);
            });
        };
        this.onEditProject = function (projectId, details, callback) {
            if (!_this.errorIfCant("editProjects", callback))
                return;
            var projectServer = _this.server.serversById[projectId];
            if (projectServer == null) {
                callback("Invalid project id");
                return;
            }
            async.series([
                function (cb) {
                    if (details.name == null) {
                        cb();
                        return;
                    }
                    projectServer.data.manifest.setProperty("name", details.name, function (err, value) {
                        if (err != null) {
                            cb(new Error(err));
                            return;
                        }
                        projectServer.io.in("sub:manifest").emit("setProperty:manifest", "name", details.name);
                        _this.server.io.in("sub:projects").emit("setProperty:projects", projectId, "name", details.name);
                        cb();
                    });
                },
                function (cb) {
                    if (details.description == null) {
                        cb();
                        return;
                    }
                    projectServer.data.manifest.setProperty("description", details.description, function (err, value) {
                        if (err != null) {
                            cb(new Error(err));
                            return;
                        }
                        projectServer.io.in("sub:manifest").emit("setProperty:manifest", "description", details.description);
                        _this.server.io.in("sub:projects").emit("setProperty:projects", projectId, "description", details.description);
                        cb();
                    });
                },
                function (cb) {
                    if (details.icon == null) {
                        cb();
                        return;
                    }
                    _this.writeIcon(projectServer.projectPath, details.icon, function (err) {
                        if (err != null) {
                            cb(new Error("Failed to save icon"));
                            return;
                        }
                        projectServer.io.in("sub:manifest").emit("updateIcon:manifest");
                        _this.server.io.in("sub:projects").emit("updateIcon:projects", projectId);
                        cb();
                    });
                }
            ], function (err) {
                if (err != null)
                    callback(err.message);
                else
                    callback(null);
            });
        };
        // Projects
        this.socket.on("add:projects", this.onAddProject);
        this.socket.on("edit:projects", this.onEditProject);
    }
    // TODO: Implement roles and capabilities
    RemoteHubClient.prototype.can = function (action) { return true; };
    return RemoteHubClient;
})(BaseRemoteClient_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RemoteHubClient;
