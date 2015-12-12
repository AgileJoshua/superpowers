var path = require("path");
var fs = require("fs");
var express = require("express");
var async = require("async");
var readdirRecursive = require("recursive-readdir");
function shouldIgnorePlugin(pluginName) { return pluginName.indexOf(".") !== -1 || pluginName === "node_modules"; }
// FIXME: Let each system specify the required files? or just assume plugins will do their job
var publicPluginFiles = ["data", "components", "componentEditors", "settingsEditors", "api", "runtime"];
var systemsPath = path.resolve(__dirname + "/../systems");
exports.buildFilesBySystem = {};
function default_1(mainApp, buildApp, callback) {
    async.eachSeries(fs.readdirSync(systemsPath), function (systemName, cb) {
        SupCore.system = SupCore.systems[systemName] = new SupCore.System(systemName);
        var systemPath = path.join(systemsPath, systemName);
        // Expose public stuff
        mainApp.use("/systems/" + systemName, express.static(systemPath + "/public"));
       // buildApp.use("/systems/" + systemName, express.static(systemPath + "/public"));
        // Write templates list
        var templatesInfo = {};
        if (fs.existsSync(systemPath + "/templates")) {
            var templateNames = fs.readdirSync(systemPath + "/templates");
            for (var _i = 0; _i < templateNames.length; _i++) {
                var templateName = templateNames[_i];
                var templateManifest = JSON.parse(fs.readFileSync(systemPath + "/templates/" + templateName + "/manifest.json", { encoding: "utf8" }));
                templatesInfo[templateName] = { title: templateManifest.name, description: templateManifest.description };
            }
        }
        fs.writeFileSync(systemPath + "/public/templates.json", JSON.stringify(templatesInfo, null, 2));
        // Load plugins
        var pluginsInfo = loadPlugins(systemName, systemPath + "/plugins", mainApp, buildApp);
        fs.writeFileSync(systemPath + "/public/plugins.json", JSON.stringify(pluginsInfo, null, 2));
        // Build files
        var buildFiles = exports.buildFilesBySystem[systemName] = ["/SupCore.js"];
        for (var _a = 0, _b = pluginsInfo.list; _a < _b.length; _a++) {
            var plugin = _b[_a];
            // FIXME: Let each plugin or system specify the files that should be exported
            buildFiles.push("/systems/" + systemName + "/plugins/" + plugin + "/api.js");
            buildFiles.push("/systems/" + systemName + "/plugins/" + plugin + "/components.js");
            buildFiles.push("/systems/" + systemName + "/plugins/" + plugin + "/runtime.js");
        }
        readdirRecursive(systemPath + "/public", function (err, entries) {
            for (var _i = 0; _i < entries.length; _i++) {
                var entry = entries[_i];
                var relativePath = path.relative(systemPath + "/public", entry);
                buildFiles.push("/systems/" + systemName + "/" + relativePath);
            }
            cb();
        });
    }, function () {
        var systemsInfo = { list: Object.keys(SupCore.systems) };
        fs.writeFileSync(__dirname + "/../public/systems.json", JSON.stringify(systemsInfo, null, 2));
        SupCore.system = null;
        callback();
    });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
function loadPlugins(systemName, pluginsPath, mainApp, buildApp) {
    var pluginNamesByAuthor = {};
    var pluginsInfo = { list: [], paths: { editors: {}, tools: {} } };
    var pluginsFolder;
    try {
        pluginsFolder = fs.readdirSync(pluginsPath);
    }
    catch (err) { }
    if (pluginsFolder == null)
        return pluginsInfo;
    for (var _i = 0; _i < pluginsFolder.length; _i++) {
        var pluginAuthor = pluginsFolder[_i];
        var pluginAuthorPath = pluginsPath + "/" + pluginAuthor;
        pluginNamesByAuthor[pluginAuthor] = [];
        for (var _a = 0, _b = fs.readdirSync(pluginAuthorPath); _a < _b.length; _a++) {
            var pluginName = _b[_a];
            if (shouldIgnorePlugin(pluginName))
                continue;
            pluginNamesByAuthor[pluginAuthor].push(pluginName);
        }
    }
    // First pass
    for (var pluginAuthor in pluginNamesByAuthor) {
        var pluginNames = pluginNamesByAuthor[pluginAuthor];
        var pluginAuthorPath = pluginsPath + "/" + pluginAuthor;
        for (var _c = 0; _c < pluginNames.length; _c++) {
            var pluginName = pluginNames[_c];
            var pluginPath = pluginAuthorPath + "/" + pluginName;
            // Load scripting API module
            var apiModulePath = pluginPath + "/api";
            if (fs.existsSync(apiModulePath))
                require(apiModulePath);
            // Expose public stuff
            mainApp.use("/systems/" + systemName + "/plugins/" + pluginAuthor + "/" + pluginName, express.static(pluginPath + "/public"));
            //buildApp.use("/systems/" + systemName + "/plugins/" + pluginAuthor + "/" + pluginName, express.static(pluginPath + "/public"));
            // Ensure all public files exist
            for (var _d = 0; _d < publicPluginFiles.length; _d++) {
                var requiredFile = publicPluginFiles[_d];
                var requiredFilePath = pluginPath + "/public/" + requiredFile + ".js";
                if (!fs.existsSync(requiredFilePath))
                    fs.closeSync(fs.openSync(requiredFilePath, "w"));
            }
        }
    }
    // Second pass, because data modules might depend on API modules
    for (var pluginAuthor in pluginNamesByAuthor) {
        var pluginNames = pluginNamesByAuthor[pluginAuthor];
        var pluginAuthorPath = pluginsPath + "/" + pluginAuthor;
        for (var _e = 0; _e < pluginNames.length; _e++) {
            var pluginName = pluginNames[_e];
            var pluginPath = pluginAuthorPath + "/" + pluginName;
            // Load data module
            var dataModulePath = pluginPath + "/data";
            if (fs.existsSync(dataModulePath))
                require(dataModulePath);
            // Collect plugin info
            pluginsInfo.list.push(pluginAuthor + "/" + pluginName);
            if (fs.existsSync(pluginPath + "/public/editors")) {
                for (var _f = 0, _g = fs.readdirSync(pluginPath + "/public/editors"); _f < _g.length; _f++) {
                    var editorName = _g[_f];
                    if (SupCore.system.data.assetClasses[editorName] != null) {
                        pluginsInfo.paths.editors[editorName] = pluginAuthor + "/" + pluginName;
                    }
                    else {
                        pluginsInfo.paths.tools[editorName] = pluginAuthor + "/" + pluginName;
                    }
                }
            }
        }
    }
    return pluginsInfo;
}
