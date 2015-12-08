var TileSetRenderer_1 = require("../../components/TileSetRenderer");
/* tslint:disable */
var TreeView = require("dnd-tree-view");
var PerfectResize = require("perfect-resize");
/* tslint:enable */
var data;
var ui = {};
var socket;
function start() {
    socket = SupClient.connect(SupClient.query.project);
    socket.on("connect", onConnected);
    socket.on("disconnect", SupClient.onDisconnected);
    SupClient.setupHotkeys();
    // Drawing
    ui.gameInstance = new SupEngine.GameInstance(document.querySelector("canvas"));
    ui.gameInstance.threeRenderer.setClearColor(0xbbbbbb);
    var cameraActor = new SupEngine.Actor(ui.gameInstance, "Camera");
    cameraActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, 10));
    ui.cameraComponent = new SupEngine.componentClasses["Camera"](cameraActor);
    ui.cameraComponent.setOrthographicMode(true);
    ui.cameraControls = new SupEngine.editorComponentClasses["Camera2DControls"](cameraActor, ui.cameraComponent, { zoomSpeed: 1.5, zoomMin: 1, zoomMax: 200 }, function () { data.tileSetUpdater.tileSetRenderer.gridRenderer.setOrthgraphicScale(ui.cameraComponent.orthographicScale); });
    // Sidebar
    new PerfectResize(document.querySelector(".sidebar"), "right");
    var fileSelect = document.querySelector("input.file-select");
    fileSelect.addEventListener("change", onFileSelectChange);
    document.querySelector("button.upload").addEventListener("click", function () { fileSelect.click(); });
    document.querySelector("button.download").addEventListener("click", onDownloadTileset);
    ui.gridWidthInput = document.querySelector("input.grid-width");
    ui.gridWidthInput.addEventListener("change", function () {
        socket.emit("edit:assets", SupClient.query.asset, "setProperty", "grid.width", parseInt(ui.gridWidthInput.value, 10), function (err) {
            if (err != null) {
                alert(err);
                return;
            }
        });
    });
    ui.gridHeightInput = document.querySelector("input.grid-height");
    ui.gridHeightInput.addEventListener("change", function () {
        socket.emit("edit:assets", SupClient.query.asset, "setProperty", "grid.height", parseInt(ui.gridHeightInput.value, 10), function (err) {
            if (err != null) {
                alert(err);
                return;
            }
        });
    });
    ui.selectedTileInput = document.querySelector("input.selected-tile-number");
    // Tile properties
    ui.propertiesTreeView = new TreeView(document.querySelector(".properties-tree-view"), { multipleSelection: false });
    ui.propertiesTreeView.on("selectionChange", onPropertySelect);
    document.querySelector("button.new-property").addEventListener("click", onNewPropertyClick);
    document.querySelector("button.rename-property").addEventListener("click", onRenamePropertyClick);
    document.querySelector("button.delete-property").addEventListener("click", onDeletePropertyClick);
    requestAnimationFrame(tick);
}
// Network callbacks
var onEditCommands = {};
function onConnected() {
    data = {};
    data.projectClient = new SupClient.ProjectClient(socket, { subEntries: false });
    var tileSetActor = new SupEngine.Actor(ui.gameInstance, "Tile Set");
    var tileSetRenderer = new TileSetRenderer_1.default(tileSetActor);
    var config = { tileSetAssetId: SupClient.query.asset };
    var receiveCallbacks = { tileSet: onAssetReceived };
    var editCallbacks = { tileSet: onEditCommands };
    data.tileSetUpdater = new TileSetRenderer_1.default.Updater(data.projectClient, tileSetRenderer, config, receiveCallbacks, editCallbacks);
}
function onAssetReceived(err, asset) {
    setupProperty("grid-width", data.tileSetUpdater.tileSetAsset.pub.grid.width);
    setupProperty("grid-height", data.tileSetUpdater.tileSetAsset.pub.grid.height);
    selectTile({ x: 0, y: 0 });
}
onEditCommands.upload = function () {
    selectTile({ x: 0, y: 0 });
};
onEditCommands.setProperty = function (key, value) {
    setupProperty(key, value);
    selectTile({ x: 0, y: 0 });
};
onEditCommands.addTileProperty = function (tile, name) {
    if (tile.x !== data.selectedTile.x && tile.y !== data.selectedTile.y)
        return;
    addTileProperty(name);
};
onEditCommands.renameTileProperty = function (tile, name, newName) {
    if (tile.x !== data.selectedTile.x && tile.y !== data.selectedTile.y)
        return;
    var liElt = ui.propertiesTreeView.treeRoot.querySelector("li[data-name=\"" + name + "\"]");
    liElt.querySelector(".name").textContent = newName;
    liElt.dataset.name = newName;
    var properties = Object.keys(data.tileSetUpdater.tileSetAsset.pub.tileProperties[(tile.x + "_" + tile.y)]);
    properties.sort();
    ui.propertiesTreeView.remove(liElt);
    ui.propertiesTreeView.insertAt(liElt, "item", properties.indexOf(newName));
    if (ui.selectedProperty === name) {
        ui.selectedProperty = newName;
        ui.propertiesTreeView.addToSelection(liElt);
    }
};
onEditCommands.deleteTileProperty = function (tile, name) {
    if (tile.x !== data.selectedTile.x && tile.y !== data.selectedTile.y)
        return;
    ui.propertiesTreeView.remove(ui.propertiesTreeView.treeRoot.querySelector("li[data-name=\"" + name + "\"]"));
};
onEditCommands.editTileProperty = function (tile, name, value) {
    if (tile.x !== data.selectedTile.x && tile.y !== data.selectedTile.y)
        return;
    var liElt = ui.propertiesTreeView.treeRoot.querySelector("li[data-name=\"" + name + "\"]");
    liElt.querySelector(".value").value = value;
};
function setupProperty(key, value) {
    switch (key) {
        case "grid-width":
            ui.gridWidthInput.value = value;
            break;
        case "grid-height":
            ui.gridHeightInput.value = value;
            break;
    }
}
function selectTile(tile) {
    data.selectedTile = tile;
    var pub = data.tileSetUpdater.tileSetAsset.pub;
    var tilePerRow = (pub.texture != null) ? Math.floor(pub.texture.image.width / pub.grid.width) : 1;
    var tilePerColumn = (pub.texture != null) ? Math.floor(pub.texture.image.height / pub.grid.height) : 1;
    var tileIndex = (tile.x === tilePerRow - 1 && tile.y === tilePerColumn - 1) ? -1 : tile.x + tile.y * tilePerRow;
    ui.selectedTileInput.value = tileIndex;
    while (ui.propertiesTreeView.treeRoot.children.length !== 0) {
        ui.propertiesTreeView.remove(ui.propertiesTreeView.treeRoot.children[0]);
    }
    if (pub.tileProperties[(tile.x + "_" + tile.y)] == null)
        return;
    var properties = Object.keys(pub.tileProperties[(tile.x + "_" + tile.y)]);
    properties.sort();
    for (var _i = 0; _i < properties.length; _i++) {
        var propertyName = properties[_i];
        addTileProperty(propertyName, pub.tileProperties[(tile.x + "_" + tile.y)][propertyName]);
    }
}
function addTileProperty(name, value) {
    if (value === void 0) { value = ""; }
    var liElt = document.createElement("li");
    liElt.dataset["name"] = name;
    var nameSpan = document.createElement("span");
    nameSpan.className = "name";
    nameSpan.textContent = name;
    liElt.appendChild(nameSpan);
    var valueInput = document.createElement("input");
    valueInput.type = "string";
    valueInput.className = "value";
    valueInput.value = value;
    valueInput.addEventListener("input", function () {
        socket.emit("edit:assets", SupClient.query.asset, "editTileProperty", data.selectedTile, ui.selectedProperty, valueInput.value, function (err) {
            if (err != null) {
                alert(err);
                return;
            }
        });
    });
    liElt.appendChild(valueInput);
    ui.propertiesTreeView.insertAt(liElt, "item");
}
// User interface
function onFileSelectChange(event) {
    if (event.target.files.length === 0)
        return;
    var reader = new FileReader;
    reader.onload = function (event) {
        socket.emit("edit:assets", SupClient.query.asset, "upload", reader.result, function (err) {
            if (err != null) {
                alert(err);
                return;
            }
        });
    };
    reader.readAsArrayBuffer(event.target.files[0]);
    event.target.parentElement.reset();
}
function onDownloadTileset(event) {
    var options = {
        initialValue: "Tile set",
        validationLabel: "Download"
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter a name for the image.", options, function (name) {
        /* tslint:enable:no-unused-expression */
        if (name == null)
            return;
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style.display = "none";
        a.href = data.tileSetUpdater.tileSetAsset.url;
        // Not yet supported in IE and Safari (http://caniuse.com/#feat=download)
        a.download = name + ".png";
        a.click();
        document.body.removeChild(a);
    });
}
function onPropertySelect() {
    if (ui.propertiesTreeView.selectedNodes.length === 1) {
        ui.selectedProperty = ui.propertiesTreeView.selectedNodes[0].dataset.name;
        document.querySelector("button.rename-property").disabled = false;
        document.querySelector("button.delete-property").disabled = false;
    }
    else {
        ui.selectedProperty = null;
        document.querySelector("button.rename-property").disabled = true;
        document.querySelector("button.delete-property").disabled = true;
    }
}
function onNewPropertyClick() {
    var options = {
        initialValue: "property",
        validationLabel: "Create"
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter a name for the property.", options, function (name) {
        /* tslint:enable:no-unused-expression */
        if (name == null)
            return;
        socket.emit("edit:assets", SupClient.query.asset, "addTileProperty", data.selectedTile, name, function (err, id) {
            if (err != null) {
                alert(err);
                return;
            }
            ui.selectedProperty = name;
            ui.propertiesTreeView.clearSelection();
            var liElt = ui.propertiesTreeView.treeRoot.querySelector("li[data-name=\"" + ui.selectedProperty + "\"]");
            ui.propertiesTreeView.addToSelection(liElt);
            liElt.querySelector("input").focus();
            document.querySelector("button.rename-property").disabled = false;
            document.querySelector("button.delete-property").disabled = false;
        });
    });
}
function onRenamePropertyClick() {
    if (ui.propertiesTreeView.selectedNodes.length !== 1)
        return;
    var options = {
        initialValue: ui.selectedProperty,
        validationLabel: "Rename"
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter a new name for the property.", options, function (newName) {
        /* tslint:enable:no-unused-expression */
        if (newName == null)
            return;
        socket.emit("edit:assets", SupClient.query.asset, "renameTileProperty", data.selectedTile, ui.selectedProperty, newName, function (err) { if (err != null) {
            alert(err);
            return;
        } });
    });
}
function onDeletePropertyClick() {
    if (ui.selectedProperty == null)
        return;
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.ConfirmDialog("Are you sure you want to delete the selected property?", "Delete", function (confirm) {
        /* tslint:enable:no-unused-expression */
        if (!confirm)
            return;
        socket.emit("edit:assets", SupClient.query.asset, "deleteTileProperty", data.selectedTile, ui.selectedProperty, function (err) { if (err != null) {
            alert(err);
            return;
        } });
    });
}
// Drawing
var lastTimestamp = 0;
var accumulatedTime = 0;
function tick(timestamp) {
    if (timestamp === void 0) { timestamp = 0; }
    requestAnimationFrame(tick);
    accumulatedTime += timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    var _a = ui.gameInstance.tick(accumulatedTime, handleTilesetArea), updates = _a.updates, timeLeft = _a.timeLeft;
    accumulatedTime = timeLeft;
    if (updates > 0)
        ui.gameInstance.draw();
}
function handleTilesetArea() {
    if (data == null || data.tileSetUpdater.tileSetAsset == null)
        return;
    var pub = data.tileSetUpdater.tileSetAsset.pub;
    if (pub.texture == null)
        return;
    if (ui.gameInstance.input.mouseButtons[0].wasJustReleased) {
        var mousePosition = ui.gameInstance.input.mousePosition;
        var _a = ui.cameraControls.getScenePosition(mousePosition.x, mousePosition.y), mouseX = _a[0], mouseY = _a[1];
        var x = Math.floor(mouseX);
        var ratio = data.tileSetUpdater.tileSetAsset.pub.grid.width / data.tileSetUpdater.tileSetAsset.pub.grid.height;
        var y = Math.floor(mouseY * ratio);
        if (x >= 0 && x < pub.texture.image.width / pub.grid.width &&
            y >= 0 && y < pub.texture.image.height / pub.grid.height &&
            (x !== data.selectedTile.x || y !== data.selectedTile.y)) {
            data.tileSetUpdater.tileSetRenderer.select(x, y);
            selectTile({ x: x, y: y });
        }
    }
}
// Start
start();
