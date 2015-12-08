var ui_1 = require("./ui");
var network_1 = require("./network");
var SpriteRenderer_1 = require("../../components/SpriteRenderer");
var SelectionRenderer_1 = require("./SelectionRenderer");
var spritesheetArea = {};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = spritesheetArea;
spritesheetArea.gameInstance = new SupEngine.GameInstance(document.querySelector(".spritesheet-container canvas"));
spritesheetArea.gameInstance.threeRenderer.setClearColor(0xbbbbbb);
var cameraActor = new SupEngine.Actor(spritesheetArea.gameInstance, "Camera");
cameraActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, 10));
var cameraComponent = new SupEngine.componentClasses["Camera"](cameraActor);
cameraComponent.setOrthographicMode(true);
cameraComponent.setOrthographicScale(10);
spritesheetArea.cameraControls = new SupEngine.editorComponentClasses["Camera2DControls"](cameraActor, cameraComponent, { zoomSpeed: 1.5, zoomMin: 1, zoomMax: 200 }, function () { spritesheetArea.gridRenderer.setOrthgraphicScale(cameraComponent.orthographicScale); });
var spriteActor = new SupEngine.Actor(spritesheetArea.gameInstance, "Sprite");
spritesheetArea.spriteRenderer = new SpriteRenderer_1.default(spriteActor);
var gridActor = new SupEngine.Actor(spritesheetArea.gameInstance, "Grid");
gridActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, 1));
spritesheetArea.gridRenderer = new SupEngine.editorComponentClasses["GridRenderer"](gridActor);
var selectionActor = new SupEngine.Actor(spritesheetArea.gameInstance, "Selection");
selectionActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, 2));
spritesheetArea.selectionRenderer = new SelectionRenderer_1.default(selectionActor);
function centerCamera() {
    if (spritesheetArea.spriteRenderer.asset == null)
        return;
    var pub = network_1.data.spriteUpdater.spriteAsset.pub;
    var scaleRatio = 1 / cameraComponent.orthographicScale;
    cameraActor.setLocalPosition(new SupEngine.THREE.Vector3(0.5 * pub.grid.width * scaleRatio, -0.5 * pub.grid.height * scaleRatio, 10));
}
exports.centerCamera = centerCamera;
function updateSelection() {
    if (ui_1.default.selectedAnimationId == null)
        return;
    var pub = network_1.data.spriteUpdater.spriteAsset.pub;
    var texture = pub.textures[pub.mapSlots["map"]];
    if (texture == null)
        return;
    var animation = network_1.data.spriteUpdater.spriteAsset.animations.byId[ui_1.default.selectedAnimationId];
    var width = pub.grid.width / pub.pixelsPerUnit;
    var height = pub.grid.height / pub.pixelsPerUnit;
    var framesPerDirection;
    if (pub.frameOrder === "rows")
        framesPerDirection = texture.size.width / pub.grid.width;
    else
        framesPerDirection = texture.size.height / pub.grid.height;
    spritesheetArea.selectionRenderer.setup(width, height, animation.startFrameIndex, animation.endFrameIndex, pub.frameOrder, framesPerDirection);
}
exports.updateSelection = updateSelection;
