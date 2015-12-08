var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var TextEditorSettingsResource = (function (_super) {
    __extends(TextEditorSettingsResource, _super);
    function TextEditorSettingsResource(pub, server) {
        _super.call(this, pub, TextEditorSettingsResource.schema, server);
    }
    TextEditorSettingsResource.prototype.init = function (callback) {
        this.pub = {
            tabSize: 2,
            softTab: true
        };
        _super.prototype.init.call(this, callback);
    };
    TextEditorSettingsResource.schema = {
        tabSize: { type: "number", min: 1, mutable: true },
        softTab: { type: "boolean", mutable: true },
    };
    return TextEditorSettingsResource;
})(SupCore.Data.Base.Resource);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TextEditorSettingsResource;
