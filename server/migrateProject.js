var fs = require("fs");
var path = require("path");
var async = require("async");
function default_1(server, callback) {
    var oldVersion = server.data.manifest.migratedFromFormatVersion;
    if (oldVersion == null) {
        callback(null);
        return;
    }
    async.series([
        function (cb) { if (oldVersion < 1)
            migrateTo1(server, cb);
        else
            cb(); }
    ], callback);
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
function migrateTo1(server, callback) {
    var assetsPath = path.join(server.projectPath, "assets");
    async.series([
        // Delete ArcadePhysics2DSettingsResource, removed in Superpowers v0.13
        // FIXME: This should be done by an init function in the plugin, probably.
        // Delete ArcadePhysics2DSettingsResource, removed in Superpowers v0.13
        // FIXME: This should be done by an init function in the plugin, probably.
        function (cb) { fs.unlink(path.join(server.projectPath, "resources/arcadePhysics2DSettings/resource.json"), function (err) { cb(); }); },
        function (cb) { fs.rmdir(path.join(server.projectPath, "resources/arcadePhysics2DSettings"), function (err) { cb(); }); },
        // Move trashed assets to "trashedAssets" folder
        // Move trashed assets to "trashedAssets" folder
        function (cb) {
            fs.readdir(assetsPath, function (err, assetFolders) {
                if (err != null)
                    throw err;
                var assetFolderRegex = /^[0-9]+-.+$/;
                var trashedAssetFolders = [];
                for (var _i = 0; _i < assetFolders.length; _i++) {
                    var assetFolder = assetFolders[_i];
                    if (!assetFolderRegex.test(assetFolder))
                        continue;
                    var assetId = assetFolder.substring(0, assetFolder.indexOf("-"));
                    if (server.data.entries.byId[assetId] == null)
                        trashedAssetFolders.push(assetFolder);
                }
                async.each(trashedAssetFolders, server.moveAssetFolderToTrash.bind(server), cb);
            });
        },
        // Delete internals.json and members.json
        // Delete internals.json and members.json
        function (cb) { fs.unlink(path.join(server.projectPath, "internals.json"), function (err) { cb(); }); },
        function (cb) { fs.unlink(path.join(server.projectPath, "members.json"), function (err) { cb(); }); }
    ], callback);
}
