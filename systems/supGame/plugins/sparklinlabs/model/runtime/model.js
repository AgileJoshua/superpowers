var async = require("async");
function loadAsset(player, entry, callback) {
    player.getAssetData("assets/" + entry.storagePath + "/model.json", "json", function (err, data) {
        var attributesList = data.attributes;
        data.attributes = {};
        async.each(attributesList, function (key, cb) {
            player.getAssetData("assets/" + entry.storagePath + "/attr-" + key + ".dat", "arraybuffer", function (err, buffer) {
                data.attributes[key] = buffer;
                cb();
                return;
            });
        }, function () {
            var mapsList = data.maps;
            data.textures = {};
            async.each(mapsList, function (key, cb) {
                var image = new Image();
                image.onload = function () {
                    var texture = data.textures[key] = new SupEngine.THREE.Texture(image);
                    texture.needsUpdate = true;
                    if (data.filtering === "pixelated") {
                        texture.magFilter = SupEngine.THREE.NearestFilter;
                        texture.minFilter = SupEngine.THREE.NearestFilter;
                    }
                    if (data.wrapping === "repeat") {
                        texture.wrapS = SupEngine.THREE.RepeatWrapping;
                        texture.wrapT = SupEngine.THREE.RepeatWrapping;
                    }
                    else if (data.wrapping === "mirroredRepeat") {
                        texture.wrapS = SupEngine.THREE.MirroredRepeatWrapping;
                        texture.wrapT = SupEngine.THREE.MirroredRepeatWrapping;
                    }
                    cb();
                };
                image.onerror = function () { cb(); };
                image.src = player.dataURL + "assets/" + entry.storagePath + "/map-" + key + ".dat";
            }, function () { callback(null, data); });
        });
    });
}
exports.loadAsset = loadAsset;
function createOuterAsset(player, asset) { return new window.Sup.Model(asset); }
exports.createOuterAsset = createOuterAsset;
