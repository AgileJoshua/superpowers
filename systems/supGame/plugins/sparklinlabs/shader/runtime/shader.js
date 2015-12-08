function loadAsset(player, entry, callback) {
    player.getAssetData("assets/" + entry.storagePath + "/shader.json", "json", function (err, data) {
        player.getAssetData("assets/" + entry.storagePath + "/vertexShader.txt", "text", function (err, vertexShader) {
            data.vertexShader = { text: vertexShader };
            player.getAssetData("assets/" + entry.storagePath + "/fragmentShader.txt", "text", function (err, fragmentShader) {
                data.fragmentShader = { text: fragmentShader };
                callback(null, data);
            });
        });
    });
}
exports.loadAsset = loadAsset;
function createOuterAsset(player, asset) { return new window.Sup.Shader(asset); }
exports.createOuterAsset = createOuterAsset;
