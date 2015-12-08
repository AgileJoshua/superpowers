function loadResource(player, resourceName, callback) {
    player.getAssetData("resources/" + resourceName + "/resource.json", "json", function (err, data) {
        if (err != null) {
            callback(err);
            return;
        }
        callback(null, data);
    });
}
exports.loadResource = loadResource;
