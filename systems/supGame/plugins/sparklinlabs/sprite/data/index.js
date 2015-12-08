var SpriteSettingsResource_1 = require("./SpriteSettingsResource");
var SpriteAsset_1 = require("./SpriteAsset");
var SpriteRendererConfig_1 = require("./SpriteRendererConfig");
SupCore.system.data.registerResource("spriteSettings", SpriteSettingsResource_1.default);
SupCore.system.data.registerAssetClass("sprite", SpriteAsset_1.default);
SupCore.system.data.registerComponentConfigClass("SpriteRenderer", SpriteRendererConfig_1.default);
