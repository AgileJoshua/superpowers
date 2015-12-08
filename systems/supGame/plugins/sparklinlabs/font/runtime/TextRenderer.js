function setupComponent(player, component, config) {
    component.setText(config.text);
    component.setOptions({ alignment: config.alignment, verticalAlignment: config.verticalAlignment, size: config.size, color: config.color });
    if (config.fontAssetId != null) {
        var font = player.getOuterAsset(config.fontAssetId).__inner;
        component.setFont(font);
    }
}
exports.setupComponent = setupComponent;
