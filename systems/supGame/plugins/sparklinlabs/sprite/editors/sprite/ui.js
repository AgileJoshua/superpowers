var network_1 = require("./network");
var animationArea_1 = require("./animationArea");
var spritesheetArea_1 = require("./spritesheetArea");
var SpriteAsset_1 = require("../../data/SpriteAsset");
/* tslint:disable */
var PerfectResize = require("perfect-resize");
var TreeView = require("dnd-tree-view");
/* tslint:enable */
var ui = {};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ui;
// Setup hotkeys
SupClient.setupHotkeys();
// Setup resizable panes
new PerfectResize(document.querySelector(".sidebar"), "right");
// Setup properties
var fileSelect = document.querySelector("input.file-select");
fileSelect.addEventListener("change", onFileSelectChange);
document.querySelector("button.upload").addEventListener("click", function () { fileSelect.click(); });
document.querySelector("button.download").addEventListener("click", function () {
    var textureName = network_1.data.spriteUpdater.spriteAsset.pub.mapSlots["map"];
    downloadTexture(textureName);
});
ui.allSettings = [
    "filtering", "pixelsPerUnit", "framesPerSecond", "opacity", "alphaTest",
    "frameOrder", "grid.width", "grid.height", "origin.x", "origin.y"];
ui.settings = {};
ui.allSettings.forEach(function (setting) {
    var parts = setting.split(".");
    var obj = ui.settings;
    var queryName = ".property-";
    parts.slice(0, parts.length - 1).forEach(function (part) {
        if (obj[part] == null)
            obj[part] = {};
        obj = obj[part];
        queryName += part + "-";
    });
    queryName += parts[parts.length - 1];
    var settingObj = obj[parts[parts.length - 1]] = document.querySelector(queryName);
    switch (setting) {
        case "filtering":
        case "frameOrder":
            settingObj.addEventListener("change", function (event) { network_1.editAsset("setProperty", setting, event.target.value); });
            break;
        case "opacity":
        case "alphaTest":
            settingObj.addEventListener("change", function (event) { network_1.editAsset("setProperty", setting, parseFloat(event.target.value)); });
            break;
        default:
            if (setting.indexOf("origin") !== -1)
                settingObj.addEventListener("change", function (event) { network_1.editAsset("setProperty", setting, event.target.value / 100); });
            else
                settingObj.addEventListener("change", function (event) { network_1.editAsset("setProperty", setting, parseInt(event.target.value, 10)); });
            break;
    }
});
ui.opacityCheckbox = document.querySelector("input.opacity-checkbox");
ui.opacityCheckbox.addEventListener("click", onCheckOpacity);
document.querySelector("button.set-grid-width").addEventListener("click", onSetGridWidth);
document.querySelector("button.set-grid-height").addEventListener("click", onSetGridHeight);
ui.imageSize = document.querySelector("td.image-size input");
// Animations
ui.animationsTreeView = new TreeView(document.querySelector(".animations-tree-view"), { dropCallback: onAnimationDrop });
ui.animationsTreeView.on("selectionChange", updateSelectedAnimation);
document.querySelector("button.new-animation").addEventListener("click", onNewAnimationClick);
document.querySelector("button.rename-animation").addEventListener("click", onRenameAnimationClick);
document.querySelector("button.delete-animation").addEventListener("click", onDeleteAnimationClick);
ui.animationPlay = document.querySelector("button.animation-play");
ui.animationPlay.addEventListener("click", onPlayAnimation);
ui.animationSlider = document.querySelector("input.animation-slider");
ui.animationSlider.addEventListener("input", onChangeAnimationTime);
document.querySelector("input.animation-loop").addEventListener("change", function (event) {
    network_1.data.spriteUpdater.config_setProperty("looping", event.target.checked);
});
// Advanced textures
ui.texturesPane = document.querySelector(".advanced-textures");
var texturePaneResizeHandle = new PerfectResize(ui.texturesPane, "bottom");
ui.texturesToogleButton = document.querySelector(".advanced-textures button.plus");
ui.texturesToogleButton.addEventListener("click", function () {
    var advancedTextures = !network_1.data.spriteUpdater.spriteAsset.pub.advancedTextures;
    network_1.editAsset("setProperty", "advancedTextures", advancedTextures);
});
ui.texturesTreeView = new TreeView(document.querySelector(".textures-tree-view"));
ui.texturesTreeView.on("selectionChange", updateSelectedMap);
ui.mapSlotsInput = {};
for (var slotName in SpriteAsset_1.default.schema["mapSlots"].properties) {
    ui.mapSlotsInput[slotName] = document.querySelector(".map-" + slotName);
    ui.mapSlotsInput[slotName].dataset["name"] = slotName;
    ui.mapSlotsInput[slotName].addEventListener("input", onEditMapSlot);
}
document.querySelector("button.new-map").addEventListener("click", onNewMapClick);
var mapFileSelect = document.querySelector(".upload-map.file-select");
mapFileSelect.addEventListener("change", onMapFileSelectChange);
document.querySelector("button.upload-map").addEventListener("click", function () { mapFileSelect.click(); });
document.querySelector("button.download-map").addEventListener("click", function () {
    if (ui.texturesTreeView.selectedNodes.length !== 1)
        return;
    var selectedNode = ui.texturesTreeView.selectedNodes[0];
    var textureName = selectedNode.dataset.name;
    downloadTexture(textureName);
});
document.querySelector("button.rename-map").addEventListener("click", onRenameMapClick);
document.querySelector("button.delete-map").addEventListener("click", onDeleteMapClick);
function onFileSelectChange(event) {
    if (event.target.files.length === 0)
        return;
    var reader = new FileReader();
    reader.onload = function (event) { network_1.editAsset("setMaps", { map: event.target.result }); };
    reader.readAsArrayBuffer(event.target.files[0]);
    event.target.parentElement.reset();
}
function downloadTexture(textureName) {
    var options = {
        initialValue: "Image",
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
        a.href = network_1.data.spriteUpdater.spriteAsset.mapObjectURLs[textureName];
        a.download = name + ".png";
        a.click();
        document.body.removeChild(a);
    });
}
function onCheckOpacity(event) {
    var opacity = (event.target.checked) ? 1 : null;
    network_1.editAsset("setProperty", "opacity", opacity);
}
function onSetGridWidth(event) {
    var texture = network_1.data.spriteUpdater.spriteAsset.pub.textures["map"];
    if (texture == null)
        return;
    var options = {
        initialValue: "1",
        validationLabel: "Set grid width"
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("How many frames per row?", options, function (framesPerRow) {
        /* tslint:enable:no-unused-expression */
        if (framesPerRow == null)
            return;
        var framesPerRowNum = parseInt(framesPerRow, 10);
        if (isNaN(framesPerRowNum))
            return;
        network_1.editAsset("setProperty", "grid.width", Math.floor(texture.size.width / framesPerRowNum));
    });
}
function onSetGridHeight(event) {
    var texture = network_1.data.spriteUpdater.spriteAsset.pub.textures["map"];
    if (texture == null)
        return;
    var options = {
        initialValue: "1",
        validationLabel: "Set grid height"
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("How many frames per column?", options, function (framesPerColumn) {
        /* tslint:enable:no-unused-expression */
        if (framesPerColumn == null)
            return;
        var framesPerColumnNum = parseInt(framesPerColumn, 10);
        if (isNaN(framesPerColumnNum))
            return;
        network_1.editAsset("setProperty", "grid.height", Math.floor(texture.size.height / framesPerColumnNum));
    });
}
function onNewAnimationClick() {
    var options = {
        initialValue: "Animation",
        validationLabel: "Create"
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter a name for the animation.", options, function (name) {
        /* tslint:enable:no-unused-expression */
        if (name == null)
            return;
        network_1.editAsset("newAnimation", name, function (animationId) {
            ui.animationsTreeView.clearSelection();
            ui.animationsTreeView.addToSelection(ui.animationsTreeView.treeRoot.querySelector("li[data-id='" + animationId + "']"));
            updateSelectedAnimation();
        });
    });
}
function onRenameAnimationClick() {
    if (ui.animationsTreeView.selectedNodes.length !== 1)
        return;
    var selectedNode = ui.animationsTreeView.selectedNodes[0];
    var animation = network_1.data.spriteUpdater.spriteAsset.animations.byId[selectedNode.dataset.id];
    var options = {
        initialValue: animation.name,
        validationLabel: "Rename"
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter a new name for the animation.", options, function (newName) {
        /* tslint:enable:no-unused-expression */
        if (newName == null)
            return;
        network_1.editAsset("setAnimationProperty", animation.id, "name", newName);
    });
}
function onDeleteAnimationClick() {
    if (ui.animationsTreeView.selectedNodes.length === 0)
        return;
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.ConfirmDialog("Are you sure you want to delete the selected animations?", "Delete", function (confirm) {
        /* tslint:enable:no-unused-expression */
        if (!confirm)
            return;
        ui.animationsTreeView.selectedNodes.forEach(function (selectedNode) { network_1.editAsset("deleteAnimation", selectedNode.dataset.id); });
    });
}
function onAnimationDrop(dropInfo, orderedNodes) {
    var animationIds = [];
    orderedNodes.forEach(function (animation) { animationIds.push(animation.dataset.id); });
    var index = SupClient.getListViewDropIndex(dropInfo, network_1.data.spriteUpdater.spriteAsset.animations);
    animationIds.forEach(function (id, i) { network_1.editAsset("moveAnimation", id, index + i); });
    return false;
}
function updateSelectedAnimation() {
    var selectedAnimElt = ui.animationsTreeView.selectedNodes[0];
    if (selectedAnimElt != null) {
        ui.selectedAnimationId = selectedAnimElt.dataset.id;
        network_1.data.spriteUpdater.config_setProperty("animationId", ui.selectedAnimationId);
        ui.animationPlay.disabled = false;
        ui.animationSlider.disabled = false;
        ui.animationSlider.max = (network_1.data.spriteUpdater.spriteRenderer.getAnimationFrameCount() - 1).toString();
        spritesheetArea_1.updateSelection();
    }
    else {
        ui.selectedAnimationId = null;
        network_1.data.spriteUpdater.config_setProperty("animationId", null);
        ui.animationPlay.disabled = true;
        ui.animationSlider.disabled = true;
        ui.animationSlider.value = "0";
        spritesheetArea_1.default.selectionRenderer.clearMesh();
    }
    ui.animationPlay.textContent = "▐ ▌";
    var buttons = document.querySelectorAll(".animations-buttons button");
    for (var index = 0; index < buttons.length; index++) {
        var button = buttons.item(index);
        button.disabled = ui.selectedAnimationId == null && button.className !== "new-animation";
    }
}
exports.updateSelectedAnimation = updateSelectedAnimation;
function onPlayAnimation() {
    if (ui.animationPlay.textContent === "▐ ▌") {
        network_1.data.spriteUpdater.spriteRenderer.pauseAnimation();
        ui.animationPlay.textContent = "▶";
    }
    else {
        network_1.data.spriteUpdater.spriteRenderer.playAnimation(network_1.data.spriteUpdater.looping);
        ui.animationPlay.textContent = "▐ ▌";
    }
}
function onChangeAnimationTime() {
    if (network_1.data.spriteUpdater == null)
        return;
    network_1.data.spriteUpdater.spriteRenderer.setAnimationFrameTime(parseInt(ui.animationSlider.value, 10));
}
function setupProperty(path, value) {
    var parts = path.split(".");
    var obj = ui.settings;
    parts.slice(0, parts.length - 1).forEach(function (part) { obj = obj[part]; });
    if (path.indexOf("origin") !== -1)
        value *= 100;
    obj[parts[parts.length - 1]].value = value;
    var pub = network_1.data.spriteUpdater.spriteAsset.pub;
    if (path === "filtering" && spritesheetArea_1.default.spriteRenderer.asset != null) {
        if (pub.filtering === "pixelated") {
            spritesheetArea_1.default.spritesheet.textures["map"].magFilter = SupEngine.THREE.NearestFilter;
            spritesheetArea_1.default.spritesheet.textures["map"].minFilter = SupEngine.THREE.NearestFilter;
        }
        else {
            spritesheetArea_1.default.spritesheet.textures["map"].magFilter = SupEngine.THREE.LinearFilter;
            spritesheetArea_1.default.spritesheet.textures["map"].minFilter = SupEngine.THREE.LinearMipMapLinearFilter;
        }
        spritesheetArea_1.default.spritesheet.textures["map"].needsUpdate = true;
    }
    if (path === "opacity") {
        obj[parts[parts.length - 1]].disabled = value == null;
        ui.opacityCheckbox.checked = value != null;
        spritesheetArea_1.default.spriteRenderer.setOpacity(value != null ? 1 : null);
    }
    if (path === "alphaTest" && spritesheetArea_1.default.spriteRenderer.material != null) {
        spritesheetArea_1.default.spriteRenderer.material.alphaTest = value;
        spritesheetArea_1.default.spriteRenderer.material.needsUpdate = true;
    }
    if (path === "pixelsPerUnit") {
        // FIXME: .setPixelsPerUnit(...) maybe?
        spritesheetArea_1.default.spritesheet.pixelsPerUnit = value;
        spritesheetArea_1.default.spriteRenderer.updateShape();
        spritesheetArea_1.default.gridRenderer.setRatio({ x: pub.pixelsPerUnit / pub.grid.width, y: pub.pixelsPerUnit / pub.grid.height });
        spritesheetArea_1.default.cameraControls.setMultiplier(value);
        animationArea_1.default.cameraControls.setMultiplier(value);
        animationArea_1.default.originMakerComponent.setScale(100 / value);
        spritesheetArea_1.updateSelection();
    }
    if (path === "grid.width" || path === "grid.height") {
        spritesheetArea_1.default.gridRenderer.setRatio({ x: pub.pixelsPerUnit / pub.grid.width, y: pub.pixelsPerUnit / pub.grid.height });
        var texture = pub.textures[pub.mapSlots["map"]];
        if (texture != null) {
            spritesheetArea_1.default.gridRenderer.resize(texture.size.width / pub.grid.width, texture.size.height / pub.grid.height);
        }
        spritesheetArea_1.updateSelection();
    }
    if (path === "frameOrder")
        spritesheetArea_1.updateSelection();
}
exports.setupProperty = setupProperty;
function setupAnimation(animation, index) {
    var liElt = document.createElement("li");
    liElt.dataset["id"] = animation.id;
    var nameSpan = document.createElement("span");
    nameSpan.className = "name";
    nameSpan.textContent = animation.name;
    liElt.appendChild(nameSpan);
    var startFrameIndexInput = document.createElement("input");
    startFrameIndexInput.type = "number";
    startFrameIndexInput.min = "0";
    startFrameIndexInput.className = "start-frame-index";
    startFrameIndexInput.value = animation.startFrameIndex;
    liElt.appendChild(startFrameIndexInput);
    startFrameIndexInput.addEventListener("change", function (event) {
        var startFrameIndex = parseInt(event.target.value, 10);
        network_1.editAsset("setAnimationProperty", animation.id, "startFrameIndex", startFrameIndex);
        if (startFrameIndex > network_1.data.spriteUpdater.spriteAsset.animations.byId[ui.selectedAnimationId].endFrameIndex)
            network_1.editAsset("setAnimationProperty", animation.id, "endFrameIndex", startFrameIndex);
    });
    var endFrameIndexInput = document.createElement("input");
    endFrameIndexInput.type = "number";
    endFrameIndexInput.min = "0";
    endFrameIndexInput.className = "end-frame-index";
    endFrameIndexInput.value = animation.endFrameIndex;
    liElt.appendChild(endFrameIndexInput);
    endFrameIndexInput.addEventListener("change", function (event) {
        var endFrameIndex = parseInt(event.target.value, 10);
        network_1.editAsset("setAnimationProperty", animation.id, "endFrameIndex", endFrameIndex);
        if (endFrameIndex < network_1.data.spriteUpdater.spriteAsset.animations.byId[ui.selectedAnimationId].startFrameIndex)
            network_1.editAsset("setAnimationProperty", animation.id, "startFrameIndex", endFrameIndex);
    });
    var speedInput = document.createElement("input");
    speedInput.type = "number";
    speedInput.className = "speed";
    speedInput.value = animation.speed;
    liElt.appendChild(speedInput);
    speedInput.addEventListener("change", function (event) {
        network_1.editAsset("setAnimationProperty", animation.id, "speed", parseFloat(event.target.value));
    });
    ui.animationsTreeView.insertAt(liElt, "item", index, null);
}
exports.setupAnimation = setupAnimation;
function onEditMapSlot(event) {
    if (event.target.value !== "" && network_1.data.spriteUpdater.spriteAsset.pub.maps[event.target.value] == null)
        return;
    var slot = event.target.value !== "" ? event.target.value : null;
    network_1.editAsset("setMapSlot", event.target.dataset.name, slot);
}
function onNewMapClick() {
    var options = {
        initialValue: "map",
        validationLabel: "Create"
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter a new name for the map.", options, function (name) {
        /* tslint:enable:no-unused-expression */
        if (name == null)
            return;
        network_1.editAsset("newMap", name);
    });
}
function onMapFileSelectChange(event) {
    var reader = new FileReader;
    var maps = {};
    reader.onload = function (event) {
        maps[ui.selectedTextureName] = reader.result;
        network_1.editAsset("setMaps", maps);
    };
    var element = event.target;
    reader.readAsArrayBuffer(element.files[0]);
    element.parentElement.reset();
    return;
}
function onRenameMapClick() {
    if (ui.texturesTreeView.selectedNodes.length !== 1)
        return;
    var selectedNode = ui.texturesTreeView.selectedNodes[0];
    var textureName = selectedNode.dataset.name;
    var options = {
        initialValue: textureName,
        validationLabel: "Rename"
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter a new name for the texture.", options, function (newName) {
        /* tslint:enable:no-unused-expression */
        if (newName == null)
            return;
        network_1.editAsset("renameMap", textureName, newName);
    });
}
function onDeleteMapClick() {
    if (ui.texturesTreeView.selectedNodes.length === 0)
        return;
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.ConfirmDialog("Are you sure you want to delete the selected textures?", "Delete", function (confirm) {
        /* tslint:enable:no-unused-expression */
        if (!confirm)
            return;
        for (var _i = 0, _a = ui.texturesTreeView.selectedNodes; _i < _a.length; _i++) {
            var selectedNode = _a[_i];
            network_1.editAsset("deleteMap", selectedNode.dataset.name);
        }
    });
}
function setupAdvancedTextures(advancedTextures) {
    ui.texturesPane.classList.toggle("collapsed", !advancedTextures);
    ui.texturesToogleButton.textContent = !advancedTextures ? "+" : "–";
    texturePaneResizeHandle.handleElt.classList.toggle("disabled", !advancedTextures);
}
exports.setupAdvancedTextures = setupAdvancedTextures;
function updateSelectedMap() {
    var selectedMapElt = ui.texturesTreeView.selectedNodes[0];
    if (selectedMapElt != null)
        ui.selectedTextureName = selectedMapElt.dataset.name;
    else
        ui.selectedTextureName = null;
    var buttons = document.querySelectorAll(".textures-buttons button");
    for (var i = 0; i < buttons.length; i++) {
        var button = buttons[i];
        button.disabled = ui.selectedTextureName == null && button.className !== "new-map";
    }
}
exports.updateSelectedMap = updateSelectedMap;
function setupMap(mapName) {
    var liElt = document.createElement("li");
    liElt.dataset["name"] = mapName;
    var nameSpan = document.createElement("span");
    nameSpan.className = "name";
    nameSpan.textContent = mapName;
    liElt.appendChild(nameSpan);
    ui.texturesTreeView.insertAt(liElt, "item", 0, null);
}
exports.setupMap = setupMap;
