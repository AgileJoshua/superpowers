var CubicModelSettingsResource_1 = require("./CubicModelSettingsResource");
var CubicModelAsset_1 = require("./CubicModelAsset");
var CubicModelRendererConfig_1 = require("./CubicModelRendererConfig");
SupCore.system.data.registerResource("cubicModelSettings", CubicModelSettingsResource_1.default);
SupCore.system.data.registerAssetClass("cubicModel", CubicModelAsset_1.default);
SupCore.system.data.registerComponentConfigClass("CubicModelRenderer", CubicModelRendererConfig_1.default);
