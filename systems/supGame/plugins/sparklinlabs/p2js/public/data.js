(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var P2BodyConfig_1 = require("./P2BodyConfig");
SupCore.system.data.registerComponentConfigClass("P2Body", P2BodyConfig_1.default);

},{"./P2BodyConfig":2}],2:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var P2BodyConfig = (function (_super) {
    __extends(P2BodyConfig, _super);
    function P2BodyConfig(pub) {
        // NOTE: "rectangle" was renamed to "box" in p2.js v0.7
        if (pub.shape === "rectangle")
            pub.shape = "box";
        _super.call(this, pub, P2BodyConfig.schema);
    }
    P2BodyConfig.create = function () {
        return {
            mass: 0,
            fixedRotation: false,
            offsetX: 0,
            offsetY: 0,
            shape: "box",
            width: 1,
            height: 1,
            radius: 1,
            length: 1
        };
    };
    P2BodyConfig.schema = {
        mass: { type: "number", min: 0, mutable: true },
        fixedRotation: { type: "boolean", mutable: true },
        offsetX: { type: "number", mutable: true },
        offsetY: { type: "number", mutable: true },
        shape: { type: "enum", items: ["box", "circle"], mutable: true },
        width: { type: "number", min: 0, mutable: true },
        height: { type: "number", min: 0, mutable: true },
        radius: { type: "number", min: 0, mutable: true }
    };
    return P2BodyConfig;
})(SupCore.Data.Base.ComponentConfig);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = P2BodyConfig;

},{}]},{},[1]);
