!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.TextEditorWidget=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var TextEditorSettingsEditor_1 = require("./TextEditorSettingsEditor");
SupClient.registerPlugin("settingsEditors", "TextEditor", { namespace: "Editors", editor: TextEditorSettingsEditor_1.default });

},{"./TextEditorSettingsEditor":2}],2:[function(require,module,exports){
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

},{}]},{},[1])(1)
});