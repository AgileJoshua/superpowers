var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ModelAnimations = (function (_super) {
    __extends(ModelAnimations, _super);
    function ModelAnimations(pub) {
        _super.call(this, pub, ModelAnimations.schema);
    }
    ModelAnimations.schema = {
        name: { type: "string", minLength: 1, maxLength: 80, mutable: true },
        duration: { type: "number" },
        keyFrames: {
            type: "hash",
            keys: { minLength: 1, maxLength: 80 },
            values: {
                type: "hash",
                properties: {
                    translation: {
                        type: "array?",
                        items: {
                            type: "hash",
                            properties: {
                                time: { type: "number", min: 0 },
                                value: { type: "array", items: { type: "number", length: 3 } }
                            }
                        }
                    },
                    rotation: {
                        type: "array?",
                        items: {
                            type: "hash",
                            properties: {
                                time: { type: "number", min: 0 },
                                value: { type: "array", items: { type: "number", length: 4 } }
                            }
                        }
                    },
                    scale: {
                        type: "array?",
                        items: {
                            type: "hash",
                            properties: {
                                time: { type: "number", min: 0 },
                                value: { type: "array", items: { type: "number", length: 3 } }
                            }
                        }
                    }
                }
            }
        }
    };
    return ModelAnimations;
})(SupCore.Data.Base.ListById);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ModelAnimations;
