var SystemAPI = (function () {
    function SystemAPI(system) {
        this.system = system;
        this.contexts = {};
    }
    SystemAPI.prototype.registerPlugin = function (contextName, pluginName, plugin) {
        if (this.contexts[contextName] == null)
            this.contexts[contextName] = { plugins: {} };
        if (this.contexts[contextName].plugins[pluginName] != null) {
            console.error("SystemAPI.registerPlugin: Tried to register two or more plugins " +
                ("named \"" + pluginName + "\" in context \"" + contextName + "\", system \"" + this.system.name + "\""));
        }
        if (plugin.exposeActorComponent != null) {
            if (plugin.exposeActorComponent.propertyName == null) {
                console.error("SystemAPI.registerPlugin: Missing actor component property name " +
                    ("in plugin \"" + pluginName + "\" in context \"" + contextName + "\", system \"" + this.system.name + "\""));
            }
            if (plugin.exposeActorComponent.className == null) {
                console.error("SystemAPI.registerPlugin: Missing actor component class name " +
                    ("in plugin \"" + pluginName + "\" in context \"" + contextName + "\", system \"" + this.system.name + "\""));
            }
        }
        this.contexts[contextName].plugins[pluginName] = plugin;
    };
    return SystemAPI;
})();
var SystemData = (function () {
    function SystemData(system) {
        this.system = system;
        this.assetClasses = {};
        this.componentConfigClasses = {};
        this.resourceClasses = {};
    }
    SystemData.prototype.registerAssetClass = function (name, assetClass) {
        if (this.assetClasses[name] != null) {
            console.log("SystemData.registerAssetClass: Tried to register two or more asset classes named \"" + name + "\" in system \"" + this.system.name + "\"");
            return;
        }
        this.assetClasses[name] = assetClass;
        return;
    };
    SystemData.prototype.registerComponentConfigClass = function (name, configClass) {
        if (this.componentConfigClasses[name] != null) {
            console.log("SystemData.registerComponentConfigClass: Tried to register two or more component configuration classes named \"" + name + "\" in system \"" + this.system.name + "\"");
            return;
        }
        this.componentConfigClasses[name] = configClass;
    };
    SystemData.prototype.registerResource = function (name, resourceClass) {
        if (this.resourceClasses[name] != null) {
            console.log("SystemData.registerResource: Tried to register two or more plugin resources named \"" + name + "\" in system \"" + this.system.name + "\"");
            return;
        }
        this.resourceClasses[name] = resourceClass;
    };
    return SystemData;
})();
var System = (function () {
    function System(name) {
        this.name = name;
        this.api = new SystemAPI(this);
        this.data = new SystemData(this);
    }
    return System;
})();
exports.System = System;
exports.systems = {};
