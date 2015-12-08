var THREE = SupEngine.THREE;
var TileSet_1 = require("./TileSet");
var TileSetRendererUpdater = (function () {
    function TileSetRendererUpdater(client, tileSetRenderer, config, receiveAssetCallbacks, editAssetCallbacks) {
        var _this = this;
        this._onTileSetAssetReceived = function (assetId, asset) {
            _this._prepareTexture(asset.pub.texture, function () {
                _this.tileSetAsset = asset;
                if (asset.pub.texture != null) {
                    _this.tileSetRenderer.setTileSet(new TileSet_1.default(asset.pub));
                    _this.tileSetRenderer.gridRenderer.setGrid({
                        width: asset.pub.texture.image.width / asset.pub.grid.width,
                        height: asset.pub.texture.image.height / asset.pub.grid.height,
                        direction: -1,
                        orthographicScale: 10,
                        ratio: { x: 1, y: asset.pub.grid.width / asset.pub.grid.height }
                    });
                }
                if (_this.receiveAssetCallbacks != null && _this.receiveAssetCallbacks.tileSet != null)
                    _this.receiveAssetCallbacks.tileSet();
            });
        };
        this._onTileSetAssetEdited = function (id, command) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            var callEditCallback = true;
            var commandFunction = _this[("_onEditCommand_" + command)];
            if (commandFunction != null) {
                if (commandFunction.apply(_this, args) === false)
                    callEditCallback = false;
            }
            if (callEditCallback && _this.editAssetCallbacks != null) {
                var editCallback = _this.editAssetCallbacks.tileSet[command];
                if (editCallback != null)
                    editCallback.apply(null, args);
            }
        };
        this._onTileSetAssetTrashed = function (assetId) {
            _this.tileSetRenderer.setTileSet(null);
            if (_this.editAssetCallbacks != null) {
                // FIXME: We should probably have a this.trashAssetCallback instead
                // and let editors handle things how they want
                SupClient.onAssetTrashed();
            }
        };
        this.client = client;
        this.tileSetRenderer = tileSetRenderer;
        this.receiveAssetCallbacks = receiveAssetCallbacks;
        this.editAssetCallbacks = editAssetCallbacks;
        this.tileSetAssetId = config.tileSetAssetId;
        this.tileSetSubscriber = {
            onAssetReceived: this._onTileSetAssetReceived,
            onAssetEdited: this._onTileSetAssetEdited,
            onAssetTrashed: this._onTileSetAssetTrashed
        };
        if (this.tileSetAssetId != null)
            this.client.subAsset(this.tileSetAssetId, "tileSet", this.tileSetSubscriber);
    }
    TileSetRendererUpdater.prototype.destroy = function () {
        if (this.tileSetAssetId != null) {
            this.client.unsubAsset(this.tileSetAssetId, this.tileSetSubscriber);
        }
    };
    TileSetRendererUpdater.prototype.changeTileSetId = function (tileSetId) {
        if (this.tileSetAssetId != null)
            this.client.unsubAsset(this.tileSetAssetId, this.tileSetSubscriber);
        this.tileSetAssetId = tileSetId;
        this.tileSetAsset = null;
        this.tileSetRenderer.setTileSet(null);
        this.tileSetRenderer.gridRenderer.resize(1, 1);
        if (this.tileSetAssetId != null)
            this.client.subAsset(this.tileSetAssetId, "tileSet", this.tileSetSubscriber);
    };
    TileSetRendererUpdater.prototype._prepareTexture = function (texture, callback) {
        if (texture == null) {
            callback();
            return;
        }
        if (texture.image.complete)
            callback();
        else
            texture.image.addEventListener("load", callback);
    };
    TileSetRendererUpdater.prototype._onEditCommand_upload = function () {
        var _this = this;
        var texture = this.tileSetAsset.pub.texture;
        this._prepareTexture(texture, function () {
            _this.tileSetRenderer.setTileSet(new TileSet_1.default(_this.tileSetAsset.pub));
            var width = texture.image.width / _this.tileSetAsset.pub.grid.width;
            var height = texture.image.height / _this.tileSetAsset.pub.grid.height;
            _this.tileSetRenderer.gridRenderer.resize(width, height);
            _this.tileSetRenderer.gridRenderer.setRatio({ x: 1, y: _this.tileSetAsset.pub.grid.width / _this.tileSetAsset.pub.grid.height });
            var editCallback = (_this.editAssetCallbacks != null) ? _this.editAssetCallbacks.tileSet["upload"] : null;
            if (editCallback != null)
                editCallback();
        });
    };
    TileSetRendererUpdater.prototype._onEditCommand_setProperty = function (key, value) {
        switch (key) {
            case "grid.width":
            case "grid.height":
                this.tileSetRenderer.refreshScaleRatio();
                var width = this.tileSetAsset.pub.texture.image.width / this.tileSetAsset.pub.grid.width;
                var height = this.tileSetAsset.pub.texture.image.height / this.tileSetAsset.pub.grid.height;
                this.tileSetRenderer.gridRenderer.resize(width, height);
                this.tileSetRenderer.gridRenderer.setRatio({ x: 1, y: this.tileSetAsset.pub.grid.width / this.tileSetAsset.pub.grid.height });
                break;
        }
    };
    return TileSetRendererUpdater;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TileSetRendererUpdater;
