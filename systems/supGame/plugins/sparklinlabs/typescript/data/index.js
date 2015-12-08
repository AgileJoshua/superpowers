var BehaviorPropertiesResource_1 = require("./BehaviorPropertiesResource");
var ScriptAsset_1 = require("./ScriptAsset");
var BehaviorConfig_1 = require("./BehaviorConfig");
SupCore.system.data.registerResource("behaviorProperties", BehaviorPropertiesResource_1.default);
SupCore.system.data.registerAssetClass("script", ScriptAsset_1.default);
SupCore.system.data.registerComponentConfigClass("Behavior", BehaviorConfig_1.default);
