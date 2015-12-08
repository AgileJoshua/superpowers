var ui_1 = require("./ui");
var animationArea_1 = require("./animationArea");
var spritesheetArea_1 = require("./spritesheetArea");
var SpriteRenderer_1 = require("../../components/SpriteRenderer");
var SpriteRendererUpdater_1 = require("../../components/SpriteRendererUpdater");
exports.socket = SupClient.connect(SupClient.query.project);
exports.socket.on("connect", onConnected);
exports.socket.on("disconnect", SupClient.onDisconnected);
var onEditCommands = {};
function onConnected() {
    exports.data = {};
    exports.data.projectClient = new SupClient.ProjectClient(exports.socket);
    var spriteActor = new SupEngine.Actor(animationArea_1.default.gameInstance, "Sprite");
    var spriteRenderer = new SpriteRenderer_1.default(spriteActor);
    var config = { spriteAssetId: SupClient.query.asset, materialType: "basic" };
    var receiveCallbacks = { sprite: onAssetReceived };
    var editCallbacks = { sprite: onEditCommands };
    exports.data.spriteUpdater = new SpriteRendererUpdater_1.default(exports.data.projectClient, spriteRenderer, config, receiveCallbacks, editCallbacks);
}
function onAssetReceived() {
    var pub = exports.data.spriteUpdater.spriteAsset.pub;
    var texture = pub.textures[pub.mapSlots["map"]];
    var map = pub.maps[pub.mapSlots["map"]];
    spritesheetArea_1.default.spritesheet = {
        textures: { map: texture },
        filtering: pub.filtering,
        pixelsPerUnit: pub.pixelsPerUnit,
        framesPerSecond: pub.framesPerSecond,
        alphaTest: pub.alphaTest,
        mapSlots: { map: "map" },
        grid: { width: 0, height: 0 },
        origin: { x: 0, y: 1 },
        animations: []
    };
    if (texture != null) {
        spritesheetArea_1.default.spritesheet.grid.width = texture.size.width;
        spritesheetArea_1.default.spritesheet.grid.height = texture.size.height;
        spritesheetArea_1.default.spritesheet.textures["map"].needsUpdate = true;
        spritesheetArea_1.default.spriteRenderer.setSprite(spritesheetArea_1.default.spritesheet);
        ui_1.default.imageSize.value = texture.size.width + " \u00D7 " + texture.size.height;
    }
    animationArea_1.centerCamera();
    spritesheetArea_1.centerCamera();
    var width = texture != null ? texture.size.width / pub.grid.width : 1;
    var height = texture != null ? texture.size.height / pub.grid.height : 1;
    spritesheetArea_1.default.gridRenderer.setGrid({
        width: width, height: height,
        orthographicScale: 5,
        direction: -1,
        ratio: { x: pub.pixelsPerUnit / pub.grid.width, y: pub.pixelsPerUnit / pub.grid.height }
    });
    ui_1.default.allSettings.forEach(function (setting) {
        var parts = setting.split(".");
        var obj = pub;
        parts.slice(0, parts.length - 1).forEach(function (part) { obj = obj[part]; });
        ui_1.setupProperty(setting, obj[parts[parts.length - 1]]);
    });
    pub.animations.forEach(function (animation, index) {
        ui_1.setupAnimation(animation, index);
    });
    ui_1.setupAdvancedTextures(pub.advancedTextures);
    for (var mapName in pub.maps)
        if (pub.maps[mapName] != null)
            ui_1.setupMap(mapName);
    for (var slotName in pub.mapSlots)
        ui_1.default.mapSlotsInput[slotName].value = pub.mapSlots[slotName] != null ? pub.mapSlots[slotName] : "";
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
    if (path === "advancedTextures")
        ui_1.setupAdvancedTextures(value);
    else
        ui_1.setupProperty(path, value);
};
onEditCommands.newAnimation = function (animation, index) { ui_1.setupAnimation(animation, index); };
onEditCommands.deleteAnimation = function (id) {
    var animationElt = ui_1.default.animationsTreeView.treeRoot.querySelector("[data-id='" + id + "']");
    ui_1.default.animationsTreeView.remove(animationElt);
    if (ui_1.default.selectedAnimationId === id)
        ui_1.updateSelectedAnimation();
};
onEditCommands.moveAnimation = function (id, index) {
    var animationElt = ui_1.default.animationsTreeView.treeRoot.querySelector("[data-id='" + id + "']");
    ui_1.default.animationsTreeView.insertAt(animationElt, "item", index);
};
onEditCommands.setAnimationProperty = function (id, key, value) {
    var animationElt = ui_1.default.animationsTreeView.treeRoot.querySelector("[data-id='" + id + "']");
    switch (key) {
        case "name":
            animationElt.querySelector(".name").textContent = value;
            break;
        case "startFrameIndex":
            animationElt.querySelector(".start-frame-index").value = value;
            if (id == ui_1.default.selectedAnimationId)
                spritesheetArea_1.updateSelection();
            break;
        case "endFrameIndex":
            animationElt.querySelector(".end-frame-index").value = value;
            if (id == ui_1.default.selectedAnimationId)
                spritesheetArea_1.updateSelection();
            break;
        case "speed":
            animationElt.querySelector(".speed").value = value;
            break;
    }
};
function updateSpritesheet() {
    var pub = exports.data.spriteUpdater.spriteAsset.pub;
    var texture = pub.textures[pub.mapSlots["map"]];
    if (texture == null)
        return;
    var asset = spritesheetArea_1.default.spritesheet;
    asset.textures["map"] = texture;
    asset.textures["map"].needsUpdate = true;
    asset.grid.width = texture.size.width;
    asset.grid.height = texture.size.height;
    asset.pixelsPerUnit = pub.pixelsPerUnit;
    spritesheetArea_1.default.spriteRenderer.setSprite(asset);
    spritesheetArea_1.default.gridRenderer.resize(texture.size.width / pub.grid.width, texture.size.height / pub.grid.height);
    ui_1.updateSelectedAnimation();
    ui_1.default.imageSize.value = texture.size.width + " \u00D7 " + texture.size.height;
}
onEditCommands.setMaps = function () { updateSpritesheet(); };
onEditCommands.newMap = function (name) { ui_1.setupMap(name); };
onEditCommands.renameMap = function (oldName, newName) {
    var pub = exports.data.spriteUpdater.spriteAsset.pub;
    var textureElt = ui_1.default.texturesTreeView.treeRoot.querySelector("[data-name=\"" + oldName + "\"]");
    textureElt.dataset["name"] = newName;
    textureElt.querySelector("span").textContent = newName;
    for (var slotName in pub.mapSlots)
        if (ui_1.default.mapSlotsInput[slotName].value === oldName)
            ui_1.default.mapSlotsInput[slotName].value = newName;
};
onEditCommands.deleteMap = function (name) {
    var textureElt = ui_1.default.texturesTreeView.treeRoot.querySelector("[data-name=\"" + name + "\"]");
    ui_1.default.texturesTreeView.remove(textureElt);
    var pub = exports.data.spriteUpdater.spriteAsset.pub;
    for (var slotName in pub.mapSlots)
        if (ui_1.default.mapSlotsInput[slotName].value === name)
            ui_1.default.mapSlotsInput[slotName].value = "";
};
onEditCommands.setMapSlot = function (slot, map) {
    ui_1.default.mapSlotsInput[slot].value = map != null ? map : "";
    if (slot === "map")
        updateSpritesheet();
};
