/// <reference path="../SupRuntime.d.ts" />
var Player_1 = require("./Player");
exports.Player = Player_1.default;
exports.plugins = {};
function registerPlugin(name, plugin) {
    if (exports.plugins[name] != null) {
        console.error("SupRuntime.registerPlugin: Tried to register two or more plugins named \"" + name + "\"");
        return;
    }
    exports.plugins[name] = plugin;
}
exports.registerPlugin = registerPlugin;
exports.resourcePlugins = {};
function registerResource(name, plugin) {
    if (exports.resourcePlugins[name] != null) {
        console.error("SupRuntime.registerResource: Tried to register two or more resources named \"" + name + "\"");
        return;
    }
    exports.resourcePlugins[name] = plugin;
}
exports.registerResource = registerResource;
