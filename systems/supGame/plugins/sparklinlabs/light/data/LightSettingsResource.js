var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var LightSettingsResource = (function (_super) {
    __extends(LightSettingsResource, _super);
    function LightSettingsResource(pub, server) {
        _super.call(this, pub, LightSettingsResource.schema, server);
    }
    LightSettingsResource.prototype.init = function (callback) {
        this.pub = {
            shadowMapType: "basic"
        };
        _super.prototype.init.call(this, callback);
    };
    LightSettingsResource.schema = {
        shadowMapType: { type: "enum", items: ["basic", "pcf", "pcfSoft"], mutable: true },
    };
    return LightSettingsResource;
})(SupCore.Data.Base.Resource);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LightSettingsResource;
