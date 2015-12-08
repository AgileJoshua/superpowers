var ui_1 = require("./ui");
var textureArea = require("./textureArea");
var engine_1 = require("./engine");
var CubicModelRenderer_1 = require("../../components/CubicModelRenderer");
var CubicModelRendererUpdater_1 = require("../../components/CubicModelRendererUpdater");
exports.socket = SupClient.connect(SupClient.query.project);
exports.socket.on("connect", onConnected);
exports.socket.on("disconnect", SupClient.onDisconnected);
var onEditCommands = {};
function onConnected() {
    exports.data = {};
    exports.data.projectClient = new SupClient.ProjectClient(exports.socket);
    var cubicModelActor = new SupEngine.Actor(engine_1.default.gameInstance, "Cubic Model");
    var cubicModelRenderer = new CubicModelRenderer_1.default(cubicModelActor);
    var config = { cubicModelAssetId: SupClient.query.asset /*, materialType: "basic"*/ };
    var receiveCallbacks = { cubicModel: onAssetReceived };
    var editCallbacks = { cubicModel: onEditCommands };
    exports.data.cubicModelUpdater = new CubicModelRendererUpdater_1.default(exports.data.projectClient, cubicModelRenderer, config, receiveCallbacks, editCallbacks);
}
function onAssetReceived() {
    // Clear tree view
    ui_1.default.nodesTreeView.clearSelection();
    ui_1.default.nodesTreeView.treeRoot.innerHTML = "";
    function walk(node, parentNode, parentElt) {
        var liElt = ui_1.createNodeElement(node);
        ui_1.default.nodesTreeView.append(liElt, "group", parentElt);
        if (node.children != null && node.children.length > 0) {
            liElt.classList.add("collapsed");
            for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                var child = _a[_i];
                walk(child, node, liElt);
            }
        }
    }
    for (var _i = 0, _a = exports.data.cubicModelUpdater.cubicModelAsset.nodes.pub; _i < _a.length; _i++) {
        var node = _a[_i];
        walk(node, null, null);
    }
    var pub = exports.data.cubicModelUpdater.cubicModelAsset.pub;
    ui_1.default.pixelsPerUnitInput.value = pub.pixelsPerUnit.toString();
    ui_1.default.textureWidthSelect.value = pub.textureWidth.toString();
    ui_1.default.textureHeightSelect.value = pub.textureHeight.toString();
    textureArea.setup();
}
function editAsset() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    var callback;
    if (typeof args[args.length - 1] === "function")
        callback = args.pop();
    args.push(function (err, id) {
        if (err != null) {
            alert(err);
            return;
        }
        if (callback != null)
            callback(id);
    });
    exports.socket.emit.apply(exports.socket, ["edit:assets", SupClient.query.asset].concat(args));
}
exports.editAsset = editAsset;
onEditCommands.setProperty = function (path, value) {
    if (path === "pixelsPerUnit")
        ui_1.default.pixelsPerUnitInput.value = value.toString();
};
onEditCommands.addNode = function (node, parentId, index) {
    var nodeElt = ui_1.createNodeElement(node);
    var parentElt;
    if (parentId != null)
        parentElt = ui_1.default.nodesTreeView.treeRoot.querySelector("[data-id='" + parentId + "']");
    ui_1.default.nodesTreeView.insertAt(nodeElt, "group", index, parentElt);
    textureArea.addNode(node);
};
onEditCommands.moveNode = function (id, parentId, index) {
    // Reparent tree node
    var nodeElt = ui_1.default.nodesTreeView.treeRoot.querySelector("[data-id='" + id + "']");
    var isInspected = ui_1.default.nodesTreeView.selectedNodes.length === 1 && nodeElt === ui_1.default.nodesTreeView.selectedNodes[0];
    var parentElt;
    if (parentId != null)
        parentElt = ui_1.default.nodesTreeView.treeRoot.querySelector("[data-id='" + parentId + "']");
    ui_1.default.nodesTreeView.insertAt(nodeElt, "group", index, parentElt);
    // Refresh inspector
    if (isInspected) {
        var node = exports.data.cubicModelUpdater.cubicModelAsset.nodes.byId[id];
        ui_1.setInspectorPosition(node.position);
        ui_1.setInspectorOrientation(node.orientation);
    }
    // TODO: Only refresh if selection is affected
    engine_1.setupHelpers();
};
onEditCommands.moveNodePivot = function (id, value) {
    var nodeElt = ui_1.default.nodesTreeView.treeRoot.querySelector("[data-id='" + id + "']");
    var isInspected = ui_1.default.nodesTreeView.selectedNodes.length === 1 && nodeElt === ui_1.default.nodesTreeView.selectedNodes[0];
    var node = exports.data.cubicModelUpdater.cubicModelAsset.nodes.byId[id];
    if (isInspected) {
        ui_1.setInspectorPosition(node.position);
        ui_1.setInspectorOrientation(node.orientation);
        ui_1.setInspectorShapeOffset(node.shape.offset);
    }
    // TODO: Only refresh if selection is affected
    engine_1.setupHelpers();
};
onEditCommands.setNodeProperty = function (id, path, value) {
    var nodeElt = ui_1.default.nodesTreeView.treeRoot.querySelector("[data-id='" + id + "']");
    var isInspected = ui_1.default.nodesTreeView.selectedNodes.length === 1 && nodeElt === ui_1.default.nodesTreeView.selectedNodes[0];
    var node = exports.data.cubicModelUpdater.cubicModelAsset.nodes.byId[id];
    switch (path) {
        case "name":
            nodeElt.querySelector(".name").textContent = value;
            break;
        case "position":
            if (isInspected)
                ui_1.setInspectorPosition(node.position);
            break;
        case "orientation":
            if (isInspected)
                ui_1.setInspectorOrientation(node.orientation);
            break;
        case "shape.offset":
            if (isInspected)
                ui_1.setInspectorShapeOffset(node.shape.offset);
            break;
        case "shape.settings.size":
            if (isInspected)
                ui_1.setInspectorBoxSize(node.shape.settings.size);
            break;
        case "shape.settings.stretch":
            if (isInspected)
                ui_1.setInspectorBoxStretch(node.shape.settings.stretch);
            break;
    }
    textureArea.updateNode(node);
    // TODO: Only refresh if selection is affected
    engine_1.setupHelpers();
};
onEditCommands.duplicateNode = function (rootNode, newNodes) {
    for (var _i = 0; _i < newNodes.length; _i++) {
        var newNode = newNodes[_i];
        onEditCommands.addNode(newNode.node, newNode.parentId, newNode.index);
    }
    // TODO: Only refresh if selection is affected
    engine_1.setupHelpers();
};
onEditCommands.removeNode = function (id) {
    var nodeElt = ui_1.default.nodesTreeView.treeRoot.querySelector("[data-id='" + id + "']");
    var isInspected = ui_1.default.nodesTreeView.selectedNodes.length === 1 && nodeElt === ui_1.default.nodesTreeView.selectedNodes[0];
    ui_1.default.nodesTreeView.remove(nodeElt);
    textureArea.updateRemovedNode();
    if (isInspected)
        ui_1.setupSelectedNode();
    // TODO: Only refresh if selection is affected
    engine_1.setupHelpers();
};
onEditCommands.moveNodeTextureOffset = function (nodeIds, offset) {
    for (var _i = 0; _i < nodeIds.length; _i++) {
        var id = nodeIds[_i];
        var node = exports.data.cubicModelUpdater.cubicModelAsset.nodes.byId[id];
        textureArea.updateNode(node);
    }
};
onEditCommands.changeTextureWidth = function () {
    ui_1.default.textureWidthSelect.value = exports.data.cubicModelUpdater.cubicModelAsset.pub.textureWidth.toString();
    textureArea.setupTexture();
};
onEditCommands.changeTextureHeight = function () {
    ui_1.default.textureHeightSelect.value = exports.data.cubicModelUpdater.cubicModelAsset.pub.textureHeight.toString();
    textureArea.setupTexture();
};
