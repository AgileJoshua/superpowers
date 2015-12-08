var THREE = SupEngine.THREE;
var engine = {};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = engine;
var canvasElt = document.querySelector("canvas");
engine.gameInstance = new SupEngine.GameInstance(canvasElt);
var cameraActor = new SupEngine.Actor(engine.gameInstance, "Camera");
cameraActor.setLocalPosition(new THREE.Vector3(0, 0, 10));
var cameraComponent = new SupEngine.componentClasses["Camera"](cameraActor);
new SupEngine.editorComponentClasses["Camera3DControls"](cameraActor, cameraComponent);
var light = new THREE.AmbientLight(0xcfcfcf);
engine.gameInstance.threeScene.add(light);
var spotLight = new THREE.PointLight(0xffffff, 0.2);
cameraActor.threeObject.add(spotLight);
spotLight.updateMatrixWorld(false);
var lastTimestamp = 0;
var accumulatedTime = 0;
function tick(timestamp) {
    if (timestamp === void 0) { timestamp = 0; }
    accumulatedTime += timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    var _a = engine.gameInstance.tick(accumulatedTime), updates = _a.updates, timeLeft = _a.timeLeft;
    accumulatedTime = timeLeft;
    if (updates > 0)
        engine.gameInstance.draw();
    requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
