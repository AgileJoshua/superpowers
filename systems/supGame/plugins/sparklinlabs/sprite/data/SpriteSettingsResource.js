var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var SpriteSettingsResource = (function (_super) {
    __extends(SpriteSettingsResource, _super);
    function SpriteSettingsResource(pub, server) {
        _super.call(this, pub, SpriteSettingsResource.schema, server);
    }
    SpriteSettingsResource.prototype.init = function (callback) {
        this.pub = {
            filtering: "pixelated",
            pixelsPerUnit: 100,
            framesPerSecond: 10,
            alphaTest: 0.1
        };
        _super.prototype.init.call(this, callback);
    };
    SpriteSettingsResource.schema = {
        filtering: { type: "enum", items: ["pixelated", "smooth"], mutable: true },
        pixelsPerUnit: { type: "number", minExcluded: 0, mutable: true },
        framesPerSecond: { type: "number", minExcluded: 0, mutable: true },
        alphaTest: { type: "number", min: 0, max: 1, mutable: true }
    };
    return SpriteSettingsResource;
})(SupCore.Data.Base.Resource);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SpriteSettingsResource;
