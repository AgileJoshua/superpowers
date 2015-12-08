var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var CannonBodyConfig = (function (_super) {
    __extends(CannonBodyConfig, _super);
    function CannonBodyConfig(pub) {
        // NOTE: offset was introduced in Superpowers 0.14
        // to merge offsetX, offsetY and offsetZ
        if (pub.offsetX != null) {
            pub.offset = {
                x: pub.offsetX,
                y: pub.offsetY,
                z: pub.offsetZ,
            };
            delete pub.offsetX;
            delete pub.offsetY;
            delete pub.offsetZ;
        }
        // NOTE: halfSize was introduced in Superpowers 0.14
        // to merge halfWidth, halfHeight and halfDepth
        if (pub.halfWidth != null) {
            pub.halfSize = {
                x: pub.halfWidth,
                y: pub.halfHeight,
                z: pub.halfDepth
            };
            delete pub.halfWidth;
            delete pub.halfHeight;
            delete pub.halfDepth;
        }
        if (pub.shape == null)
            pub.shape = "box";
        if (pub.radius == null)
            pub.radius = 1;
        if (pub.height == null)
            pub.height = 1;
        _super.call(this, pub, CannonBodyConfig.schema);
    }
    CannonBodyConfig.create = function () {
        return {
            mass: 0,
            fixedRotation: false,
            offset: { x: 0, y: 0, z: 0 },
            shape: "box",
            halfSize: { x: 0.5, y: 0.5, z: 0.5 },
            radius: 1,
            height: 1
        };
    };
    CannonBodyConfig.schema = {
        mass: { type: "number", min: 0, mutable: true },
        fixedRotation: { type: "boolean", mutable: true },
        offset: {
            mutable: true,
            type: "hash",
            properties: {
                x: { type: "number", mutable: true },
                y: { type: "number", mutable: true },
                z: { type: "number", mutable: true },
            }
        },
        shape: { type: "enum", items: ["box", "sphere", "cylinder"], mutable: true },
        halfSize: {
            mutable: true,
            type: "hash",
            properties: {
                x: { type: "number", min: 0, mutable: true },
                y: { type: "number", min: 0, mutable: true },
                z: { type: "number", min: 0, mutable: true },
            }
        },
        radius: { type: "number", min: 0, mutable: true },
        height: { type: "number", min: 0, mutable: true }
    };
    return CannonBodyConfig;
})(SupCore.Data.Base.ComponentConfig);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CannonBodyConfig;
