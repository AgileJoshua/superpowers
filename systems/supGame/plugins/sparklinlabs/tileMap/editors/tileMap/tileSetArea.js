var ui_1 = require("./ui");
var mapArea_1 = require("./mapArea");
var network_1 = require("./network");
var tmpVector3 = new SupEngine.THREE.Vector3();
var tileSetArea = {};
tileSetArea.gameInstance = new SupEngine.GameInstance(document.querySelector("canvas.tileSet"));
tileSetArea.gameInstance.threeRenderer.setClearColor(0xbbbbbb);
var cameraActor = new SupEngine.Actor(tileSetArea.gameInstance, "Camera");
cameraActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, 10));
tileSetArea.cameraComponent = new SupEngine.componentClasses["Camera"](cameraActor);
tileSetArea.cameraComponent.setOrthographicMode(true);
new SupEngine.editorComponentClasses["Camera2DControls"](cameraActor, tileSetArea.cameraComponent, { zoomSpeed: 1.5, zoomMin: 1, zoomMax: 200 }, function () { network_1.data.tileSetUpdater.tileSetRenderer.gridRenderer.setOrthgraphicScale(tileSetArea.cameraComponent.orthographicScale); });
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = tileSetArea;
function getTileSetGridPosition(gameInstance, cameraComponent) {
    var mousePosition = gameInstance.input.mousePosition;
    var position = new SupEngine.THREE.Vector3(mousePosition.x, mousePosition.y, 0);
    cameraComponent.actor.getLocalPosition(tmpVector3);
    var ratio = network_1.data.tileMapUpdater.tileSetAsset.pub.grid.width / network_1.data.tileMapUpdater.tileSetAsset.pub.grid.height;
    var x = position.x / gameInstance.threeRenderer.domElement.width;
    x = x * 2 - 1;
    x *= cameraComponent.orthographicScale / 2 * cameraComponent.cachedRatio;
    x += tmpVector3.x;
    x = Math.floor(x);
    var y = position.y / gameInstance.threeRenderer.domElement.height;
    y = y * 2 - 1;
    y *= cameraComponent.orthographicScale / 2;
    y -= tmpVector3.y;
    y *= ratio;
    y = Math.floor(y);
    return [x, y];
}
function handleTileSetArea() {
    if (network_1.data.tileMapUpdater == null)
        return;
    if (network_1.data.tileMapUpdater.tileMapAsset == null)
        return;
    if (network_1.data.tileMapUpdater.tileSetAsset == null)
        return;
    if (network_1.data.tileMapUpdater.tileSetAsset.pub.texture == null)
        return;
    var tilesPerRow = network_1.data.tileMapUpdater.tileSetAsset.pub.texture.image.width / network_1.data.tileMapUpdater.tileSetAsset.pub.grid.width;
    var tilesPerColumn = network_1.data.tileMapUpdater.tileSetAsset.pub.texture.image.height / network_1.data.tileMapUpdater.tileSetAsset.pub.grid.height;
    var _a = getTileSetGridPosition(tileSetArea.gameInstance, tileSetArea.cameraComponent), mouseX = _a[0], mouseY = _a[1];
    if (tileSetArea.gameInstance.input.mouseButtons[0].wasJustPressed) {
        if (mouseX >= 0 && mouseX < tilesPerRow && mouseY >= 0 && mouseY < tilesPerColumn) {
            if (ui_1.default.fillToolButton.checked) {
                ui_1.selectFill(mouseX, mouseY);
            }
            else {
                tileSetArea.selectionStartPoint = { x: mouseX, y: mouseY };
                ui_1.selectBrush(mouseX, mouseY);
            }
        }
    }
    else if (tileSetArea.gameInstance.input.mouseButtons[0].wasJustReleased && tileSetArea.selectionStartPoint != null) {
        // Clamp mouse values
        var x = Math.max(0, Math.min(tilesPerRow - 1, mouseX));
        var y = Math.max(0, Math.min(tilesPerColumn - 1, mouseY));
        var startX = Math.min(tileSetArea.selectionStartPoint.x, x);
        var startY = Math.min(tileSetArea.selectionStartPoint.y, y);
        var width = Math.abs(x - tileSetArea.selectionStartPoint.x) + 1;
        var height = Math.abs(y - tileSetArea.selectionStartPoint.y);
        var layerData = [];
        for (var y_1 = height; y_1 >= 0; y_1--) {
            for (var x_1 = 0; x_1 < width; x_1++) {
                layerData.push([startX + x_1, startY + y_1, false, false, 0]);
            }
        }
        mapArea_1.setupPattern(layerData, width);
        ui_1.selectBrush(startX, startY, width, height + 1);
        tileSetArea.selectionStartPoint = null;
    }
    if (tileSetArea.selectionStartPoint != null) {
        // Clamp mouse values
        var x = Math.max(0, Math.min(tilesPerRow - 1, mouseX));
        var y = Math.max(0, Math.min(tilesPerColumn - 1, mouseY));
        var width = x - tileSetArea.selectionStartPoint.x;
        if (width >= 0) {
            width += 1;
            x = tileSetArea.selectionStartPoint.x;
        }
        else {
            width -= 1;
            x = tileSetArea.selectionStartPoint.x + 1;
        }
        var height = y - tileSetArea.selectionStartPoint.y;
        if (height >= 0) {
            height += 1;
            y = tileSetArea.selectionStartPoint.y;
        }
        else {
            height -= 1;
            y = tileSetArea.selectionStartPoint.y + 1;
        }
        network_1.data.tileSetUpdater.tileSetRenderer.select(x, y, width, height);
    }
}
exports.handleTileSetArea = handleTileSetArea;
