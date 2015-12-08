function loadAsset(player, entry, callback) {
    player.getAssetData("assets/" + entry.storagePath + "/scene.json", "json", callback);
}
exports.loadAsset = loadAsset;
function createOuterAsset(player, asset) {
    return new window.Sup.Scene(asset);
}
exports.createOuterAsset = createOuterAsset;
