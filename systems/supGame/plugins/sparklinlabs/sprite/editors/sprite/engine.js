var spritesheetArea_1 = require("./spritesheetArea");
var animationArea_1 = require("./animationArea");
var lastTimestamp = 0;
var accumulatedTime = 0;
function tick(timestamp) {
    if (timestamp === void 0) { timestamp = 0; }
    accumulatedTime += timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    var _a = spritesheetArea_1.default.gameInstance.tick(accumulatedTime), updates = _a.updates, timeLeft = _a.timeLeft;
    accumulatedTime = timeLeft;
    if (updates > 0) {
        for (var i = 0; i < updates; i++) {
            animationArea_1.default.gameInstance.update();
            animationArea_1.handleAnimationArea();
        }
        spritesheetArea_1.default.gameInstance.draw();
        animationArea_1.default.gameInstance.draw();
    }
    requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
