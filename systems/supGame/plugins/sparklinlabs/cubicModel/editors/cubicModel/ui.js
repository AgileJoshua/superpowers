var network_1 = require("./network");
var engine_1 = require("./engine");
var textureArea_1 = require("./textureArea");
var CubicModelAsset_1 = require("../../data/CubicModelAsset");
var THREE = SupEngine.THREE;
/* tslint:disable */
var PerfectResize = require("perfect-resize");
var TreeView = require("dnd-tree-view");
/* tslint:enable */
var ui = {};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ui;
// Hotkeys
SupClient.setupHotkeys();
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
ui.canvasElt = document.querySelector("canvas");
// Setup resizable panes
new PerfectResize(document.querySelector(".texture-container"), "bottom");
new PerfectResize(document.querySelector(".sidebar"), "right");
new PerfectResize(document.querySelector(".nodes-tree-view"), "top");
// Grid
ui.gridSize = 20;
ui.gridStep = 1;
document.getElementById("grid-step").addEventListener("input", onGridStepInput);
document.getElementById("grid-visible").addEventListener("change", onGridVisibleChange);
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
// Unit ratio
ui.pixelsPerUnitInput = document.querySelector("input.property-pixelsPerUnit");
ui.pixelsPerUnitInput.addEventListener("change", onChangePixelsPerUnit);
function onChangePixelsPerUnit(event) { network_1.editAsset("setProperty", "pixelsPerUnit", parseFloat(event.target.value)); }
// Texture download
document.querySelector("button.download").addEventListener("click", function (event) {
    var options = {
        initialValue: "Texture",
        validationLabel: "Download"
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter a name for the texture.", options, function (name) {
        /* tslint:enable:no-unused-expression */
        if (name == null)
            return;
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style.display = "none";
        a.href = network_1.data.cubicModelUpdater.cubicModelAsset.clientTextureDatas["map"].ctx.canvas.toDataURL();
        a.download = name + ".png";
        a.click();
        document.body.removeChild(a);
    });
});
// Texture size
ui.textureWidthSelect = document.querySelector("select.property-texture-width");
ui.textureHeightSelect = document.querySelector("select.property-texture-height");
var addOption = function (parent, value) {
    var optionElt = document.createElement("option");
    optionElt.textContent = value.toString();
    optionElt.value = value.toString();
    parent.appendChild(optionElt);
};
for (var _i = 0, _a = CubicModelAsset_1.default.validTextureSizes; _i < _a.length; _i++) {
    var size = _a[_i];
    addOption(ui.textureWidthSelect, size);
    addOption(ui.textureHeightSelect, size);
}
ui.textureWidthSelect.addEventListener("input", function (event) { network_1.editAsset("changeTextureWidth", parseInt(event.target.value, 10)); });
ui.textureHeightSelect.addEventListener("input", function (event) { network_1.editAsset("changeTextureHeight", parseInt(event.target.value, 10)); });
// Setup tree view
ui.treeViewElt = document.querySelector(".nodes-tree-view");
ui.nodesTreeView = new TreeView(document.querySelector(".nodes-tree-view"), { dropCallback: onNodeDrop });
ui.nodesTreeView.on("activate", onNodeActivate);
ui.nodesTreeView.on("selectionChange", function () { setupSelectedNode(); });
function createNodeElement(node) {
    var liElt = document.createElement("li");
    liElt.dataset["id"] = node.id;
    var nameSpan = document.createElement("span");
    nameSpan.classList.add("name");
    nameSpan.textContent = node.name;
    liElt.appendChild(nameSpan);
    var visibleButton = document.createElement("button");
    visibleButton.textContent = "Hide";
    visibleButton.classList.add("show");
    visibleButton.addEventListener("click", function (event) {
        event.stopPropagation();
        var shape = network_1.data.cubicModelUpdater.cubicModelRenderer.byNodeId[event.target.parentElement.dataset["id"]].shape;
        shape.visible = !shape.visible;
        visibleButton.textContent = (shape.visible) ? "Hide" : "Show";
        if (shape.visible)
            visibleButton.classList.add("show");
        else
            visibleButton.classList.remove("show");
    });
    liElt.appendChild(visibleButton);
    return liElt;
}
exports.createNodeElement = createNodeElement;
function onNodeDrop(dropInfo, orderedNodes) {
    var dropPoint = SupClient.getTreeViewDropPoint(dropInfo, network_1.data.cubicModelUpdater.cubicModelAsset.nodes);
    var nodeIds = [];
    for (var _i = 0; _i < orderedNodes.length; _i++) {
        var node = orderedNodes[_i];
        nodeIds.push(node.dataset.id);
    }
    var sourceParentNode = network_1.data.cubicModelUpdater.cubicModelAsset.nodes.parentNodesById[nodeIds[0]];
    var sourceChildren = (sourceParentNode != null && sourceParentNode.children != null) ? sourceParentNode.children : network_1.data.cubicModelUpdater.cubicModelAsset.nodes.pub;
    var sameParent = (sourceParentNode != null && dropPoint.parentId === sourceParentNode.id);
    var i = 0;
    for (var _a = 0; _a < nodeIds.length; _a++) {
        var id = nodeIds[_a];
        network_1.editAsset("moveNode", id, dropPoint.parentId, dropPoint.index + i);
        if (!sameParent || sourceChildren.indexOf(network_1.data.cubicModelUpdater.cubicModelAsset.nodes.byId[id]) >= dropPoint.index)
            i++;
    }
    return false;
}
function onNodeActivate() { ui.nodesTreeView.selectedNodes[0].classList.toggle("collapsed"); }
function setupSelectedNode() {
    engine_1.setupHelpers();
    // Setup texture area
    var nodeIds = [];
    for (var _i = 0, _a = ui.nodesTreeView.selectedNodes; _i < _a.length; _i++) {
        var node_1 = _a[_i];
        nodeIds.push(node_1.dataset.id);
    }
    textureArea_1.setSelectedNode(nodeIds);
    // Setup transform
    var nodeElt = ui.nodesTreeView.selectedNodes[0];
    if (nodeElt == null || ui.nodesTreeView.selectedNodes.length !== 1) {
        ui.inspectorElt.hidden = true;
        ui.renameNodeButton.disabled = true;
        ui.duplicateNodeButton.disabled = true;
        ui.deleteNodeButton.disabled = true;
        return;
    }
    ui.inspectorElt.hidden = false;
    var node = network_1.data.cubicModelUpdater.cubicModelAsset.nodes.byId[nodeElt.dataset.id];
    setInspectorPosition(node.position);
    setInspectorOrientation(node.orientation);
    // Setup shape editor
    ui.inspectorFields.shape.type.value = node.shape.type;
    setInspectorShapeOffset(node.shape.offset);
    ui.shapeTbodyElt.hidden = node.shape.type !== "box";
    if (!ui.shapeTbodyElt.hidden) {
        var boxSettings = node.shape.settings;
        setInspectorBoxSize(boxSettings.size);
        setInspectorBoxStretch(boxSettings.stretch);
    }
    // Enable buttons
    ui.renameNodeButton.disabled = false;
    ui.duplicateNodeButton.disabled = false;
    ui.deleteNodeButton.disabled = false;
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
        if (ui.inspectorFields.position[i].value !== values[i]) {
            ui.inspectorFields.position[i].value = values[i];
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
        if (ui.inspectorFields.orientation[i].value !== values[i]) {
            ui.inspectorFields.orientation[i].value = values[i];
        }
    }
}
exports.setInspectorOrientation = setInspectorOrientation;
function setInspectorShapeOffset(offset) {
    var values = [
        roundForInspector(offset.x).toString(),
        roundForInspector(offset.y).toString(),
        roundForInspector(offset.z).toString()
    ];
    for (var i = 0; i < 3; i++) {
        // NOTE: This helps avoid clearing selection when possible
        if (ui.inspectorFields.shape.offset[i].value !== values[i]) {
            ui.inspectorFields.shape.offset[i].value = values[i];
        }
    }
}
exports.setInspectorShapeOffset = setInspectorShapeOffset;
function setInspectorBoxSize(size) {
    var values = [size.x.toString(), size.y.toString(), size.z.toString()];
    for (var i = 0; i < 3; i++) {
        // NOTE: This helps avoid clearing selection when possible
        if (ui.inspectorFields.shape.box.size[i].value !== values[i]) {
            ui.inspectorFields.shape.box.size[i].value = values[i];
        }
    }
}
exports.setInspectorBoxSize = setInspectorBoxSize;
function setInspectorBoxStretch(stretch) {
    var values = [
        roundForInspector(stretch.x).toString(),
        roundForInspector(stretch.y).toString(),
        roundForInspector(stretch.z).toString()
    ];
    for (var i = 0; i < 3; i++) {
        // NOTE: This helps avoid clearing selection when possible
        if (ui.inspectorFields.shape.box.stretch[i].value !== values[i]) {
            ui.inspectorFields.shape.box.stretch[i].value = values[i];
        }
    }
}
exports.setInspectorBoxStretch = setInspectorBoxStretch;
// Transform mode
ui.translateMode = "all";
document.querySelector(".main .controls .transform-mode").addEventListener("click", onTransformModeClick);
document.querySelector(".main .controls .transform-settings").addEventListener("click", onTransformSettingsClick);
function onTransformModeClick(event) {
    var target = event.target;
    if (target.tagName !== "INPUT")
        return;
    if (target.id === "transform-space") {
        engine_1.default.transformHandleComponent.setSpace(target.checked ? "local" : "world");
    }
    else {
        var transformSpaceCheckbox = document.getElementById("transform-space");
        transformSpaceCheckbox.disabled = target.value === "scale";
        engine_1.default.transformHandleComponent.setMode(target.value);
        if (target.value === "translate") {
            ui.translateMode = target.dataset["target"];
            var linkShapeToPivot = document.getElementById("translate-pivot-shape").checked;
            if (ui.translateMode === "pivot" && linkShapeToPivot)
                ui.translateMode = "all";
        }
    }
    engine_1.setupHelpers();
}
function onTransformSettingsClick(event) {
    var target = event.target;
    if (target.tagName !== "INPUT")
        return;
    if (target.id === "transform-space") {
        engine_1.default.transformHandleComponent.setSpace(target.checked ? "local" : "world");
    }
    else if (target.id === "translate-pivot-shape") {
        var linkShapeToPivot = document.getElementById("translate-pivot-shape").checked;
        if (ui.translateMode === "pivot" && linkShapeToPivot)
            ui.translateMode = "all";
        else if (ui.translateMode === "all" && !linkShapeToPivot)
            ui.translateMode = "pivot";
    }
}
// Node buttons
ui.newNodeButton = document.querySelector("button.new-node");
ui.newNodeButton.addEventListener("click", onNewNodeClick);
ui.renameNodeButton = document.querySelector("button.rename-node");
ui.renameNodeButton.addEventListener("click", onRenameNodeClick);
ui.duplicateNodeButton = document.querySelector("button.duplicate-node");
ui.duplicateNodeButton.addEventListener("click", onDuplicateNodeClick);
ui.deleteNodeButton = document.querySelector("button.delete-node");
ui.deleteNodeButton.addEventListener("click", onDeleteNodeClick);
// Inspector
ui.inspectorElt = document.querySelector(".inspector");
ui.shapeTbodyElt = ui.inspectorElt.querySelector(".box-shape");
ui.inspectorFields = {
    position: ui.inspectorElt.querySelectorAll(".transform .position input"),
    orientation: ui.inspectorElt.querySelectorAll(".transform .orientation input"),
    shape: {
        type: ui.inspectorElt.querySelector(".shape .type select"),
        offset: ui.inspectorElt.querySelectorAll(".shape .offset input"),
        box: {
            size: ui.inspectorElt.querySelectorAll(".box-shape .size input"),
            stretch: ui.inspectorElt.querySelectorAll(".box-shape .stretch input")
        }
    }
};
for (var _b = 0, _c = ui.inspectorFields.position; _b < _c.length; _b++) {
    var input = _c[_b];
    input.addEventListener("change", onInspectorInputChange);
}
for (var _d = 0, _e = ui.inspectorFields.orientation; _d < _e.length; _d++) {
    var input = _e[_d];
    input.addEventListener("change", onInspectorInputChange);
}
for (var _f = 0, _g = ui.inspectorFields.shape.offset; _f < _g.length; _f++) {
    var input = _g[_f];
    input.addEventListener("change", onInspectorInputChange);
}
for (var _h = 0, _j = ui.inspectorFields.shape.box.size; _h < _j.length; _h++) {
    var input = _j[_h];
    input.addEventListener("change", onInspectorInputChange);
}
for (var _k = 0, _l = ui.inspectorFields.shape.box.stretch; _k < _l.length; _k++) {
    var input = _l[_k];
    input.addEventListener("change", onInspectorInputChange);
}
function onNewNodeClick() {
    // TODO: Allow choosing shape and default texture color
    var options = {
        initialValue: "Node",
        validationLabel: "Create"
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter a name for the node.", options, function (name) {
        /* tslint:enable:no-unused-expression */
        if (name == null)
            return;
        var options = SupClient.getTreeViewInsertionPoint(ui.nodesTreeView);
        var quaternion = new THREE.Quaternion();
        engine_1.default.cameraActor.getGlobalOrientation(quaternion);
        var offset = new THREE.Vector3(0, 0, -10).applyQuaternion(quaternion);
        var position = new THREE.Vector3();
        engine_1.default.cameraActor.getGlobalPosition(position).add(offset);
        var pixelsPerunit = network_1.data.cubicModelUpdater.cubicModelAsset.pub.pixelsPerUnit;
        if (options.parentId != null) {
            var inverseParentMatrix = new THREE.Matrix4().getInverse(network_1.data.cubicModelUpdater.cubicModelRenderer.byNodeId[options.parentId].pivot.matrixWorld);
            position.applyMatrix4(inverseParentMatrix);
        }
        else {
            position.multiplyScalar(pixelsPerunit);
        }
        options.transform = { position: position };
        options.shape = {
            type: "box",
            offset: { x: 0, y: 0, z: 0 },
            settings: {
                size: { x: pixelsPerunit, y: pixelsPerunit, z: pixelsPerunit },
                stretch: { x: 1, y: 1, z: 1 }
            }
        };
        network_1.editAsset("addNode", name, options, function (nodeId) {
            ui.nodesTreeView.clearSelection();
            ui.nodesTreeView.addToSelection(ui.nodesTreeView.treeRoot.querySelector("li[data-id='" + nodeId + "']"));
            setupSelectedNode();
        });
    });
}
function onRenameNodeClick() {
    if (ui.nodesTreeView.selectedNodes.length !== 1)
        return;
    var selectedNode = ui.nodesTreeView.selectedNodes[0];
    var node = network_1.data.cubicModelUpdater.cubicModelAsset.nodes.byId[selectedNode.dataset.id];
    var options = {
        initialValue: node.name,
        validationLabel: "Rename"
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter a new name for the node.", options, function (newName) {
        /* tslint:enable:no-unused-expression */
        if (newName == null)
            return;
        network_1.editAsset("setNodeProperty", node.id, "name", newName);
    });
}
function onDuplicateNodeClick() {
    if (ui.nodesTreeView.selectedNodes.length !== 1)
        return;
    var selectedNode = ui.nodesTreeView.selectedNodes[0];
    var node = network_1.data.cubicModelUpdater.cubicModelAsset.nodes.byId[selectedNode.dataset.id];
    var options = {
        initialValue: node.name,
        validationLabel: "Duplicate"
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter a name for the new node.", options, function (newName) {
        /* tslint:enable:no-unused-expression */
        if (newName == null)
            return;
        var options = SupClient.getTreeViewInsertionPoint(ui.nodesTreeView);
        network_1.editAsset("duplicateNode", newName, node.id, options.index, function (err, nodeId) {
            if (err != null) {
                alert(err);
                return;
            }
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
    new SupClient.dialogs.ConfirmDialog("Are you sure you want to delete the selected nodes?", "Delete", function (confirm) {
        /* tslint:enable:no-unused-expression */
        if (!confirm)
            return;
        for (var _i = 0, _a = ui.nodesTreeView.selectedNodes; _i < _a.length; _i++) {
            var selectedNode = _a[_i];
            network_1.editAsset("removeNode", selectedNode.dataset.id);
        }
    });
}
function onInspectorInputChange(event) {
    if (ui.nodesTreeView.selectedNodes.length !== 1)
        return;
    var nodeId = ui.nodesTreeView.selectedNodes[0].dataset.id;
    // transform, shape or box-shape
    var context = event.target.parentElement.parentElement.parentElement.parentElement.className;
    var path;
    var uiFields;
    if (context === "transform") {
        path = "";
        uiFields = ui.inspectorFields;
    }
    else if (context === "shape") {
        path = "shape.";
        uiFields = ui.inspectorFields.shape;
    }
    else if (context === "box-shape") {
        path = "shape.settings.";
        uiFields = ui.inspectorFields.shape.box;
    }
    else
        throw new Error("Unsupported inspector input context");
    var propertyType = event.target.parentElement.parentElement.parentElement.className;
    var value;
    if (context === "shape" && propertyType === "type") {
        // Single value
        value = uiFields[propertyType].value;
    }
    else {
        // Multiple values
        var inputs = uiFields[propertyType];
        value = {
            x: parseFloat(inputs[0].value),
            y: parseFloat(inputs[1].value),
            z: parseFloat(inputs[2].value),
        };
        if (propertyType === "orientation") {
            var euler = new THREE.Euler(THREE.Math.degToRad(value.x), THREE.Math.degToRad(value.y), THREE.Math.degToRad(value.z));
            var quaternion = new THREE.Quaternion().setFromEuler(euler);
            value = { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w };
        }
    }
    if (propertyType !== "position" || ui.translateMode !== "pivot") {
        network_1.editAsset("setNodeProperty", nodeId, "" + path + propertyType, value);
    }
    else {
        network_1.editAsset("moveNodePivot", nodeId, value);
    }
}
