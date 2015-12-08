var network_1 = require("./network");
var engine_1 = require("./engine");
var THREE = SupEngine.THREE;
/* tslint:disable */
var TreeView = require("dnd-tree-view");
var PerfectResize = require("perfect-resize");
/* tslint:enable */
var ui = {};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ui;
// Hotkeys
document.addEventListener("keydown", function (event) {
    if (document.querySelector(".dialog") != null)
        return;
    var activeElement = document.activeElement;
    while (activeElement != null) {
        if (activeElement === ui.canvasElt || activeElement === ui.treeViewElt)
            break;
        activeElement = activeElement.parentElement;
    }
    if (activeElement == null)
        return;
    if (event.keyCode === 78 && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        onNewNodeClick();
    }
    if (event.keyCode === 80 && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        event.stopPropagation();
        onNewPrefabClick();
    }
    if (event.keyCode === 113) {
        event.preventDefault();
        onRenameNodeClick();
    }
    if (event.keyCode === 68 && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        onDuplicateNodeClick();
    }
    if (event.keyCode === 46) {
        event.preventDefault();
        onDeleteNodeClick();
    }
});
SupClient.setupHotkeys();
document.addEventListener("keydown", function (event) {
    if (document.querySelector("body > .dialog") != null)
        return;
    if (event.target.tagName === "INPUT")
        return;
    if (event.target.tagName === "TEXTAREA")
        return;
    if (event.target.tagName === "SELECT")
        return;
    if (event.target.tagName === "BUTTON")
        return;
    switch (event.keyCode) {
        case window.KeyEvent.DOM_VK_E:
            document.getElementById("transform-mode-translate").checked = true;
            engine_1.default.transformHandleComponent.setMode("translate");
            break;
        case window.KeyEvent.DOM_VK_R:
            document.getElementById("transform-mode-rotate").checked = true;
            engine_1.default.transformHandleComponent.setMode("rotate");
            break;
        case window.KeyEvent.DOM_VK_T:
            document.getElementById("transform-mode-scale").checked = true;
            engine_1.default.transformHandleComponent.setMode("scale");
            break;
        case window.KeyEvent.DOM_VK_L:
            var localElt = document.getElementById("transform-space");
            localElt.checked = !localElt.checked;
            engine_1.default.transformHandleComponent.setSpace(localElt.checked ? "local" : "world");
            break;
        case window.KeyEvent.DOM_VK_G:
            ui.gridCheckbox.checked = !ui.gridCheckbox.checked;
            engine_1.default.gridHelperComponent.setVisible(ui.gridCheckbox.checked);
            break;
        case window.KeyEvent.DOM_VK_F:
            if (ui.nodesTreeView.selectedNodes.length !== 1)
                return;
            var nodeId = ui.nodesTreeView.selectedNodes[0].dataset.id;
            var position = new THREE.Box3().setFromObject(network_1.data.sceneUpdater.bySceneNodeId[nodeId].actor.threeObject).center();
            if (ui.cameraMode === "2D")
                position.z = engine_1.default.cameraActor.getLocalPosition(new THREE.Vector3()).z;
            engine_1.default.cameraActor.setLocalPosition(position);
            if (ui.cameraMode === "3D")
                engine_1.default.cameraActor.moveOriented(new THREE.Vector3(0, 0, 20));
            break;
    }
});
ui.canvasElt = document.querySelector("canvas");
// Setup resizable panes
new PerfectResize(document.querySelector(".sidebar"), "right");
new PerfectResize(document.querySelector(".nodes-tree-view"), "top");
// Setup tree view
ui.treeViewElt = document.querySelector(".nodes-tree-view");
ui.nodesTreeView = new TreeView(ui.treeViewElt, { dropCallback: onNodeDrop });
ui.nodesTreeView.on("activate", onNodeActivate);
ui.nodesTreeView.on("selectionChange", function () { setupSelectedNode(); });
ui.newActorButton = document.querySelector("button.new-actor");
ui.newActorButton.addEventListener("click", onNewNodeClick);
ui.newPrefabButton = document.querySelector("button.new-prefab");
ui.newPrefabButton.addEventListener("click", onNewPrefabClick);
ui.renameNodeButton = document.querySelector("button.rename-node");
ui.renameNodeButton.addEventListener("click", onRenameNodeClick);
ui.duplicateNodeButton = document.querySelector("button.duplicate-node");
ui.duplicateNodeButton.addEventListener("click", onDuplicateNodeClick);
ui.deleteNodeButton = document.querySelector("button.delete-node");
ui.deleteNodeButton.addEventListener("click", onDeleteNodeClick);
// Inspector
ui.inspectorElt = document.querySelector(".inspector");
ui.inspectorTbodyElt = ui.inspectorElt.querySelector("tbody");
ui.transform = {
    positionElts: ui.inspectorElt.querySelectorAll(".transform .position input"),
    orientationElts: ui.inspectorElt.querySelectorAll(".transform .orientation input"),
    scaleElts: ui.inspectorElt.querySelectorAll(".transform .scale input"),
};
ui.visibleCheckbox = ui.inspectorElt.querySelector(".visible input");
ui.visibleCheckbox.addEventListener("change", onVisibleChange);
ui.layerSelect = ui.inspectorElt.querySelector(".layer select");
ui.layerSelect.addEventListener("change", onLayerChange);
ui.prefabRow = ui.inspectorElt.querySelector(".prefab");
ui.prefabInput = ui.inspectorElt.querySelector(".prefab input");
ui.prefabInput.addEventListener("input", onPrefabInput);
ui.prefabOpenElt = ui.inspectorElt.querySelector(".prefab button");
ui.prefabOpenElt.addEventListener("click", function (event) {
    var selectedNode = ui.nodesTreeView.selectedNodes[0];
    var node = network_1.data.sceneUpdater.sceneAsset.nodes.byId[selectedNode.dataset.id];
    var id = node.prefab.sceneAssetId;
    window.parent.postMessage({ type: "openEntry", id: id }, window.location.origin);
});
for (var transformType in ui.transform) {
    var inputs = ui.transform[transformType];
    for (var _i = 0; _i < inputs.length; _i++) {
        var input = inputs[_i];
        input.addEventListener("change", onTransformInputChange);
    }
}
ui.newComponentButton = document.querySelector("button.new-component");
ui.newComponentButton.addEventListener("click", onNewComponentClick);
ui.cameraMode = "3D";
ui.cameraModeButton = document.getElementById("toggle-camera-button");
ui.cameraModeButton.addEventListener("click", onChangeCameraMode);
ui.cameraVerticalAxis = "Y";
ui.cameraVerticalAxisButton = document.getElementById("toggle-camera-vertical-axis");
ui.cameraVerticalAxisButton.addEventListener("click", onChangeCameraVerticalAxis);
ui.cameraSpeedSlider = document.getElementById("camera-speed-slider");
ui.cameraSpeedSlider.addEventListener("input", onChangeCameraSpeed);
ui.cameraSpeedSlider.value = engine_1.default.cameraControls.movementSpeed;
ui.camera2DZ = document.getElementById("camera-2d-z");
ui.camera2DZ.addEventListener("input", onChangeCamera2DZ);
document.querySelector(".main .controls .transform-mode").addEventListener("click", onTransformModeClick);
ui.availableComponents = {};
function start() {
    var componentNames = Object.keys(SupClient.plugins["componentEditors"]);
    componentNames.sort(function (a, b) { return a.localeCompare(b); });
    for (var _i = 0; _i < componentNames.length; _i++) {
        var componentName = componentNames[_i];
        ui.availableComponents[componentName] = componentName;
    }
}
exports.start = start;
// Transform
function onTransformModeClick(event) {
    if (event.target.tagName !== "INPUT")
        return;
    if (event.target.id === "transform-space") {
        engine_1.default.transformHandleComponent.setSpace(event.target.checked ? "local" : "world");
    }
    else {
        var transformSpaceCheckbox = document.getElementById("transform-space");
        transformSpaceCheckbox.disabled = event.target.value === "scale";
        engine_1.default.transformHandleComponent.setMode(event.target.value);
    }
}
// Grid
ui.gridCheckbox = document.getElementById("grid-visible");
ui.gridCheckbox.addEventListener("change", onGridVisibleChange);
ui.gridSize = 80;
ui.gridStep = 1;
document.getElementById("grid-step").addEventListener("input", onGridStepInput);
function onGridStepInput(event) {
    var target = event.target;
    var value = parseFloat(target.value);
    if (value !== 0 && value < 0.0001) {
        value = 0;
        target.value = "0";
    }
    if (isNaN(value) || value <= 0) {
        target.reportValidity();
        return;
    }
    ui.gridStep = value;
    engine_1.default.gridHelperComponent.setup(ui.gridSize, ui.gridStep);
}
function onGridVisibleChange(event) {
    engine_1.default.gridHelperComponent.setVisible(event.target.checked);
}
// Light
document.getElementById("show-light").addEventListener("change", function (event) {
    if (event.target.checked)
        engine_1.default.gameInstance.threeScene.add(engine_1.default.ambientLight);
    else
        engine_1.default.gameInstance.threeScene.remove(engine_1.default.ambientLight);
});
function createNodeElement(node) {
    var liElt = document.createElement("li");
    liElt.dataset["id"] = node.id;
    var nameSpan = document.createElement("span");
    nameSpan.classList.add("name");
    if (node.prefab != null)
        nameSpan.classList.add("prefab");
    nameSpan.textContent = node.name;
    liElt.appendChild(nameSpan);
    var visibleButton = document.createElement("button");
    visibleButton.textContent = "Hide";
    visibleButton.classList.add("show");
    visibleButton.addEventListener("click", function (event) {
        event.stopPropagation();
        var actor = network_1.data.sceneUpdater.bySceneNodeId[event.target.parentElement.dataset["id"]].actor;
        actor.threeObject.visible = !actor.threeObject.visible;
        visibleButton.textContent = (actor.threeObject.visible) ? "Hide" : "Show";
        if (actor.threeObject.visible)
            visibleButton.classList.add("show");
        else
            visibleButton.classList.remove("show");
    });
    liElt.appendChild(visibleButton);
    return liElt;
}
exports.createNodeElement = createNodeElement;
function onNodeDrop(dropInfo, orderedNodes) {
    var dropPoint = SupClient.getTreeViewDropPoint(dropInfo, network_1.data.sceneUpdater.sceneAsset.nodes);
    var nodeIds = [];
    for (var _i = 0; _i < orderedNodes.length; _i++) {
        var node = orderedNodes[_i];
        nodeIds.push(node.dataset.id);
    }
    var sourceParentNode = network_1.data.sceneUpdater.sceneAsset.nodes.parentNodesById[nodeIds[0]];
    var sourceChildren = (sourceParentNode != null && sourceParentNode.children != null) ? sourceParentNode.children : network_1.data.sceneUpdater.sceneAsset.nodes.pub;
    var sameParent = (sourceParentNode != null && dropPoint.parentId === sourceParentNode.id);
    var i = 0;
    for (var _a = 0; _a < nodeIds.length; _a++) {
        var id = nodeIds[_a];
        network_1.socket.emit("edit:assets", SupClient.query.asset, "moveNode", id, dropPoint.parentId, dropPoint.index + i, function (err) { if (err != null)
            alert(err); });
        if (!sameParent || sourceChildren.indexOf(network_1.data.sceneUpdater.sceneAsset.nodes.byId[id]) >= dropPoint.index)
            i++;
    }
    return false;
}
function onNodeActivate() { ui.nodesTreeView.selectedNodes[0].classList.toggle("collapsed"); }
function setupSelectedNode() {
    engine_1.setupHelpers();
    // Clear component editors
    for (var componentId in ui.componentEditors)
        ui.componentEditors[componentId].destroy();
    ui.componentEditors = {};
    // Setup transform
    var nodeElt = ui.nodesTreeView.selectedNodes[0];
    if (nodeElt == null || ui.nodesTreeView.selectedNodes.length !== 1) {
        ui.inspectorElt.hidden = true;
        ui.newActorButton.disabled = false;
        ui.newPrefabButton.disabled = false;
        ui.renameNodeButton.disabled = true;
        ui.duplicateNodeButton.disabled = true;
        ui.deleteNodeButton.disabled = true;
        return;
    }
    ui.inspectorElt.hidden = false;
    var node = network_1.data.sceneUpdater.sceneAsset.nodes.byId[nodeElt.dataset.id];
    setInspectorPosition(node.position);
    setInspectorOrientation(node.orientation);
    setInspectorScale(node.scale);
    ui.visibleCheckbox.checked = node.visible;
    ui.layerSelect.value = node.layer;
    // If it's a prefab, disable various buttons
    var isPrefab = node.prefab != null;
    ui.newActorButton.disabled = isPrefab;
    ui.newPrefabButton.disabled = isPrefab;
    ui.renameNodeButton.disabled = false;
    ui.duplicateNodeButton.disabled = false;
    ui.deleteNodeButton.disabled = false;
    if (isPrefab) {
        if (ui.prefabRow.parentElement == null)
            ui.inspectorTbodyElt.appendChild(ui.prefabRow);
        setInspectorPrefabScene(node.prefab.sceneAssetId);
    }
    else if (ui.prefabRow.parentElement != null)
        ui.inspectorTbodyElt.removeChild(ui.prefabRow);
    // Setup component editors
    var componentsElt = ui.inspectorElt.querySelector(".components");
    componentsElt.innerHTML = "";
    for (var _i = 0, _a = node.components; _i < _a.length; _i++) {
        var component = _a[_i];
        var componentElt = createComponentElement(node.id, component);
        ui.inspectorElt.querySelector(".components").appendChild(componentElt);
    }
    ui.newComponentButton.disabled = isPrefab;
}
exports.setupSelectedNode = setupSelectedNode;
function roundForInspector(number) { return parseFloat(number.toFixed(3)); }
function setInspectorPosition(position) {
    var values = [
        roundForInspector(position.x).toString(),
        roundForInspector(position.y).toString(),
        roundForInspector(position.z).toString()
    ];
    for (var i = 0; i < 3; i++) {
        // NOTE: This helps avoid clearing selection when possible
        if (ui.transform.positionElts[i].value !== values[i]) {
            ui.transform.positionElts[i].value = values[i];
        }
    }
}
exports.setInspectorPosition = setInspectorPosition;
function setInspectorOrientation(orientation) {
    var euler = new THREE.Euler().setFromQuaternion(orientation);
    var values = [
        roundForInspector(THREE.Math.radToDeg(euler.x)).toString(),
        roundForInspector(THREE.Math.radToDeg(euler.y)).toString(),
        roundForInspector(THREE.Math.radToDeg(euler.z)).toString()
    ];
    // Work around weird conversion from quaternion to euler conversion
    if (values[1] === "180" && values[2] === "180") {
        values[0] = roundForInspector(180 - THREE.Math.radToDeg(euler.x)).toString();
        values[1] = "0";
        values[2] = "0";
    }
    for (var i = 0; i < 3; i++) {
        // NOTE: This helps avoid clearing selection when possible
        if (ui.transform.orientationElts[i].value !== values[i]) {
            ui.transform.orientationElts[i].value = values[i];
        }
    }
}
exports.setInspectorOrientation = setInspectorOrientation;
function setInspectorScale(scale) {
    var values = [
        roundForInspector(scale.x).toString(),
        roundForInspector(scale.y).toString(),
        roundForInspector(scale.z).toString()
    ];
    for (var i = 0; i < 3; i++) {
        // NOTE: This helps avoid clearing selection when possible
        if (ui.transform.scaleElts[i].value !== values[i]) {
            ui.transform.scaleElts[i].value = values[i];
        }
    }
}
exports.setInspectorScale = setInspectorScale;
function setInspectorVisible(visible) {
    ui.visibleCheckbox.checked = visible;
}
exports.setInspectorVisible = setInspectorVisible;
function setInspectorLayer(layer) {
    ui.layerSelect.value = layer;
}
exports.setInspectorLayer = setInspectorLayer;
function setupInspectorLayers() {
    while (ui.layerSelect.childElementCount > network_1.data.gameSettingsResource.pub.customLayers.length + 1)
        ui.layerSelect.removeChild(ui.layerSelect.lastElementChild);
    var optionElt = ui.layerSelect.firstElementChild.nextElementSibling;
    for (var i = 0; i < network_1.data.gameSettingsResource.pub.customLayers.length; i++) {
        if (optionElt == null) {
            optionElt = document.createElement("option");
            ui.layerSelect.appendChild(optionElt);
        }
        optionElt.value = (i + 1).toString(); // + 1 because "Default" is 0
        optionElt.textContent = network_1.data.gameSettingsResource.pub.customLayers[i];
        optionElt = optionElt.nextElementSibling;
    }
}
exports.setupInspectorLayers = setupInspectorLayers;
function setInspectorPrefabScene(sceneAssetId) {
    ui.prefabInput.value = sceneAssetId != null ? network_1.data.projectClient.entries.getPathFromId(sceneAssetId) : "";
    ui.prefabOpenElt.disabled = sceneAssetId == null;
}
exports.setInspectorPrefabScene = setInspectorPrefabScene;
function onNewNodeClick() {
    var options = {
        initialValue: "Actor",
        validationLabel: "Create",
        pattern: SupClient.namePattern,
        title: SupClient.namePatternDescription
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter a name for the actor.", options, function (name) {
        /* tslint:enable:no-unused-expression */
        if (name == null)
            return;
        createNewNode(name, false);
    });
}
function onNewPrefabClick() {
    var options = {
        initialValue: "Prefab",
        validationLabel: "Create",
        pattern: SupClient.namePattern,
        title: SupClient.namePatternDescription
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter a name for the prefab.", options, function (name) {
        /* tslint:enable:no-unused-expression */
        if (name == null)
            return;
        createNewNode(name, true);
    });
}
function createNewNode(name, prefab) {
    var options = SupClient.getTreeViewInsertionPoint(ui.nodesTreeView);
    var offset = new THREE.Vector3(0, 0, -10).applyQuaternion(engine_1.default.cameraActor.getGlobalOrientation(new THREE.Quaternion()));
    var position = new THREE.Vector3();
    engine_1.default.cameraActor.getGlobalPosition(position).add(offset);
    if (options.parentId != null) {
        var parentMatrix = network_1.data.sceneUpdater.bySceneNodeId[options.parentId].actor.getGlobalMatrix(new THREE.Matrix4());
        position.applyMatrix4(parentMatrix.getInverse(parentMatrix));
    }
    options.transform = { position: position };
    options.prefab = prefab;
    network_1.socket.emit("edit:assets", SupClient.query.asset, "addNode", name, options, function (err, nodeId) {
        if (err != null) {
            alert(err);
            return;
        }
        ui.nodesTreeView.clearSelection();
        ui.nodesTreeView.addToSelection(ui.nodesTreeView.treeRoot.querySelector("li[data-id='" + nodeId + "']"));
        setupSelectedNode();
    });
}
function onRenameNodeClick() {
    if (ui.nodesTreeView.selectedNodes.length !== 1)
        return;
    var selectedNode = ui.nodesTreeView.selectedNodes[0];
    var node = network_1.data.sceneUpdater.sceneAsset.nodes.byId[selectedNode.dataset.id];
    var options = {
        initialValue: node.name,
        validationLabel: "Rename",
        pattern: SupClient.namePattern,
        title: SupClient.namePatternDescription
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter a new name for the actor.", options, function (newName) {
        /* tslint:enable:no-unused-expression */
        if (newName == null)
            return;
        network_1.socket.emit("edit:assets", SupClient.query.asset, "setNodeProperty", node.id, "name", newName, function (err) { if (err != null)
            alert(err); });
    });
}
function onDuplicateNodeClick() {
    if (ui.nodesTreeView.selectedNodes.length !== 1)
        return;
    var selectedNode = ui.nodesTreeView.selectedNodes[0];
    var node = network_1.data.sceneUpdater.sceneAsset.nodes.byId[selectedNode.dataset.id];
    var options = {
        initialValue: node.name,
        validationLabel: "Duplicate",
        pattern: SupClient.namePattern,
        title: SupClient.namePatternDescription
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter a name for the new actor.", options, function (newName) {
        /* tslint:enable:no-unused-expression */
        if (newName == null)
            return;
        var options = SupClient.getTreeViewInsertionPoint(ui.nodesTreeView);
        network_1.socket.emit("edit:assets", SupClient.query.asset, "duplicateNode", newName, node.id, options.index, function (err, nodeId) {
            if (err != null)
                alert(err);
            ui.nodesTreeView.clearSelection();
            ui.nodesTreeView.addToSelection(ui.nodesTreeView.treeRoot.querySelector("li[data-id='" + nodeId + "']"));
            setupSelectedNode();
        });
    });
}
function onDeleteNodeClick() {
    if (ui.nodesTreeView.selectedNodes.length === 0)
        return;
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.ConfirmDialog("Are you sure you want to delete the selected actors?", "Delete", function (confirm) {
        /* tslint:enable:no-unused-expression */
        if (!confirm)
            return;
        for (var _i = 0, _a = ui.nodesTreeView.selectedNodes; _i < _a.length; _i++) {
            var selectedNode = _a[_i];
            network_1.socket.emit("edit:assets", SupClient.query.asset, "removeNode", selectedNode.dataset.id, function (err) { if (err != null)
                alert(err); });
        }
    });
}
function onTransformInputChange(event) {
    if (ui.nodesTreeView.selectedNodes.length !== 1)
        return;
    var transformType = event.target.parentElement.parentElement.parentElement.className;
    var inputs = ui.transform[(transformType + "Elts")];
    var value = {
        x: parseFloat(inputs[0].value),
        y: parseFloat(inputs[1].value),
        z: parseFloat(inputs[2].value),
    };
    if (transformType === "orientation") {
        var euler = new THREE.Euler(THREE.Math.degToRad(value.x), THREE.Math.degToRad(value.y), THREE.Math.degToRad(value.z));
        var quaternion = new THREE.Quaternion().setFromEuler(euler);
        value = { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w };
    }
    var nodeId = ui.nodesTreeView.selectedNodes[0].dataset.id;
    network_1.socket.emit("edit:assets", SupClient.query.asset, "setNodeProperty", nodeId, transformType, value, function (err) { if (err != null)
        alert(err); });
}
function onVisibleChange(event) {
    if (ui.nodesTreeView.selectedNodes.length !== 1)
        return;
    var nodeId = ui.nodesTreeView.selectedNodes[0].dataset.id;
    network_1.socket.emit("edit:assets", SupClient.query.asset, "setNodeProperty", nodeId, "visible", event.target.checked, function (err) { if (err != null)
        alert(err); });
}
function onLayerChange(event) {
    if (ui.nodesTreeView.selectedNodes.length !== 1)
        return;
    var nodeId = ui.nodesTreeView.selectedNodes[0].dataset.id;
    network_1.socket.emit("edit:assets", SupClient.query.asset, "setNodeProperty", nodeId, "layer", parseInt(event.target.value, 10), function (err) { if (err != null)
        alert(err); });
}
function onPrefabInput(event) {
    if (ui.nodesTreeView.selectedNodes.length !== 1)
        return;
    var nodeId = ui.nodesTreeView.selectedNodes[0].dataset.id;
    if (event.target.value === "") {
        network_1.socket.emit("edit:assets", SupClient.query.asset, "setNodeProperty", nodeId, "prefab.sceneAssetId", null, function (err) { if (err != null)
            alert(err); });
    }
    else {
        var entry = SupClient.findEntryByPath(network_1.data.projectClient.entries.pub, event.target.value);
        if (entry != null && entry.type === "scene") {
            network_1.socket.emit("edit:assets", SupClient.query.asset, "setNodeProperty", nodeId, "prefab.sceneAssetId", entry.id, function (err) { if (err != null)
                alert(err); });
        }
    }
}
function createComponentElement(nodeId, component) {
    var componentElt = document.createElement("div");
    componentElt.dataset["componentId"] = component.id;
    var template = document.getElementById("component-cartridge-template");
    var clone = document.importNode(template.content, true);
    clone.querySelector(".type").textContent = component.type;
    var table = clone.querySelector(".settings");
    var editConfig = function (command) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var callback = function (err) { if (err != null)
            alert(err); };
        // Override callback if one is given
        var lastArg = args[args.length - 1];
        if (typeof lastArg === "function")
            callback = args.pop();
        // Prevent setting a NaN value
        if (command === "setProperty" && typeof args[1] === "number" && isNaN(args[1]))
            return;
        network_1.socket.emit.apply(network_1.socket, ["edit:assets", SupClient.query.asset, "editComponent", nodeId, component.id, command].concat(args, [callback]));
    };
    var componentEditorPlugin = SupClient.plugins["componentEditors"][component.type].content;
    ui.componentEditors[component.id] = new componentEditorPlugin(table.querySelector("tbody"), component.config, network_1.data.projectClient, editConfig);
    var shrinkButton = clone.querySelector(".shrink-component");
    shrinkButton.addEventListener("click", function () {
        if (table.style.display === "none") {
            table.style.display = "";
            shrinkButton.textContent = "–";
        }
        else {
            table.style.display = "none";
            shrinkButton.textContent = "+";
        }
    });
    clone.querySelector(".delete-component").addEventListener("click", onDeleteComponentClick);
    componentElt.appendChild(clone);
    return componentElt;
}
exports.createComponentElement = createComponentElement;
function onNewComponentClick() {
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.SelectDialog("Select the type of component to create.", ui.availableComponents, "Create", { size: 12 }, function (type) {
        /* tslint:enable:no-unused-expression */
        if (type == null)
            return;
        var nodeId = ui.nodesTreeView.selectedNodes[0].dataset.id;
        network_1.socket.emit("edit:assets", SupClient.query.asset, "addComponent", nodeId, type, null, function (err) { if (err != null)
            alert(err); });
    });
}
function onDeleteComponentClick(event) {
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.ConfirmDialog("Are you sure you want to delete this component?", "Delete", function (confirm) {
        /* tslint:enable:no-unused-expression */
        if (!confirm)
            return;
        var nodeId = ui.nodesTreeView.selectedNodes[0].dataset.id;
        var componentId = event.target.parentElement.parentElement.dataset.componentId;
        network_1.socket.emit("edit:assets", SupClient.query.asset, "removeComponent", nodeId, componentId, function (err) { if (err != null)
            alert(err); });
    });
}
function setCameraMode(mode) {
    engine_1.default.gameInstance.destroyComponent(engine_1.default.cameraControls);
    ui.cameraMode = mode;
    document.querySelector(".controls .camera-vertical-axis").hidden = ui.cameraMode !== "3D";
    document.querySelector(".controls .camera-speed").hidden = ui.cameraMode !== "3D";
    document.querySelector(".controls .camera-2d-z").hidden = ui.cameraMode === "3D";
    var axis = ui.cameraMode === "3D" ? ui.cameraVerticalAxis : "Y";
    engine_1.default.cameraRoot.setLocalEulerAngles(new THREE.Euler(axis === "Y" ? 0 : Math.PI / 2, 0, 0));
    engine_1.updateCameraMode();
    ui.cameraModeButton.textContent = ui.cameraMode;
}
exports.setCameraMode = setCameraMode;
function onChangeCameraMode(event) {
    setCameraMode(ui.cameraMode === "3D" ? "2D" : "3D");
}
function setCameraVerticalAxis(axis) {
    ui.cameraVerticalAxis = axis;
    engine_1.default.cameraRoot.setLocalEulerAngles(new THREE.Euler(axis === "Y" ? 0 : Math.PI / 2, 0, 0));
    ui.cameraVerticalAxisButton.textContent = axis;
}
exports.setCameraVerticalAxis = setCameraVerticalAxis;
function onChangeCameraVerticalAxis(event) {
    setCameraVerticalAxis(ui.cameraVerticalAxis === "Y" ? "Z" : "Y");
}
function onChangeCameraSpeed() {
    engine_1.default.cameraControls.movementSpeed = ui.cameraSpeedSlider.value;
}
function onChangeCamera2DZ() {
    var z = parseFloat(ui.camera2DZ.value);
    if (isNaN(z))
        return;
    engine_1.default.cameraActor.threeObject.position.setZ(z);
    engine_1.default.cameraActor.threeObject.updateMatrixWorld(false);
}
