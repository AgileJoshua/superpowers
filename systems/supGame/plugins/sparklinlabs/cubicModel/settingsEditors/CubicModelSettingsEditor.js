var CubicModelSettingsEditor = (function () {
    function CubicModelSettingsEditor(container, projectClient) {
        var _this = this;
        this.fields = {};
        this.onResourceReceived = function (resourceId, resource) {
            _this.resource = resource;
            for (var setting in resource.pub) {
                _this.fields[setting].value = resource.pub[setting];
            }
        };
        this.onResourceEdited = function (resourceId, command, propertyName) {
            _this.fields[propertyName].value = _this.resource.pub[propertyName];
        };
        this.projectClient = projectClient;
        var tbody = SupClient.table.createTable(container).tbody;
        this.pixelsPerUnitRow = SupClient.table.appendRow(tbody, "Pixels per unit");
        this.fields["pixelsPerUnit"] = SupClient.table.appendNumberField(this.pixelsPerUnitRow.valueCell, "");
        this.fields["pixelsPerUnit"].addEventListener("change", function (event) {
            _this.projectClient.socket.emit("edit:resources", "cubicModelSettings", "setProperty", "pixelsPerUnit", parseInt(event.target.value), function (err) { if (err != null)
                alert(err); });
        });
        this.projectClient.subResource("cubicModelSettings", this);
    }
    return CubicModelSettingsEditor;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CubicModelSettingsEditor;
