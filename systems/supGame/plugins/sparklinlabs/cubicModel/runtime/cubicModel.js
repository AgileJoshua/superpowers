var async = require("async");
function loadAsset(player, entry, callback) {
    player.getAssetData("assets/" + entry.storagePath + "/cubicModel.json", "json", function (err, data) {
        data.textures = {};
        var mapsList = data.maps;
        data.textures = {};
        async.each(mapsList, function (key, cb) {
            var canvas = document.createElement("canvas");
            canvas.width = data.textureWidth;
            canvas.height = data.textureHeight;
            var ctx = canvas.getContext("2d");
            var texture = data.textures[key] = new SupEngine.THREE.Texture(canvas);
            texture.needsUpdate = true;
            texture.magFilter = SupEngine.THREE.NearestFilter;
            texture.minFilter = SupEngine.THREE.NearestFilter;
            player.getAssetData("assets/" + entry.storagePath + "/map-" + key + ".dat", "arraybuffer", function (err, map) {
                var imageData = new ImageData(new Uint8ClampedArray(map), data.textureWidth, data.textureHeight);
                ctx.putImageData(imageData, 0, 0);
                cb();
            });
        }, function () { callback(null, data); });
    });
}
exports.loadAsset = loadAsset;
function createOuterAsset(player, asset) { return new window.Sup.CubicModel(asset); }
exports.createOuterAsset = createOuterAsset;
