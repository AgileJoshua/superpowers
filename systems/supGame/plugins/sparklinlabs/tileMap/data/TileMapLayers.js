var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var TileMapLayers = (function (_super) {
    __extends(TileMapLayers, _super);
    function TileMapLayers(pub) {
        _super.call(this, pub, TileMapLayers.schema);
    }
    TileMapLayers.schema = {
        name: { type: "string", minLength: 1, maxLength: 80, mutable: true },
        data: { type: "array" }
    };
    return TileMapLayers;
})(SupCore.Data.Base.ListById);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TileMapLayers;
