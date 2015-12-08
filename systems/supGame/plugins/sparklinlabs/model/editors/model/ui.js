var network_1 = require("./network");
var index_1 = require("./importers/index");
var ModelAsset_1 = require("../../data/ModelAsset");
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
// Model upload
var modelFileSelect = document.querySelector(".model input.file-select");
modelFileSelect.addEventListener("change", onModelFileSelectChange);
document.querySelector(".model button.upload").addEventListener("click", function () { modelFileSelect.click(); });
// Primary map upload
var primaryMapFileSelect = document.querySelector(".map input.file-select");
primaryMapFileSelect.addEventListener("change", onPrimaryMapFileSelectChange);
ui.mapUploadButton = document.querySelector(".map button.upload");
ui.mapUploadButton.addEventListener("click", function () { primaryMapFileSelect.click(); });
ui.mapDownloadButton = document.querySelector(".map button.download");
ui.mapDownloadButton.addEventListener("click", function () {
    var textureName = network_1.data.modelUpdater.modelAsset.pub.mapSlots["map"];
    downloadTexture(textureName);
});
// Filtering
ui.filteringSelect = document.querySelector(".filtering");
ui.filteringSelect.addEventListener("change", onChangeFiltering);
// Wrapping
ui.wrappingSelect = document.querySelector(".wrapping");
ui.wrappingSelect.addEventListener("change", onChangeWrapping);
// Show skeleton
var showSkeletonCheckbox = document.querySelector(".show-skeleton");
showSkeletonCheckbox.addEventListener("change", onShowSkeletonChange);
// Unit Ratio
ui.unitRatioInput = document.querySelector("input.property-unitRatio");
ui.unitRatioInput.addEventListener("change", onChangeUnitRatio);
// Opacity
ui.opacityCheckbox = document.querySelector("input.opacity-checkbox");
ui.opacityCheckbox.addEventListener("click", onCheckOpacity);
ui.opacityInput = document.querySelector("input.property-opacity");
ui.opacityInput.addEventListener("input", onChangeOpacity);
// Animations
ui.animationsTreeView = new TreeView(document.querySelector(".animations-tree-view"), { dropCallback: onAnimationDrop });
ui.animationsTreeView.on("selectionChange", updateSelectedAnimation);
document.querySelector("button.new-animation").addEventListener("click", onNewAnimationClick);
// Animation upload
var animationFileSelect = document.querySelector(".upload-animation.file-select");
animationFileSelect.addEventListener("change", onAnimationFileSelectChange);
document.querySelector("button.upload-animation").addEventListener("click", function () { animationFileSelect.click(); });
document.querySelector("button.rename-animation").addEventListener("click", onRenameAnimationClick);
document.querySelector("button.delete-animation").addEventListener("click", onDeleteAnimationClick);
// Advanced textures
ui.texturesPane = document.querySelector(".advanced-textures");
var texturePaneResizeHandle = new PerfectResize(ui.texturesPane, "bottom");
ui.texturesToogleButton = document.querySelector(".advanced-textures button.plus");
ui.texturesToogleButton.addEventListener("click", function () {
    var advancedTextures = !network_1.data.modelUpdater.modelAsset.pub.advancedTextures;
    network_1.editAsset("setProperty", "advancedTextures", advancedTextures);
});
ui.texturesTreeView = new TreeView(document.querySelector(".textures-tree-view"));
ui.texturesTreeView.on("selectionChange", updateSelectedMap);
ui.mapSlotsInput = {};
for (var slotName in ModelAsset_1.default.schema["mapSlots"].properties) {
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
// Error pane
ui.errorPane = document.querySelector(".error-pane");
ui.errorPaneStatus = ui.errorPane.querySelector(".status");
ui.errorPaneInfo = ui.errorPaneStatus.querySelector(".info");
ui.errorsTBody = ui.errorPane.querySelector(".errors tbody");
var errorPaneResizeHandle = new PerfectResize(ui.errorPane, "bottom");
errorPaneResizeHandle.handleElt.classList.add("disabled");
var errorPaneToggleButton = ui.errorPane.querySelector("button.toggle");
ui.errorPaneStatus.addEventListener("click", function () {
    var collapsed = ui.errorPane.classList.toggle("collapsed");
    errorPaneToggleButton.textContent = collapsed ? "+" : "–";
    errorPaneResizeHandle.handleElt.classList.toggle("disabled", collapsed);
});
function setImportLog(log) {
    var errorsCount = 0;
    var warningsCount = 0;
    var lastErrorRow = null;
    if (log == null)
        log = [];
    for (var _i = 0; _i < log.length; _i++) {
        var entry = log[_i];
        // console.log(entry.file, entry.line, entry.type, entry.message);
        var logRow = document.createElement("tr");
        var positionCell = document.createElement("td");
        positionCell.textContent = (entry.line != null) ? (entry.line + 1).toString() : "";
        logRow.appendChild(positionCell);
        var typeCell = document.createElement("td");
        typeCell.textContent = entry.type;
        logRow.appendChild(typeCell);
        var messageCell = document.createElement("td");
        messageCell.textContent = entry.message;
        logRow.appendChild(messageCell);
        var fileCell = document.createElement("td");
        fileCell.textContent = entry.file;
        logRow.appendChild(fileCell);
        if (entry.type === "warning")
            warningsCount++;
        if (entry.type !== "error") {
            ui.errorsTBody.appendChild(logRow);
            continue;
        }
        ui.errorsTBody.insertBefore(logRow, (lastErrorRow != null) ? lastErrorRow.nextElementSibling : ui.errorsTBody.firstChild);
        lastErrorRow = logRow;
        errorsCount++;
    }
    var errorsAndWarningsInfo = [];
    if (errorsCount > 1)
        errorsAndWarningsInfo.push(errorsCount + " errors");
    else if (errorsCount > 0)
        errorsAndWarningsInfo.push("1 error");
    else
        errorsAndWarningsInfo.push("No errors");
    if (warningsCount > 1)
        errorsAndWarningsInfo.push(warningsCount + " warnings");
    else if (warningsCount > 0)
        errorsAndWarningsInfo.push(warningsCount + " warnings");
    if (network_1.data == null || errorsCount > 0) {
        var info = (network_1.data == null) ? "Import failed \u2014 " : "";
        ui.errorPaneInfo.textContent = info + errorsAndWarningsInfo.join(", ");
        ui.errorPaneStatus.classList.add("has-errors");
        return;
    }
    ui.errorPaneInfo.textContent = errorsAndWarningsInfo.join(", ");
    ui.errorPaneStatus.classList.remove("has-errors");
}
function onModelFileSelectChange(event) {
    if (event.target.files.length === 0)
        return;
    ui.errorsTBody.innerHTML = "";
    index_1.default(event.target.files, function (log, data) {
        event.target.parentElement.reset();
        setImportLog(log);
        if (data != null) {
            network_1.editAsset("setModel", data.upAxisMatrix, data.attributes, data.bones);
            if (data.maps != null)
                network_1.editAsset("setMaps", data.maps);
        }
    });
}
function onPrimaryMapFileSelectChange(event) {
    ui.errorsTBody.innerHTML = "";
    ui.errorPaneInfo.textContent = "No errors";
    ui.errorPaneStatus.classList.remove("has-errors");
    var reader = new FileReader;
    reader.onload = function (event) { network_1.editAsset("setMaps", { map: reader.result }); };
    var element = event.target;
    reader.readAsArrayBuffer(element.files[0]);
    element.parentElement.reset();
    return;
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
        a.href = network_1.data.modelUpdater.mapObjectURLs[textureName];
        a.download = name + ".png";
        a.click();
        document.body.removeChild(a);
    });
}
function onChangeFiltering(event) { network_1.editAsset("setProperty", "filtering", event.target.value); }
function onChangeWrapping(event) { network_1.editAsset("setProperty", "wrapping", event.target.value); }
function onShowSkeletonChange(event) { network_1.data.modelUpdater.modelRenderer.setShowSkeleton(event.target.checked); }
function onChangeUnitRatio(event) { network_1.editAsset("setProperty", "unitRatio", parseFloat(event.target.value)); }
function onCheckOpacity(event) { network_1.editAsset("setProperty", "opacity", (event.target.checked) ? 1 : null); }
function onChangeOpacity(event) { network_1.editAsset("setProperty", "opacity", parseFloat(event.target.value)); }
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
        network_1.editAsset("newAnimation", name, null, null, function (animationId) {
            ui.animationsTreeView.clearSelection();
            ui.animationsTreeView.addToSelection(ui.animationsTreeView.treeRoot.querySelector("li[data-id=\"" + animationId + "\"]"));
            updateSelectedAnimation();
        });
    });
}
function onAnimationFileSelectChange(event) {
    if (event.target.files.length === 0)
        return;
    var animationId = ui.selectedAnimationId;
    index_1.default(event.target.files, function (log, data) {
        event.target.parentElement.reset();
        setImportLog(log);
        if (data != null) {
            if (data.animation == null) {
                alert("No animation found in imported files");
                return;
            }
            // TODO: Check if bones are compatible
            network_1.editAsset("setAnimation", animationId, data.animation.duration, data.animation.keyFrames);
        }
    });
}
function onRenameAnimationClick() {
    if (ui.animationsTreeView.selectedNodes.length !== 1)
        return;
    var selectedNode = ui.animationsTreeView.selectedNodes[0];
    var animation = network_1.data.modelUpdater.modelAsset.animations.byId[selectedNode.dataset.id];
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
        for (var _i = 0, _a = ui.animationsTreeView.selectedNodes; _i < _a.length; _i++) {
            var selectedNode = _a[_i];
            network_1.editAsset("deleteAnimation", selectedNode.dataset.id);
        }
    });
}
function onAnimationDrop(dropInfo, orderedNodes) {
    var animationIds = [];
    for (var _i = 0; _i < orderedNodes.length; _i++) {
        var animation = orderedNodes[_i];
        animationIds.push(animation.dataset["id"]);
    }
    var index = SupClient.getListViewDropIndex(dropInfo, network_1.data.modelUpdater.modelAsset.animations);
    for (var i = 0; i < animationIds.length; i++)
        network_1.editAsset("moveAnimation", animationIds[i], index + i);
    return false;
}
function updateSelectedAnimation() {
    var selectedAnimElt = ui.animationsTreeView.selectedNodes[0];
    if (selectedAnimElt != null)
        ui.selectedAnimationId = selectedAnimElt.dataset.id;
    else
        ui.selectedAnimationId = null;
    var buttons = document.querySelectorAll(".animations-buttons button");
    for (var i = 0; i < buttons.length; i++) {
        var button = buttons[i];
        button.disabled = ui.selectedAnimationId == null && button.className !== "new-animation";
    }
    network_1.data.modelUpdater.config_setProperty("animationId", ui.selectedAnimationId);
}
exports.updateSelectedAnimation = updateSelectedAnimation;
function setupAnimation(animation, index) {
    var liElt = document.createElement("li");
    liElt.dataset["id"] = animation.id;
    var nameSpan = document.createElement("span");
    nameSpan.className = "name";
    nameSpan.textContent = animation.name;
    liElt.appendChild(nameSpan);
    ui.animationsTreeView.insertAt(liElt, "item", index, null);
}
exports.setupAnimation = setupAnimation;
function onEditMapSlot(event) {
    if (event.target.value !== "" && network_1.data.modelUpdater.modelAsset.pub.maps[event.target.value] == null)
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
    ui.errorsTBody.innerHTML = "";
    ui.errorPaneInfo.textContent = "No errors";
    ui.errorPaneStatus.classList.remove("has-errors");
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
    new SupClient.dialogs.ConfirmDialog("Are you sure you want to delete the selected textures?", "Delete", function (confirmed) {
        /* tslint:enable:no-unused-expression */
        if (!confirmed)
            return;
        for (var _i = 0, _a = ui.texturesTreeView.selectedNodes; _i < _a.length; _i++) {
            var selectedNode = _a[_i];
            network_1.editAsset("deleteMap", selectedNode.dataset.name);
        }
    });
}
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
function setupOpacity(opacity) {
    ui.opacityInput.value = opacity != null ? opacity.toString() : "";
    ui.opacityInput.disabled = opacity == null;
    ui.opacityCheckbox.checked = opacity != null;
}
exports.setupOpacity = setupOpacity;
function setupAdvancedTextures(advancedTextures) {
    ui.mapUploadButton.disabled = advancedTextures;
    ui.mapDownloadButton.disabled = advancedTextures;
    // NOTE: .toggle signature lacks the second argument in TypeScript 1.5 alpha
    ui.texturesPane.classList.toggle("collapsed", !advancedTextures);
    ui.texturesToogleButton.textContent = !advancedTextures ? "+" : "–";
    texturePaneResizeHandle.handleElt.classList.toggle("disabled", !advancedTextures);
}
exports.setupAdvancedTextures = setupAdvancedTextures;
