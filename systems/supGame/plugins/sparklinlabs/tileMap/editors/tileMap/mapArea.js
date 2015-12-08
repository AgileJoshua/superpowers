var ui_1 = require("./ui");
var tileSetArea_1 = require("./tileSetArea");
var network_1 = require("./network");
var _ = require("lodash");
var TileMap_1 = require("../../components/TileMap");
var TileMapRenderer_1 = require("../../components/TileMapRenderer");
var tmpVector3 = new SupEngine.THREE.Vector3();
// Map Area
var mapArea = {};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = mapArea;
mapArea.gameInstance = new SupEngine.GameInstance(document.querySelector("canvas.map"));
mapArea.gameInstance.threeRenderer.setClearColor(0xbbbbbb);
var cameraActor = new SupEngine.Actor(mapArea.gameInstance, "Camera");
cameraActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, 100));
mapArea.cameraComponent = new SupEngine.componentClasses["Camera"](cameraActor);
mapArea.cameraComponent.setOrthographicMode(true);
mapArea.cameraControls = new SupEngine.editorComponentClasses["Camera2DControls"](cameraActor, mapArea.cameraComponent, { zoomSpeed: 1.5, zoomMin: 1, zoomMax: 200 }, function () { mapArea.gridRenderer.setOrthgraphicScale(mapArea.cameraComponent.orthographicScale); });
mapArea.gridActor = new SupEngine.Actor(mapArea.gameInstance, "Grid");
mapArea.gridActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, 90));
mapArea.gridRenderer = new SupEngine.editorComponentClasses["GridRenderer"](mapArea.gridActor, {
    width: 1, height: 1, ratio: { x: 1, y: 1 },
    orthographicScale: mapArea.cameraComponent.orthographicScale
});
mapArea.patternData = [];
mapArea.patternDataWidth = 1;
mapArea.patternActor = new SupEngine.Actor(mapArea.gameInstance, "Pattern");
mapArea.patternRenderer = new TileMapRenderer_1.default(mapArea.patternActor);
mapArea.patternBackgroundActor = new SupEngine.Actor(mapArea.gameInstance, "Pattern Background");
mapArea.patternBackgroundRenderer = new SupEngine.editorComponentClasses["FlatColorRenderer"](mapArea.patternBackgroundActor);
mapArea.duplicatingSelection = false;
mapArea.cursorPoint = { x: -1, y: -1 };
function setupPattern(layerData, width) {
    if (width === void 0) { width = 1; }
    mapArea.patternData = layerData;
    mapArea.patternDataWidth = width;
    var pub = network_1.data.tileMapUpdater.tileMapAsset.pub;
    var height = layerData.length / width;
    var patternLayerData = [];
    for (var y = 0; y < pub.height; y++) {
        for (var x = 0; x < pub.width; x++) {
            var localX = x - mapArea.cursorPoint.x;
            var localY = y - mapArea.cursorPoint.y;
            if (localX < 0 || localX >= width || localY < 0 || localY >= height)
                patternLayerData.push(0);
            else
                patternLayerData.push(layerData[localY * width + localX]);
        }
    }
    var patternData = {
        tileSetId: null,
        width: pub.width, height: pub.height,
        pixelsPerUnit: pub.pixelsPerUnit,
        layerDepthOffset: pub.layerDepthOffset,
        layers: [{ id: "0", name: "pattern", data: patternLayerData }]
    };
    mapArea.patternRenderer.setTileMap(new TileMap_1.default(patternData));
}
exports.setupPattern = setupPattern;
function setupFillPattern(newTileData) {
    var pub = network_1.data.tileMapUpdater.tileMapAsset.pub;
    var layerData = network_1.data.tileMapUpdater.tileMapAsset.layers.byId[tileSetArea_1.default.selectedLayerId].data;
    var patternLayerData = [];
    for (var y = 0; y < pub.height; y++) {
        for (var x = 0; x < pub.width; x++) {
            patternLayerData.push(0);
        }
    }
    var refTileData = layerData[mapArea.cursorPoint.y * pub.width + mapArea.cursorPoint.x];
    function checkTile(x, y) {
        if (x < 0 || x >= pub.width || y < 0 || y >= pub.height)
            return;
        var index = y * pub.width + x;
        // Skip if target tile on pattern isn't empty
        var patternTile = patternLayerData[index];
        if (patternTile !== 0)
            return;
        // Skip if target tile on layer is different from the base tile
        var layerTile = layerData[index];
        if (layerTile === 0) {
            if (refTileData !== 0)
                return;
        }
        else {
            for (var i = 0; i < layerTile.length; i++)
                if (layerTile[i] !== refTileData[i])
                    return;
        }
        patternLayerData[index] = _.cloneDeep(newTileData);
        checkTile(x - 1, y);
        checkTile(x + 1, y);
        checkTile(x, y - 1);
        checkTile(x, y + 1);
    }
    if (mapArea.cursorPoint.x >= 0 && mapArea.cursorPoint.x < pub.width && mapArea.cursorPoint.y >= 0 && mapArea.cursorPoint.y < pub.height)
        checkTile(mapArea.cursorPoint.x, mapArea.cursorPoint.y);
    var patternData = {
        tileSetId: null,
        width: pub.width, height: pub.height,
        pixelsPerUnit: pub.pixelsPerUnit,
        layerDepthOffset: pub.layerDepthOffset,
        layers: [{ id: "0", name: "pattern", data: patternLayerData }]
    };
    mapArea.patternRenderer.setTileMap(new TileMap_1.default(patternData));
}
exports.setupFillPattern = setupFillPattern;
function flipTilesHorizontally() {
    if (!mapArea.patternActor.threeObject.visible)
        return;
    var width = mapArea.patternDataWidth;
    var height = mapArea.patternData.length / mapArea.patternDataWidth;
    var layerData = [];
    for (var y = 0; y < height; y++) {
        for (var x = width - 1; x >= 0; x--) {
            var tileValue = mapArea.patternData[y * width + x];
            if (typeof tileValue === "number")
                layerData.push(0);
            else {
                tileValue[2] = !tileValue[2];
                if (tileValue[4] === 90)
                    tileValue[4] = 270;
                else if (tileValue[4] === 270)
                    tileValue[4] = 90;
                layerData.push(tileValue);
            }
        }
    }
    setupPattern(layerData, width);
}
exports.flipTilesHorizontally = flipTilesHorizontally;
function flipTilesVertically() {
    if (!mapArea.patternActor.threeObject.visible)
        return;
    var width = mapArea.patternDataWidth;
    var height = mapArea.patternData.length / mapArea.patternDataWidth;
    var layerData = [];
    for (var y = height - 1; y >= 0; y--) {
        for (var x = 0; x < width; x++) {
            var tileValue = mapArea.patternData[y * width + x];
            if (typeof tileValue === "number")
                layerData.push(0);
            else {
                tileValue[3] = !tileValue[3];
                if (tileValue[4] === 90)
                    tileValue[4] = 270;
                else if (tileValue[4] === 270)
                    tileValue[4] = 90;
                layerData.push(tileValue);
            }
        }
    }
    setupPattern(layerData, width);
}
exports.flipTilesVertically = flipTilesVertically;
function rotateTiles() {
    if (!mapArea.patternActor.threeObject.visible)
        return;
    var width = mapArea.patternDataWidth;
    var height = mapArea.patternData.length / mapArea.patternDataWidth;
    var layerData = [];
    for (var x = 0; x < width; x++) {
        for (var y = height - 1; y >= 0; y--) {
            var tileValue = mapArea.patternData[y * width + x];
            if (typeof tileValue === "number")
                layerData.push(0);
            else {
                tileValue[4] += 90;
                if (tileValue[4] === 360)
                    tileValue[4] = 0;
                layerData.push(tileValue);
            }
        }
    }
    setupPattern(layerData, height);
    var ratio = network_1.data.tileSetUpdater.tileSetAsset.pub.grid.width / network_1.data.tileSetUpdater.tileSetAsset.pub.grid.height;
    mapArea.patternBackgroundActor.setLocalScale(new SupEngine.THREE.Vector3(height, width / ratio, 1));
}
exports.rotateTiles = rotateTiles;
function editMap(edits) {
    var actualEdits = [];
    var layer = network_1.data.tileMapUpdater.tileMapAsset.layers.byId[tileSetArea_1.default.selectedLayerId];
    for (var _i = 0; _i < edits.length; _i++) {
        var edit = edits[_i];
        if (edit.x >= 0 && edit.x < network_1.data.tileMapUpdater.tileMapAsset.pub.width && edit.y >= 0 && edit.y < network_1.data.tileMapUpdater.tileMapAsset.pub.height) {
            var index = edit.y * network_1.data.tileMapUpdater.tileMapAsset.pub.width + edit.x;
            var sameTile = true;
            if (edit.tileValue === 0) {
                if (layer.data[index] !== 0)
                    sameTile = false;
            }
            else {
                var tileValue = edit.tileValue;
                for (var i = 0; i < tileValue.length; i++) {
                    if (layer.data[index][i] !== tileValue[i]) {
                        sameTile = false;
                        break;
                    }
                }
            }
            if (!sameTile)
                actualEdits.push(edit);
        }
    }
    if (actualEdits.length === 0)
        return;
    network_1.socket.emit("edit:assets", SupClient.query.asset, "editMap", layer.id, actualEdits, function (err) {
        if (err != null) {
            alert(err);
            return;
        }
    });
}
function getMapGridPosition(gameInstance, cameraComponent) {
    var mousePosition = gameInstance.input.mousePosition;
    var position = new SupEngine.THREE.Vector3(mousePosition.x, mousePosition.y, 0);
    cameraComponent.actor.getLocalPosition(tmpVector3);
    var x = position.x / gameInstance.threeRenderer.domElement.width;
    x = x * 2 - 1;
    x *= cameraComponent.orthographicScale / 2 * cameraComponent.cachedRatio;
    x += tmpVector3.x;
    x *= network_1.data.tileMapUpdater.tileMapAsset.pub.pixelsPerUnit / network_1.data.tileMapUpdater.tileSetAsset.pub.grid.width;
    x = Math.floor(x);
    var y = position.y / gameInstance.threeRenderer.domElement.height;
    y = y * 2 - 1;
    y *= cameraComponent.orthographicScale / 2;
    y -= tmpVector3.y;
    y *= network_1.data.tileMapUpdater.tileMapAsset.pub.pixelsPerUnit / network_1.data.tileMapUpdater.tileSetAsset.pub.grid.height;
    y = Math.floor(y);
    return [x, -y - 1];
}
function handleMapArea() {
    if (network_1.data.tileMapUpdater == null || network_1.data.tileMapUpdater.tileMapAsset == null ||
        network_1.data.tileMapUpdater.tileSetAsset == null || network_1.data.tileMapUpdater.tileSetAsset.pub.texture == null) {
        mapArea.patternActor.threeObject.visible = false;
        mapArea.patternBackgroundActor.threeObject.visible = false;
        return;
    }
    var pub = network_1.data.tileMapUpdater.tileMapAsset.pub;
    var _a = getMapGridPosition(mapArea.gameInstance, mapArea.cameraComponent), mouseX = _a[0], mouseY = _a[1];
    if (mouseX != mapArea.cursorPoint.x || mouseY != mapArea.cursorPoint.y) {
        mapArea.cursorPoint.x = mouseX;
        mapArea.cursorPoint.y = mouseY;
        ui_1.default.mousePositionLabel.x.textContent = mouseX.toString();
        ui_1.default.mousePositionLabel.y.textContent = mouseY.toString();
        if (ui_1.default.fillToolButton.checked) {
            network_1.data.tileSetUpdater.tileSetRenderer.selectedTileActor.getLocalPosition(tmpVector3);
            setupFillPattern([tmpVector3.x, -tmpVector3.y, false, false, 0]);
        }
        else if (mapArea.patternActor.threeObject.visible)
            setupPattern(mapArea.patternData, mapArea.patternDataWidth);
    }
    // Edit tiles
    if (mapArea.gameInstance.input.mouseButtons[0].isDown) {
        if (ui_1.default.eraserToolButton.checked) {
            editMap([{ x: mouseX, y: mouseY, tileValue: 0 }]);
        }
        else if (ui_1.default.fillToolButton.checked) {
            var edits = [];
            for (var y = 0; y < pub.height; y++) {
                for (var x = 0; x < pub.width; x++) {
                    var tileValue = mapArea.patternRenderer.tileMap.getTileAt(0, x, y);
                    if (tileValue !== 0)
                        edits.push({ x: x, y: y, tileValue: tileValue });
                }
            }
            editMap(edits);
        }
        else if (mapArea.patternActor.threeObject.visible) {
            var edits = [];
            for (var tileIndex = 0; tileIndex < mapArea.patternData.length; tileIndex++) {
                var tileValue = mapArea.patternData[tileIndex];
                var x = mouseX + tileIndex % mapArea.patternDataWidth;
                var y = mouseY + Math.floor(tileIndex / mapArea.patternDataWidth);
                edits.push({ x: x, y: y, tileValue: tileValue });
            }
            editMap(edits);
            if (ui_1.default.selectionToolButton.checked && !mapArea.duplicatingSelection) {
                mapArea.patternActor.threeObject.visible = false;
                mapArea.patternBackgroundActor.threeObject.visible = false;
            }
        }
    }
    // Quick switch to Brush or Eraser
    if (mapArea.gameInstance.input.mouseButtons[2].wasJustReleased && !ui_1.default.fillToolButton.checked) {
        if (!ui_1.default.selectionToolButton.checked || !mapArea.patternBackgroundActor.threeObject.visible) {
            if (mouseX >= 0 && mouseX < pub.width && mouseY >= 0 && mouseY < pub.height) {
                var layer = network_1.data.tileMapUpdater.tileMapAsset.layers.byId[tileSetArea_1.default.selectedLayerId];
                var tile = layer.data[mouseY * pub.width + mouseX];
                if (typeof tile === "number")
                    ui_1.selectEraser();
                else {
                    ui_1.selectBrush(tile[0], tile[1]);
                    setupPattern([tile]);
                }
            }
        }
        else {
            mapArea.selectionStartPoint = null;
            mapArea.patternBackgroundActor.threeObject.visible = false;
            mapArea.patternActor.threeObject.visible = false;
            mapArea.duplicatingSelection = false;
        }
    }
    if (mapArea.patternActor.threeObject.visible || ui_1.default.eraserToolButton.checked) {
        var layer = network_1.data.tileMapUpdater.tileMapAsset.layers.byId[tileSetArea_1.default.selectedLayerId];
        var z = (pub.layers.indexOf(layer) + 0.5) * pub.layerDepthOffset;
        var ratioX = pub.pixelsPerUnit / network_1.data.tileMapUpdater.tileSetAsset.pub.grid.width;
        var ratioY = pub.pixelsPerUnit / network_1.data.tileMapUpdater.tileSetAsset.pub.grid.height;
        var patternPosition = new SupEngine.THREE.Vector3(mouseX / ratioX, mouseY / ratioY, z);
        mapArea.patternBackgroundActor.setLocalPosition(patternPosition);
    }
    // Select all
    if (mapArea.gameInstance.input.keyboardButtons[window.KeyEvent.DOM_VK_CONTROL].isDown &&
        mapArea.gameInstance.input.keyboardButtons[window.KeyEvent.DOM_VK_A].wasJustPressed) {
        ui_1.selectSelection();
        mapArea.patternBackgroundActor.threeObject.visible = true;
        mapArea.selectionStartPoint = { x: 0, y: 0 };
        mapArea.selectionEndPoint = {
            x: pub.width - 1,
            y: pub.height - 1
        };
    }
    // Selection
    if (ui_1.default.selectionToolButton.checked) {
        if (mapArea.gameInstance.input.mouseButtons[0].wasJustPressed) {
            // A pattern is already in the buffer
            if (!mapArea.patternActor.threeObject.visible) {
                if (mouseX >= 0 && mouseX < pub.width && mouseY >= 0 && mouseY < pub.height) {
                    mapArea.patternBackgroundActor.threeObject.visible = true;
                    mapArea.selectionStartPoint = { x: mouseX, y: mouseY };
                }
                else {
                    mapArea.selectionStartPoint = null;
                    mapArea.patternActor.threeObject.visible = false;
                    mapArea.patternBackgroundActor.threeObject.visible = false;
                }
            }
        }
        if (mapArea.selectionStartPoint != null) {
            if (mapArea.gameInstance.input.mouseButtons[0].isDown) {
                // Clamp mouse values
                var x = Math.max(0, Math.min(pub.width - 1, mouseX));
                var y = Math.max(0, Math.min(pub.height - 1, mouseY));
                mapArea.selectionEndPoint = { x: x, y: y };
            }
            var startX = Math.min(mapArea.selectionStartPoint.x, mapArea.selectionEndPoint.x);
            var startY = Math.min(mapArea.selectionStartPoint.y, mapArea.selectionEndPoint.y);
            var width = Math.abs(mapArea.selectionEndPoint.x - mapArea.selectionStartPoint.x) + 1;
            var height = Math.abs(mapArea.selectionEndPoint.y - mapArea.selectionStartPoint.y) + 1;
            var ratioX = pub.pixelsPerUnit / network_1.data.tileMapUpdater.tileSetAsset.pub.grid.width;
            var ratioY = pub.pixelsPerUnit / network_1.data.tileMapUpdater.tileSetAsset.pub.grid.height;
            var z = network_1.data.tileMapUpdater.tileMapAsset.layers.pub.length * pub.layerDepthOffset;
            var patternPosition = new SupEngine.THREE.Vector3(startX / ratioX, startY / ratioY, z);
            mapArea.patternBackgroundActor.setLocalPosition(patternPosition);
            var ratio = network_1.data.tileSetUpdater.tileSetAsset.pub.grid.width / network_1.data.tileSetUpdater.tileSetAsset.pub.grid.height;
            mapArea.patternBackgroundActor.setLocalScale(new SupEngine.THREE.Vector3(width, height / ratio, 1));
            // Delete selection
            if (mapArea.gameInstance.input.keyboardButtons[window.KeyEvent.DOM_VK_DELETE].wasJustReleased) {
                var edits = [];
                for (var y = 0; y < height; y++) {
                    for (var x = 0; x < width; x++) {
                        edits.push({ x: startX + x, y: startY + y, tileValue: 0 });
                    }
                }
                editMap(edits);
                mapArea.patternBackgroundActor.threeObject.visible = false;
                mapArea.selectionStartPoint = null;
            }
            else if (mapArea.gameInstance.input.keyboardButtons[window.KeyEvent.DOM_VK_M].wasJustReleased ||
                mapArea.gameInstance.input.keyboardButtons[window.KeyEvent.DOM_VK_D].wasJustReleased) {
                var layerData = [];
                var layer = network_1.data.tileMapUpdater.tileMapAsset.layers.byId[tileSetArea_1.default.selectedLayerId];
                var edits = [];
                for (var y = 0; y < height; y++) {
                    for (var x = 0; x < width; x++) {
                        var tile = layer.data[(startY + y) * pub.width + startX + x];
                        layerData.push(tile);
                        if (!mapArea.gameInstance.input.keyboardButtons[window.KeyEvent.DOM_VK_D].wasJustReleased)
                            edits.push({ x: startX + x, y: startY + y, tileValue: 0 });
                    }
                }
                editMap(edits);
                setupPattern(layerData, width);
                mapArea.patternActor.threeObject.visible = true;
                mapArea.selectionStartPoint = null;
                mapArea.duplicatingSelection = mapArea.gameInstance.input.keyboardButtons[window.KeyEvent.DOM_VK_D].wasJustReleased;
            }
        }
    }
}
exports.handleMapArea = handleMapArea;
