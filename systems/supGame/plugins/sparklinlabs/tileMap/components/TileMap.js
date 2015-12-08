var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var events_1 = require("events");
var TileMap = (function (_super) {
    __extends(TileMap, _super);
    function TileMap(data) {
        _super.call(this);
        this.data = data;
    }
    TileMap.prototype.getWidth = function () { return this.data.width; };
    TileMap.prototype.getHeight = function () { return this.data.height; };
    TileMap.prototype.getPixelsPerUnit = function () { return this.data.pixelsPerUnit; };
    TileMap.prototype.getLayersDepthOffset = function () { return this.data.layerDepthOffset; };
    TileMap.prototype.getLayersCount = function () { return this.data.layers.length; };
    TileMap.prototype.getLayerId = function (index) { return this.data.layers[index].id; };
    TileMap.prototype.setTileAt = function (layer, x, y, value) {
        if (x < 0 || y < 0 || x >= this.data.width || y >= this.data.height)
            return;
        var index = y * this.data.width + x;
        this.data.layers[layer].data[index] = (value != null) ? value : 0;
        this.emit("setTileAt", layer, x, y);
    };
    TileMap.prototype.getTileAt = function (layer, x, y) {
        if (x < 0 || y < 0 || x >= this.data.width || y >= this.data.height)
            return 0;
        var index = y * this.data.width + x;
        return this.data.layers[layer].data[index];
    };
    return TileMap;
})(events_1.EventEmitter);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TileMap;
