var TextRendererUpdater = (function () {
    function TextRendererUpdater(client, textRenderer, config, receiveAssetCallbacks, editAssetCallbacks) {
        var _this = this;
        this._onFontAssetReceived = function (assetId, asset) {
            _this.fontAsset = asset;
            _this.textRenderer.setText(_this.text);
            _this.textRenderer.setOptions(_this.options);
            _this._setupFont();
            if (_this.receiveAssetCallbacks != null)
                _this.receiveAssetCallbacks.font(null);
        };
        this._onFontAssetEdited = function (id, command) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            var commandFunction = _this[("_onEditCommand_" + command)];
            if (commandFunction != null)
                commandFunction.apply(_this, args);
            if (_this.editAssetCallbacks != null) {
                var editCallback = _this.editAssetCallbacks.font[command];
                if (editCallback != null)
                    editCallback.apply(null, args);
            }
        };
        this._onFontAssetTrashed = function () {
            _this.textRenderer.clearMesh();
            if (_this.editAssetCallbacks != null)
                SupClient.onAssetTrashed();
        };
        this.client = client;
        this.textRenderer = textRenderer;
        this.receiveAssetCallbacks = receiveAssetCallbacks;
        this.editAssetCallbacks = editAssetCallbacks;
        this.fontAssetId = config.fontAssetId;
        this.text = config.text;
        this.options = { alignment: config.alignment, verticalAlignment: config.verticalAlignment, size: config.size, color: config.color };
        this.fontSubscriber = {
            onAssetReceived: this._onFontAssetReceived,
            onAssetEdited: this._onFontAssetEdited,
            onAssetTrashed: this._onFontAssetTrashed
        };
        if (this.fontAssetId != null)
            this.client.subAsset(this.fontAssetId, "font", this.fontSubscriber);
    }
    TextRendererUpdater.prototype.destroy = function () {
        if (this.fontAssetId != null)
            this.client.unsubAsset(this.fontAssetId, this.fontSubscriber);
    };
    TextRendererUpdater.prototype.config_setProperty = function (path, value) {
        switch (path) {
            case "fontAssetId": {
                if (this.fontAssetId != null)
                    this.client.unsubAsset(this.fontAssetId, this.fontSubscriber);
                this.fontAssetId = value;
                this.fontAsset = null;
                this.textRenderer.clearMesh();
                if (this.fontAssetId != null)
                    this.client.subAsset(this.fontAssetId, "font", this.fontSubscriber);
                break;
            }
            case "text": {
                this.text = value;
                this.textRenderer.setText(this.text);
                break;
            }
            case "alignment":
            case "verticalAlignment":
            case "size":
            case "color": {
                this.options[path] = (value !== "") ? value : null;
                this.textRenderer.setOptions(this.options);
                break;
            }
        }
    };
    TextRendererUpdater.prototype._setupFont = function () {
        var _this = this;
        this.textRenderer.clearMesh();
        if (this.fontAsset.pub.isBitmap) {
            if (this.fontAsset.pub.texture != null) {
                var image = this.fontAsset.pub.texture.image;
                if (image.complete)
                    this.textRenderer.setFont(this.fontAsset.pub);
                else
                    image.addEventListener("load", function () { _this.textRenderer.setFont(_this.fontAsset.pub); });
            }
        }
        else {
            if (this.fontAsset.font == null)
                this.textRenderer.setFont(this.fontAsset.pub);
            else {
                this.fontAsset.font.load().then(function () { _this.textRenderer.setFont(_this.fontAsset.pub); }, function () { _this.textRenderer.setFont(_this.fontAsset.pub); });
            }
        }
    };
    TextRendererUpdater.prototype._onEditCommand_upload = function () { this._setupFont(); };
    TextRendererUpdater.prototype._onEditCommand_setProperty = function (path) {
        if (path === "isBitmap")
            this._setupFont();
        else
            this.textRenderer.setFont(this.fontAsset.pub);
    };
    return TextRendererUpdater;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TextRendererUpdater;
