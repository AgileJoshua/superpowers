!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.TextEditorWidget=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var TextEditorSettingsResource_1 = require("./TextEditorSettingsResource");
SupCore.system.data.registerResource("textEditorSettings", TextEditorSettingsResource_1.default);

},{"./TextEditorSettingsResource":2}],2:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var TextEditorSettingsResource = (function (_super) {
    __extends(TextEditorSettingsResource, _super);
    function TextEditorSettingsResource(pub, server) {
        _super.call(this, pub, TextEditorSettingsResource.schema, server);
    }
    TextEditorSettingsResource.prototype.init = function (callback) {
        this.pub = {
            tabSize: 2,
            softTab: true
        };
        _super.prototype.init.call(this, callback);
    };
    TextEditorSettingsResource.schema = {
        tabSize: { type: "number", min: 1, mutable: true },
        softTab: { type: "boolean", mutable: true },
    };
    return TextEditorSettingsResource;
})(SupCore.Data.Base.Resource);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TextEditorSettingsResource;

},{}]},{},[1])(1)
});