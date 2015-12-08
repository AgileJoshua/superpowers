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
