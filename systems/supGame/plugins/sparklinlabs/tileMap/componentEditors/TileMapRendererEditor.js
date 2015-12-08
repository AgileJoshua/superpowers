var TileMapRendererEditor = (function () {
    function TileMapRendererEditor(tbody, config, projectClient, editConfig) {
        var _this = this;
        this._onChangeTileMapAsset = function (event) {
            if (event.target.value === "")
                _this.editConfig("setProperty", "tileMapAssetId", null);
            else {
                var entry = SupClient.findEntryByPath(_this.projectClient.entries.pub, event.target.value);
                if (entry != null && entry.type == "tileMap")
                    _this.editConfig("setProperty", "tileMapAssetId", entry.id);
            }
        };
        this._onChangeTileSetAsset = function (event) {
            if (event.target.value === "")
                _this.editConfig("setProperty", "tileSetAssetId", null);
            else {
                var entry = SupClient.findEntryByPath(_this.projectClient.entries.pub, event.target.value);
                if (entry != null && entry.type == "tileSet")
                    _this.editConfig("setProperty", "tileSetAssetId", entry.id);
            }
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
        this.projectClient = projectClient;
        this.editConfig = editConfig;
        this.tbody = tbody;
        this.tileMapAssetId = config.tileMapAssetId;
        this.tileSetAssetId = config.tileSetAssetId;
        this.shaderAssetId = config.shaderAssetId;
        var tileMapRow = SupClient.table.appendRow(tbody, "Map");
        var tileMapFields = SupClient.table.appendAssetField(tileMapRow.valueCell, "");
        this.tileMapTextField = tileMapFields.textField;
        this.tileMapTextField.disabled = true;
        this.tileMapButtonElt = tileMapFields.buttonElt;
        this.tileMapButtonElt.addEventListener("click", function (event) {
            window.parent.postMessage({ type: "openEntry", id: _this.tileMapAssetId }, window.location.origin);
        });
        this.tileMapButtonElt.disabled = this.tileMapAssetId == null;
        var tileSetRow = SupClient.table.appendRow(tbody, "Tile Set");
        this.tileSetTextField = SupClient.table.appendTextField(tileSetRow.valueCell, "");
        this.tileSetTextField.disabled = true;
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
        this.tileMapTextField.addEventListener("input", this._onChangeTileMapAsset);
        this.tileSetTextField.addEventListener("input", this._onChangeTileSetAsset);
        this.projectClient.subEntries(this);
    }
    TileMapRendererEditor.prototype.destroy = function () {
        this.projectClient.unsubEntries(this);
    };
    TileMapRendererEditor.prototype.config_setProperty = function (path, value) {
        if (this.projectClient.entries == null)
            return;
        switch (path) {
            case "tileMapAssetId":
                this.tileMapAssetId = value;
                this.tileMapButtonElt.disabled = this.tileMapAssetId == null;
                this.tileMapTextField.value = this.projectClient.entries.getPathFromId(this.tileMapAssetId);
                break;
            case "tileSetAssetId":
                this.tileSetAssetId = value;
                this.tileSetTextField.value = this.projectClient.entries.getPathFromId(this.tileSetAssetId);
                break;
            case "castShadow":
                this.castShadowField.checked = value;
                break;
            case "receiveShadow":
                this.receiveShadowField.checked = value;
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
    TileMapRendererEditor.prototype.onEntriesReceived = function (entries) {
        this.tileMapTextField.disabled = false;
        this.materialSelectBox.disabled = false;
        this.castShadowField.disabled = false;
        this.receiveShadowField.disabled = false;
        this.shaderTextField.disabled = false;
        if (entries.byId[this.tileMapAssetId] != null)
            this.tileMapTextField.value = entries.getPathFromId(this.tileMapAssetId);
        if (entries.byId[this.shaderAssetId] != null) {
            this.shaderTextField.value = entries.getPathFromId(this.shaderAssetId);
        }
    };
    TileMapRendererEditor.prototype.onEntryAdded = function (entry, parentId, index) { };
    TileMapRendererEditor.prototype.onEntryMoved = function (id, parentId, index) {
        if (id === this.tileMapAssetId)
            this.tileMapTextField.value = this.projectClient.entries.getPathFromId(this.tileMapAssetId);
        if (id === this.tileSetAssetId)
            this.tileSetTextField.value = this.projectClient.entries.getPathFromId(this.tileSetAssetId);
    };
    TileMapRendererEditor.prototype.onSetEntryProperty = function (id, key, value) {
        if (id === this.tileMapAssetId)
            this.tileMapTextField.value = this.projectClient.entries.getPathFromId(this.tileMapAssetId);
        if (id === this.tileSetAssetId)
            this.tileSetTextField.value = this.projectClient.entries.getPathFromId(this.tileSetAssetId);
    };
    TileMapRendererEditor.prototype.onEntryTrashed = function (id) { };
    TileMapRendererEditor.prototype._updateShaderField = function (materialType) {
        var shaderRow = this.shaderTextField.parentElement.parentElement.parentElement;
        if (materialType === "shader") {
            if (shaderRow.parentElement == null)
                this.tbody.appendChild(shaderRow);
        }
        else if (shaderRow.parentElement != null)
            shaderRow.parentElement.removeChild(shaderRow);
    };
    return TileMapRendererEditor;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TileMapRendererEditor;
