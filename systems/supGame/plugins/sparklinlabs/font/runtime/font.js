function loadAsset(player, entry, callback) {
    player.getAssetData("assets/" + entry.storagePath + "/asset.json", "json", function (err, data) {
        if (data.isBitmap) {
            var img = new Image();
            img.onload = function () {
                data.texture = new SupEngine.THREE.Texture(img);
                data.texture.needsUpdate = true;
                if (data.filtering === "pixelated") {
                    data.texture.magFilter = SupEngine.THREE.NearestFilter;
                    data.texture.minFilter = SupEngine.THREE.NearestFilter;
                }
                callback(null, data);
            };
            img.onerror = function () { callback(null, data); };
            img.src = player.dataURL + "assets/" + entry.storagePath + "/bitmap.dat";
        }
        else {
            data.name = "Font" + entry.id;
            var font;
            try {
                font = new FontFace(data.name, "url(" + player.dataURL + "assets/" + encodeURIComponent(entry.storagePath) + "/font.dat)");
                document.fonts.add(font);
            }
            catch (e) { }
            if (font != null)
                font.load().then(function () { callback(null, data); }, function () { callback(null, data); });
            else
                callback(null, data);
        }
    });
}
exports.loadAsset = loadAsset;
function createOuterAsset(player, asset) { return new window.Sup.Font(asset); }
exports.createOuterAsset = createOuterAsset;
