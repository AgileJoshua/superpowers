var TileMapSettingsResource_1 = require("./TileMapSettingsResource");
var TileMapAsset_1 = require("./TileMapAsset");
var TileSetAsset_1 = require("./TileSetAsset");
var TileMapRendererConfig_1 = require("./TileMapRendererConfig");
SupCore.system.data.registerResource("tileMapSettings", TileMapSettingsResource_1.default);
SupCore.system.data.registerAssetClass("tileMap", TileMapAsset_1.default);
SupCore.system.data.registerAssetClass("tileSet", TileSetAsset_1.default);
SupCore.system.data.registerComponentConfigClass("TileMapRenderer", TileMapRendererConfig_1.default);
