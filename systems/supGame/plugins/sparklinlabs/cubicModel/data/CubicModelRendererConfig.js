var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var CubicModelRendererConfig = (function (_super) {
    __extends(CubicModelRendererConfig, _super);
    function CubicModelRendererConfig(pub) {
        _super.call(this, pub, CubicModelRendererConfig.schema);
    }
    CubicModelRendererConfig.create = function () {
        var emptyConfig = {
            cubicModelAssetId: null // , animationId: null,
        };
        return emptyConfig;
    };
    CubicModelRendererConfig.prototype.restore = function () {
        if (this.pub.cubicModelAssetId != null)
            this.emit("addDependencies", [this.pub.cubicModelAssetId]);
        // if (this.pub.shaderAssetId != null) this.emit("addDependencies", [ this.pub.shaderAssetId ]);
    };
    CubicModelRendererConfig.prototype.destroy = function () {
        if (this.pub.cubicModelAssetId != null)
            this.emit("removeDependencies", [this.pub.cubicModelAssetId]);
        // if (this.pub.shaderAssetId != null) this.emit("removeDependencies", [ this.pub.shaderAssetId ]);
    };
    CubicModelRendererConfig.prototype.setProperty = function (path, value, callback) {
        var _this = this;
        var oldDepId;
        if (path === "cubicModelAssetId")
            oldDepId = this.pub.cubicModelAssetId;
        // if (path === "shaderAssetId") oldDepId = this.pub.shaderAssetId;
        _super.prototype.setProperty.call(this, path, value, function (err, actualValue) {
            if (err != null) {
                callback(err);
                return;
            }
            if (path === "cubicModelAssetId" || path === "shaderAssetId") {
                if (oldDepId != null)
                    _this.emit("removeDependencies", [oldDepId]);
                if (actualValue != null)
                    _this.emit("addDependencies", [actualValue]);
            }
            // if (path === "overrideOpacity") this.pub.opacity = null;
            callback(null, actualValue);
        });
    };
    CubicModelRendererConfig.schema = {
        cubicModelAssetId: { type: "string?", min: 0, mutable: true },
    };
    return CubicModelRendererConfig;
})(SupCore.Data.Base.ComponentConfig);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CubicModelRendererConfig;
