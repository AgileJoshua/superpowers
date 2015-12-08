(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var ArcadeBody2DConfig_1 = require("./ArcadeBody2DConfig");
SupCore.system.data.registerComponentConfigClass("ArcadeBody2D", ArcadeBody2DConfig_1.default);

},{"./ArcadeBody2DConfig":2}],2:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ArcadeBody2DConfig = (function (_super) {
    __extends(ArcadeBody2DConfig, _super);
    function ArcadeBody2DConfig(pub) {
        _super.call(this, pub, ArcadeBody2DConfig.schema);
        // Migration v0.12.0
        if (this.pub.offset == null) {
            this.pub.offset = { x: this.pub.offsetX, y: this.pub.offsetY };
            delete this.pub.offsetX;
            delete this.pub.offsetY;
        }
        if (this.pub.tileMapAssetId === "")
            this.pub.tileMapAssetId = null;
        // Migration v0.6.0
        if (this.pub.type == null) {
            this.pub.type = "box";
            this.pub.tileMapAssetId = null;
            this.pub.tileSetPropertyName = null;
            this.pub.layersIndex = null;
        }
    }
    ArcadeBody2DConfig.create = function () {
        var newConfig = {
            type: "box",
            movable: true,
            width: 1,
            height: 1,
            offset: { x: 0, y: 0 },
            tileMapAssetId: null,
            tileSetPropertyName: null,
            layersIndex: null,
        };
        return newConfig;
    };
    ArcadeBody2DConfig.schema = {
        type: { type: "enum", items: ["box", "tileMap"], mutable: true },
        // Box
        movable: { type: "boolean", mutable: true },
        width: { type: "number", mutable: true },
        height: { type: "number", mutable: true },
        offset: {
            type: "hash",
            properties: {
                x: { type: "number", mutable: true },
                y: { type: "number", mutable: true },
            }
        },
        // TileMap
        tileMapAssetId: { type: "string?", mutable: true },
        tileSetPropertyName: { type: "string?", mutable: true },
        layersIndex: { type: "string?", min: 0, mutable: true },
    };
    return ArcadeBody2DConfig;
})(SupCore.Data.Base.ComponentConfig);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ArcadeBody2DConfig;

},{}]},{},[1]);