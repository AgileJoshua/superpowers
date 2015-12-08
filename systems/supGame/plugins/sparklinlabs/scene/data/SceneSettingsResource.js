var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var SceneSettingsResource = (function (_super) {
    __extends(SceneSettingsResource, _super);
    function SceneSettingsResource(pub, server) {
        _super.call(this, pub, SceneSettingsResource.schema, server);
    }
    SceneSettingsResource.prototype.init = function (callback) {
        this.pub = {
            formatVersion: SceneSettingsResource.currentFormatVersion,
            defaultCameraMode: "3D",
            defaultVerticalAxis: "Y"
        };
        _super.prototype.init.call(this, callback);
    };
    SceneSettingsResource.prototype.migrate = function (resourcePath, pub, callback) {
        if (pub.formatVersion === SceneSettingsResource.currentFormatVersion) {
            callback(false);
            return;
        }
        if (pub.formatVersion == null) {
            // NOTE: Vertical axis was introduced in Superpowers 0.13
            if (pub.defaultVerticalAxis == null)
                pub.defaultVerticalAxis = "Y";
            pub.formatVersion = 1;
        }
        callback(true);
    };
    SceneSettingsResource.currentFormatVersion = 1;
    SceneSettingsResource.schema = {
        formatVersion: { type: "integer" },
        defaultCameraMode: { type: "enum", items: ["3D", "2D"], mutable: true },
        defaultVerticalAxis: { type: "enum", items: ["Y", "Z"], mutable: true }
    };
    return SceneSettingsResource;
})(SupCore.Data.Base.Resource);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SceneSettingsResource;
