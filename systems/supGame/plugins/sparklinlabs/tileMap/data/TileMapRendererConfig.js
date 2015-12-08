var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var TileMapRendererConfig = (function (_super) {
    __extends(TileMapRendererConfig, _super);
    function TileMapRendererConfig(pub) {
        // NOTE: Legacy stuff from Superpowers 0.4
        if (typeof pub.tileMapAssetId === "number")
            pub.tileMapAssetId = pub.tileMapAssetId.toString();
        if (typeof pub.tileSetAssetId === "number")
            pub.tileSetAssetId = pub.tileSetAssetId.toString();
        // NOTE: Legacy stuff from Superpowers 0.11
        if (pub.castShadow == null)
            pub.castShadow = false;
        if (pub.receiveShadow == null)
            pub.receiveShadow = false;
        if (pub.materialType == null)
            pub.materialType = "basic";
        _super.call(this, pub, TileMapRendererConfig.schema);
    }
    TileMapRendererConfig.create = function () {
        var newConfig = {
            tileMapAssetId: null, tileSetAssetId: null,
            castShadow: false, receiveShadow: false,
            materialType: "basic", shaderAssetId: null
        };
        return newConfig;
    };
    ;
    TileMapRendererConfig.prototype.restore = function () {
        if (this.pub.tileMapAssetId != null)
            this.emit("addDependencies", [this.pub.tileMapAssetId]);
        if (this.pub.tileSetAssetId != null)
            this.emit("addDependencies", [this.pub.tileSetAssetId]);
    };
    TileMapRendererConfig.prototype.destroy = function () {
        if (this.pub.tileMapAssetId != null)
            this.emit("removeDependencies", [this.pub.tileMapAssetId]);
        if (this.pub.tileSetAssetId != null)
            this.emit("removeDependencies", [this.pub.tileSetAssetId]);
    };
    TileMapRendererConfig.prototype.setProperty = function (path, value, callback) {
        var _this = this;
        var oldDepId;
        if (path === "tileMapAssetId")
            oldDepId = this.pub.tileMapAssetId;
        if (path === "tileSetAssetId")
            oldDepId = this.pub.tileSetAssetId;
        _super.prototype.setProperty.call(this, path, value, function (err, actualValue) {
            if (err != null) {
                callback(err, null);
                return;
            }
            if (path === "tileMapAssetId" || path === "tileSetAssetId") {
                if (oldDepId != null)
                    _this.emit("removeDependencies", [oldDepId]);
                if (actualValue != null)
                    _this.emit("addDependencies", [actualValue]);
            }
            callback(null, actualValue);
        });
    };
    TileMapRendererConfig.schema = {
        tileMapAssetId: { type: "string?", min: 0, mutable: true },
        tileSetAssetId: { type: "string?", min: 0, mutable: true },
        castShadow: { type: "boolean", mutable: true },
        receiveShadow: { type: "boolean", mutable: true },
        materialType: { type: "enum", items: ["basic", "phong", "shader"], mutable: true },
        shaderAssetId: { type: "string?", min: 0, mutable: true }
    };
    return TileMapRendererConfig;
})(SupCore.Data.Base.ComponentConfig);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TileMapRendererConfig;
