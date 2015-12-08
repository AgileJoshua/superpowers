function loadAsset(player, entry, callback) {
    var sound = { buffer: null };
    if (player.gameInstance.audio.getContext() == null) {
        setTimeout(function () { callback(null, sound); }, 0);
        return;
    }
    player.getAssetData("assets/" + entry.storagePath + "/sound.json", "json", function (err, data) {
        player.getAssetData("assets/" + entry.storagePath + "/sound.dat", "arraybuffer", function (err, soundData) {
            if (err != null) {
                callback(err);
                return;
            }
            if (data.streaming) {
                var typedArray = new Uint8Array(soundData);
                var blob = new Blob([typedArray], { type: "audio/*" });
                sound.buffer = URL.createObjectURL(blob);
                setTimeout(function () { callback(null, sound); }, 0);
            }
            else {
                var onLoad = function (buffer) { sound.buffer = buffer; callback(null, sound); };
                var onError = function () { callback(null, sound); };
                player.gameInstance.audio.getContext().decodeAudioData(soundData, onLoad, onError);
            }
        });
    });
}
exports.loadAsset = loadAsset;
function createOuterAsset(player, asset) { return new window.Sup.Sound(asset); }
exports.createOuterAsset = createOuterAsset;
