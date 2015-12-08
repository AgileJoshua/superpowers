var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ModelRendererConfig = (function (_super) {
    __extends(ModelRendererConfig, _super);
    function ModelRendererConfig(pub) {
        // NOTE: overrideOpacity was introduced in Superpowers 0.8
        if (pub.overrideOpacity == null)
            pub.overrideOpacity = false;
        if (pub.color == null)
            pub.color = "ffffff";
        // NOTE: These settings were introduced in Superpowers 0.7
        if (pub.castShadow == null)
            pub.castShadow = false;
        if (pub.receiveShadow == null)
            pub.receiveShadow = false;
        if (pub.materialType == null)
            pub.materialType = "basic";
        // NOTE: Legacy stuff from Superpowers 0.4
        if (typeof pub.modelAssetId === "number")
            pub.modelAssetId = pub.modelAssetId.toString();
        if (typeof pub.animationId === "number")
            pub.animationId = pub.animationId.toString();
        _super.call(this, pub, ModelRendererConfig.schema);
    }
    ModelRendererConfig.create = function () {
        var emptyConfig = {
            modelAssetId: null,
            animationId: null,
            castShadow: false,
            receiveShadow: false,
            color: "ffffff",
            overrideOpacity: false,
            opacity: null,
            materialType: "basic",
            shaderAssetId: null
        };
        return emptyConfig;
    };
    ModelRendererConfig.prototype.restore = function () {
        if (this.pub.modelAssetId != null)
            this.emit("addDependencies", [this.pub.modelAssetId]);
        if (this.pub.shaderAssetId != null)
            this.emit("addDependencies", [this.pub.shaderAssetId]);
    };
    ModelRendererConfig.prototype.destroy = function () {
        if (this.pub.modelAssetId != null)
            this.emit("removeDependencies", [this.pub.modelAssetId]);
        if (this.pub.shaderAssetId != null)
            this.emit("removeDependencies", [this.pub.shaderAssetId]);
    };
    ModelRendererConfig.prototype.setProperty = function (path, value, callback) {
        var _this = this;
        var oldDepId;
        if (path === "modelAssetId")
            oldDepId = this.pub[path];
        if (path === "shaderAssetId")
            oldDepId = this.pub.shaderAssetId;
        _super.prototype.setProperty.call(this, path, value, function (err, actualValue) {
            if (err != null) {
                callback(err);
                return;
            }
            if (path === "modelAssetId" || path === "shaderAssetId") {
                if (oldDepId != null)
                    _this.emit("removeDependencies", [oldDepId]);
                if (actualValue != null)
                    _this.emit("addDependencies", [actualValue]);
            }
            if (path === "overrideOpacity")
                _this.pub.opacity = null;
            callback(null, actualValue);
        });
    };
    ModelRendererConfig.schema = {
        modelAssetId: { type: "string?", min: 0, mutable: true },
        animationId: { type: "string?", min: 0, mutable: true },
        castShadow: { type: "boolean", mutable: true },
        receiveShadow: { type: "boolean", mutable: true },
        color: { type: "string", length: 6, mutable: true },
        overrideOpacity: { type: "boolean", mutable: true },
        opacity: { type: "number?", min: 0, max: 1, mutable: true },
        materialType: { type: "enum", items: ["basic", "phong", "shader"], mutable: true },
        shaderAssetId: { type: "string?", min: 0, mutable: true }
    };
    return ModelRendererConfig;
})(SupCore.Data.Base.ComponentConfig);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ModelRendererConfig;
