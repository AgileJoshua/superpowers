var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var CameraConfig = (function (_super) {
    __extends(CameraConfig, _super);
    function CameraConfig(pub) {
        // New setting introduced in v0.8
        if (pub.depth == null)
            pub.depth = 0;
        // New settings introduced in v0.7
        if (pub.nearClippingPlane == null)
            pub.nearClippingPlane = 0.1;
        if (pub.farClippingPlane == null)
            pub.farClippingPlane = 1000;
        _super.call(this, pub, CameraConfig.schema);
    }
    CameraConfig.create = function () {
        return {
            mode: "perspective",
            fov: 45,
            orthographicScale: 10,
            viewport: { x: 0, y: 0, width: 1, height: 1 },
            depth: 0,
            nearClippingPlane: 0.1,
            farClippingPlane: 1000
        };
    };
    ;
    CameraConfig.schema = {
        mode: { type: "enum", items: ["perspective", "orthographic"], mutable: true },
        fov: { type: "number", min: 0.1, max: 179.9, mutable: true },
        orthographicScale: { type: "number", min: 0.1, mutable: true },
        viewport: {
            type: "hash",
            properties: {
                x: { type: "number", min: 0, max: 1, mutable: true },
                y: { type: "number", min: 0, max: 1, mutable: true },
                width: { type: "number", min: 0, max: 1, mutable: true },
                height: { type: "number", min: 0, max: 1, mutable: true },
            }
        },
        depth: { type: "number", mutable: true },
        nearClippingPlane: { type: "number", min: 0.1, mutable: true },
        farClippingPlane: { type: "number", min: 0.1, mutable: true }
    };
    return CameraConfig;
})(SupCore.Data.Base.ComponentConfig);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CameraConfig;
