var ui_1 = require("./ui");
var mapArea_1 = require("./mapArea");
var tileSetArea_1 = require("./tileSetArea");
var TileMapRenderer_1 = require("../../components/TileMapRenderer");
var TileSet_1 = require("../../components/TileSet");
var TileSetRenderer_1 = require("../../components/TileSetRenderer");
exports.data = {};
exports.socket = SupClient.connect(SupClient.query.project);
exports.socket.on("connect", onConnected);
exports.socket.on("disconnect", SupClient.onDisconnected);
var onEditCommands = {};
var onTileSetEditCommands = {};
function onConnected() {
    exports.data.projectClient = new SupClient.ProjectClient(exports.socket, { subEntries: true });
    var tileMapActor = new SupEngine.Actor(mapArea_1.default.gameInstance, "Tile Map");
    var tileMapRenderer = new TileMapRenderer_1.default(tileMapActor);
    var config = { tileMapAssetId: SupClient.query.asset, tileSetAssetId: null, materialType: "basic" };
    var receiveCallbacks = { tileMap: onTileMapAssetReceived };
    var editCallbacks = { tileMap: onEditCommands };
    exports.data.tileMapUpdater = new TileMapRenderer_1.default.Updater(exports.data.projectClient, tileMapRenderer, config, receiveCallbacks, editCallbacks);
}
// Tile Map
function onTileMapAssetReceived() {
    var pub = exports.data.tileMapUpdater.tileMapAsset.pub;
    var tileSetActor = new SupEngine.Actor(tileSetArea_1.default.gameInstance, "Tile Set");
    var tileSetRenderer = new TileSetRenderer_1.default(tileSetActor);
    var config = { tileSetAssetId: pub.tileSetId };
    var receiveCallbacks = { tileSet: onTileSetAssetReceived };
    var editCallbacks = { tileSet: onTileSetEditCommands };
    exports.data.tileSetUpdater = new TileSetRenderer_1.default.Updater(exports.data.projectClient, tileSetRenderer, config, receiveCallbacks, editCallbacks);
    updateTileSetInput();
    onEditCommands.resizeMap();
    for (var setting in ui_1.default.settings)
        onEditCommands.setProperty(setting, pub[setting]);
    for (var index = pub.layers.length - 1; index >= 0; index--)
        ui_1.setupLayer(pub.layers[index], index);
    tileSetArea_1.default.selectedLayerId = pub.layers[0].id.toString();
    ui_1.default.layersTreeView.addToSelection(ui_1.default.layersTreeView.treeRoot.querySelector("li[data-id=\"" + pub.layers[0].id + "\"]"));
    mapArea_1.default.patternActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, pub.layerDepthOffset / 2));
}
function updateTileSetInput() {
    var tileSetName = (exports.data.tileMapUpdater.tileMapAsset.pub.tileSetId != null) ?
        exports.data.projectClient.entries.getPathFromId(exports.data.tileMapUpdater.tileMapAsset.pub.tileSetId) : "";
    ui_1.default.tileSetInput.value = tileSetName;
}
onEditCommands.changeTileSet = function () {
    updateTileSetInput();
    exports.data.tileSetUpdater.changeTileSetId(exports.data.tileMapUpdater.tileMapAsset.pub.tileSetId);
};
onEditCommands.resizeMap = function () {
    var width = exports.data.tileMapUpdater.tileMapAsset.pub.width;
    var height = exports.data.tileMapUpdater.tileMapAsset.pub.height;
    ui_1.default.sizeInput.value = width + " \u00D7 " + height;
    mapArea_1.default.gridRenderer.resize(width, height);
};
onEditCommands.setProperty = function (path, value) {
    ui_1.default.settings[path].value = value;
    if (path === "pixelsPerUnit" && exports.data.tileMapUpdater.tileSetAsset != null) {
        var tileSetPub = exports.data.tileMapUpdater.tileSetAsset.pub;
        var tileMapPub = exports.data.tileMapUpdater.tileMapAsset.pub;
        mapArea_1.default.cameraControls.setMultiplier(value / tileSetPub.grid.width / 1);
        mapArea_1.default.gridRenderer.setRatio({ x: tileMapPub.pixelsPerUnit / tileSetPub.grid.width, y: tileMapPub.pixelsPerUnit / tileSetPub.grid.height });
        mapArea_1.default.patternRenderer.refreshPixelsPerUnit(tileMapPub.pixelsPerUnit);
        mapArea_1.default.patternBackgroundRenderer.refreshScale(1 / tileMapPub.pixelsPerUnit);
    }
};
onEditCommands.newLayer = function (layerPub, index) {
    ui_1.setupLayer(layerPub, index);
    var pub = exports.data.tileMapUpdater.tileMapAsset.pub;
    var layer = exports.data.tileMapUpdater.tileMapAsset.layers.byId[tileSetArea_1.default.selectedLayerId];
    var z = (pub.layers.indexOf(layer) + 0.5) * pub.layerDepthOffset;
    mapArea_1.default.patternActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, z));
    ui_1.refreshLayersId();
};
onEditCommands.renameLayer = function (id, newName) {
    var layerElt = ui_1.default.layersTreeView.treeRoot.querySelector("[data-id=\"" + id + "\"]");
    layerElt.querySelector(".name").textContent = newName;
};
onEditCommands.deleteLayer = function (id, index) {
    var layerElt = ui_1.default.layersTreeView.treeRoot.querySelector("[data-id=\"" + id + "\"]");
    ui_1.default.layersTreeView.remove(layerElt);
    if (id === tileSetArea_1.default.selectedLayerId) {
        index = Math.max(0, index - 1);
        tileSetArea_1.default.selectedLayerId = exports.data.tileMapUpdater.tileMapAsset.pub.layers[index].id;
        ui_1.default.layersTreeView.clearSelection();
        ui_1.default.layersTreeView.addToSelection(ui_1.default.layersTreeView.treeRoot.querySelector("li[data-id=\"" + tileSetArea_1.default.selectedLayerId + "\"]"));
    }
    var pub = exports.data.tileMapUpdater.tileMapAsset.pub;
    var layer = exports.data.tileMapUpdater.tileMapAsset.layers.byId[tileSetArea_1.default.selectedLayerId];
    var z = (pub.layers.indexOf(layer) + 0.5) * pub.layerDepthOffset;
    mapArea_1.default.patternActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, z));
    ui_1.refreshLayersId();
};
onEditCommands.moveLayer = function (id, newIndex) {
    var pub = exports.data.tileMapUpdater.tileMapAsset.pub;
    var layerElt = ui_1.default.layersTreeView.treeRoot.querySelector("[data-id=\"" + id + "\"]");
    ui_1.default.layersTreeView.insertAt(layerElt, "item", pub.layers.length - newIndex);
    var layer = exports.data.tileMapUpdater.tileMapAsset.layers.byId[tileSetArea_1.default.selectedLayerId];
    var z = (pub.layers.indexOf(layer) + 0.5) * pub.layerDepthOffset;
    mapArea_1.default.patternActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, z));
    ui_1.refreshLayersId();
};
// Tile Set
function onTileSetAssetReceived() {
    var tileMapPub = exports.data.tileMapUpdater.tileMapAsset.pub;
    var tileSetPub = exports.data.tileMapUpdater.tileSetAsset.pub;
    mapArea_1.default.cameraControls.setMultiplier(tileMapPub.pixelsPerUnit / tileSetPub.grid.width / 1);
    mapArea_1.default.gridRenderer.setRatio({ x: tileMapPub.pixelsPerUnit / tileSetPub.grid.width, y: tileMapPub.pixelsPerUnit / tileSetPub.grid.height });
    if (tileSetPub.texture != null) {
        mapArea_1.default.patternRenderer.setTileSet(new TileSet_1.default(tileSetPub));
        if (ui_1.default.brushToolButton.checked)
            ui_1.selectBrush(0, 0);
    }
    mapArea_1.default.patternBackgroundRenderer.setup(0x900090, 1 / tileMapPub.pixelsPerUnit, tileSetPub.grid.width);
}
;
onTileSetEditCommands.upload = function () {
    mapArea_1.default.patternRenderer.setTileSet(new TileSet_1.default(exports.data.tileMapUpdater.tileSetAsset.pub));
    if (ui_1.default.brushToolButton.checked)
        ui_1.selectBrush(0, 0);
};
onTileSetEditCommands.setProperty = function () {
    var tileMapPub = exports.data.tileMapUpdater.tileMapAsset.pub;
    var tileSetPub = exports.data.tileMapUpdater.tileSetAsset.pub;
    mapArea_1.default.cameraControls.setMultiplier(tileMapPub.pixelsPerUnit / tileSetPub.grid.width / 1);
    mapArea_1.default.gridRenderer.setRatio({ x: tileMapPub.pixelsPerUnit / tileSetPub.grid.width, y: tileMapPub.pixelsPerUnit / tileSetPub.grid.height });
    if (tileSetPub.texture != null)
        mapArea_1.default.patternRenderer.setTileSet(new TileSet_1.default(tileSetPub));
    mapArea_1.default.patternBackgroundRenderer.setup(0x900090, 1 / tileMapPub.pixelsPerUnit, tileSetPub.grid.width);
    if (ui_1.default.brushToolButton.checked)
        ui_1.selectBrush(0, 0);
};
