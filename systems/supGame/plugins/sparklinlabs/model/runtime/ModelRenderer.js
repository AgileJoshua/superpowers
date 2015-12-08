function setupComponent(player, component, config) {
    component.castShadow = config.castShadow;
    component.receiveShadow = config.receiveShadow;
    if (config.overrideOpacity)
        component.opacity = config.opacity;
    var hex = parseInt(config.color, 16);
    component.color.r = (hex >> 16 & 255) / 255;
    component.color.g = (hex >> 8 & 255) / 255;
    component.color.b = (hex & 255) / 255;
    if (config.modelAssetId != null) {
        var model = player.getOuterAsset(config.modelAssetId);
        if (model == null)
            return;
        if (!config.overrideOpacity)
            component.opacity = model.__inner.opacity;
        var shader;
        if (config.materialType === "shader") {
            if (config.shaderAssetId != null) {
                var shaderAsset = player.getOuterAsset(config.shaderAssetId);
                if (shaderAsset == null)
                    return;
                shader = shaderAsset.__inner;
            }
        }
        component.setModel(model.__inner, config.materialType, shader);
        if (config.animationId != null) {
            // FIXME: should we load model with SupCore.Data?
            for (var _i = 0, _a = model.__inner.animations; _i < _a.length; _i++) {
                var animation = _a[_i];
                if (animation.id === config.animationId) {
                    component.setAnimation(animation.name);
                    break;
                }
            }
        }
    }
}
exports.setupComponent = setupComponent;
