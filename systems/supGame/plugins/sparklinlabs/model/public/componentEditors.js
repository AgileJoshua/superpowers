(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var ModelRendererEditor_1 = require("./ModelRendererEditor");
SupClient.registerPlugin("componentEditors", "ModelRenderer", ModelRendererEditor_1.default);

},{"./ModelRendererEditor":2}],2:[function(require,module,exports){
var ModelRendererEditor = (function () {
    function ModelRendererEditor(tbody, config, projectClient, editConfig) {
        var _this = this;
        this._onChangeModelAsset = function (event) {
            if (event.target.value === "") {
                _this.editConfig("setProperty", "modelAssetId", null);
                _this.editConfig("setProperty", "animationId", null);
            }
            else {
                var entry = SupClient.findEntryByPath(_this.projectClient.entries.pub, event.target.value);
                if (entry != null && entry.type === "model") {
                    _this.editConfig("setProperty", "modelAssetId", entry.id);
                    _this.editConfig("setProperty", "animationId", null);
                }
            }
        };
        this._onChangeModelAnimation = function (event) {
            var animationId = (event.target.value === "") ? null : event.target.value;
            _this.editConfig("setProperty", "animationId", animationId);
        };
        this._onChangeShaderAsset = function (event) {
            if (event.target.value === "")
                _this.editConfig("setProperty", "shaderAssetId", null);
            else {
                var entry = SupClient.findEntryByPath(_this.projectClient.entries.pub, event.target.value);
                if (entry != null && entry.type === "shader")
                    _this.editConfig("setProperty", "shaderAssetId", entry.id);
            }
        };
        this.tbody = tbody;
        this.projectClient = projectClient;
        this.editConfig = editConfig;
        this.modelAssetId = config.modelAssetId;
        this.animationId = config.animationId;
        this.shaderAssetId = config.shaderAssetId;
        var modelRow = SupClient.table.appendRow(tbody, "Model");
        var modelFields = SupClient.table.appendAssetField(modelRow.valueCell, "");
        this.modelTextField = modelFields.textField;
        this.modelTextField.addEventListener("input", this._onChangeModelAsset);
        this.modelTextField.disabled = true;
        this.modelButtonElt = modelFields.buttonElt;
        this.modelButtonElt.addEventListener("click", function (event) {
            window.parent.postMessage({ type: "openEntry", id: _this.modelAssetId }, window.location.origin);
        });
        this.modelButtonElt.disabled = this.modelAssetId == null;
        var animationRow = SupClient.table.appendRow(tbody, "Animation");
        this.animationSelectBox = SupClient.table.appendSelectBox(animationRow.valueCell, { "": "(None)" });
        this.animationSelectBox.addEventListener("change", this._onChangeModelAnimation);
        this.animationSelectBox.disabled = true;
        var shadowRow = SupClient.table.appendRow(tbody, "Shadow");
        var shadowDiv = document.createElement("div");
        shadowDiv.classList.add("inputs");
        shadowRow.valueCell.appendChild(shadowDiv);
        var castSpan = document.createElement("span");
        castSpan.style.marginLeft = "5px";
        castSpan.textContent = "Cast";
        shadowDiv.appendChild(castSpan);
        this.castShadowField = SupClient.table.appendBooleanField(shadowDiv, config.castShadow);
        this.castShadowField.addEventListener("change", function (event) {
            _this.editConfig("setProperty", "castShadow", event.target.checked);
        });
        this.castShadowField.disabled = true;
        var receiveSpan = document.createElement("span");
        receiveSpan.style.marginLeft = "5px";
        receiveSpan.textContent = "Receive";
        shadowDiv.appendChild(receiveSpan);
        this.receiveShadowField = SupClient.table.appendBooleanField(shadowDiv, config.receiveShadow);
        this.receiveShadowField.addEventListener("change", function (event) {
            _this.editConfig("setProperty", "receiveShadow", event.target.checked);
        });
        this.receiveShadowField.disabled = true;
        var colorRow = SupClient.table.appendRow(tbody, "Color");
        var colorInputs = SupClient.table.appendColorField(colorRow.valueCell, config.color);
        this.colorField = colorInputs.textField;
        this.colorField.addEventListener("change", function (event) {
            _this.editConfig("setProperty", "color", event.target.value);
        });
        this.colorField.disabled = true;
        this.colorPicker = colorInputs.pickerField;
        this.colorPicker.addEventListener("change", function (event) {
            _this.editConfig("setProperty", "color", event.target.value.slice(1));
        });
        this.colorPicker.disabled = true;
        var opacityRow = SupClient.table.appendRow(tbody, "Opacity", { checkbox: true });
        this.overrideOpacityField = opacityRow.checkbox;
        this.overrideOpacityField.checked = config.overrideOpacity;
        this.overrideOpacityField.addEventListener("change", function (event) {
            _this.editConfig("setProperty", "overrideOpacity", event.target.checked);
        });
        var opacityParent = document.createElement("div");
        opacityParent.style.display = "flex";
        opacityParent.style.alignItems = "center";
        opacityRow.valueCell.appendChild(opacityParent);
        this.transparentField = SupClient.table.appendBooleanField(opacityParent, config.opacity != null);
        this.transparentField.style.width = "50%";
        this.transparentField.style.borderRight = "1px solid #ccc";
        this.transparentField.addEventListener("change", function (event) {
            var opacity = (event.target.checked) ? 1 : null;
            _this.editConfig("setProperty", "opacity", opacity);
        });
        this.transparentField.disabled = !config.overrideOpacity;
        this.opacityField = SupClient.table.appendNumberField(opacityParent, config.opacity, 0, 1);
        this.opacityField.addEventListener("input", function (event) {
            _this.editConfig("setProperty", "opacity", parseFloat(event.target.value));
        });
        this.opacityField.step = "0.1";
        this.opacityField.disabled = !config.overrideOpacity;
        var materialRow = SupClient.table.appendRow(tbody, "Material");
        this.materialSelectBox = SupClient.table.appendSelectBox(materialRow.valueCell, { "basic": "Basic", "phong": "Phong", "shader": "Shader" }, config.materialType);
        this.materialSelectBox.addEventListener("change", function (event) {
            _this.editConfig("setProperty", "materialType", event.target.value);
        });
        this.materialSelectBox.disabled = true;
        var shaderRow = SupClient.table.appendRow(tbody, "Shader");
        var shaderFields = SupClient.table.appendAssetField(shaderRow.valueCell, "");
        this.shaderTextField = shaderFields.textField;
        this.shaderTextField.addEventListener("input", this._onChangeShaderAsset);
        this.shaderTextField.disabled = true;
        this.shaderButtonElt = shaderFields.buttonElt;
        this.shaderButtonElt.addEventListener("click", function (event) {
            window.parent.postMessage({ type: "openEntry", id: _this.shaderAssetId }, window.location.origin);
        });
        this.shaderButtonElt.disabled = this.shaderAssetId == null;
        this._updateShaderField(config.materialType);
        this.projectClient.subEntries(this);
    }
    ModelRendererEditor.prototype.destroy = function () {
        this.projectClient.unsubEntries(this);
        if (this.modelAssetId != null) {
            this.projectClient.unsubAsset(this.modelAssetId, this);
        }
    };
    ModelRendererEditor.prototype.config_setProperty = function (path, value) {
        if (this.projectClient.entries == null)
            return;
        switch (path) {
            case "modelAssetId":
                if (this.modelAssetId != null)
                    this.projectClient.unsubAsset(this.modelAssetId, this);
                this.modelAssetId = value;
                this.modelButtonElt.disabled = this.modelAssetId == null;
                this.animationSelectBox.disabled = true;
                if (this.modelAssetId != null) {
                    this.projectClient.subAsset(this.modelAssetId, "model", this);
                    this.modelTextField.value = this.projectClient.entries.getPathFromId(this.modelAssetId);
                }
                else
                    this.modelTextField.value = "";
                break;
            case "animationId":
                if (!this.animationSelectBox.disabled) {
                    this.animationSelectBox.value = (value != null) ? value : "";
                }
                this.animationId = value;
                break;
            case "castShadow":
                this.castShadowField.value = value;
                break;
            case "receiveShadow":
                this.receiveShadowField.value = value;
                break;
            case "color":
                this.colorField.value = value;
                this.colorPicker.value = "#" + value;
                break;
            case "overrideOpacity":
                this.overrideOpacityField.checked = value;
                this.transparentField.disabled = !value;
                this.transparentField.checked = false;
                this.opacityField.value = null;
                this.opacityField.disabled = true;
                break;
            case "opacity":
                this.transparentField.checked = value != null;
                this.opacityField.disabled = value == null;
                this.opacityField.value = value;
                break;
            case "materialType":
                this.materialSelectBox.value = value;
                this._updateShaderField(value);
                break;
            case "shaderAssetId":
                this.shaderAssetId = value;
                this.shaderButtonElt.disabled = this.shaderAssetId == null;
                if (value != null)
                    this.shaderTextField.value = this.projectClient.entries.getPathFromId(value);
                else
                    this.shaderTextField.value = "";
                break;
        }
    };
    // Network callbacks
    ModelRendererEditor.prototype.onEntriesReceived = function (entries) {
        this.modelTextField.disabled = false;
        this.materialSelectBox.disabled = false;
        this.castShadowField.disabled = false;
        this.receiveShadowField.disabled = false;
        this.colorField.disabled = false;
        this.colorPicker.disabled = false;
        this.shaderTextField.disabled = false;
        if (entries.byId[this.modelAssetId] != null) {
            this.modelTextField.value = entries.getPathFromId(this.modelAssetId);
            this.projectClient.subAsset(this.modelAssetId, "model", this);
        }
        if (entries.byId[this.shaderAssetId] != null) {
            this.shaderTextField.value = entries.getPathFromId(this.shaderAssetId);
        }
    };
    ModelRendererEditor.prototype.onEntryAdded = function (entry, parentId, index) { };
    ModelRendererEditor.prototype.onEntryMoved = function (id, parentId, index) {
        if (id === this.modelAssetId) {
            this.modelTextField.value = this.projectClient.entries.getPathFromId(this.modelAssetId);
        }
        else if (id === this.shaderAssetId) {
            this.shaderTextField.value = this.projectClient.entries.getPathFromId(this.shaderAssetId);
        }
    };
    ModelRendererEditor.prototype.onSetEntryProperty = function (id, key, value) {
        if (key !== "name")
            return;
        if (id === this.modelAssetId) {
            this.modelTextField.value = this.projectClient.entries.getPathFromId(this.modelAssetId);
        }
        else if (id === this.shaderAssetId) {
            this.shaderTextField.value = this.projectClient.entries.getPathFromId(this.shaderAssetId);
        }
    };
    ModelRendererEditor.prototype.onEntryTrashed = function (id) { };
    ModelRendererEditor.prototype.onAssetReceived = function (assetId, asset) {
        if (assetId !== this.modelAssetId)
            return;
        this.asset = asset;
        this._clearAnimations();
        for (var _i = 0, _a = this.asset.pub.animations; _i < _a.length; _i++) {
            var animation = _a[_i];
            SupClient.table.appendSelectOption(this.animationSelectBox, animation.id, animation.name);
        }
        this.animationSelectBox.value = (this.animationId != null) ? this.animationId : "";
        this.animationSelectBox.disabled = false;
    };
    ModelRendererEditor.prototype.onAssetEdited = function (assetId, command) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        if (assetId !== this.modelAssetId)
            return;
        if (command.indexOf("Animation") === -1)
            return;
        var animationId = this.animationSelectBox.value;
        this._clearAnimations();
        for (var _a = 0, _b = this.asset.pub.animations; _a < _b.length; _a++) {
            var animation = _b[_a];
            SupClient.table.appendSelectOption(this.animationSelectBox, animation.id, animation.name);
        }
        if (animationId != null && this.asset.animations.byId[animationId] != null)
            this.animationSelectBox.value = animationId;
        else
            this.editConfig("setProperty", "animationId", "");
    };
    ModelRendererEditor.prototype.onAssetTrashed = function () {
        this._clearAnimations();
        this.modelTextField.value = "";
        this.animationSelectBox.value = "";
        this.animationSelectBox.disabled = true;
    };
    // User interface
    ModelRendererEditor.prototype._clearAnimations = function () {
        while (true) {
            var child = this.animationSelectBox.children[1];
            if (child == null)
                break;
            this.animationSelectBox.removeChild(child);
        }
    };
    ModelRendererEditor.prototype._updateShaderField = function (materialType) {
        var shaderRow = this.shaderTextField.parentElement.parentElement.parentElement;
        if (materialType === "shader") {
            if (shaderRow.parentElement == null)
                this.tbody.appendChild(shaderRow);
        }
        else if (shaderRow.parentElement != null)
            shaderRow.parentElement.removeChild(shaderRow);
    };
    return ModelRendererEditor;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ModelRendererEditor;

},{}]},{},[1]);
