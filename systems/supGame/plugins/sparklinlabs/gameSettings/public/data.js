(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var GameSettingsResource_1 = require("./GameSettingsResource");
SupCore.system.data.registerResource("gameSettings", GameSettingsResource_1.default);

},{"./GameSettingsResource":2}],2:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var GameSettingsResource = (function (_super) {
    __extends(GameSettingsResource, _super);
    function GameSettingsResource(pub, server) {
        _super.call(this, pub, GameSettingsResource.schema, server);
    }
    GameSettingsResource.prototype.init = function (callback) {
        this.pub = {
            formatVersion: GameSettingsResource.currentFormatVersion,
            startupSceneId: null,
            framesPerSecond: 60,
            ratioNumerator: null, ratioDenominator: null,
            customLayers: []
        };
        _super.prototype.init.call(this, callback);
    };
    GameSettingsResource.prototype.migrate = function (resourcePath, pub, callback) {
        var _this = this;
        if (pub.formatVersion === GameSettingsResource.currentFormatVersion) {
            callback(false);
            return;
        }
        if (pub.formatVersion == null) {
            // NOTE: Custom layers were introduced in Superpowers 0.8
            if (pub.customLayers == null)
                pub.customLayers = [];
            this.server.data.entries.walk(function (node) {
                var path = _this.server.data.entries.getPathFromId(node.id);
                if (path === pub.startupScene)
                    pub.startupSceneId = node.id;
            });
            delete pub.startupScene;
            pub.formatVersion = 1;
        }
        callback(true);
    };
    GameSettingsResource.currentFormatVersion = 1;
    GameSettingsResource.schema = {
        formatVersion: { type: "integer" },
        startupSceneId: { type: "string?", mutable: true },
        framesPerSecond: { type: "integer", minExcluded: 0, mutable: true },
        ratioNumerator: { type: "integer?", mutable: true },
        ratioDenominator: { type: "integer?", mutable: true },
        customLayers: {
            type: "array", mutable: true, minLength: 0, maxLength: 8,
            items: { type: "string", minLength: 1, maxLength: 80 }
        }
    };
    return GameSettingsResource;
})(SupCore.Data.Base.Resource);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GameSettingsResource;

},{}]},{},[1]);
