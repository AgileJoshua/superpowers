var async = require("async");
function loadAsset(player, entry, callback) {
    player.getAssetData("assets/" + entry.storagePath + "/sprite.json", "json", function (err, data) {
        data.textures = {};
        var mapsList = data.maps;
        data.textures = {};
        async.each(mapsList, function (key, cb) {
            var image = new Image();
            image.onload = function () {
                var texture = data.textures[key] = new SupEngine.THREE.Texture(image);
                // Three.js might resize our texture to make its dimensions power-of-twos
                // because of WebGL limitations (see https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL#Non_power-of-two_textures)
                // so we store its original, non-power-of-two size for later use
                texture.size = { width: image.width, height: image.height };
                texture.needsUpdate = true;
                if (data.filtering === "pixelated") {
                    texture.magFilter = SupEngine.THREE.NearestFilter;
                    texture.minFilter = SupEngine.THREE.NearestFilter;
                }
                cb();
            };
            image.onerror = function () { cb(); };
            image.src = player.dataURL + "assets/" + entry.storagePath + "/map-" + key + ".dat";
        }, function () { callback(null, data); });
    });
}
exports.loadAsset = loadAsset;
function createOuterAsset(player, asset) { return new window.Sup.Sprite(asset); }
exports.createOuterAsset = createOuterAsset;
