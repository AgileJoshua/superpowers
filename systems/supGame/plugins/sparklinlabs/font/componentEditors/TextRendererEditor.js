var TextRendererEditor = (function () {
    function TextRendererEditor(tbody, config, projectClient, editConfig) {
        var _this = this;
        this.fields = {};
        this.pendingModification = 0;
        this._onChangeFontAsset = function (event) {
            if (event.target.value === "")
                _this.editConfig("setProperty", "fontAssetId", null);
            else {
                var entry = SupClient.findEntryByPath(_this.projectClient.entries.pub, event.target.value);
                if (entry != null && entry.type === "font")
                    _this.editConfig("setProperty", "fontAssetId", entry.id);
            }
        };
        this.editConfig = editConfig;
        this.projectClient = projectClient;
        this.fontAssetId = config.fontAssetId;
        var fontRow = SupClient.table.appendRow(tbody, "Font");
        var fontName = (config.fontAssetId != null) ? this.projectClient.entries.getPathFromId(this.fontAssetId) : "";
        var fontFields = SupClient.table.appendAssetField(fontRow.valueCell, fontName);
        this.fields["fontAssetId"] = fontFields.textField;
        this.fields["fontAssetId"].addEventListener("input", this._onChangeFontAsset);
        this.fontButtonElt = fontFields.buttonElt;
        this.fontButtonElt.addEventListener("click", function (event) {
            window.parent.postMessage({ type: "openEntry", id: _this.fontAssetId }, window.location.origin);
        });
        this.fontButtonElt.disabled = this.fontAssetId == null;
        var textRow = SupClient.table.appendRow(tbody, "Text");
        this.fields["text"] = SupClient.table.appendTextAreaField(textRow.valueCell, config.text);
        this.fields["text"].addEventListener("input", function (event) {
            _this.pendingModification += 1;
            _this.editConfig("setProperty", "text", event.target.value, function (err) {
                _this.pendingModification -= 1;
                if (err != null) {
                    alert(err);
                    return;
                }
            });
        });
        var alignmentRow = SupClient.table.appendRow(tbody, "Alignment");
        this.fields["alignment"] = SupClient.table.appendSelectBox(alignmentRow.valueCell, { "left": "Left", "center": "Center", "right": "Right" }, config.alignment);
        this.fields["alignment"].addEventListener("change", function (event) { _this.editConfig("setProperty", "alignment", event.target.value); });
        var verticalAlignmentRow = SupClient.table.appendRow(tbody, "Vertical Align");
        this.fields["verticalAlignment"] = SupClient.table.appendSelectBox(verticalAlignmentRow.valueCell, { "top": "Top", "center": "Center", "bottom": "Bottom" }, config.verticalAlignment);
        this.fields["verticalAlignment"].addEventListener("change", function (event) { _this.editConfig("setProperty", "verticalAlignment", event.target.value); });
        var sizeRow = SupClient.table.appendRow(tbody, "Size");
        this.fields["size"] = SupClient.table.appendNumberField(sizeRow.valueCell, config.size, 0);
        this.fields["size"].addEventListener("change", function (event) {
            var size = (event.target.value !== "") ? parseInt(event.target.value) : null;
            _this.editConfig("setProperty", "size", size);
        });
        var colorRow = SupClient.table.appendRow(tbody, "Color");
        var colorInputs = SupClient.table.appendColorField(colorRow.valueCell, config.color);
        this.fields["color"] = colorInputs.textField;
        this.fields["color"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "color", event.target.value);
        });
        this.colorPicker = colorInputs.pickerField;
        this.colorPicker.addEventListener("change", function (event) {
            _this.editConfig("setProperty", "color", event.target.value.slice(1));
        });
        this.projectClient.subEntries(this);
    }
    TextRendererEditor.prototype.destroy = function () { this.projectClient.unsubEntries(this); };
    TextRendererEditor.prototype.config_setProperty = function (path, value) {
        if (path === "fontAssetId") {
            this.fontAssetId = value;
            this.fontButtonElt.disabled = this.fontAssetId == null;
            if (value != null)
                this.fields["fontAssetId"].value = this.projectClient.entries.getPathFromId(value);
            else
                this.fields["fontAssetId"].value = "";
        }
        else if (path === "color") {
            this.fields["color"].value = value;
            this.colorPicker.value = (value != null) ? "#" + value : "#ffffff";
        }
        else if (path === "text") {
            if (this.pendingModification === 0)
                this.fields["text"].value = value;
        }
        else
            this.fields[path].value = value;
    };
    // Network callbacks
    TextRendererEditor.prototype.onEntriesReceived = function (entries) { };
    TextRendererEditor.prototype.onEntryAdded = function (entry, parentId, index) { };
    TextRendererEditor.prototype.onEntryMoved = function (id, parentId, index) {
        if (id === this.fontAssetId)
            this.fields["fontAssetId"].value = this.projectClient.entries.getPathFromId(this.fontAssetId);
    };
    TextRendererEditor.prototype.onSetEntryProperty = function (id, key, value) {
        if (id === this.fontAssetId)
            this.fields["fontAssetId"].value = this.projectClient.entries.getPathFromId(this.fontAssetId);
    };
    TextRendererEditor.prototype.onEntryTrashed = function (id) { };
    return TextRendererEditor;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TextRendererEditor;
