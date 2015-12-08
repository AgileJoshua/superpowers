var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var SpriteAnimations = (function (_super) {
    __extends(SpriteAnimations, _super);
    function SpriteAnimations(pub) {
        _super.call(this, pub, SpriteAnimations.schema);
    }
    SpriteAnimations.schema = {
        name: { type: "string", minLength: 1, maxLength: 80, mutable: true },
        startFrameIndex: { type: "number", min: 0, mutable: true },
        endFrameIndex: { type: "number", min: 0, mutable: true },
        speed: { type: "number", mutable: true }
    };
    return SpriteAnimations;
})(SupCore.Data.Base.ListById);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SpriteAnimations;
