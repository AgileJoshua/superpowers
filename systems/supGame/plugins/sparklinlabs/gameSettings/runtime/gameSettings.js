function init(player, callback) {
    player.gameInstance.framesPerSecond = player.resources.gameSettings.framesPerSecond;
    SupRuntime.Player.updateInterval = 1000 / player.gameInstance.framesPerSecond;
    if (player.resources.gameSettings.ratioNumerator != null && player.resources.gameSettings.ratioDenominator != null) {
        player.gameInstance.setRatio(player.resources.gameSettings.ratioNumerator / player.resources.gameSettings.ratioDenominator);
    }
    // NOTE: Custom layers were introduced in Superpowers 0.8
    if (player.resources.gameSettings.customLayers != null) {
        player.gameInstance.layers = player.gameInstance.layers.concat(player.resources.gameSettings.customLayers);
    }
    callback();
}
exports.init = init;
function lateStart(player, callback) {
    var sceneId = player.resources.gameSettings.startupSceneId;
    if (sceneId != null) {
        var outerAsset = player.getOuterAsset(sceneId);
        if (outerAsset != null && outerAsset.type === "scene")
            window.Sup.loadScene(outerAsset);
    }
    callback();
}
exports.lateStart = lateStart;
