var THREE = SupEngine.THREE;
var ModelRendererUpdater = (function () {
    function ModelRendererUpdater(client, modelRenderer, config, receiveAssetCallbacks, editAssetCallbacks) {
        this.overrideOpacity = false;
        this.modelAsset = null;
        this.mapObjectURLs = {};
        this.modelSubscriber = {
            onAssetReceived: this._onModelAssetReceived.bind(this),
            onAssetEdited: this._onModelAssetEdited.bind(this),
            onAssetTrashed: this._onModelAssetTrashed.bind(this)
        };
        this.shaderSubscriber = {
            onAssetReceived: this._onShaderAssetReceived.bind(this),
            onAssetEdited: this._onShaderAssetEdited.bind(this),
            onAssetTrashed: this._onShaderAssetTrashed.bind(this)
        };
        this.client = client;
        this.modelRenderer = modelRenderer;
        this.receiveAssetCallbacks = receiveAssetCallbacks;
        this.editAssetCallbacks = editAssetCallbacks;
        this.modelAssetId = config.modelAssetId;
        this.animationId = config.animationId;
        this.materialType = config.materialType;
        this.shaderAssetId = config.shaderAssetId;
        if (config.overrideOpacity != null)
            this.overrideOpacity = config.overrideOpacity;
        this.modelRenderer.castShadow = config.castShadow;
        this.modelRenderer.receiveShadow = config.receiveShadow;
        if (config.overrideOpacity)
            this.modelRenderer.opacity = config.opacity;
        if (config.color != null) {
            var hex = parseInt(config.color, 16);
            this.modelRenderer.color.r = (hex >> 16 & 255) / 255;
            this.modelRenderer.color.g = (hex >> 8 & 255) / 255;
            this.modelRenderer.color.b = (hex & 255) / 255;
        }
        if (this.modelAssetId != null)
            this.client.subAsset(this.modelAssetId, "model", this.modelSubscriber);
        if (this.shaderAssetId != null)
            this.client.subAsset(this.shaderAssetId, "shader", this.shaderSubscriber);
    }
    ModelRendererUpdater.prototype.destroy = function () {
        if (this.modelAssetId != null)
            this.client.unsubAsset(this.modelAssetId, this.modelSubscriber);
        if (this.shaderAssetId != null)
            this.client.unsubAsset(this.shaderAssetId, this.shaderSubscriber);
    };
    ModelRendererUpdater.prototype._onModelAssetReceived = function (assetId, asset) {
        var _this = this;
        if (this.modelRenderer.opacity == null)
            this.modelRenderer.opacity = asset.pub.opacity;
        this._prepareMaps(asset.pub.textures, function () {
            _this.modelAsset = asset;
            _this._setModel();
            if (_this.receiveAssetCallbacks != null)
                _this.receiveAssetCallbacks.model();
        });
    };
    ModelRendererUpdater.prototype._prepareMaps = function (textures, callback) {
        var textureNames = Object.keys(textures);
        var texturesToLoad = textureNames.length;
        if (texturesToLoad === 0) {
            callback();
            return;
        }
        function onTextureLoaded() {
            texturesToLoad--;
            if (texturesToLoad === 0)
                callback();
        }
        textureNames.forEach(function (key) {
            var image = textures[key].image;
            if (!image.complete)
                image.addEventListener("load", onTextureLoaded);
            else
                onTextureLoaded();
        });
    };
    ModelRendererUpdater.prototype._setModel = function () {
        if (this.modelAsset == null || (this.materialType === "shader" && this.shaderPub == null)) {
            this.modelRenderer.setModel(null);
            return;
        }
        this.modelRenderer.setModel(this.modelAsset.pub, this.materialType, this.shaderPub);
        if (this.animationId != null)
            this._playAnimation();
    };
    ModelRendererUpdater.prototype._playAnimation = function () {
        var animation = this.modelAsset.animations.byId[this.animationId];
        this.modelRenderer.setAnimation((animation != null) ? animation.name : null);
    };
    ModelRendererUpdater.prototype._onModelAssetEdited = function (id, command) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        var commandCallback = this[("_onEditCommand_" + command)];
        if (commandCallback != null)
            commandCallback.apply(this, args);
        if (this.editAssetCallbacks != null) {
            var editCallback = this.editAssetCallbacks.model[command];
            if (editCallback != null)
                editCallback.apply(null, args);
        }
    };
    ModelRendererUpdater.prototype._onEditCommand_setModel = function () {
        this._setModel();
    };
    ModelRendererUpdater.prototype._onEditCommand_setMaps = function (maps) {
        var _this = this;
        // TODO: Only update the maps that changed, don't recreate the whole model
        this._prepareMaps(this.modelAsset.pub.textures, function () {
            _this._setModel();
        });
    };
    ModelRendererUpdater.prototype._onEditCommand_newAnimation = function (animation, index) {
        this.modelRenderer.updateAnimationsByName();
        this._playAnimation();
    };
    ModelRendererUpdater.prototype._onEditCommand_deleteAnimation = function (id) {
        this.modelRenderer.updateAnimationsByName();
        this._playAnimation();
    };
    ModelRendererUpdater.prototype._onEditCommand_setAnimationProperty = function (id, key, value) {
        this.modelRenderer.updateAnimationsByName();
        this._playAnimation();
    };
    ModelRendererUpdater.prototype._onEditCommand_setMapSlot = function (slot, name) { this._setModel(); };
    ModelRendererUpdater.prototype._onEditCommand_deleteMap = function (name) { this._setModel(); };
    ModelRendererUpdater.prototype._onEditCommand_setProperty = function (path, value) {
        switch (path) {
            case "unitRatio":
                this.modelRenderer.setUnitRatio(value);
                break;
            case "opacity":
                if (!this.overrideOpacity)
                    this.modelRenderer.setOpacity(value);
                break;
        }
    };
    ModelRendererUpdater.prototype._onModelAssetTrashed = function () {
        this.modelAsset = null;
        this.modelRenderer.setModel(null);
        // FIXME: the updater shouldn't be dealing with SupClient.onAssetTrashed directly
        if (this.editAssetCallbacks != null)
            SupClient.onAssetTrashed();
    };
    ModelRendererUpdater.prototype._onShaderAssetReceived = function (assetId, asset) {
        this.shaderPub = asset.pub;
        this._setModel();
    };
    ModelRendererUpdater.prototype._onShaderAssetEdited = function (id, command) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        if (command !== "editVertexShader" && command !== "editFragmentShader")
            this._setModel();
    };
    ModelRendererUpdater.prototype._onShaderAssetTrashed = function () {
        this.shaderPub = null;
        this._setModel();
    };
    ModelRendererUpdater.prototype.config_setProperty = function (path, value) {
        switch (path) {
            case "modelAssetId":
                if (this.modelAssetId != null)
                    this.client.unsubAsset(this.modelAssetId, this.modelSubscriber);
                this.modelAssetId = value;
                this.modelAsset = null;
                this.modelRenderer.setModel(null, null);
                if (this.modelAssetId != null)
                    this.client.subAsset(this.modelAssetId, "model", this.modelSubscriber);
                break;
            case "animationId":
                this.animationId = value;
                if (this.modelAsset != null)
                    this._playAnimation();
                break;
            case "castShadow":
                this.modelRenderer.setCastShadow(value);
                break;
            case "receiveShadow":
                this.modelRenderer.threeMesh.receiveShadow = value;
                this.modelRenderer.threeMesh.material.needsUpdate = true;
                break;
            case "overrideOpacity":
                this.overrideOpacity = value;
                this.modelRenderer.setOpacity(value ? null : this.modelAsset.pub.opacity);
                break;
            case "opacity":
                this.modelRenderer.setOpacity(value);
                break;
            case "color":
                var hex = parseInt(value, 16);
                this.modelRenderer.setColor((hex >> 16 & 255) / 255, (hex >> 8 & 255) / 255, (hex & 255) / 255);
                break;
            case "materialType":
                this.materialType = value;
                this._setModel();
                break;
            case "shaderAssetId":
                if (this.shaderAssetId != null)
                    this.client.unsubAsset(this.shaderAssetId, this.shaderSubscriber);
                this.shaderAssetId = value;
                this.shaderPub = null;
                this.modelRenderer.setModel(null);
                if (this.shaderAssetId != null)
                    this.client.subAsset(this.shaderAssetId, "shader", this.shaderSubscriber);
                break;
        }
    };
    return ModelRendererUpdater;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ModelRendererUpdater;
