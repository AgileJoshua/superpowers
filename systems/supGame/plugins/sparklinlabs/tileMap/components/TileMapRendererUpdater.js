var THREE = SupEngine.THREE;
var TileMap_1 = require("./TileMap");
var TileSet_1 = require("./TileSet");
var TileMapRendererUpdater = (function () {
    function TileMapRendererUpdater(client, tileMapRenderer, config, receiveAssetCallbacks, editAssetCallbacks) {
        var _this = this;
        this.shaderSubscriber = {
            onAssetReceived: this._onShaderAssetReceived.bind(this),
            onAssetEdited: this._onShaderAssetEdited.bind(this),
            onAssetTrashed: this._onShaderAssetTrashed.bind(this)
        };
        this._onTileMapAssetReceived = function (assetId, asset) {
            _this.tileMapAsset = asset;
            _this._setTileMap();
            if (_this.tileMapAsset.pub.tileSetId != null)
                _this.client.subAsset(_this.tileMapAsset.pub.tileSetId, "tileSet", _this.tileSetSubscriber);
            if (_this.receiveAssetCallbacks != null && _this.receiveAssetCallbacks.tileMap != null)
                _this.receiveAssetCallbacks.tileMap();
        };
        this._onTileMapAssetEdited = function (id, command) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            if (_this.tileSetAsset != null || command === "changeTileSet") {
                var commandFunction = _this[("_onEditCommand_" + command)];
                if (commandFunction != null)
                    commandFunction.apply(_this, args);
            }
            if (_this.editAssetCallbacks != null && _this.editAssetCallbacks.tileMap != null) {
                var editCallback = _this.editAssetCallbacks.tileMap[command];
                if (editCallback != null)
                    editCallback.apply(null, args);
            }
        };
        this._onTileMapAssetTrashed = function (assetId) {
            _this.tileMapRenderer.setTileMap(null);
            if (_this.editAssetCallbacks != null) {
                // FIXME: We should probably have a this.trashAssetCallback instead
                // and let editors handle things how they want
                SupClient.onAssetTrashed();
            }
        };
        this._onTileSetAssetReceived = function (assetId, asset) {
            _this._prepareTexture(asset.pub.texture, function () {
                _this.tileSetAsset = asset;
                _this.tileMapRenderer.setTileSet(new TileSet_1.default(asset.pub));
                if (_this.receiveAssetCallbacks != null && _this.receiveAssetCallbacks.tileSet != null)
                    _this.receiveAssetCallbacks.tileSet();
            });
        };
        this._onTileSetAssetEdited = function (id, command) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            var commandFunction = _this[("_onTileSetEditCommand_" + command)];
            if (commandFunction != null)
                commandFunction.apply(_this, args);
            if (_this.editAssetCallbacks != null && _this.editAssetCallbacks.tileSet != null) {
                var editCallback = _this.editAssetCallbacks.tileSet[command];
                if (editCallback != null)
                    editCallback.apply(null, args);
            }
        };
        this._onTileSetAssetTrashed = function (assetId) {
            _this.tileMapRenderer.setTileSet(null);
        };
        this.client = client;
        this.tileMapRenderer = tileMapRenderer;
        this.receiveAssetCallbacks = receiveAssetCallbacks;
        this.editAssetCallbacks = editAssetCallbacks;
        this.tileMapAssetId = config.tileMapAssetId;
        this.tileSetAssetId = config.tileSetAssetId;
        this.materialType = config.materialType;
        this.shaderAssetId = config.shaderAssetId;
        this.tileMapSubscriber = {
            onAssetReceived: this._onTileMapAssetReceived,
            onAssetEdited: this._onTileMapAssetEdited,
            onAssetTrashed: this._onTileMapAssetTrashed
        };
        this.tileSetSubscriber = {
            onAssetReceived: this._onTileSetAssetReceived,
            onAssetEdited: this._onTileSetAssetEdited,
            onAssetTrashed: this._onTileSetAssetTrashed
        };
        this.tileMapRenderer.receiveShadow = config.receiveShadow;
        if (this.tileMapAssetId != null)
            this.client.subAsset(this.tileMapAssetId, "tileMap", this.tileMapSubscriber);
        if (this.shaderAssetId != null)
            this.client.subAsset(this.shaderAssetId, "shader", this.shaderSubscriber);
    }
    TileMapRendererUpdater.prototype.destroy = function () {
        if (this.tileMapAssetId != null)
            this.client.unsubAsset(this.tileMapAssetId, this.tileMapSubscriber);
        if (this.tileSetAssetId != null) {
            this.client.unsubAsset(this.tileSetAssetId, this.tileSetSubscriber);
        }
        if (this.shaderAssetId != null)
            this.client.unsubAsset(this.shaderAssetId, this.shaderSubscriber);
    };
    TileMapRendererUpdater.prototype._setTileMap = function () {
        if (this.tileMapAsset == null || (this.materialType === "shader" && this.shaderPub == null)) {
            this.tileMapRenderer.setTileMap(null);
            return;
        }
        this.tileMapRenderer.setTileMap(new TileMap_1.default(this.tileMapAsset.pub), this.materialType, this.shaderPub);
    };
    TileMapRendererUpdater.prototype._onEditCommand_changeTileSet = function () {
        if (this.tileSetAssetId != null)
            this.client.unsubAsset(this.tileSetAssetId, this.tileSetSubscriber);
        this.tileSetAsset = null;
        this.tileMapRenderer.setTileSet(null);
        this.tileSetAssetId = this.tileMapAsset.pub.tileSetId;
        if (this.tileSetAssetId != null)
            this.client.subAsset(this.tileSetAssetId, "tileSet", this.tileSetSubscriber);
    };
    TileMapRendererUpdater.prototype._onEditCommand_resizeMap = function () { this._setTileMap(); };
    TileMapRendererUpdater.prototype._onEditCommand_moveMap = function () {
        this.tileMapRenderer.refreshEntireMap();
    };
    TileMapRendererUpdater.prototype._onEditCommand_setProperty = function (path, value) {
        switch (path) {
            case "pixelsPerUnit":
                this.tileMapRenderer.refreshPixelsPerUnit(value);
                break;
            case "layerDepthOffset":
                this.tileMapRenderer.refreshLayersDepth();
                break;
        }
    };
    TileMapRendererUpdater.prototype._onEditCommand_editMap = function (layerId, edits) {
        var index = this.tileMapAsset.pub.layers.indexOf(this.tileMapAsset.layers.byId[layerId]);
        for (var _i = 0; _i < edits.length; _i++) {
            var edit = edits[_i];
            this.tileMapRenderer.refreshTileAt(index, edit.x, edit.y);
        }
    };
    TileMapRendererUpdater.prototype._onEditCommand_newLayer = function (layer, index) {
        this.tileMapRenderer.addLayer(layer.id, index);
    };
    TileMapRendererUpdater.prototype._onEditCommand_deleteLayer = function (id, index) {
        this.tileMapRenderer.deleteLayer(index);
    };
    TileMapRendererUpdater.prototype._onEditCommand_moveLayer = function (id, newIndex) {
        this.tileMapRenderer.moveLayer(id, newIndex);
    };
    TileMapRendererUpdater.prototype._prepareTexture = function (texture, callback) {
        if (texture == null) {
            callback();
            return;
        }
        if (texture.image.complete)
            callback();
        else
            texture.image.addEventListener("load", callback);
    };
    TileMapRendererUpdater.prototype._onTileSetEditCommand_upload = function () {
        var _this = this;
        this._prepareTexture(this.tileSetAsset.pub.texture, function () {
            _this.tileMapRenderer.setTileSet(new TileSet_1.default(_this.tileSetAsset.pub));
        });
    };
    TileMapRendererUpdater.prototype._onTileSetEditCommand_setProperty = function () {
        this.tileMapRenderer.setTileSet(new TileSet_1.default(this.tileSetAsset.pub));
    };
    TileMapRendererUpdater.prototype._onShaderAssetReceived = function (assetId, asset) {
        this.shaderPub = asset.pub;
        this._setTileMap();
    };
    TileMapRendererUpdater.prototype._onShaderAssetEdited = function (id, command) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        if (command !== "editVertexShader" && command !== "editFragmentShader")
            this._setTileMap();
    };
    TileMapRendererUpdater.prototype._onShaderAssetTrashed = function () {
        this.shaderPub = null;
        this._setTileMap();
    };
    TileMapRendererUpdater.prototype.config_setProperty = function (path, value) {
        switch (path) {
            case "tileMapAssetId":
                if (this.tileMapAssetId != null)
                    this.client.unsubAsset(this.tileMapAssetId, this.tileMapSubscriber);
                this.tileMapAssetId = value;
                this.tileMapAsset = null;
                this.tileMapRenderer.setTileMap(null);
                if (this.tileSetAssetId != null)
                    this.client.unsubAsset(this.tileSetAssetId, this.tileSetSubscriber);
                this.tileSetAsset = null;
                this.tileMapRenderer.setTileSet(null);
                if (this.tileMapAssetId != null)
                    this.client.subAsset(this.tileMapAssetId, "tileMap", this.tileMapSubscriber);
                break;
            // case "tileSetAssetId":
            case "castShadow":
                this.tileMapRenderer.setCastShadow(value);
                break;
            case "receiveShadow":
                this.tileMapRenderer.setReceiveShadow(value);
                break;
            case "materialType":
                this.materialType = value;
                this._setTileMap();
                break;
            case "shaderAssetId":
                if (this.shaderAssetId != null)
                    this.client.unsubAsset(this.shaderAssetId, this.shaderSubscriber);
                this.shaderAssetId = value;
                this.shaderPub = null;
                this.tileMapRenderer.setTileMap(null);
                if (this.shaderAssetId != null)
                    this.client.subAsset(this.shaderAssetId, "shader", this.shaderSubscriber);
                break;
        }
    };
    return TileMapRendererUpdater;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TileMapRendererUpdater;
