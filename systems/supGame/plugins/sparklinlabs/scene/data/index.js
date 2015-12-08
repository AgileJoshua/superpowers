var SceneSettingsResource_1 = require("./SceneSettingsResource");
var SceneAsset_1 = require("./SceneAsset");
var CameraConfig_1 = require("./CameraConfig");
SupCore.system.data.registerResource("sceneSettings", SceneSettingsResource_1.default);
SupCore.system.data.registerAssetClass("scene", SceneAsset_1.default);
SupCore.system.data.registerComponentConfigClass("Camera", CameraConfig_1.default);
