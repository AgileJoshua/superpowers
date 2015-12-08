var ArcadeBody2DEditor = (function () {
    function ArcadeBody2DEditor(tbody, config, projectClient, editConfig) {
        var _this = this;
        this.tbody = tbody;
        this.projectClient = projectClient;
        this.editConfig = editConfig;
        // Type
        var typeRow = SupClient.table.appendRow(this.tbody, "Type");
        this.typeField = SupClient.table.appendSelectBox(typeRow.valueCell, {
            "box": "Box",
            "tileMap": "Tile Map"
        });
        this.typeField.value = config.type.toString();
        this.typeField.addEventListener("change", function (event) {
            _this.editConfig("setProperty", "type", event.target.value);
        });
        // Box boxFields
        this.boxFields = {};
        var movableRow = SupClient.table.appendRow(this.tbody, "Movable");
        this.boxFields["movable"] = SupClient.table.appendBooleanField(movableRow.valueCell, config.movable);
        this.boxFields["movable"].addEventListener("click", function (event) {
            _this.editConfig("setProperty", "movable", event.target.checked);
        });
        var sizeRow = SupClient.table.appendRow(this.tbody, "Size");
        var sizeFields = SupClient.table.appendNumberFields(sizeRow.valueCell, [config.width, config.height]);
        this.boxFields["width"] = sizeFields[0];
        this.boxFields["width"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "width", parseFloat(event.target.value));
        });
        this.boxFields["height"] = sizeFields[1];
        this.boxFields["height"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "height", parseFloat(event.target.value));
        });
        var offsetRow = SupClient.table.appendRow(this.tbody, "Offset");
        var offsetFields = SupClient.table.appendNumberFields(offsetRow.valueCell, [config.offset.x, config.offset.y]);
        this.boxFields["offset.x"] = offsetFields[0];
        this.boxFields["offset.x"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "offset.x", parseFloat(event.target.value));
        });
        this.boxFields["offset.y"] = offsetFields[1];
        this.boxFields["offset.y"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "offset.y", parseFloat(event.target.value));
        });
        // Tile Map boxFields
        this.tileMapFields = {};
        var tileMapRow = SupClient.table.appendRow(this.tbody, "Tile Map");
        var tileMapName = (config.tileMapAssetId != null) ? this.projectClient.entries.getPathFromId(config.tileMapAssetId) : "";
        this.tileMapFields["tileMapAssetId"] = SupClient.table.appendTextField(tileMapRow.valueCell, tileMapName);
        this.tileMapFields["tileMapAssetId"].addEventListener("input", function (event) {
            if (event.target.value === "")
                _this.editConfig("setProperty", "tileMapAssetId", null);
            else {
                var entry = SupClient.findEntryByPath(_this.projectClient.entries.pub, event.target.value);
                if (entry != null && entry.type === "tileMap")
                    _this.editConfig("setProperty", "tileMapAssetId", entry.id);
            }
        });
        var tileSetPropertyNameRow = SupClient.table.appendRow(this.tbody, "Tile Set Property");
        this.tileMapFields["tileSetPropertyName"] = SupClient.table.appendTextField(tileSetPropertyNameRow.valueCell, config.tileSetPropertyName);
        this.tileMapFields["tileSetPropertyName"].addEventListener("change", function (event) {
            var tileSetPropertyName = (event.target.value !== "") ? event.target.value : null;
            _this.editConfig("setProperty", "tileSetPropertyName", tileSetPropertyName);
        });
        var layersIndexRow = SupClient.table.appendRow(this.tbody, "Layers");
        this.tileMapFields["layersIndex"] = SupClient.table.appendTextField(layersIndexRow.valueCell, config.layersIndex);
        this.tileMapFields["layersIndex"].addEventListener("change", function (event) {
            var layersIndex = (event.target.value !== "") ? event.target.value : null;
            _this.editConfig("setProperty", "layersIndex", layersIndex);
        });
        this.updateFields(true);
    }
    ArcadeBody2DEditor.prototype.destroy = function () { };
    ArcadeBody2DEditor.prototype.config_setProperty = function (path, value) {
        if (path === "type") {
            this.typeField.value = value;
            this.updateFields();
        }
        else if (path === "movable")
            this.boxFields["movable"].checked = value;
        else if (path === "tileMapAssetId") {
            var tileMapName = (value !== "") ? this.projectClient.entries.getPathFromId(value) : "";
            this.tileMapFields["tileMapAssetId"].value = tileMapName;
        }
        else {
            if (this.boxFields[path] != null)
                this.boxFields[path].value = value;
            else
                this.tileMapFields[path].value = value;
        }
    };
    ArcadeBody2DEditor.prototype.updateFields = function (onlyRemove) {
        if (onlyRemove === void 0) { onlyRemove = false; }
        if (this.typeField.value === "box") {
            for (var fieldName in this.tileMapFields)
                this.tbody.removeChild(this.tileMapFields[fieldName].parentElement.parentElement);
            if (onlyRemove)
                return;
            this.tbody.appendChild(this.boxFields["movable"].parentElement.parentElement);
            this.tbody.appendChild(this.boxFields["width"].parentElement.parentElement.parentElement);
            this.tbody.appendChild(this.boxFields["offset.x"].parentElement.parentElement.parentElement);
        }
        else {
            this.tbody.removeChild(this.boxFields["movable"].parentElement.parentElement);
            this.tbody.removeChild(this.boxFields["width"].parentElement.parentElement.parentElement);
            this.tbody.removeChild(this.boxFields["offset.x"].parentElement.parentElement.parentElement);
            if (onlyRemove)
                return;
            for (var fieldName in this.tileMapFields)
                this.tbody.appendChild(this.tileMapFields[fieldName].parentElement.parentElement);
        }
    };
    return ArcadeBody2DEditor;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ArcadeBody2DEditor;
