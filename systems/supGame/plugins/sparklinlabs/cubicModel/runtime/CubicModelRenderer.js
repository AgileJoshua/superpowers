function setupComponent(player, component, config) {
    // component.castShadow = config.castShadow;
    // component.receiveShadow = config.receiveShadow;
    // if (config.overrideOpacity) component.opacity = config.opacity;
    // let hex = parseInt(config.color, 16);
    // component.color.r = (hex >> 16 & 255) / 255;
    // component.color.g = (hex >> 8 & 255) / 255;
    // component.color.b = (hex & 255) / 255;
    // component.horizontalFlip = config.horizontalFlip;
    // component.verticalFlip = config.verticalFlip;
    if (config.cubicModelAssetId != null) {
        var cubicModel = player.getOuterAsset(config.cubicModelAssetId);
        if (cubicModel == null)
            return;
        if (!config.overrideOpacity)
            component.opacity = cubicModel.__inner.opacity;
        var shader;
        if (config.materialType === "shader") {
            if (config.shaderAssetId != null) {
                var shaderAsset = player.getOuterAsset(config.shaderAssetId);
                if (shaderAsset == null)
                    return;
                shader = shaderAsset.__inner;
            }
        }
        component.setCubicModel(cubicModel.__inner, config.materialType, shader);
        if (config.animationId != null) {
            // FIXME: should we load cubicModel with SupCore.Data?
            cubicModel.__inner.animations.every(function (animation) {
                if (animation.id === config.animationId) {
                    component.setAnimation(animation.name);
                    return false;
                }
                else
                    return true;
            });
        }
    }
}
exports.setupComponent = setupComponent;
