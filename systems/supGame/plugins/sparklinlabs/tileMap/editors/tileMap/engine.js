var mapArea_1 = require("./mapArea");
var tileSetArea_1 = require("./tileSetArea");
var lastTimestamp = 0;
var accumulatedTime = 0;
function tick(timestamp) {
    if (timestamp === void 0) { timestamp = 0; }
    accumulatedTime += timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    var _a = mapArea_1.default.gameInstance.tick(accumulatedTime, mapArea_1.handleMapArea), updates = _a.updates, timeLeft = _a.timeLeft;
    accumulatedTime = timeLeft;
    if (updates > 0) {
        for (var i = 0; i < updates; i++) {
            tileSetArea_1.default.gameInstance.update();
            tileSetArea_1.handleTileSetArea();
        }
        mapArea_1.default.gameInstance.draw();
        tileSetArea_1.default.gameInstance.draw();
    }
    requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
