var ui_1 = require("./ui");
var engine_1 = require("./engine");
var ModelRenderer_1 = require("../../components/ModelRenderer");
exports.socket = SupClient.connect(SupClient.query.project);
exports.socket.on("connect", onConnected);
exports.socket.on("disconnect", SupClient.onDisconnected);
var onEditCommands = {};
function onConnected() {
    exports.data = {};
    exports.data.projectClient = new SupClient.ProjectClient(exports.socket, { subEntries: false });
    var modelActor = new SupEngine.Actor(engine_1.default.gameInstance, "Model");
    var modelRenderer = new ModelRenderer_1.default(modelActor);
    var config = { modelAssetId: SupClient.query.asset, animationId: null, materialType: "phong" };
    var receiveCallbacks = { model: onAssetReceived };
    var editCallbacks = { model: onEditCommands };
    exports.data.modelUpdater = new ModelRenderer_1.default.Updater(exports.data.projectClient, modelRenderer, config, receiveCallbacks, editCallbacks);
}
function onAssetReceived() {
    var pub = exports.data.modelUpdater.modelAsset.pub;
    for (var index = 0; index < pub.animations.length; index++) {
        var animation = pub.animations[index];
        ui_1.setupAnimation(animation, index);
    }
    ui_1.default.filteringSelect.value = pub.filtering;
    ui_1.default.wrappingSelect.value = pub.wrapping;
    ui_1.default.unitRatioInput.value = pub.unitRatio.toString();
    ui_1.setupOpacity(pub.opacity);
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
    switch (path) {
        case "filtering":
            ui_1.default.filteringSelect.value = value;
            break;
        case "wrapping":
            ui_1.default.wrappingSelect.value = value;
            break;
        case "unitRatio":
            ui_1.default.unitRatioInput.value = value.toString();
            break;
        case "opacity":
            ui_1.setupOpacity(value);
            break;
        case "advancedTextures":
            ui_1.setupAdvancedTextures(value);
            break;
    }
};
onEditCommands.newAnimation = function (animation, index) {
    ui_1.setupAnimation(animation, index);
};
onEditCommands.deleteAnimation = function (id) {
    var animationElt = ui_1.default.animationsTreeView.treeRoot.querySelector("[data-id=\"" + id + "\"]");
    ui_1.default.animationsTreeView.remove(animationElt);
    if (ui_1.default.selectedAnimationId === id)
        ui_1.updateSelectedAnimation();
};
onEditCommands.moveAnimation = function (id, index) {
    var animationElt = ui_1.default.animationsTreeView.treeRoot.querySelector("[data-id=\"" + id + "\"]");
    ui_1.default.animationsTreeView.insertAt(animationElt, "item", index);
};
onEditCommands.setAnimationProperty = function (id, key, value) {
    var animationElt = ui_1.default.animationsTreeView.treeRoot.querySelector("[data-id=\"" + id + "\"]");
    switch (key) {
        case "name":
            animationElt.querySelector(".name").textContent = value;
            break;
    }
};
onEditCommands.newMap = function (name) {
    ui_1.setupMap(name);
};
onEditCommands.renameMap = function (oldName, newName) {
    var pub = exports.data.modelUpdater.modelAsset.pub;
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
    var pub = exports.data.modelUpdater.modelAsset.pub;
    for (var slotName in pub.mapSlots)
        if (ui_1.default.mapSlotsInput[slotName].value === name)
            ui_1.default.mapSlotsInput[slotName].value = "";
};
onEditCommands.setMapSlot = function (slot, map) {
    ui_1.default.mapSlotsInput[slot].value = map != null ? map : "";
};
