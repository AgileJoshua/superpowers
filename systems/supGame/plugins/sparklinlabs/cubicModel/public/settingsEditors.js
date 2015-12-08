(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var CubicModelSettingsEditor_1 = require("./CubicModelSettingsEditor");
SupClient.registerPlugin("settingsEditors", "CubicModel", { namespace: "Editors", editor: CubicModelSettingsEditor_1.default });

},{"./CubicModelSettingsEditor":2}],2:[function(require,module,exports){
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

},{}]},{},[1]);
