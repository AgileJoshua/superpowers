var network_1 = require("./network");
var ui_1 = require("./ui");
var THREE = SupEngine.THREE;
var engine = {};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = engine;
var canvasElt = document.querySelector("canvas");
engine.gameInstance = new SupEngine.GameInstance(canvasElt);
engine.cameraRoot = new SupEngine.Actor(engine.gameInstance, "Camera Root");
engine.cameraActor = new SupEngine.Actor(engine.gameInstance, "Camera", engine.cameraRoot);
engine.cameraActor.setLocalPosition(new THREE.Vector3(0, 0, 10));
engine.cameraComponent = new SupEngine.componentClasses["Camera"](engine.cameraActor);
engine.cameraComponent.layers = [0, -1];
engine.cameraControls = new SupEngine.editorComponentClasses["Camera3DControls"](engine.cameraActor, engine.cameraComponent);
engine.ambientLight = new THREE.AmbientLight(0xcfcfcf);
var gridActor = new SupEngine.Actor(engine.gameInstance, "Grid", null, { layer: 0 });
var selectionActor = new SupEngine.Actor(engine.gameInstance, "Selection Box", null, { layer: -1 });
var transformHandlesActor = new SupEngine.Actor(engine.gameInstance, "Transform Handles", null, { layer: -1 });
function start() {
    // Those classes are loaded asynchronously
    engine.selectionBoxComponent = new SupEngine.editorComponentClasses["SelectionBox"](selectionActor);
    engine.transformHandleComponent = new SupEngine.editorComponentClasses["TransformHandle"](transformHandlesActor, engine.cameraComponent.unifiedThreeCamera);
    engine.transformHandleComponent.control.addEventListener("mouseDown", function () { draggingControls = true; });
    engine.transformHandleComponent.control.addEventListener("objectChange", onTransformChange);
    engine.gridHelperComponent = new SupEngine.editorComponentClasses["GridHelper"](gridActor, ui_1.default.gridSize, ui_1.default.gridStep);
    engine.gridHelperComponent.setVisible(false);
    requestAnimationFrame(tick);
}
exports.start = start;
function updateCameraMode() {
    if (ui_1.default.cameraMode === "3D") {
        engine.cameraComponent.setOrthographicMode(false);
        engine.cameraControls = new SupEngine.editorComponentClasses["Camera3DControls"](engine.cameraActor, engine.cameraComponent);
        engine.cameraControls.movementSpeed = ui_1.default.cameraSpeedSlider.value;
    }
    else {
        engine.cameraActor.setLocalOrientation(new SupEngine.THREE.Quaternion().setFromAxisAngle(new SupEngine.THREE.Vector3(0, 1, 0), 0));
        engine.cameraComponent.setOrthographicMode(true);
        engine.cameraControls = new SupEngine.editorComponentClasses["Camera2DControls"](engine.cameraActor, engine.cameraComponent, {
            zoomSpeed: 1.5,
            zoomMin: 1,
            zoomMax: 100,
        });
    }
    engine.transformHandleComponent.control.camera = engine.cameraComponent.threeCamera;
    if (ui_1.default.cameraMode === "3D") {
        gridActor.setLocalPosition(new THREE.Vector3(0, 0, 0));
        gridActor.setLocalEulerAngles(new THREE.Euler(0, 0, 0));
        gridActor.layer = 0;
    }
    else {
        gridActor.setLocalPosition(new THREE.Vector3(0, 0, -500));
        gridActor.setLocalEulerAngles(new THREE.Euler(Math.PI / 2, 0, 0));
        gridActor.layer = -1;
    }
}
exports.updateCameraMode = updateCameraMode;
var lastTimestamp = 0;
var accumulatedTime = 0;
function tick(timestamp) {
    if (timestamp === void 0) { timestamp = 0; }
    accumulatedTime += timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    var _a = engine.gameInstance.tick(accumulatedTime, update), updates = _a.updates, timeLeft = _a.timeLeft;
    accumulatedTime = timeLeft;
    if (updates > 0)
        engine.gameInstance.draw();
    requestAnimationFrame(tick);
}
var pos = new THREE.Vector3();
function update() {
    if (ui_1.default.cameraMode === "3D" && engine.gameInstance.input.keyboardButtons[window.KeyEvent.DOM_VK_CONTROL].isDown) {
        if (engine.gameInstance.input.mouseButtons[5].isDown) {
            ui_1.default.cameraSpeedSlider.value = (parseFloat(ui_1.default.cameraSpeedSlider.value) + 2 * parseFloat(ui_1.default.cameraSpeedSlider.step)).toString();
            engine.cameraControls.movementSpeed = ui_1.default.cameraSpeedSlider.value;
        }
        else if (engine.gameInstance.input.mouseButtons[6].isDown) {
            ui_1.default.cameraSpeedSlider.value = (parseFloat(ui_1.default.cameraSpeedSlider.value) - 2 * parseFloat(ui_1.default.cameraSpeedSlider.step)).toString();
            engine.cameraControls.movementSpeed = ui_1.default.cameraSpeedSlider.value;
        }
    }
    if (engine.gameInstance.input.mouseButtons[0].wasJustReleased)
        mouseUp();
    var snap = engine.gameInstance.input.keyboardButtons[window.KeyEvent.DOM_VK_CONTROL].isDown;
    if (snap !== (engine.transformHandleComponent.control.translationSnap != null)) {
        engine.transformHandleComponent.control.setTranslationSnap(snap ? ui_1.default.gridStep : null);
        engine.transformHandleComponent.control.setRotationSnap(snap ? Math.PI / 36 : null);
    }
    if (ui_1.default.cameraMode === "2D") {
        engine.cameraActor.getLocalPosition(pos);
        pos.x += (ui_1.default.gridStep - pos.x % ui_1.default.gridStep);
        pos.y += (ui_1.default.gridStep - pos.y % ui_1.default.gridStep);
        pos.z = 0;
        gridActor.setLocalPosition(pos);
    }
}
// Mouse picking
var mousePosition = new THREE.Vector2;
var raycaster = new THREE.Raycaster;
var draggingControls = false;
function mouseUp() {
    if (draggingControls) {
        draggingControls = false;
        return;
    }
    mousePosition.x = engine.gameInstance.input.mousePosition.x / canvasElt.clientWidth * 2 - 1;
    mousePosition.y = -(engine.gameInstance.input.mousePosition.y / canvasElt.clientHeight * 2 - 1);
    raycaster.setFromCamera(mousePosition, engine.cameraComponent.threeCamera);
    var selectedNodeId = null;
    ui_1.default.nodesTreeView.clearSelection();
    var intersects = raycaster.intersectObject(engine.gameInstance.threeScene, true);
    if (intersects.length > 0) {
        for (var _i = 0; _i < intersects.length; _i++) {
            var intersect = intersects[_i];
            var threeObject = intersect.object;
            while (threeObject != null) {
                if (threeObject.userData.nodeId != null)
                    break;
                threeObject = threeObject.parent;
            }
            if (threeObject != null) {
                selectedNodeId = threeObject.userData.nodeId;
                var treeViewNode = ui_1.default.nodesTreeView.treeRoot.querySelector("li[data-id='" + selectedNodeId + "']");
                ui_1.default.nodesTreeView.addToSelection(treeViewNode);
                var treeViewParent = treeViewNode.parentElement;
                while (treeViewParent !== ui_1.default.nodesTreeView.treeRoot) {
                    if (treeViewParent.tagName === "OL")
                        treeViewParent.previousElementSibling.classList.remove("collapsed");
                    treeViewParent = treeViewParent.parentElement;
                }
                ui_1.default.nodesTreeView.scrollIntoView(treeViewNode);
                break;
            }
        }
    }
    ui_1.setupSelectedNode();
    setupHelpers();
}
function setupHelpers() {
    var nodeElt = ui_1.default.nodesTreeView.selectedNodes[0];
    if (nodeElt != null && ui_1.default.nodesTreeView.selectedNodes.length === 1) {
        engine.selectionBoxComponent.setTarget(network_1.data.sceneUpdater.bySceneNodeId[nodeElt.dataset.id].actor.threeObject);
        engine.transformHandleComponent.setTarget(network_1.data.sceneUpdater.bySceneNodeId[nodeElt.dataset.id].actor.threeObject);
    }
    else {
        engine.selectionBoxComponent.setTarget(null);
        engine.transformHandleComponent.setTarget(null);
    }
}
exports.setupHelpers = setupHelpers;
function onTransformChange() {
    var nodeElt = ui_1.default.nodesTreeView.selectedNodes[0];
    var nodeId = nodeElt.dataset.id;
    var target = network_1.data.sceneUpdater.bySceneNodeId[nodeId].actor;
    var object = engine.transformHandleComponent.control.object;
    var transformType;
    var value;
    switch (engine.transformHandleComponent.mode) {
        case "translate": {
            transformType = "position";
            var position = object.getWorldPosition();
            if (target.parent != null) {
                var mtx = target.parent.getGlobalMatrix(new THREE.Matrix4());
                mtx.getInverse(mtx);
                position.applyMatrix4(mtx);
            }
            value = { x: position.x, y: position.y, z: position.z };
            break;
        }
        case "rotate": {
            transformType = "orientation";
            var orientation_1 = object.getWorldQuaternion();
            if (target.parent != null) {
                var q = target.parent.getGlobalOrientation(new THREE.Quaternion()).inverse();
                orientation_1.multiply(q);
            }
            value = { x: orientation_1.x, y: orientation_1.y, z: orientation_1.z, w: orientation_1.w };
            break;
        }
        case "scale": {
            transformType = "scale";
            value = { x: object.scale.x, y: object.scale.y, z: object.scale.z };
            break;
        }
    }
    network_1.socket.emit("edit:assets", SupClient.query.asset, "setNodeProperty", nodeId, transformType, value, function (err) { if (err != null)
        alert(err); });
}
