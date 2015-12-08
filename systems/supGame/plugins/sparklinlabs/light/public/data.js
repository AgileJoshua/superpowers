(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var LightConfig_1 = require("./LightConfig");
var LightSettingsResource_1 = require("./LightSettingsResource");
SupCore.system.data.registerComponentConfigClass("Light", LightConfig_1.default);
SupCore.system.data.registerResource("lightSettings", LightSettingsResource_1.default);

},{"./LightConfig":2,"./LightSettingsResource":3}],2:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var LightConfig = (function (_super) {
    __extends(LightConfig, _super);
    function LightConfig(pub) {
        _super.call(this, pub, LightConfig.schema);
        if (pub.shadowMapSize == null) {
            pub.shadowMapSize = { width: 512, height: 512 };
            pub.shadowBias = 0;
            pub.shadowDarkness = 0.5;
            pub.shadowCameraNearPlane = 0.1;
            pub.shadowCameraFarPlane = 1000;
            pub.shadowCameraFov = 50;
            pub.shadowCameraSize = { top: 100, bottom: -100, left: -100, right: 100 };
        }
    }
    LightConfig.create = function () {
        var emptyConfig = {
            type: "ambient",
            color: "ffffff",
            intensity: 1,
            distance: 0,
            angle: 60,
            target: { x: 0, y: 0, z: 0 },
            castShadow: false,
            shadowMapSize: { width: 512, height: 512 },
            shadowBias: 0,
            shadowDarkness: 0.5,
            shadowCameraNearPlane: 0.1, shadowCameraFarPlane: 1000,
            shadowCameraFov: 50,
            shadowCameraSize: { top: 100, bottom: -100, left: -100, right: 100 }
        };
        return emptyConfig;
    };
    LightConfig.schema = {
        type: { type: "enum", items: ["ambient", "point", "spot", "directional"], mutable: true },
        color: { type: "string", length: 6, mutable: true },
        intensity: { type: "number", min: 0, mutable: true },
        distance: { type: "number", min: 0, mutable: true },
        angle: { type: "number", min: 0, max: 90, mutable: true },
        target: {
            type: "hash",
            properties: {
                x: { type: "number", mutable: true },
                y: { type: "number", mutable: true },
                z: { type: "number", mutable: true }
            }
        },
        castShadow: { type: "boolean", mutable: true },
        shadowMapSize: {
            type: "hash",
            properties: {
                width: { type: "number", min: 1, mutable: true },
                height: { type: "number", min: 1, mutable: true },
            }
        },
        shadowBias: { type: "number", mutable: true },
        shadowDarkness: { type: "number", min: 0, max: 1, mutable: true },
        shadowCameraNearPlane: { type: "number", min: 0, mutable: true },
        shadowCameraFarPlane: { type: "number", min: 0, mutable: true },
        shadowCameraFov: { type: "number", min: 0, mutable: true },
        shadowCameraSize: {
            type: "hash",
            properties: {
                top: { type: "number", mutable: true },
                bottom: { type: "number", mutable: true },
                left: { type: "number", mutable: true },
                right: { type: "number", mutable: true },
            }
        }
    };
    return LightConfig;
})(SupCore.Data.Base.ComponentConfig);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LightConfig;

},{}],3:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var LightSettingsResource = (function (_super) {
    __extends(LightSettingsResource, _super);
    function LightSettingsResource(pub, server) {
        _super.call(this, pub, LightSettingsResource.schema, server);
    }
    LightSettingsResource.prototype.init = function (callback) {
        this.pub = {
            shadowMapType: "basic"
        };
        _super.prototype.init.call(this, callback);
    };
    LightSettingsResource.schema = {
        shadowMapType: { type: "enum", items: ["basic", "pcf", "pcfSoft"], mutable: true },
    };
    return LightSettingsResource;
})(SupCore.Data.Base.Resource);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LightSettingsResource;

},{}]},{},[1]);
