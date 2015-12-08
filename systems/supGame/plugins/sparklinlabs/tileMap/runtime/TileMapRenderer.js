function setupComponent(player, component, config) {
    if (config.tileMapAssetId == null)
        return;
    var tileMap = player.getOuterAsset(config.tileMapAssetId);
    var shader;
    if (config.materialType === "shader") {
        if (config.shaderAssetId != null) {
            var shaderAsset = player.getOuterAsset(config.shaderAssetId);
            if (shaderAsset == null)
                return;
            shader = shaderAsset.__inner;
        }
    }
    component.castShadow = config.castShadow;
    component.receiveShadow = config.receiveShadow;
    component.setTileMap(tileMap.__inner, config.materialType, shader);
    var tileSetId = (config.tileSetAssetId != null) ? config.tileSetAssetId : tileMap.__inner.data.tileSetId;
    var tileSet = player.getOuterAsset(tileSetId);
    component.setTileSet(tileSet.__inner);
}
exports.setupComponent = setupComponent;
