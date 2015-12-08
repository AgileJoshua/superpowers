var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
function getShapeTextureSize(shape) {
    var width = 0;
    var height = 0;
    switch (shape.type) {
        case "box":
            width = shape.settings.size.x * 2 + shape.settings.size.z * 2;
            height = shape.settings.size.z + shape.settings.size.y;
            break;
    }
    return { width: width, height: height };
}
exports.getShapeTextureSize = getShapeTextureSize;
function getShapeTextureFaceSize(shape, faceName) {
    var width = 0;
    var height = 0;
    switch (shape.type) {
        case "box":
            switch (faceName) {
                case "front":
                case "back":
                    width = shape.settings.size.x;
                    height = shape.settings.size.y;
                    break;
                case "left":
                case "right":
                    width = shape.settings.size.z;
                    height = shape.settings.size.y;
                    break;
                case "top":
                case "bottom":
                    width = shape.settings.size.x;
                    height = shape.settings.size.z;
                    break;
            }
            break;
    }
    return { width: width, height: height };
}
exports.getShapeTextureFaceSize = getShapeTextureFaceSize;
var CubicModelNodes = (function (_super) {
    __extends(CubicModelNodes, _super);
    function CubicModelNodes(cubicModelAsset) {
        _super.call(this, cubicModelAsset.pub.nodes, CubicModelNodes.schema);
        this.cubicModelAsset = cubicModelAsset;
    }
    CubicModelNodes.schema = {
        name: { type: "string", minLength: 1, maxLength: 80, mutable: true },
        children: { type: "array" },
        position: {
            mutable: true,
            type: "hash",
            properties: {
                x: { type: "number", mutable: true },
                y: { type: "number", mutable: true },
                z: { type: "number", mutable: true },
            }
        },
        orientation: {
            mutable: true,
            type: "hash",
            properties: {
                x: { type: "number", mutable: true },
                y: { type: "number", mutable: true },
                z: { type: "number", mutable: true },
                w: { type: "number", mutable: true },
            }
        },
        shape: {
            type: "hash",
            properties: {
                type: { type: "string", mutable: true },
                offset: {
                    mutable: true,
                    type: "hash",
                    properties: {
                        x: { type: "number", mutable: true },
                        y: { type: "number", mutable: true },
                        z: { type: "number", mutable: true },
                    }
                },
                textureLayoutCustom: { type: "boolean", mutable: true },
                textureLayout: {
                    type: "hash",
                    values: {
                        type: "hash",
                        properties: {
                            offset: {
                                type: "hash",
                                properties: {
                                    x: { type: "number" },
                                    y: { type: "number" }
                                }
                            },
                            mirror: {
                                type: "hash",
                                properties: {
                                    x: { type: "boolean", mutable: true },
                                    y: { type: "boolean", mutable: true }
                                }
                            },
                            angle: { type: "number", mutable: true }
                        }
                    }
                },
                settings: {
                    mutable: true,
                    type: "any"
                }
            }
        }
    };
    return CubicModelNodes;
})(SupCore.Data.Base.TreeById);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CubicModelNodes;
