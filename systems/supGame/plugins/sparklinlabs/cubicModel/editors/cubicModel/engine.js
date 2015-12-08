var network_1 = require("./network");
var ui_1 = require("./ui");
var textureArea_1 = require("./textureArea");
var THREE = SupEngine.THREE;
var engine = {};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = engine;
var canvasElt = document.querySelector("canvas");
engine.gameInstance = new SupEngine.GameInstance(canvasElt);
engine.cameraActor = new SupEngine.Actor(engine.gameInstance, "Camera");
engine.cameraActor.setLocalPosition(new THREE.Vector3(0, 0, 10));
var cameraComponent = new SupEngine.componentClasses["Camera"](engine.cameraActor);
cameraComponent.layers = [0, -1];
/* tslint:disable:no-unused-expression */
new SupEngine.editorComponentClasses["Camera3DControls"](engine.cameraActor, cameraComponent);
/* tslint:enable:no-unused-expression */
var markerActor = new SupEngine.Actor(engine.gameInstance, "Marker", null, { layer: -1 });
engine.transformMarkerComponent = new SupEngine.editorComponentClasses["TransformMarker"](markerActor);
engine.transformMarkerComponent.hide();
var selectionActor = new SupEngine.Actor(engine.gameInstance, "Selection Box", null, { layer: -1 });
engine.selectionBoxComponent = new SupEngine.editorComponentClasses["SelectionBox"](selectionActor);
var transformHandlesActor = new SupEngine.Actor(engine.gameInstance, "Transform Handles", null, { layer: -1 });
engine.transformHandleComponent = new SupEngine.editorComponentClasses["TransformHandle"](transformHandlesActor, cameraComponent.unifiedThreeCamera);
var gridActor = new SupEngine.Actor(engine.gameInstance, "Grid", null, { layer: 0 });
/*let light = new THREE.AmbientLight(0xcfcfcf);
engine.gameInstance.threeScene.add(light);*/
function start() {
    // We need to delay this because it relies on ui.grid* being setup
    engine.gridHelperComponent = new SupEngine.editorComponentClasses["GridHelper"](gridActor, ui_1.default.gridSize, ui_1.default.gridStep);
    engine.gridHelperComponent.setVisible(false);
}
exports.start = start;
var lastTimestamp = 0;
var accumulatedTime = 0;
function tick(timestamp) {
    if (timestamp === void 0) { timestamp = 0; }
    accumulatedTime += timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    var _a = engine.gameInstance.tick(accumulatedTime, update), updates = _a.updates, timeLeft = _a.timeLeft;
    accumulatedTime = timeLeft;
    if (updates > 0) {
        for (var i = 0; i < updates; i++) {
            textureArea_1.default.gameInstance.update();
            textureArea_1.handleTextureArea();
        }
        engine.gameInstance.draw();
        textureArea_1.default.gameInstance.draw();
    }
    requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
function update() {
    if (engine.gameInstance.input.mouseButtons[0].wasJustReleased)
        mouseUp();
    if (engine.gameInstance.input.keyboardButtons[window.KeyEvent.DOM_VK_E].wasJustPressed) {
        // TODO: switch between pivot or shape
        document.getElementById("transform-mode-translate-pivot").checked = true;
        engine.transformHandleComponent.setMode("translate");
    }
    if (engine.gameInstance.input.keyboardButtons[window.KeyEvent.DOM_VK_R].wasJustPressed) {
        document.getElementById("transform-mode-rotate").checked = true;
        engine.transformHandleComponent.setMode("rotate");
    }
    if (engine.gameInstance.input.keyboardButtons[window.KeyEvent.DOM_VK_T].wasJustPressed) {
        document.getElementById("transform-mode-stretch").checked = true;
        engine.transformHandleComponent.setMode("scale");
    }
    if (engine.gameInstance.input.keyboardButtons[window.KeyEvent.DOM_VK_L].wasJustPressed) {
        var localElt = document.getElementById("transform-space");
        localElt.checked = !localElt.checked;
        engine.transformHandleComponent.setSpace(localElt.checked ? "local" : "world");
    }
    var snap = engine.gameInstance.input.keyboardButtons[window.KeyEvent.DOM_VK_CONTROL].isDown;
    if (snap !== (engine.transformHandleComponent.control.translationSnap != null)) {
        engine.transformHandleComponent.control.setTranslationSnap(snap ? ui_1.default.gridStep : null);
        engine.transformHandleComponent.control.setRotationSnap(snap ? Math.PI / 36 : null);
    }
}
// Mouse picking
var mousePosition = new THREE.Vector2;
var raycaster = new THREE.Raycaster;
var draggingControls = false;
engine.transformHandleComponent.control.addEventListener("mouseDown", function () {
    draggingControls = true;
});
engine.transformHandleComponent.control.addEventListener("objectChange", onTransformChange);
function mouseUp() {
    if (draggingControls) {
        draggingControls = false;
        return;
    }
    mousePosition.x = engine.gameInstance.input.mousePosition.x / canvasElt.clientWidth * 2 - 1;
    mousePosition.y = -(engine.gameInstance.input.mousePosition.y / canvasElt.clientHeight * 2 - 1);
    raycaster.setFromCamera(mousePosition, cameraComponent.threeCamera);
    var selectedNodeId = null;
    ui_1.default.nodesTreeView.clearSelection();
    var intersects = raycaster.intersectObject(engine.gameInstance.threeScene, true);
    if (intersects.length > 0) {
        for (var _i = 0; _i < intersects.length; _i++) {
            var intersect = intersects[_i];
            var threeObject = intersect.object;
            while (threeObject != null) {
                if (threeObject.userData.cubicNodeId != null)
                    break;
                threeObject = threeObject.parent;
            }
            if (threeObject != null) {
                selectedNodeId = threeObject.userData.cubicNodeId;
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
        var _a = network_1.data.cubicModelUpdater.cubicModelRenderer.byNodeId[nodeElt.dataset.id], pivot = _a.pivot, shape = _a.shape;
        engine.transformMarkerComponent.move(pivot);
        engine.selectionBoxComponent.setTarget(shape);
        var mode = engine.transformHandleComponent.mode;
        var handleTarget = (mode === "rotate" || (mode === "translate" && ui_1.default.translateMode !== "shape")) ? pivot : shape;
        engine.transformHandleComponent.setTarget(handleTarget);
    }
    else {
        engine.transformMarkerComponent.hide();
        engine.selectionBoxComponent.setTarget(null);
        engine.transformHandleComponent.setTarget(null);
    }
}
exports.setupHelpers = setupHelpers;
function onTransformChange() {
    var nodeElt = ui_1.default.nodesTreeView.selectedNodes[0];
    var nodeId = nodeElt.dataset.id;
    var _a = network_1.data.cubicModelUpdater.cubicModelRenderer.byNodeId[nodeElt.dataset.id], pivot = _a.pivot, shape = _a.shape;
    var transformMode = engine.transformHandleComponent.mode;
    var target = (transformMode === "rotate" || (transformMode === "translate" && ui_1.default.translateMode !== "shape")) ? pivot : shape;
    var object = engine.transformHandleComponent.control.object;
    var transformType;
    var value;
    switch (engine.transformHandleComponent.mode) {
        case "translate":
            switch (ui_1.default.translateMode) {
                case "all":
                    transformType = "position";
                    break;
                case "shape":
                    transformType = "shape.offset";
                    break;
                case "pivot":
                    transformType = "pivotPosition";
                    break;
            }
            var position = object.getWorldPosition();
            var parent_1 = target.parent;
            var pixelsPerUnit = network_1.data.cubicModelUpdater.cubicModelAsset.pub.pixelsPerUnit;
            /*if (ui.translateMode === "all") {
              position.sub(target.getWorldPosition().sub(parent.getWorldPosition()));
              parent = parent.parent;
            }*/
            if (parent_1.userData.cubicNodeId != null) {
                var inverseParentMatrix = parent_1.matrixWorld.clone();
                inverseParentMatrix.getInverse(inverseParentMatrix);
                position.applyMatrix4(inverseParentMatrix);
                if (ui_1.default.translateMode !== "shape") {
                    var parentOffset = network_1.data.cubicModelUpdater.cubicModelAsset.nodes.byId[parent_1.userData.cubicNodeId].shape.offset;
                    position.x -= parentOffset.x;
                    position.y -= parentOffset.y;
                    position.z -= parentOffset.z;
                }
                position.multiplyScalar(1 / pixelsPerUnit);
            }
            value = { x: position.x * pixelsPerUnit, y: position.y * pixelsPerUnit, z: position.z * pixelsPerUnit };
            break;
        case "rotate":
            if (ui_1.default.translateMode === "pivot")
                target = pivot;
            transformType = "orientation";
            var orientation_1 = object.getWorldQuaternion();
            if (target.parent != null) {
                var q = target.parent.getWorldQuaternion().inverse();
                orientation_1.multiply(q);
            }
            value = { x: orientation_1.x, y: orientation_1.y, z: orientation_1.z, w: orientation_1.w };
            break;
        case "scale":
            transformType = "scale";
            value = { x: object.scale.x, y: object.scale.y, z: object.scale.z };
            break;
    }
    if (transformType !== "pivotPosition") {
        network_1.socket.emit("edit:assets", SupClient.query.asset, "setNodeProperty", nodeId, transformType, value, function (err) { if (err != null)
            alert(err); });
    }
    else {
        network_1.socket.emit("edit:assets", SupClient.query.asset, "moveNodePivot", nodeId, value, function (err) { if (err != null)
            alert(err); });
    }
}
