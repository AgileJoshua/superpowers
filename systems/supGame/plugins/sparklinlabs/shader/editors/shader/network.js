var ui_1 = require("./ui");
var engine_1 = require("./engine");
exports.socket = SupClient.connect(SupClient.query.project);
exports.socket.on("welcome", onWelcome);
exports.socket.on("disconnect", SupClient.onDisconnected);
function onWelcome(clientId) {
    exports.data = { projectClient: new SupClient.ProjectClient(exports.socket, { subEntries: true }) };
    ui_1.setupEditors(clientId);
    exports.data.projectClient.subAsset(SupClient.query.asset, "shader", { onAssetReceived: onAssetReceived, onAssetEdited: onAssetEdited, onAssetTrashed: onAssetTrashed });
}
function onAssetReceived(assetId, asset) {
    exports.data.shaderAsset = asset;
    for (var _i = 0, _a = asset.pub.uniforms; _i < _a.length; _i++) {
        var uniform = _a[_i];
        ui_1.setupUniform(uniform);
    }
    ui_1.default.useLightUniformsCheckbox.checked = asset.pub.useLightUniforms;
    for (var _b = 0, _c = asset.pub.attributes; _b < _c.length; _b++) {
        var attribute = _c[_b];
        ui_1.setupAttribute(attribute);
    }
    ui_1.default.vertexEditor.setText(asset.pub.vertexShader.draft);
    var hasVertexDraft = asset.pub.vertexShader.draft !== asset.pub.vertexShader.text;
    ui_1.default.vertexHeader.classList.toggle("has-draft", hasVertexDraft);
    ui_1.default.vertexSaveElt.hidden = !hasVertexDraft;
    ui_1.default.fragmentEditor.setText(asset.pub.fragmentShader.draft);
    var hasFragmentDraft = asset.pub.fragmentShader.draft !== asset.pub.fragmentShader.text;
    ui_1.default.fragmentHeader.classList.toggle("has-draft", hasFragmentDraft);
    ui_1.default.fragmentSaveElt.hidden = !hasFragmentDraft;
    engine_1.setupPreview();
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
var onEditCommands = {};
function onAssetEdited(id, command) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    var commandFunction = onEditCommands[("" + command)];
    if (commandFunction != null)
        commandFunction.apply(this, args);
    if (ui_1.default.previewTypeSelect.value !== "Asset" && command !== "editVertexShader" && command !== "editFragmentShader")
        engine_1.setupPreview();
}
onEditCommands.setProperty = function (path, value) {
    switch (path) {
        case "useLightUniforms":
            ui_1.default.useLightUniformsCheckbox.checked = value;
            break;
    }
};
onEditCommands.newUniform = function (uniform) { ui_1.setupUniform(uniform); };
onEditCommands.deleteUniform = function (id) {
    var rowElt = ui_1.default.uniformsList.querySelector("[data-id='" + id + "']");
    rowElt.parentElement.removeChild(rowElt);
};
onEditCommands.setUniformProperty = function (id, key, value) {
    var rowElt = ui_1.default.uniformsList.querySelector("[data-id='" + id + "']");
    if (key === "value") {
        var type = exports.data.shaderAsset.uniforms.byId[id].type;
        switch (type) {
            case "f":
                var floatInputElt = rowElt.querySelector(".float");
                floatInputElt.value = value;
                break;
            case "c":
            case "v2":
            case "v3":
            case "v4":
                setUniformValues(rowElt, type, value);
                break;
            case "t":
                var textInputElt = rowElt.querySelector(".text");
                textInputElt.value = value;
                break;
        }
    }
    else {
        var fieldElt = rowElt.querySelector("." + key);
        fieldElt.value = value;
    }
    if (key === "type")
        ui_1.setUniformValueInputs(id);
};
function setUniformValues(parentElt, name, values) {
    for (var i = 0; i < values.length; i++)
        parentElt.querySelector("." + name + "_" + i).value = values[i].toString();
}
onEditCommands.newAttribute = function (attribute) { ui_1.setupAttribute(attribute); };
onEditCommands.deleteAttribute = function (id) {
    var rowElt = ui_1.default.attributesList.querySelector("[data-id='" + id + "']");
    rowElt.parentElement.removeChild(rowElt);
};
onEditCommands.setAttributeProperty = function (id, key, value) {
    var rowElt = ui_1.default.attributesList.querySelector("[data-id='" + id + "']");
    var fieldElt = rowElt.querySelector("." + key);
    fieldElt.value = value;
};
onEditCommands.editVertexShader = function (operationData) {
    ui_1.default.vertexEditor.receiveEditText(operationData);
    ui_1.default.vertexHeader.classList.toggle("has-draft", true);
    ui_1.default.vertexSaveElt.hidden = false;
};
onEditCommands.saveVertexShader = function () {
    ui_1.default.vertexHeader.classList.toggle("has-draft", false);
    ui_1.default.vertexHeader.classList.toggle("has-errors", false);
    ui_1.default.vertexSaveElt.hidden = true;
};
onEditCommands.editFragmentShader = function (operationData) {
    ui_1.default.fragmentEditor.receiveEditText(operationData);
    ui_1.default.fragmentHeader.classList.toggle("has-draft", true);
    ui_1.default.fragmentSaveElt.hidden = false;
};
onEditCommands.saveFragmentShader = function () {
    ui_1.default.fragmentHeader.classList.toggle("has-draft", false);
    ui_1.default.fragmentHeader.classList.toggle("has-errors", false);
    ui_1.default.fragmentSaveElt.hidden = true;
};
function onAssetTrashed() {
    SupClient.onAssetTrashed();
}
