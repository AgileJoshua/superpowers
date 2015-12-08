(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var SceneSettingsEditor_1 = require("./SceneSettingsEditor");
SupClient.registerPlugin("settingsEditors", "Scene", { namespace: "Editors", editor: SceneSettingsEditor_1.default });

},{"./SceneSettingsEditor":2}],2:[function(require,module,exports){
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

},{}]},{},[1]);
