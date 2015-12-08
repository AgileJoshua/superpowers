var LightSettingsEditor = (function () {
    function LightSettingsEditor(container, projectClient) {
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
        var shadowMapTypeRow = SupClient.table.appendRow(tbody, "Shadow Map Type");
        this.fields["shadowMapType"] = SupClient.table.appendSelectBox(shadowMapTypeRow.valueCell, { "basic": "Basic", "pcf": "PCF", "pcfSoft": "PCF Soft" });
        this.fields["shadowMapType"].addEventListener("change", function (event) {
            _this.projectClient.socket.emit("edit:resources", "lightSettings", "setProperty", "shadowMapType", event.target.value, function (err) { if (err != null)
                alert(err); });
        });
        this.projectClient.subResource("lightSettings", this);
    }
    return LightSettingsEditor;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LightSettingsEditor;
