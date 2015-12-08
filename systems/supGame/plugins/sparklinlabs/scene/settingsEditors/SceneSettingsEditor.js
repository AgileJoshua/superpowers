var SceneSettingsEditor = (function () {
    function SceneSettingsEditor(container, projectClient) {
        var _this = this;
        this.fields = {};
        this.onResourceReceived = function (resourceId, resource) {
            _this.resource = resource;
            for (var setting in resource.pub) {
                if (setting === "formatVersion")
                    continue;
                _this.fields[setting].value = resource.pub[setting];
            }
        };
        this.onResourceEdited = function (resourceId, command, propertyName) {
            _this.fields[propertyName].value = _this.resource.pub[propertyName];
        };
        this.projectClient = projectClient;
        var tbody = SupClient.table.createTable(container).tbody;
        var defaultCameraModeRow = SupClient.table.appendRow(tbody, "Default camera mode");
        this.fields["defaultCameraMode"] = SupClient.table.appendSelectBox(defaultCameraModeRow.valueCell, { "3D": "3D", "2D": "2D" });
        this.fields["defaultCameraMode"].addEventListener("change", function (event) {
            _this.projectClient.socket.emit("edit:resources", "sceneSettings", "setProperty", "defaultCameraMode", event.target.value, function (err) { if (err != null)
                alert(err); });
        });
        var defaultVerticalAxisRow = SupClient.table.appendRow(tbody, "Default camera vertical axis");
        this.fields["defaultVerticalAxis"] = SupClient.table.appendSelectBox(defaultVerticalAxisRow.valueCell, { "Y": "Y", "Z": "Z" });
        this.fields["defaultVerticalAxis"].addEventListener("change", function (event) {
            _this.projectClient.socket.emit("edit:resources", "sceneSettings", "setProperty", "defaultVerticalAxis", event.target.value, function (err) { if (err != null)
                alert(err); });
        });
        this.projectClient.subResource("sceneSettings", this);
    }
    return SceneSettingsEditor;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SceneSettingsEditor;
