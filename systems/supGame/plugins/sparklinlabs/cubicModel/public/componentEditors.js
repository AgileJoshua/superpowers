(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var CubicModelRendererEditor_1 = require("./CubicModelRendererEditor");
SupClient.registerPlugin("componentEditors", "CubicModelRenderer", CubicModelRendererEditor_1.default);

},{"./CubicModelRendererEditor":2}],2:[function(require,module,exports){
var CubicModelRendererEditor = (function () {
    function CubicModelRendererEditor(tbody, config, projectClient, editConfig) {
        var _this = this;
        this._onChangeCubicModelAsset = function (event) {
            if (event.target.value === "") {
                _this.editConfig("setProperty", "cubicModelAssetId", null);
            }
            else {
                var entry = SupClient.findEntryByPath(_this.projectClient.entries.pub, event.target.value);
                if (entry != null && entry.type === "cubicModel") {
                    _this.editConfig("setProperty", "cubicModelAssetId", entry.id);
                }
            }
        };
        this._onChangeCubicModelAnimation = function (event) {
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
        this.cubicModelAssetId = config.cubicModelAssetId;
        // this.animationId = config.animationId;
        // this.shaderAssetId = config.shaderAssetId;
        var cubicModelRow = SupClient.table.appendRow(tbody, "Cubic Model");
        var cubicModelFields = SupClient.table.appendAssetField(cubicModelRow.valueCell, "");
        this.cubicModelTextField = cubicModelFields.textField;
        this.cubicModelTextField.addEventListener("input", this._onChangeCubicModelAsset);
        this.cubicModelTextField.disabled = true;
        this.cubicModelButtonElt = cubicModelFields.buttonElt;
        this.cubicModelButtonElt.addEventListener("click", function (event) {
            window.parent.postMessage({ type: "openEntry", id: _this.cubicModelAssetId }, window.location.origin);
        });
        this.cubicModelButtonElt.disabled = this.cubicModelAssetId == null;
        /*
        let animationRow = SupClient.table.appendRow(tbody, "Animation");
        this.animationSelectBox = SupClient.table.appendSelectBox(animationRow.valueCell, { "": "(None)" });
        this.animationSelectBox.addEventListener("change", this._onChangeCubicModelAnimation);
        this.animationSelectBox.disabled = true;
    
        let flipRow = SupClient.table.appendRow(tbody, "Flip");
        let flipDiv = <any>document.createElement("div");
        flipDiv.classList.add("inputs");
        flipRow.valueCell.appendChild(flipDiv);
    
        let horizontalSpan = document.createElement("span");
        horizontalSpan.style.marginLeft = "5px";
        horizontalSpan.textContent = "H";
        flipDiv.appendChild(horizontalSpan);
        this.horizontalFlipField = SupClient.table.appendBooleanField(flipDiv, config.horizontalFlip);
        this.horizontalFlipField.addEventListener("change", (event: any) => {
          this.editConfig("setProperty", "horizontalFlip", event.target.checked);
        });
    
        let verticalSpan = document.createElement("span");
        verticalSpan.style.marginLeft = "5px";
        verticalSpan.textContent = "V";
        flipDiv.appendChild(verticalSpan);
        this.verticalFlipField = SupClient.table.appendBooleanField(flipDiv, config.verticalFlip);
        this.verticalFlipField.addEventListener("change", (event: any) => {
          this.editConfig("setProperty", "verticalFlip", event.target.checked);
        });
    
        let shadowRow = SupClient.table.appendRow(tbody, "Shadow");
        let shadowDiv = <any>document.createElement("div");
        shadowDiv.classList.add("inputs");
        shadowRow.valueCell.appendChild(shadowDiv);
    
        let castSpan = document.createElement("span");
        castSpan.style.marginLeft = "5px";
        castSpan.textContent = "Cast";
        shadowDiv.appendChild(castSpan);
        this.castShadowField = SupClient.table.appendBooleanField(shadowDiv, config.castShadow);
        this.castShadowField.addEventListener("change", (event: any) => {
          this.editConfig("setProperty", "castShadow", event.target.checked);
        });
        this.castShadowField.disabled = true;
    
        let receiveSpan = document.createElement("span");
        receiveSpan.style.marginLeft = "5px";
        receiveSpan.textContent = "Receive";
        shadowDiv.appendChild(receiveSpan);
        this.receiveShadowField = SupClient.table.appendBooleanField(shadowDiv, config.receiveShadow);
        this.receiveShadowField.addEventListener("change", (event: any) => {
          this.editConfig("setProperty", "receiveShadow", event.target.checked);
        });
        this.receiveShadowField.disabled = true;
    
        let colorRow = SupClient.table.appendRow(tbody, "Color");
        let colorInputs = SupClient.table.appendColorField(colorRow.valueCell, config.color);
    
        this.colorField = colorInputs.textField;
        this.colorField.addEventListener("change", (event: any) => {
          this.editConfig("setProperty", "color", event.target.value);
        });
        this.colorField.disabled = true;
    
        this.colorPicker = colorInputs.pickerField;
        this.colorPicker.addEventListener("change", (event: any) => {
          this.editConfig("setProperty", "color", event.target.value.slice(1));
        });
        this.colorPicker.disabled = true;
    
        let opacityRow = SupClient.table.appendRow(tbody, "Opacity", { checkbox: true } );
        this.overrideOpacityField = opacityRow.checkbox;
        this.overrideOpacityField.checked = config.overrideOpacity;
        this.overrideOpacityField.addEventListener("change", (event: any) => {
          this.editConfig("setProperty", "overrideOpacity", event.target.checked);
        });
    
        let opacityParent = document.createElement("div");
        opacityParent.style.display = "flex";
        opacityParent.style.alignItems = "center";
        opacityRow.valueCell.appendChild(opacityParent);
    
        this.transparentField = SupClient.table.appendBooleanField(<any>opacityParent, config.opacity != null);
        this.transparentField.style.width = "50%";
        this.transparentField.style.borderRight = "1px solid #ccc";
        this.transparentField.addEventListener("change", (event: any) => {
          let opacity = (event.target.checked) ? 1 : null;
          this.editConfig("setProperty", "opacity", opacity);
        });
        this.transparentField.disabled = !config.overrideOpacity;
    
        this.opacityField = SupClient.table.appendNumberField(<any>opacityParent, config.opacity, 0, 1);
        this.opacityField.addEventListener("input", (event: any) => {
          this.editConfig("setProperty", "opacity", parseFloat(event.target.value));
        });
        this.opacityField.step = "0.1";
        this.opacityField.disabled = !config.overrideOpacity;
    
        let materialRow = SupClient.table.appendRow(tbody, "Material");
        this.materialSelectBox = SupClient.table.appendSelectBox(materialRow.valueCell, { "basic": "Basic", "phong": "Phong", "shader": "Shader" }, config.materialType);
        this.materialSelectBox.addEventListener("change", (event: any) => {
          this.editConfig("setProperty", "materialType", event.target.value);
        })
        this.materialSelectBox.disabled = true;
    
        let shaderRow = SupClient.table.appendRow(tbody, "Shader");
        let shaderFields = SupClient.table.appendAssetField(shaderRow.valueCell, "");
        this.shaderTextField = shaderFields.textField;
        this.shaderTextField.addEventListener("input", this._onChangeShaderAsset);
        this.shaderTextField.disabled = true;
        this.shaderButtonElt = shaderFields.buttonElt;
        this.shaderButtonElt.addEventListener("click", (event) => {
          window.parent.postMessage({ type: "openEntry", id: this.shaderAssetId }, (<any>window.location).origin);
        });
        this.shaderButtonElt.disabled = this.shaderAssetId == null;
        this._updateShaderField(config.materialType);*/
        this.projectClient.subEntries(this);
    }
    CubicModelRendererEditor.prototype.destroy = function () {
        this.projectClient.unsubEntries(this);
        if (this.cubicModelAssetId != null)
            this.projectClient.unsubAsset(this.cubicModelAssetId, this);
    };
    CubicModelRendererEditor.prototype.config_setProperty = function (path, value) {
        if (this.projectClient.entries == null)
            return;
        switch (path) {
            case "cubicModelAssetId":
                if (this.cubicModelAssetId != null)
                    this.projectClient.unsubAsset(this.cubicModelAssetId, this);
                this.cubicModelAssetId = value;
                this.cubicModelButtonElt.disabled = this.cubicModelAssetId == null;
                // this.animationSelectBox.disabled = true;
                if (this.cubicModelAssetId != null) {
                    this.cubicModelTextField.value = this.projectClient.entries.getPathFromId(this.cubicModelAssetId);
                    this.projectClient.subAsset(this.cubicModelAssetId, "cubicModel", this);
                }
                else
                    this.cubicModelTextField.value = "";
                break;
        }
    };
    // Network callbacks
    CubicModelRendererEditor.prototype.onEntriesReceived = function (entries) {
        this.cubicModelTextField.disabled = false;
        // this.castShadowField.disabled = false;
        // this.receiveShadowField.disabled = false;
        // this.colorField.disabled = false;
        // this.colorPicker.disabled = false;
        // this.materialSelectBox.disabled = false;
        // this.shaderTextField.disabled = false;
        if (entries.byId[this.cubicModelAssetId] != null) {
            this.cubicModelTextField.value = entries.getPathFromId(this.cubicModelAssetId);
            this.projectClient.subAsset(this.cubicModelAssetId, "cubicModel", this);
        }
        /*if (entries.byId[this.shaderAssetId] != null) {
          this.shaderTextField.value = entries.getPathFromId(this.shaderAssetId);
        }*/
    };
    CubicModelRendererEditor.prototype.onEntryAdded = function (entry, parentId, index) { };
    CubicModelRendererEditor.prototype.onEntryMoved = function (id, parentId, index) {
        if (id === this.cubicModelAssetId) {
            this.cubicModelTextField.value = this.projectClient.entries.getPathFromId(this.cubicModelAssetId);
        }
        else if (id === this.shaderAssetId) {
        }
    };
    CubicModelRendererEditor.prototype.onSetEntryProperty = function (id, key, value) {
        if (key !== "name")
            return;
        if (id === this.cubicModelAssetId) {
            this.cubicModelTextField.value = this.projectClient.entries.getPathFromId(this.cubicModelAssetId);
        }
        else if (id === this.shaderAssetId) {
        }
    };
    CubicModelRendererEditor.prototype.onEntryTrashed = function (id) { };
    CubicModelRendererEditor.prototype.onAssetReceived = function (assetId, asset) {
        if (assetId !== this.cubicModelAssetId)
            return;
        this.asset = asset;
        /*
        this._clearAnimations();
    
        for (let animation of this.asset.pub.animations) {
          SupClient.table.appendSelectOption(this.animationSelectBox, animation.id, animation.name);
        }
    
        this.animationSelectBox.value = (this.animationId != null) ? this.animationId : "";
        this.animationSelectBox.disabled = false;*/
    };
    CubicModelRendererEditor.prototype.onAssetEdited = function (assetId, command) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        if (assetId !== this.cubicModelAssetId)
            return;
        if (command.indexOf("Animation") === -1)
            return;
        /*let animationId = this.animationSelectBox.value;
    
        this._clearAnimations();
    
        for (let animation of this.asset.pub.animations) {
          SupClient.table.appendSelectOption(this.animationSelectBox, animation.id, animation.name);
        }
    
        if (animationId != null && this.asset.animations.byId[animationId] != null) this.animationSelectBox.value = animationId;
        else this.editConfig("setProperty", "animationId", "");*/
    };
    CubicModelRendererEditor.prototype.onAssetTrashed = function () {
        this._clearAnimations();
        this.cubicModelTextField.value = "";
        // this.animationSelectBox.value = "";
        // this.animationSelectBox.disabled = true;
    };
    // User interface
    CubicModelRendererEditor.prototype._clearAnimations = function () {
        /*while (true) {
          let child = this.animationSelectBox.children[1];
          if (child == null) break;
          this.animationSelectBox.removeChild(child);
        }*/
    };
    CubicModelRendererEditor.prototype._updateShaderField = function (materialType) {
        // let shaderRow = this.shaderTextField.parentElement.parentElement.parentElement;
        // if (materialType === "shader") {
        //   if (shaderRow.parentElement == null) this.tbody.appendChild(shaderRow);
        // } else if (shaderRow.parentElement != null) shaderRow.parentElement.removeChild(shaderRow);
    };
    return CubicModelRendererEditor;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CubicModelRendererEditor;

},{}]},{},[1]);
