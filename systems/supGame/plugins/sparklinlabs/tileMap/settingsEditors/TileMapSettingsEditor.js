var TileMapSettingsEditor = (function () {
    function TileMapSettingsEditor(container, projectClient) {
        var _this = this;
        this.fields = {};
        this.onResourceReceived = function (resourceId, resource) {
            _this.resource = resource;
            for (var setting in resource.pub) {
                if (setting === "formatVersion")
                    continue;
                if (setting === "grid") {
                    _this.fields["grid.width"].value = resource.pub.grid.width.toString();
                    _this.fields["grid.height"].value = resource.pub.grid.height.toString();
                }
                else
                    _this.fields[setting].value = resource.pub[setting];
            }
        };
        this.onResourceEdited = function (resourceId, command, propertyName, value) {
            _this.fields[propertyName].value = value;
        };
        this.projectClient = projectClient;
        var tbody = SupClient.table.createTable(container).tbody;
        this.pixelsPerUnitRow = SupClient.table.appendRow(tbody, "Pixels per unit");
        this.fields["pixelsPerUnit"] = SupClient.table.appendNumberField(this.pixelsPerUnitRow.valueCell, "");
        this.defaultWidthRow = SupClient.table.appendRow(tbody, "Default width");
        this.fields["width"] = SupClient.table.appendNumberField(this.defaultWidthRow.valueCell, "");
        this.defaultHeightRow = SupClient.table.appendRow(tbody, "Default height");
        this.fields["height"] = SupClient.table.appendNumberField(this.defaultHeightRow.valueCell, "");
        this.depthOffsetRow = SupClient.table.appendRow(tbody, "Depth Offset");
        this.fields["layerDepthOffset"] = SupClient.table.appendNumberField(this.depthOffsetRow.valueCell, "");
        this.gridSizeRow = SupClient.table.appendRow(tbody, "Tile set grid size");
        var gridFields = SupClient.table.appendNumberFields(this.gridSizeRow.valueCell, [null, null]);
        this.fields["grid.width"] = gridFields[0];
        this.fields["grid.height"] = gridFields[1];
        this.fields["pixelsPerUnit"].addEventListener("change", function (event) {
            _this.projectClient.socket.emit("edit:resources", "tileMapSettings", "setProperty", "pixelsPerUnit", parseInt(event.target.value), function (err) { if (err != null)
                alert(err); });
        });
        this.fields["width"].addEventListener("change", function (event) {
            _this.projectClient.socket.emit("edit:resources", "tileMapSettings", "setProperty", "width", parseInt(event.target.value), function (err) { if (err != null)
                alert(err); });
        });
        this.fields["height"].addEventListener("change", function (event) {
            _this.projectClient.socket.emit("edit:resources", "tileMapSettings", "setProperty", "height", parseInt(event.target.value), function (err) { if (err != null)
                alert(err); });
        });
        this.fields["layerDepthOffset"].addEventListener("change", function (event) {
            _this.projectClient.socket.emit("edit:resources", "tileMapSettings", "setProperty", "layerDepthOffset", parseInt(event.target.value), function (err) { if (err != null)
                alert(err); });
        });
        this.fields["grid.width"].addEventListener("change", function (event) {
            _this.projectClient.socket.emit("edit:resources", "tileMapSettings", "setProperty", "grid.width", parseInt(event.target.value), function (err) { if (err != null)
                alert(err); });
        });
        this.fields["grid.height"].addEventListener("change", function (event) {
            _this.projectClient.socket.emit("edit:resources", "tileMapSettings", "setProperty", "grid.height", parseInt(event.target.value), function (err) { if (err != null)
                alert(err); });
        });
        this.projectClient.subResource("tileMapSettings", this);
    }
    return TileMapSettingsEditor;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TileMapSettingsEditor;
