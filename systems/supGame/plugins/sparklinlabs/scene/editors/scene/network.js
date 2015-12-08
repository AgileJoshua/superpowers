var ui_1 = require("./ui");
var engine_1 = require("./engine");
var async = require("async");
var THREE = SupEngine.THREE;
var SceneUpdater_1 = require("../../components/SceneUpdater");
exports.socket = SupClient.connect(SupClient.query.project);
exports.socket.on("welcome", onWelcome);
exports.socket.on("disconnect", SupClient.onDisconnected);
function onWelcome() {
    exports.data = { projectClient: new SupClient.ProjectClient(exports.socket, { subEntries: true }) };
    loadPlugins(function () {
        engine_1.start();
        ui_1.start();
        exports.data.projectClient.subResource("sceneSettings", sceneSettingSubscriber);
        exports.data.projectClient.subResource("gameSettings", gameSettingSubscriber);
    });
}
function loadPlugins(callback) {
    window.fetch("/systems/" + SupCore.system.name + "/plugins.json").then(function (response) { return response.json(); }).then(function (pluginsInfo) {
        async.eachSeries(pluginsInfo.list, function (pluginName, pluginCallback) {
            async.series([
                function (cb) {
                    var dataScript = document.createElement("script");
                    dataScript.src = "/systems/" + SupCore.system.name + "/plugins/" + pluginName + "/data.js";
                    dataScript.addEventListener("load", function () { cb(null, null); });
                    dataScript.addEventListener("error", function () { cb(null, null); });
                    document.body.appendChild(dataScript);
                },
                function (cb) {
                    var componentsScript = document.createElement("script");
                    componentsScript.src = "/systems/" + SupCore.system.name + "/plugins/" + pluginName + "/components.js";
                    componentsScript.addEventListener("load", function () { cb(null, null); });
                    componentsScript.addEventListener("error", function () { cb(null, null); });
                    document.body.appendChild(componentsScript);
                },
                function (cb) {
                    SupClient.activePluginPath = "/systems/" + SupCore.system.name + "/plugins/" + pluginName;
                    var componentEditorsScript = document.createElement("script");
                    componentEditorsScript.src = SupClient.activePluginPath + "/componentEditors.js";
                    componentEditorsScript.addEventListener("load", function () { cb(null, null); });
                    componentEditorsScript.addEventListener("error", function () { cb(null, null); });
                    document.body.appendChild(componentEditorsScript);
                },
            ], pluginCallback);
        }, callback);
    });
}
var sceneSettingSubscriber = {
    onResourceReceived: function (resourceId, resource) {
        ui_1.setCameraMode(resource.pub.defaultCameraMode);
        ui_1.setCameraVerticalAxis(resource.pub.defaultVerticalAxis);
        exports.data.sceneUpdater = new SceneUpdater_1.default(exports.data.projectClient, { gameInstance: engine_1.default.gameInstance, actor: null }, { sceneAssetId: SupClient.query.asset, isInPrefab: false }, { scene: onSceneAssetReceived }, { scene: onEditCommands });
    },
    onResourceEdited: function (resourceId, command, propertyName) { }
};
var gameSettingSubscriber = {
    onResourceReceived: function (resourceId, resource) {
        exports.data.gameSettingsResource = resource;
        ui_1.setupInspectorLayers();
    },
    onResourceEdited: function (resourceId, command, propertyName) {
        if (propertyName == "customLayers")
            ui_1.setupInspectorLayers();
    }
};
function onSceneAssetReceived() {
    // Clear tree view
    ui_1.default.nodesTreeView.clearSelection();
    ui_1.default.nodesTreeView.treeRoot.innerHTML = "";
    var box = {
        x: { min: Infinity, max: -Infinity },
        y: { min: Infinity, max: -Infinity },
        z: { min: Infinity, max: -Infinity },
    };
    var pos = new THREE.Vector3();
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
        // Compute scene bounding box
        exports.data.sceneUpdater.bySceneNodeId[node.id].actor.getGlobalPosition(pos);
        box.x.min = Math.min(box.x.min, pos.x);
        box.x.max = Math.max(box.x.max, pos.x);
        box.y.min = Math.min(box.y.min, pos.y);
        box.y.max = Math.max(box.y.max, pos.y);
        box.z.min = Math.min(box.z.min, pos.z);
        box.z.max = Math.max(box.z.max, pos.z);
    }
    for (var _i = 0, _a = exports.data.sceneUpdater.sceneAsset.nodes.pub; _i < _a.length; _i++) {
        var node = _a[_i];
        walk(node, null, null);
    }
    // Place camera so that it fits the scene
    if (exports.data.sceneUpdater.sceneAsset.nodes.pub.length > 0) {
        var z = box.z.max + 10;
        engine_1.default.cameraActor.setLocalPosition(new THREE.Vector3((box.x.min + box.x.max) / 2, (box.y.min + box.y.max) / 2, z));
        ui_1.default.camera2DZ.value = z.toString();
    }
}
var onEditCommands = {};
onEditCommands.addNode = function (node, parentId, index) {
    var nodeElt = ui_1.createNodeElement(node);
    var parentElt;
    if (parentId != null)
        parentElt = ui_1.default.nodesTreeView.treeRoot.querySelector("[data-id='" + parentId + "']");
    ui_1.default.nodesTreeView.insertAt(nodeElt, "group", index, parentElt);
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
        var node = exports.data.sceneUpdater.sceneAsset.nodes.byId[id];
        ui_1.setInspectorPosition(node.position);
        ui_1.setInspectorOrientation(node.orientation);
        ui_1.setInspectorScale(node.scale);
    }
    // TODO: Only refresh if selection is affected
    engine_1.setupHelpers();
};
onEditCommands.setNodeProperty = function (id, path, value) {
    var nodeElt = ui_1.default.nodesTreeView.treeRoot.querySelector("[data-id='" + id + "']");
    var isInspected = ui_1.default.nodesTreeView.selectedNodes.length === 1 && nodeElt === ui_1.default.nodesTreeView.selectedNodes[0];
    var node = exports.data.sceneUpdater.sceneAsset.nodes.byId[id];
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
        case "scale":
            if (isInspected)
                ui_1.setInspectorScale(node.scale);
            break;
        case "visible":
            if (isInspected)
                ui_1.setInspectorVisible(value);
            break;
        case "layer":
            if (isInspected)
                ui_1.setInspectorLayer(value);
            break;
        case "prefab.sceneAssetId":
            if (isInspected)
                ui_1.setInspectorPrefabScene(value);
            break;
    }
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
    if (isInspected)
        ui_1.setupSelectedNode();
    else
        engine_1.setupHelpers();
};
onEditCommands.addComponent = function (nodeId, nodeComponent, index) {
    var isInspected = ui_1.default.nodesTreeView.selectedNodes.length === 1 && nodeId === ui_1.default.nodesTreeView.selectedNodes[0].dataset.id;
    if (isInspected) {
        var componentElt = ui_1.createComponentElement(nodeId, nodeComponent);
        // TODO: Take index into account
        ui_1.default.inspectorElt.querySelector(".components").appendChild(componentElt);
    }
    // TODO: Only refresh if selection is affected
    engine_1.setupHelpers();
};
onEditCommands.editComponent = function (nodeId, componentId, command) {
    var args = [];
    for (var _i = 3; _i < arguments.length; _i++) {
        args[_i - 3] = arguments[_i];
    }
    var isInspected = ui_1.default.nodesTreeView.selectedNodes.length === 1 && nodeId === ui_1.default.nodesTreeView.selectedNodes[0].dataset.id;
    if (isInspected) {
        var componentEditor = ui_1.default.componentEditors[componentId];
        var commandCallback = componentEditor[("config_" + command)];
        if (commandCallback != null)
            commandCallback.call.apply(commandCallback, [componentEditor].concat(args));
    }
    // TODO: Only refresh if selection is affected
    engine_1.setupHelpers();
};
onEditCommands.removeComponent = function (nodeId, componentId) {
    var isInspected = ui_1.default.nodesTreeView.selectedNodes.length === 1 && nodeId === ui_1.default.nodesTreeView.selectedNodes[0].dataset.id;
    if (isInspected) {
        ui_1.default.componentEditors[componentId].destroy();
        delete ui_1.default.componentEditors[componentId];
        var componentElt = ui_1.default.inspectorElt.querySelector(".components > div[data-component-id='" + componentId + "']");
        componentElt.parentElement.removeChild(componentElt);
    }
    // TODO: Only refresh if selection is affected
    engine_1.setupHelpers();
};
