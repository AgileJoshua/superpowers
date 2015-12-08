var THREE = SupEngine.THREE;
var SpriteRendererUpdater = (function () {
    function SpriteRendererUpdater(client, spriteRenderer, config, receiveAssetCallbacks, editAssetCallbacks) {
        this.looping = true;
        this.overrideOpacity = false;
        this.spriteSubscriber = {
            onAssetReceived: this._onSpriteAssetReceived.bind(this),
            onAssetEdited: this._onSpriteAssetEdited.bind(this),
            onAssetTrashed: this._onSpriteAssetTrashed.bind(this)
        };
        this.shaderSubscriber = {
            onAssetReceived: this._onShaderAssetReceived.bind(this),
            onAssetEdited: this._onShaderAssetEdited.bind(this),
            onAssetTrashed: this._onShaderAssetTrashed.bind(this)
        };
        this.client = client;
        this.spriteRenderer = spriteRenderer;
        this.receiveAssetCallbacks = receiveAssetCallbacks;
        this.editAssetCallbacks = editAssetCallbacks;
        this.spriteAssetId = config.spriteAssetId;
        this.animationId = config.animationId;
        this.materialType = config.materialType;
        this.shaderAssetId = config.shaderAssetId;
        if (config.overrideOpacity != null)
            this.overrideOpacity = config.overrideOpacity;
        this.spriteAsset = null;
        this.spriteRenderer.horizontalFlip = config.horizontalFlip;
        this.spriteRenderer.verticalFlip = config.verticalFlip;
        this.spriteRenderer.castShadow = config.castShadow;
        this.spriteRenderer.receiveShadow = config.receiveShadow;
        if (config.overrideOpacity)
            this.spriteRenderer.opacity = config.opacity;
        if (config.color != null) {
            var hex = parseInt(config.color, 16);
            this.spriteRenderer.color.r = (hex >> 16 & 255) / 255;
            this.spriteRenderer.color.g = (hex >> 8 & 255) / 255;
            this.spriteRenderer.color.b = (hex & 255) / 255;
        }
        if (this.spriteAssetId != null)
            this.client.subAsset(this.spriteAssetId, "sprite", this.spriteSubscriber);
        if (this.shaderAssetId != null)
            this.client.subAsset(this.shaderAssetId, "shader", this.shaderSubscriber);
    }
    SpriteRendererUpdater.prototype.destroy = function () {
        if (this.spriteAssetId != null)
            this.client.unsubAsset(this.spriteAssetId, this.spriteSubscriber);
        if (this.shaderAssetId != null)
            this.client.unsubAsset(this.shaderAssetId, this.shaderSubscriber);
    };
    SpriteRendererUpdater.prototype._onSpriteAssetReceived = function (assetId, asset) {
        var _this = this;
        if (this.spriteRenderer.opacity == null)
            this.spriteRenderer.opacity = asset.pub.opacity;
        this._prepareMaps(asset.pub.textures, function () {
            _this.spriteAsset = asset;
            _this._setSprite();
            if (_this.receiveAssetCallbacks != null)
                _this.receiveAssetCallbacks.sprite();
        });
    };
    SpriteRendererUpdater.prototype._prepareMaps = function (textures, callback) {
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
    SpriteRendererUpdater.prototype._setSprite = function () {
        if (this.spriteAsset == null || (this.materialType === "shader" && this.shaderPub == null)) {
            this.spriteRenderer.setSprite(null);
            return;
        }
        this.spriteRenderer.setSprite(this.spriteAsset.pub, this.materialType, this.shaderPub);
        if (this.animationId != null)
            this._playAnimation();
    };
    SpriteRendererUpdater.prototype._playAnimation = function () {
        var animation = this.spriteAsset.animations.byId[this.animationId];
        if (animation == null)
            return;
        this.spriteRenderer.setAnimation(animation.name, this.looping);
    };
    SpriteRendererUpdater.prototype._onSpriteAssetEdited = function (id, command) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        var callEditCallback = true;
        var commandFunction = this[("_onEditCommand_" + command)];
        if (commandFunction != null) {
            if (commandFunction.apply(this, args) === false)
                callEditCallback = false;
        }
        if (callEditCallback && this.editAssetCallbacks != null) {
            var editCallback = this.editAssetCallbacks.sprite[command];
            if (editCallback != null)
                editCallback.apply(null, args);
        }
    };
    SpriteRendererUpdater.prototype._onEditCommand_setMaps = function (maps) {
        var _this = this;
        // TODO: Only update the maps that changed, don't recreate the whole model
        this._prepareMaps(this.spriteAsset.pub.textures, function () {
            _this._setSprite();
            var editCallback = (_this.editAssetCallbacks != null) ? _this.editAssetCallbacks.sprite["setMaps"] : null;
            if (editCallback != null)
                editCallback();
        });
        return false;
    };
    SpriteRendererUpdater.prototype._onEditCommand_setMapSlot = function (slot, name) { this._setSprite(); };
    SpriteRendererUpdater.prototype._onEditCommand_deleteMap = function (name) { this._setSprite(); };
    SpriteRendererUpdater.prototype._onEditCommand_setProperty = function (path, value) {
        switch (path) {
            case "filtering":
                break;
            case "opacity":
                if (!this.overrideOpacity)
                    this.spriteRenderer.setOpacity(value);
                break;
            case "alphaTest":
                this.spriteRenderer.material.alphaTest = value;
                this.spriteRenderer.material.needsUpdate = true;
                break;
            case "pixelsPerUnit":
            case "origin.x":
            case "origin.y":
                this.spriteRenderer.updateShape();
                break;
            default:
                this._setSprite();
                break;
        }
    };
    SpriteRendererUpdater.prototype._onEditCommand_newAnimation = function () {
        this.spriteRenderer.updateAnimationsByName();
        this._playAnimation();
    };
    SpriteRendererUpdater.prototype._onEditCommand_deleteAnimation = function () {
        this.spriteRenderer.updateAnimationsByName();
        this._playAnimation();
    };
    SpriteRendererUpdater.prototype._onEditCommand_setAnimationProperty = function () {
        this.spriteRenderer.updateAnimationsByName();
        this._playAnimation();
    };
    SpriteRendererUpdater.prototype._onSpriteAssetTrashed = function () {
        this.spriteAsset = null;
        this.spriteRenderer.setSprite(null);
        // FIXME: the updater shouldn't be dealing with SupClient.onAssetTrashed directly
        if (this.editAssetCallbacks != null)
            SupClient.onAssetTrashed();
    };
    SpriteRendererUpdater.prototype._onShaderAssetReceived = function (assetId, asset) {
        this.shaderPub = asset.pub;
        this._setSprite();
    };
    SpriteRendererUpdater.prototype._onShaderAssetEdited = function (id, command) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        if (command !== "editVertexShader" && command !== "editFragmentShader")
            this._setSprite();
    };
    SpriteRendererUpdater.prototype._onShaderAssetTrashed = function () {
        this.shaderPub = null;
        this._setSprite();
    };
    SpriteRendererUpdater.prototype.config_setProperty = function (path, value) {
        switch (path) {
            case "spriteAssetId":
                if (this.spriteAssetId != null)
                    this.client.unsubAsset(this.spriteAssetId, this.spriteSubscriber);
                this.spriteAssetId = value;
                this.spriteAsset = null;
                this.spriteRenderer.setSprite(null);
                if (this.spriteAssetId != null)
                    this.client.subAsset(this.spriteAssetId, "sprite", this.spriteSubscriber);
                break;
            case "animationId":
                this.animationId = value;
                this._setSprite();
                break;
            case "looping":
                this.looping = value;
                if (this.animationId != null)
                    this._playAnimation();
                break;
            case "horizontalFlip":
                this.spriteRenderer.setHorizontalFlip(value);
                break;
            case "verticalFlip":
                this.spriteRenderer.setVerticalFlip(value);
                break;
            case "castShadow":
                this.spriteRenderer.setCastShadow(value);
                break;
            case "receiveShadow":
                this.spriteRenderer.receiveShadow = value;
                this.spriteRenderer.threeMesh.receiveShadow = value;
                this.spriteRenderer.threeMesh.material.needsUpdate = true;
                break;
            case "color":
                var hex = parseInt(value, 16);
                this.spriteRenderer.color.r = (hex >> 16 & 255) / 255;
                this.spriteRenderer.color.g = (hex >> 8 & 255) / 255;
                this.spriteRenderer.color.b = (hex & 255) / 255;
                var material = this.spriteRenderer.threeMesh.material;
                material.color.setRGB(this.spriteRenderer.color.r, this.spriteRenderer.color.g, this.spriteRenderer.color.b);
                material.needsUpdate = true;
                break;
            case "overrideOpacity":
                this.overrideOpacity = value;
                this.spriteRenderer.setOpacity(value ? null : this.spriteAsset.pub.opacity);
                break;
            case "opacity":
                this.spriteRenderer.setOpacity(value);
                break;
            case "materialType":
                this.materialType = value;
                this._setSprite();
                break;
            case "shaderAssetId":
                if (this.shaderAssetId != null)
                    this.client.unsubAsset(this.shaderAssetId, this.shaderSubscriber);
                this.shaderAssetId = value;
                this.shaderPub = null;
                this.spriteRenderer.setSprite(null);
                if (this.shaderAssetId != null)
                    this.client.subAsset(this.shaderAssetId, "shader", this.shaderSubscriber);
                break;
        }
    };
    return SpriteRendererUpdater;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SpriteRendererUpdater;
