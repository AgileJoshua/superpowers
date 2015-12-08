var TileSet_1 = require("../components/TileSet");
function loadAsset(player, entry, callback) {
    player.getAssetData("assets/" + entry.storagePath + "/tileset.json", "json", function (err, data) {
        var img = new Image();
        img.onload = function () {
            data.texture = new SupEngine.THREE.Texture(img);
            data.texture.needsUpdate = true;
            data.texture.magFilter = SupEngine.THREE.NearestFilter;
            data.texture.minFilter = SupEngine.THREE.NearestFilter;
            callback(null, new TileSet_1.default(data));
        };
        img.onerror = function () { callback(null, new TileSet_1.default(data)); };
        img.src = player.dataURL + "assets/" + entry.storagePath + "/image.dat";
    });
}
exports.loadAsset = loadAsset;
function createOuterAsset(player, asset) {
    return new window.Sup.TileSet(asset);
}
exports.createOuterAsset = createOuterAsset;
