var network_1 = require("./network");
var ui_1 = require("./ui");
var SpriteOriginMarker_1 = require("./SpriteOriginMarker");
var PerfectResize = require("perfect-resize");
var animationArea = {};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = animationArea;
new PerfectResize(document.querySelector(".animation-container"), "bottom");
animationArea.gameInstance = new SupEngine.GameInstance(document.querySelector(".animation-container canvas"));
animationArea.gameInstance.threeRenderer.setClearColor(0xbbbbbb);
var cameraActor = new SupEngine.Actor(animationArea.gameInstance, "Camera");
cameraActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, 10));
var cameraComponent = new SupEngine.componentClasses["Camera"](cameraActor);
cameraComponent.setOrthographicMode(true);
cameraComponent.setOrthographicScale(10);
animationArea.cameraControls = new SupEngine.editorComponentClasses["Camera2DControls"](cameraActor, cameraComponent, { zoomSpeed: 1.5, zoomMin: 1, zoomMax: 200 });
var originActor = new SupEngine.Actor(animationArea.gameInstance, "Origin");
originActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, 1));
animationArea.originMakerComponent = new SpriteOriginMarker_1.default(originActor);
function centerCamera() {
    if (network_1.data.spriteUpdater.spriteRenderer.asset == null)
        return;
    var pub = network_1.data.spriteUpdater.spriteAsset.pub;
    var scaleRatio = 1 / cameraComponent.orthographicScale;
    cameraActor.setLocalPosition(new SupEngine.THREE.Vector3((0.5 - pub.origin.x) * pub.grid.width * scaleRatio, (0.5 - pub.origin.y) * pub.grid.height * scaleRatio, 10));
}
exports.centerCamera = centerCamera;
function handleAnimationArea() {
    if (network_1.data != null && ui_1.default.selectedAnimationId != null) {
        if (!network_1.data.spriteUpdater.spriteRenderer.isAnimationPlaying) {
            ui_1.default.animationPlay.textContent = "▶";
        }
        else {
            ui_1.default.animationSlider.value = network_1.data.spriteUpdater.spriteRenderer.getAnimationFrameIndex().toString();
        }
    }
}
exports.handleAnimationArea = handleAnimationArea;
