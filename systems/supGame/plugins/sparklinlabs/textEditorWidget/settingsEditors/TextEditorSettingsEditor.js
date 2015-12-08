var SpriteSettingsEditor = (function () {
    function SpriteSettingsEditor(container, projectClient) {
        var _this = this;
        this.onResourceReceived = function (resourceId, resource) {
            _this.resource = resource;
            _this.tabSizeField.value = resource.pub.tabSize.toString();
            _this.softTabField.checked = resource.pub.softTab;
        };
        this.onResourceEdited = function (resourceId, command, propertyName) {
            switch (propertyName) {
                case "tabSize":
                    _this.tabSizeField.value = _this.resource.pub.tabSize.toString();
                    break;
                case "softTab":
                    _this.softTabField.checked = _this.resource.pub.softTab;
                    break;
            }
        };
        var tbody = SupClient.table.createTable(container).tbody;
        var tabSizeRow = SupClient.table.appendRow(tbody, "Tab size");
        this.tabSizeField = SupClient.table.appendNumberField(tabSizeRow.valueCell, "", 1);
        this.tabSizeField.addEventListener("change", function (event) {
            projectClient.socket.emit("edit:resources", "textEditorSettings", "setProperty", "tabSize", parseInt(event.target.value), function (err) { if (err != null)
                alert(err); });
        });
        var softTabRow = SupClient.table.appendRow(tbody, "Use soft tab");
        this.softTabField = SupClient.table.appendBooleanField(softTabRow.valueCell, true);
        this.softTabField.addEventListener("change", function (event) {
            projectClient.socket.emit("edit:resources", "textEditorSettings", "setProperty", "softTab", event.target.checked, function (err) { if (err != null)
                alert(err); });
        });
        projectClient.subResource("textEditorSettings", this);
    }
    return SpriteSettingsEditor;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SpriteSettingsEditor;
