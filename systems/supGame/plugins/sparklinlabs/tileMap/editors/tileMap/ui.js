var network_1 = require("./network");
var mapArea_1 = require("./mapArea");
var tileSetArea_1 = require("./tileSetArea");
/* tslint:disable */
var TreeView = require("dnd-tree-view");
var PerfectResize = require("perfect-resize");
/* tslint:enable */
var tmpPosition = new SupEngine.THREE.Vector3();
var tmpScale = new SupEngine.THREE.Vector3();
var ui = {};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ui;
// Setup resize handles
new PerfectResize(document.querySelector(".sidebar"), "right");
new PerfectResize(document.querySelector(".layers"), "bottom");
ui.tileSetInput = document.querySelector(".property-tileSetId");
ui.tileSetInput.addEventListener("input", onTileSetChange);
ui.tileSetInput.addEventListener("keyup", function (event) { event.stopPropagation(); });
ui.sizeInput = document.querySelector(".property-size");
document.querySelector("button.resize").addEventListener("click", onResizeMapClick);
document.querySelector("button.move").addEventListener("click", onMoveMapClick);
ui.settings = {};
["pixelsPerUnit", "layerDepthOffset"].forEach(function (setting) {
    var queryName = ".property-" + setting;
    var settingObj = ui.settings[setting] = document.querySelector(queryName);
    settingObj.addEventListener("change", function (event) {
        var value = (setting === "layerDepthOffset") ? parseFloat(settingObj.value) : parseInt(settingObj.value, 10);
        network_1.socket.emit("edit:assets", SupClient.query.asset, "setProperty", setting, value, function (err) { if (err != null) {
            alert(err);
            return;
        } });
    });
});
ui.gridCheckbox = document.querySelector("input.grid-checkbox");
ui.gridCheckbox.addEventListener("change", onChangeGridDisplay);
ui.highlightCheckbox = document.querySelector("input.highlight-checkbox");
ui.highlightCheckbox.addEventListener("change", onChangeHighlight);
ui.highlightSlider = document.querySelector("input.highlight-slider");
ui.highlightSlider.addEventListener("input", onChangeHighlight);
ui.brushToolButton = document.querySelector("input#Brush");
ui.brushToolButton.addEventListener("change", function () { selectBrush(); });
ui.fillToolButton = document.querySelector("input#Fill");
ui.fillToolButton.addEventListener("change", function () { selectFill(); });
ui.selectionToolButton = document.querySelector("input#Selection");
ui.selectionToolButton.addEventListener("change", function () { selectSelection(); });
ui.eraserToolButton = document.querySelector("input#Eraser");
ui.eraserToolButton.addEventListener("change", function () { selectEraser(); });
ui.layersTreeView = new TreeView(document.querySelector(".layers-tree-view"), { dropCallback: onLayerDrop, multipleSelection: false });
ui.layersTreeView.on("selectionChange", onLayerSelect);
document.querySelector("button.new-layer").addEventListener("click", onNewLayerClick);
document.querySelector("button.rename-layer").addEventListener("click", onRenameLayerClick);
document.querySelector("button.delete-layer").addEventListener("click", onDeleteLayerClick);
ui.mousePositionLabel = {
    x: document.querySelector("label.position-x"),
    y: document.querySelector("label.position-y")
};
// Keybindings
SupClient.setupHotkeys();
document.addEventListener("keyup", function (event) {
    if (event.target.tagName === "INPUT")
        return;
    switch (event.keyCode) {
        case window.KeyEvent.DOM_VK_B:
            selectBrush();
            break;
        case window.KeyEvent.DOM_VK_F:
            selectFill();
            break;
        case window.KeyEvent.DOM_VK_S:
            selectSelection();
            break;
        case window.KeyEvent.DOM_VK_E:
            selectEraser();
            break;
        case window.KeyEvent.DOM_VK_G:
            ui.gridCheckbox.checked = !ui.gridCheckbox.checked;
            onChangeGridDisplay();
            break;
        case window.KeyEvent.DOM_VK_I:
            ui.highlightCheckbox.checked = !ui.highlightCheckbox.checked;
            onChangeHighlight();
            break;
        case window.KeyEvent.DOM_VK_H:
            mapArea_1.flipTilesHorizontally();
            break;
        case window.KeyEvent.DOM_VK_V:
            mapArea_1.flipTilesVertically();
            break;
        case window.KeyEvent.DOM_VK_R:
            mapArea_1.rotateTiles();
            break;
    }
});
function onTileSetChange(event) {
    var value = event.target.value;
    if (value === "")
        network_1.socket.emit("edit:assets", SupClient.query.asset, "changeTileSet", null, function (err) { if (err != null) {
            alert(err);
            return;
        } });
    var entry = SupClient.findEntryByPath(network_1.data.projectClient.entries.pub, value);
    if (entry != null && entry.type === "tileSet") {
        network_1.socket.emit("edit:assets", SupClient.query.asset, "changeTileSet", entry.id, function (err) { if (err != null) {
            alert(err);
            return;
        } });
    }
}
function onResizeMapClick() {
    var options = {
        initialValue: network_1.data.tileMapUpdater.tileMapAsset.pub.width.toString(),
        validationLabel: "Resize"
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter a new width for the map.", options, function (newWidthString) {
        /* tslint:enable:no-unused-expression */
        if (newWidthString == null)
            return;
        var newWidth = parseInt(newWidthString, 10);
        if (isNaN(newWidth))
            return;
        var options = {
            initialValue: network_1.data.tileMapUpdater.tileMapAsset.pub.height.toString(),
            validationLabel: "Resize"
        };
        /* tslint:disable:no-unused-expression */
        new SupClient.dialogs.PromptDialog("Enter a new height for the map.", options, function (newHeightString) {
            /* tslint:enable:no-unused-expression */
            if (newHeightString == null)
                return;
            var newHeight = parseInt(newHeightString, 10);
            if (isNaN(newHeight))
                return;
            if (newWidth === network_1.data.tileMapUpdater.tileMapAsset.pub.width && newHeight === network_1.data.tileMapUpdater.tileMapAsset.pub.height)
                return;
            network_1.socket.emit("edit:assets", SupClient.query.asset, "resizeMap", newWidth, newHeight, function (err) {
                if (err != null) {
                    alert(err);
                }
            });
        });
    });
}
function onMoveMapClick() {
    var options = {
        initialValue: "0",
        validationLabel: "Apply offset"
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter the horizontal offset.", options, function (horizontalOffsetString) {
        /* tslint:enable:no-unused-expression */
        if (horizontalOffsetString == null)
            return;
        var horizontalOffset = parseInt(horizontalOffsetString, 10);
        if (isNaN(horizontalOffset))
            return;
        /* tslint:disable:no-unused-expression */
        new SupClient.dialogs.PromptDialog("Enter the vertical offset.", options, function (verticalOffsetString) {
            /* tslint:enable:no-unused-expression */
            if (verticalOffsetString == null)
                return;
            var verticalOffset = parseInt(verticalOffsetString, 10);
            if (isNaN(verticalOffset))
                return;
            if (horizontalOffset === 0 && verticalOffset === 0)
                return;
            network_1.socket.emit("edit:assets", SupClient.query.asset, "moveMap", horizontalOffset, verticalOffset, function (err) {
                if (err != null) {
                    alert(err);
                }
            });
        });
    });
}
function onNewLayerClick() {
    var options = {
        initialValue: "Layer",
        validationLabel: "Create"
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter a name for the layer.", options, function (name) {
        /* tslint:enable:no-unused-expression */
        if (name == null)
            return;
        var index = SupClient.getTreeViewInsertionPoint(ui.layersTreeView).index;
        index = network_1.data.tileMapUpdater.tileMapAsset.pub.layers.length - index + 1;
        network_1.socket.emit("edit:assets", SupClient.query.asset, "newLayer", name, index, function (err, layerId) {
            if (err != null) {
                alert(err);
                return;
            }
            ui.layersTreeView.clearSelection();
            ui.layersTreeView.addToSelection(ui.layersTreeView.treeRoot.querySelector("li[data-id=\"" + layerId + "\"]"));
            tileSetArea_1.default.selectedLayerId = layerId;
        });
    });
}
function onRenameLayerClick() {
    if (ui.layersTreeView.selectedNodes.length !== 1)
        return;
    var selectedNode = ui.layersTreeView.selectedNodes[0];
    var layer = network_1.data.tileMapUpdater.tileMapAsset.layers.byId[selectedNode.dataset["id"]];
    var options = {
        initialValue: layer.name,
        validationLabel: "Rename"
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter a new name for the layer.", options, function (newName) {
        /* tslint:enable:no-unused-expression */
        if (newName == null)
            return;
        network_1.socket.emit("edit:assets", SupClient.query.asset, "renameLayer", layer.id, newName, function (err) {
            if (err != null) {
                alert(err);
                return;
            }
        });
    });
}
function onDeleteLayerClick() {
    if (ui.layersTreeView.selectedNodes.length !== 1)
        return;
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.ConfirmDialog("Are you sure you want to delete the selected layer?", "Delete", function (confirm) {
        /* tslint:enable:no-unused-expression */
        if (!confirm)
            return;
        var selectedNode = ui.layersTreeView.selectedNodes[0];
        network_1.socket.emit("edit:assets", SupClient.query.asset, "deleteLayer", selectedNode.dataset.id, function (err) {
            if (err != null) {
                alert(err);
                return;
            }
        });
    });
}
function onLayerDrop(dropInfo, orderedNodes) {
    var id = orderedNodes[0].dataset.id;
    var newIndex = SupClient.getListViewDropIndex(dropInfo, network_1.data.tileMapUpdater.tileMapAsset.layers, true);
    network_1.socket.emit("edit:assets", SupClient.query.asset, "moveLayer", id, newIndex, function (err) {
        if (err != null) {
            alert(err);
            return;
        }
    });
    return false;
}
function onLayerSelect() {
    if (ui.layersTreeView.selectedNodes.length === 0) {
        ui.layersTreeView.addToSelection(ui.layersTreeView.treeRoot.querySelector("li[data-id=\"" + tileSetArea_1.default.selectedLayerId + "\"]"));
    }
    else {
        tileSetArea_1.default.selectedLayerId = ui.layersTreeView.selectedNodes[0].dataset["id"];
    }
    onChangeHighlight();
    var pub = network_1.data.tileMapUpdater.tileMapAsset.pub;
    var layer = network_1.data.tileMapUpdater.tileMapAsset.layers.byId[tileSetArea_1.default.selectedLayerId];
    var z = (pub.layers.indexOf(layer) + 0.5) * pub.layerDepthOffset;
    mapArea_1.default.patternActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, z));
}
function onChangeGridDisplay() {
    mapArea_1.default.gridActor.threeObject.visible = ui.gridCheckbox.checked;
}
function onChangeHighlight() {
    for (var id in network_1.data.tileMapUpdater.tileMapRenderer.layerMeshesById) {
        var layerMesh = network_1.data.tileMapUpdater.tileMapRenderer.layerMeshesById[id];
        if (ui.highlightCheckbox.checked && id !== tileSetArea_1.default.selectedLayerId) {
            layerMesh.material.opacity = parseFloat(ui.highlightSlider.value) / 100;
        }
        else {
            layerMesh.material.opacity = 1;
        }
    }
}
function selectBrush(x, y, width, height) {
    if (width === void 0) { width = 1; }
    if (height === void 0) { height = 1; }
    ui.brushToolButton.checked = true;
    if (network_1.data.tileMapUpdater.tileSetAsset == null || network_1.data.tileMapUpdater.tileSetAsset.pub == null)
        return;
    if (x != null && y != null)
        network_1.data.tileSetUpdater.tileSetRenderer.select(x, y, width, height);
    var ratio = network_1.data.tileSetUpdater.tileSetAsset.pub.grid.width / network_1.data.tileSetUpdater.tileSetAsset.pub.grid.height;
    network_1.data.tileSetUpdater.tileSetRenderer.selectedTileActor.getLocalPosition(tmpPosition);
    tmpPosition.y = Math.round(tmpPosition.y * ratio);
    network_1.data.tileSetUpdater.tileSetRenderer.selectedTileActor.getLocalScale(tmpScale);
    tmpScale.y = Math.round(tmpScale.y * ratio);
    var layerData = [];
    for (var y_1 = -tmpScale.y - 1; y_1 >= 0; y_1--) {
        for (var x_1 = 0; x_1 < tmpScale.x; x_1++) {
            layerData.push([tmpPosition.x + x_1, -tmpPosition.y + y_1, false, false, 0]);
        }
    }
    mapArea_1.setupPattern(layerData, tmpScale.x);
    mapArea_1.default.patternActor.threeObject.visible = true;
    network_1.data.tileSetUpdater.tileSetRenderer.selectedTileActor.threeObject.visible = true;
    mapArea_1.default.patternBackgroundActor.threeObject.visible = true;
    mapArea_1.default.patternBackgroundActor.setLocalScale(new SupEngine.THREE.Vector3(width, height / ratio, 1));
}
exports.selectBrush = selectBrush;
function selectFill(x, y) {
    ui.fillToolButton.checked = true;
    if (network_1.data.tileMapUpdater.tileSetAsset == null || network_1.data.tileMapUpdater.tileSetAsset.pub == null)
        return;
    if (x != null && y != null)
        network_1.data.tileSetUpdater.tileSetRenderer.select(x, y);
    network_1.data.tileSetUpdater.tileSetRenderer.selectedTileActor.getLocalPosition(tmpPosition);
    mapArea_1.setupFillPattern([tmpPosition.x, -tmpPosition.y, false, false, 0]);
    mapArea_1.default.patternActor.threeObject.visible = true;
    network_1.data.tileSetUpdater.tileSetRenderer.selectedTileActor.threeObject.visible = true;
    mapArea_1.default.patternBackgroundActor.threeObject.visible = false;
}
exports.selectFill = selectFill;
function selectSelection() {
    ui.selectionToolButton.checked = true;
    if (network_1.data.tileMapUpdater.tileSetAsset == null || network_1.data.tileMapUpdater.tileSetAsset.pub == null)
        return;
    mapArea_1.default.patternActor.threeObject.visible = false;
    mapArea_1.default.patternBackgroundActor.threeObject.visible = false;
    network_1.data.tileSetUpdater.tileSetRenderer.selectedTileActor.threeObject.visible = false;
    mapArea_1.default.selectionStartPoint = null;
}
exports.selectSelection = selectSelection;
function selectEraser() {
    ui.eraserToolButton.checked = true;
    if (network_1.data.tileMapUpdater.tileSetAsset == null || network_1.data.tileMapUpdater.tileSetAsset.pub == null)
        return;
    mapArea_1.default.patternActor.threeObject.visible = false;
    network_1.data.tileSetUpdater.tileSetRenderer.selectedTileActor.threeObject.visible = false;
    mapArea_1.default.patternBackgroundActor.threeObject.visible = true;
    var ratio = network_1.data.tileSetUpdater.tileSetAsset.pub.grid.width / network_1.data.tileSetUpdater.tileSetAsset.pub.grid.height;
    mapArea_1.default.patternBackgroundActor.setLocalScale(new SupEngine.THREE.Vector3(1, 1 / ratio, 1));
}
exports.selectEraser = selectEraser;
function setupLayer(layer, index) {
    var liElt = document.createElement("li");
    liElt.dataset["id"] = layer.id;
    var displayCheckbox = document.createElement("input");
    displayCheckbox.classList.add("display");
    displayCheckbox.type = "checkbox";
    displayCheckbox.checked = true;
    displayCheckbox.addEventListener("change", function () {
        network_1.data.tileMapUpdater.tileMapRenderer.layerVisibleById[layer.id] = displayCheckbox.checked;
    });
    displayCheckbox.addEventListener("click", function (event) { event.stopPropagation(); });
    liElt.appendChild(displayCheckbox);
    var indexSpan = document.createElement("span");
    indexSpan.classList.add("index");
    indexSpan.textContent = index + " -";
    liElt.appendChild(indexSpan);
    var nameSpan = document.createElement("span");
    nameSpan.classList.add("name");
    nameSpan.textContent = layer.name;
    liElt.appendChild(nameSpan);
    ui.layersTreeView.insertAt(liElt, "item", network_1.data.tileMapUpdater.tileMapAsset.pub.layers.length - 1 - index);
}
exports.setupLayer = setupLayer;
function refreshLayersId() {
    for (var layerIndex = 0; layerIndex < network_1.data.tileMapUpdater.tileMapAsset.pub.layers.length; layerIndex++) {
        var layerId = network_1.data.tileMapUpdater.tileMapAsset.pub.layers[layerIndex].id;
        var indexSpanElt = ui.layersTreeView.treeRoot.querySelector("[data-id=\"" + layerId + "\"] .index");
        indexSpanElt.textContent = layerIndex + " -";
    }
}
exports.refreshLayersId = refreshLayersId;
