var network_1 = require("./network");
var engine_1 = require("./engine");
var Uniforms_1 = require("../../data/Uniforms");
var Attributes_1 = require("../../data/Attributes");
/* tslint:disable */
var PerfectResize = require("perfect-resize");
/* tslint:enable */
var ui = {};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ui;
SupClient.setupHotkeys();
ui.uniformsList = document.querySelector(".uniforms tbody");
function setupUniform(uniform) {
    var rowElt = document.createElement("tr");
    rowElt.dataset["id"] = uniform.id;
    ui.uniformsList.insertBefore(rowElt, ui.uniformsList.lastChild);
    var nameElt = document.createElement("td");
    var nameInputElt = document.createElement("input");
    nameInputElt.classList.add("name");
    nameInputElt.addEventListener("change", function (event) {
        if (event.target.value === "")
            network_1.editAsset("deleteUniform", rowElt.dataset["id"]);
        else
            network_1.editAsset("setUniformProperty", rowElt.dataset["id"], "name", event.target.value);
    });
    nameInputElt.value = uniform.name;
    nameElt.appendChild(nameInputElt);
    rowElt.appendChild(nameElt);
    var typeElt = document.createElement("td");
    var selectTypeElt = document.createElement("select");
    for (var _i = 0, _a = Uniforms_1.default.schema.type.items; _i < _a.length; _i++) {
        var type = _a[_i];
        var optionElt = document.createElement("option");
        optionElt.textContent = type;
        selectTypeElt.appendChild(optionElt);
    }
    selectTypeElt.classList.add("type");
    selectTypeElt.addEventListener("change", function (event) {
        network_1.editAsset("setUniformProperty", rowElt.dataset["id"], "type", event.target.value);
    });
    selectTypeElt.value = uniform.type;
    typeElt.appendChild(selectTypeElt);
    rowElt.appendChild(typeElt);
    var valueElt = document.createElement("td");
    rowElt.appendChild(valueElt);
    var valueDivElt = document.createElement("div");
    valueDivElt.classList.add("value");
    valueElt.appendChild(valueDivElt);
    setUniformValueInputs(uniform.id);
}
exports.setupUniform = setupUniform;
function setUniformValueInputs(id) {
    var uniform = network_1.data.shaderAsset.uniforms.byId[id];
    var valueRowElt = ui.uniformsList.querySelector("[data-id='" + id + "'] .value");
    while (valueRowElt.children.length > 0)
        valueRowElt.removeChild(valueRowElt.children[0]);
    switch (uniform.type) {
        case "f":
            var floatInputElt = document.createElement("input");
            floatInputElt.type = "number";
            floatInputElt.classList.add("float");
            floatInputElt.addEventListener("change", function (event) { network_1.editAsset("setUniformProperty", id, "value", parseFloat(event.target.value)); });
            floatInputElt.value = uniform.value;
            valueRowElt.appendChild(floatInputElt);
            break;
        case "c":
        case "v2":
        case "v3":
        case "v4":
            setArrayUniformInputs(id, valueRowElt, uniform.type);
            break;
        case "t":
            var textInputElt = document.createElement("input");
            textInputElt.classList.add("text");
            textInputElt.addEventListener("change", function (event) { network_1.editAsset("setUniformProperty", id, "value", event.target.value); });
            textInputElt.value = uniform.value;
            valueRowElt.appendChild(textInputElt);
            break;
    }
}
exports.setUniformValueInputs = setUniformValueInputs;
function setArrayUniformInputs(id, parentElt, name) {
    var uniform = network_1.data.shaderAsset.uniforms.byId[id];
    for (var i = 0; i < uniform.value.length; i++) {
        var inputElt = document.createElement("input");
        inputElt.type = "number";
        inputElt.classList.add(name + "_" + i);
        inputElt.addEventListener("change", function (event) {
            var values = [];
            for (var j = 0; j < uniform.value.length; j++) {
                var elt = parentElt.querySelector("." + name + "_" + j);
                values.push(parseFloat(elt.value));
            }
            network_1.editAsset("setUniformProperty", id, "value", values);
        });
        inputElt.value = uniform.value[i];
        parentElt.appendChild(inputElt);
    }
}
var newUniformInput = document.querySelector(".uniforms .new input");
newUniformInput.addEventListener("keyup", function (event) {
    if (event.keyCode === 13) {
        network_1.editAsset("newUniform", event.target.value);
        event.target.value = "";
    }
});
ui.useLightUniformsCheckbox = document.getElementById("use-light-uniforms");
ui.useLightUniformsCheckbox.addEventListener("change", function (event) {
    network_1.editAsset("setProperty", "useLightUniforms", event.target.checked);
});
ui.attributesList = document.querySelector(".attributes tbody");
function setupAttribute(attribute) {
    var rowElt = document.createElement("tr");
    rowElt.dataset["id"] = attribute.id;
    ui.attributesList.insertBefore(rowElt, ui.attributesList.lastChild);
    var nameElt = document.createElement("td");
    var nameInputElt = document.createElement("input");
    nameInputElt.classList.add("name");
    nameInputElt.addEventListener("change", function (event) {
        if (event.target.value === "")
            network_1.editAsset("deleteAttribute", rowElt.dataset["id"]);
        else
            network_1.editAsset("setAttributeProperty", rowElt.dataset["id"], "name", event.target.value);
    });
    nameInputElt.value = attribute.name;
    nameElt.appendChild(nameInputElt);
    rowElt.appendChild(nameElt);
    var typeElt = document.createElement("td");
    var selectTypeElt = document.createElement("select");
    for (var _i = 0, _a = Attributes_1.default.schema.type.items; _i < _a.length; _i++) {
        var type = _a[_i];
        var optionElt = document.createElement("option");
        optionElt.textContent = type;
        selectTypeElt.appendChild(optionElt);
    }
    selectTypeElt.classList.add("type");
    selectTypeElt.addEventListener("change", function (event) { network_1.editAsset("setAttributeProperty", rowElt.dataset["id"], "type", event.target.value); });
    selectTypeElt.value = attribute.type;
    typeElt.appendChild(selectTypeElt);
    rowElt.appendChild(typeElt);
    var valueElt = document.createElement("td");
    valueElt.textContent = "Random";
    rowElt.appendChild(valueElt);
}
exports.setupAttribute = setupAttribute;
var newAttributeInput = document.querySelector(".attributes .new input");
newAttributeInput.addEventListener("keyup", function (event) {
    if (event.keyCode === 13) {
        network_1.editAsset("newAttribute", event.target.value);
        event.target.value = "";
    }
});
var shadersPane = document.querySelector(".shaders");
var shaderPaneResizeHandle = new PerfectResize(shadersPane, "bottom");
shaderPaneResizeHandle.on("drag", function () {
    ui.vertexEditor.codeMirrorInstance.refresh();
    ui.fragmentEditor.codeMirrorInstance.refresh();
});
function onSaveVertex() {
    try {
        engine_1.setupPreview({ useDraft: true });
    }
    catch (e) {
        ui.vertexHeader.classList.toggle("has-errors", true);
        engine_1.setupPreview();
        return;
    }
    network_1.editAsset("saveVertexShader");
}
function onSaveFragment() {
    try {
        engine_1.setupPreview({ useDraft: true });
    }
    catch (e) {
        ui.fragmentHeader.classList.toggle("has-errors", true);
        engine_1.setupPreview();
        return;
    }
    network_1.editAsset("saveFragmentShader");
}
var fragmentShadersPane = shadersPane.querySelector(".fragment");
var fragmentShaderPaneResizeHandle = new PerfectResize(fragmentShadersPane, "right");
fragmentShaderPaneResizeHandle.on("drag", function () {
    ui.vertexEditor.codeMirrorInstance.refresh();
    ui.fragmentEditor.codeMirrorInstance.refresh();
});
ui.vertexSaveElt = document.querySelector(".vertex button");
ui.vertexHeader = document.querySelector(".vertex .header");
ui.vertexSaveElt.addEventListener("click", onSaveVertex);
ui.fragmentSaveElt = document.querySelector(".fragment button");
ui.fragmentHeader = document.querySelector(".fragment .header");
ui.fragmentSaveElt.addEventListener("click", onSaveFragment);
function setupEditors(clientId) {
    var vertexTextArea = document.querySelector(".vertex textarea");
    ui.vertexEditor = new TextEditorWidget(network_1.data.projectClient, clientId, vertexTextArea, {
        mode: "x-shader/x-vertex",
        sendOperationCallback: function (operation) {
            network_1.editAsset("editVertexShader", operation, network_1.data.shaderAsset.vertexDocument.getRevisionId());
        },
        saveCallback: onSaveVertex
    });
    var fragmentTextArea = document.querySelector(".fragment textarea");
    ui.fragmentEditor = new TextEditorWidget(network_1.data.projectClient, clientId, fragmentTextArea, {
        mode: "x-shader/x-fragment",
        sendOperationCallback: function (operation) {
            network_1.editAsset("editFragmentShader", operation, network_1.data.shaderAsset.fragmentDocument.getRevisionId());
        },
        saveCallback: onSaveFragment
    });
}
exports.setupEditors = setupEditors;
var previewPane = document.querySelector(".preview");
/* tslint:disable:no-unused-expression */
new PerfectResize(previewPane, "right");
/* tslint:enable:no-unused-expression */
ui.previewTypeSelect = previewPane.querySelector("select");
ui.previewTypeSelect.addEventListener("change", function () {
    ui.previewAssetInput.hidden = ui.previewTypeSelect.value !== "Asset";
    engine_1.setupPreview();
});
ui.previewAssetInput = previewPane.querySelector("input");
ui.previewAssetInput.addEventListener("input", function (event) {
    if (event.target.value === "") {
        ui.previewEntry = null;
        engine_1.setupPreview();
        return;
    }
    var entry = SupClient.findEntryByPath(network_1.data.projectClient.entries.pub, event.target.value);
    if (entry == null || (entry.type !== "sprite" && entry.type !== "model"))
        return;
    ui.previewEntry = entry;
    engine_1.setupPreview();
});
