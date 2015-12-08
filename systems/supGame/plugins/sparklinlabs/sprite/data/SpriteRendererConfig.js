var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var SpriteRendererConfig = (function (_super) {
    __extends(SpriteRendererConfig, _super);
    function SpriteRendererConfig(pub) {
        // NOTE: Settings introduced in Superpowers 0.8
        if (pub.overrideOpacity == null)
            pub.overrideOpacity = false;
        if (pub.color == null)
            pub.color = "ffffff";
        if (pub.horizontalFlip == null)
            pub.horizontalFlip = false;
        if (pub.verticalFlip == null)
            pub.verticalFlip = false;
        // NOTE: Settings introduced in Superpowers 0.7
        if (pub.castShadow == null)
            pub.castShadow = false;
        if (pub.receiveShadow == null)
            pub.receiveShadow = false;
        if (pub.materialType == null)
            pub.materialType = "basic";
        // NOTE: Legacy stuff from Superpowers 0.4
        if (typeof pub.spriteAssetId === "number")
            pub.spriteAssetId = pub.spriteAssetId.toString();
        if (typeof pub.animationId === "number")
            pub.animationId = pub.animationId.toString();
        _super.call(this, pub, SpriteRendererConfig.schema);
    }
    SpriteRendererConfig.create = function () {
        var emptyConfig = {
            spriteAssetId: null, animationId: null,
            horizontalFlip: false, verticalFlip: false,
            castShadow: false, receiveShadow: false,
            color: "ffffff",
            overrideOpacity: false, opacity: null,
            materialType: "basic", shaderAssetId: null
        };
        return emptyConfig;
    };
    SpriteRendererConfig.prototype.restore = function () {
        if (this.pub.spriteAssetId != null)
            this.emit("addDependencies", [this.pub.spriteAssetId]);
        if (this.pub.shaderAssetId != null)
            this.emit("addDependencies", [this.pub.shaderAssetId]);
    };
    SpriteRendererConfig.prototype.destroy = function () {
        if (this.pub.spriteAssetId != null)
            this.emit("removeDependencies", [this.pub.spriteAssetId]);
        if (this.pub.shaderAssetId != null)
            this.emit("removeDependencies", [this.pub.shaderAssetId]);
    };
    SpriteRendererConfig.prototype.setProperty = function (path, value, callback) {
        var _this = this;
        var oldDepId;
        if (path === "spriteAssetId")
            oldDepId = this.pub.spriteAssetId;
        if (path === "shaderAssetId")
            oldDepId = this.pub.shaderAssetId;
        _super.prototype.setProperty.call(this, path, value, function (err, actualValue) {
            if (err != null) {
                callback(err);
                return;
            }
            if (path === "spriteAssetId" || path === "shaderAssetId") {
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
    SpriteRendererConfig.schema = {
        spriteAssetId: { type: "string?", min: 0, mutable: true },
        animationId: { type: "string?", min: 0, mutable: true },
        horizontalFlip: { type: "boolean", mutable: true },
        verticalFlip: { type: "boolean", mutable: true },
        castShadow: { type: "boolean", mutable: true },
        receiveShadow: { type: "boolean", mutable: true },
        color: { type: "string?", length: 6, mutable: true },
        overrideOpacity: { type: "boolean", mutable: true },
        opacity: { type: "number?", min: 0, max: 1, mutable: true },
        materialType: { type: "enum", items: ["basic", "phong", "shader"], mutable: true },
        shaderAssetId: { type: "string?", min: 0, mutable: true }
    };
    return SpriteRendererConfig;
})(SupCore.Data.Base.ComponentConfig);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SpriteRendererConfig;
