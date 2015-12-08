var p2 = require("p2");
window.p2 = p2;
var P2;
(function (P2) {
    P2.World = new p2.World();
    P2.autoUpdate = true;
})(P2 || (P2 = {}));
;
SupEngine.P2 = P2;
SupEngine.registerEarlyUpdateFunction("P2js", function () {
    if (!P2.autoUpdate)
        return;
    P2.World.step(1 / 60);
});
var P2Body = require("./P2Body");
SupRuntime.registerPlugin("P2Body", P2Body);
