var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var CubicModelSettingsResource = (function (_super) {
    __extends(CubicModelSettingsResource, _super);
    function CubicModelSettingsResource(pub, server) {
        _super.call(this, pub, CubicModelSettingsResource.schema, server);
    }
    CubicModelSettingsResource.prototype.init = function (callback) {
        this.pub = {
            pixelsPerUnit: 16
        };
        _super.prototype.init.call(this, callback);
    };
    CubicModelSettingsResource.schema = {
        pixelsPerUnit: { type: "integer", min: 1, mutable: true }
    };
    return CubicModelSettingsResource;
})(SupCore.Data.Base.Resource);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CubicModelSettingsResource;
