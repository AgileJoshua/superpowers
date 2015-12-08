var SpriteSettingsEditor = (function () {
    function SpriteSettingsEditor(container, projectClient) {
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
        this.filteringRow = SupClient.table.appendRow(tbody, "Filtering");
        this.fields["filtering"] = SupClient.table.appendSelectBox(this.filteringRow.valueCell, { pixelated: "Pixelated", smooth: "Smooth" });
        this.fpsRow = SupClient.table.appendRow(tbody, "Frames per second");
        this.fields["framesPerSecond"] = SupClient.table.appendNumberField(this.fpsRow.valueCell, "");
        this.pixelsPerUnitRow = SupClient.table.appendRow(tbody, "Pixels per unit");
        this.fields["pixelsPerUnit"] = SupClient.table.appendNumberField(this.pixelsPerUnitRow.valueCell, "");
        this.alphaTestRow = SupClient.table.appendRow(tbody, "Alpha testing");
        this.fields["alphaTest"] = SupClient.table.appendNumberField(this.alphaTestRow.valueCell, "");
        this.fields["filtering"].addEventListener("change", function (event) {
            _this.projectClient.socket.emit("edit:resources", "spriteSettings", "setProperty", "filtering", event.target.value, function (err) { if (err != null)
                alert(err); });
        });
        this.fields["framesPerSecond"].addEventListener("change", function (event) {
            _this.projectClient.socket.emit("edit:resources", "spriteSettings", "setProperty", "framesPerSecond", parseInt(event.target.value), function (err) { if (err != null)
                alert(err); });
        });
        this.fields["pixelsPerUnit"].addEventListener("change", function (event) {
            _this.projectClient.socket.emit("edit:resources", "spriteSettings", "setProperty", "pixelsPerUnit", parseInt(event.target.value), function (err) { if (err != null)
                alert(err); });
        });
        this.fields["alphaTest"].addEventListener("change", function (event) {
            _this.projectClient.socket.emit("edit:resources", "spriteSettings", "setProperty", "alphaTest", parseFloat(event.target.value), function (err) { if (err != null)
                alert(err); });
        });
        this.projectClient.subResource("spriteSettings", this);
    }
    return SpriteSettingsEditor;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SpriteSettingsEditor;
