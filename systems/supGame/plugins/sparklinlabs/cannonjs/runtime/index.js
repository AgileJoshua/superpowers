//FIX ME
//import  cannon from "cannon"
var cannon = require("cannon");
var CannonBody = require("./CannonBody");
window.CANNON = cannon;
SupEngine.Cannon = {
    World: new window.CANNON.World(),
    autoUpdate: true
};
SupEngine.registerEarlyUpdateFunction("Cannonjs", function (player) {
    if (!SupEngine.Cannon.autoUpdate)
        return;
    SupEngine.Cannon.World.step(1 / 60);
});
SupRuntime.registerPlugin("CannonBody", CannonBody);
