var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var TileMapSettingsResource = (function (_super) {
    __extends(TileMapSettingsResource, _super);
    function TileMapSettingsResource(pub, server) {
        _super.call(this, pub, TileMapSettingsResource.schema, server);
    }
    TileMapSettingsResource.prototype.init = function (callback) {
        this.pub = {
            formatVersion: TileMapSettingsResource.currentFormatVersion,
            pixelsPerUnit: 100,
            width: 30,
            height: 20,
            layerDepthOffset: 1,
            grid: {
                width: 40,
                height: 40
            }
        };
        _super.prototype.init.call(this, callback);
    };
    TileMapSettingsResource.prototype.migrate = function (resourcePath, pub, callback) {
        if (pub.formatVersion === TileMapSettingsResource.currentFormatVersion) {
            callback(false);
            return;
        }
        if (pub.formatVersion == null) {
            // NOTE: gridSize was renamed to grid.width and .height in Superpowers 0.8
            if (pub["gridSize"] != null) {
                pub.grid = { width: pub["gridSize"], height: pub["gridSize"] };
                delete pub["gridSize"];
            }
            pub.formatVersion = 1;
        }
        callback(true);
    };
    TileMapSettingsResource.currentFormatVersion = 1;
    TileMapSettingsResource.schema = {
        formatVersion: { type: "integer" },
        pixelsPerUnit: { type: "integer", minExcluded: 0, mutable: true },
        width: { type: "integer", min: 1, mutable: true },
        height: { type: "integer", min: 1, mutable: true },
        layerDepthOffset: { type: "number", min: 0, mutable: true },
        grid: {
            type: "hash",
            properties: {
                width: { type: "integer", min: 1, mutable: true },
                height: { type: "integer", min: 1, mutable: true }
            }
        }
    };
    return TileMapSettingsResource;
})(SupCore.Data.Base.Resource);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TileMapSettingsResource;
