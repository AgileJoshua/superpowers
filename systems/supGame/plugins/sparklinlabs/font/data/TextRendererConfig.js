var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var TextRendererConfig = (function (_super) {
    __extends(TextRendererConfig, _super);
    function TextRendererConfig(pub) {
        // NOTE: Legacy stuff from Superpowers 0.7
        if (pub.color != null && pub.color.length !== 6)
            pub.color = "ffffff";
        // NOTE: Migration from old "align" property
        if (pub.align != null) {
            pub.alignment = pub.align;
            delete pub.align;
        }
        if (pub.verticalAlignment == null)
            pub.verticalAlignment = "center";
        _super.call(this, pub, TextRendererConfig.schema);
    }
    TextRendererConfig.create = function () {
        var emptyConfig = {
            fontAssetId: null,
            text: "Text",
            alignment: "center",
            size: null,
            color: null
        };
        return emptyConfig;
    };
    TextRendererConfig.prototype.restore = function () { if (this.pub.fontAssetId != null)
        this.emit("addDependencies", [this.pub.fontAssetId]); };
    TextRendererConfig.prototype.destroy = function () { if (this.pub.fontAssetId != null)
        this.emit("removeDependencies", [this.pub.fontAssetId]); };
    TextRendererConfig.prototype.setProperty = function (path, value, callback) {
        var _this = this;
        var oldDepId;
        if (path === "fontAssetId")
            oldDepId = this.pub[path];
        _super.prototype.setProperty.call(this, path, value, function (err, actualValue) {
            if (err != null) {
                callback(err);
                return;
            }
            if (path === "fontAssetId") {
                if (oldDepId != null)
                    _this.emit("removeDependencies", [oldDepId]);
                if (actualValue != null)
                    _this.emit("addDependencies", [actualValue]);
            }
            callback(null, actualValue);
        });
    };
    TextRendererConfig.schema = {
        fontAssetId: { type: "string?", min: 0, mutable: true },
        text: { type: "string", min: 0, mutable: true },
        alignment: { type: "enum", items: ["left", "center", "right"], mutable: true },
        verticalAlignment: { type: "enum", items: ["top", "center", "bottom"], mutable: true },
        size: { type: "integer?", min: 0, mutable: true },
        color: { type: "string?", length: 6, mutable: true }
    };
    return TextRendererConfig;
})(SupCore.Data.Base.ComponentConfig);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TextRendererConfig;
