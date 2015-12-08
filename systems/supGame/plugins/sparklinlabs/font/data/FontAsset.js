var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var path = require("path");
var fs = require("fs");
// Reference to THREE, client-side only
var THREE;
if (global.window != null && global.window.SupEngine != null)
    THREE = global.window.SupEngine.THREE;
var FontAsset = (function (_super) {
    __extends(FontAsset, _super);
    function FontAsset(id, pub, server) {
        _super.call(this, id, pub, FontAsset.schema, server);
    }
    FontAsset.prototype.init = function (options, callback) {
        this.pub = {
            formatVersion: FontAsset.currentFormatVersion,
            isBitmap: false,
            filtering: "pixelated",
            pixelsPerUnit: 20,
            font: new Buffer(0),
            size: 32,
            color: "ffffff",
            bitmap: new Buffer(0),
            gridWidth: 16,
            gridHeight: 16,
            charset: null,
            charsetOffset: 32,
        };
        _super.prototype.init.call(this, options, callback);
    };
    FontAsset.prototype.load = function (assetPath) {
        var _this = this;
        fs.readFile(path.join(assetPath, "asset.json"), { encoding: "utf8" }, function (err, json) {
            var pub = JSON.parse(json);
            fs.readFile(path.join(assetPath, "font.dat"), function (err, buffer) {
                pub.font = buffer;
                fs.readFile(path.join(assetPath, "bitmap.dat"), function (err, buffer) {
                    pub.bitmap = buffer;
                    _this._onLoaded(assetPath, pub);
                });
            });
        });
    };
    FontAsset.prototype.migrate = function (assetPath, pub, callback) {
        if (pub.formatVersion === FontAsset.currentFormatVersion) {
            callback(false);
            return;
        }
        if (pub.formatVersion == null) {
            // NOTE: Legacy stuff from Superpowers 0.7
            if (pub.color == null || pub.color.length !== 6)
                pub.color = "ffffff";
            pub.formatVersion = 1;
        }
        callback(true);
    };
    FontAsset.prototype.client_load = function () { this._loadFont(); };
    FontAsset.prototype.client_unload = function () { this._unloadFont(); };
    FontAsset.prototype.save = function (assetPath, callback) {
        var font = this.pub.font;
        var bitmap = this.pub.bitmap;
        delete this.pub.font;
        delete this.pub.bitmap;
        var json = JSON.stringify(this.pub, null, 2);
        this.pub.font = font;
        this.pub.bitmap = bitmap;
        fs.writeFile(path.join(assetPath, "asset.json"), json, { encoding: "utf8" }, function () {
            fs.writeFile(path.join(assetPath, "font.dat"), font, function () {
                fs.writeFile(path.join(assetPath, "bitmap.dat"), bitmap, callback);
            });
        });
    };
    FontAsset.prototype._loadFont = function () {
        this._unloadFont();
        if (this.pub.isBitmap)
            this._loadBitmapFont();
        else
            this._loadTTFont();
    };
    FontAsset.prototype._unloadFont = function () {
        if (this.url != null)
            URL.revokeObjectURL(this.url);
        if (this.font != null)
            delete this.font;
        if (this.pub.texture != null) {
            this.pub.texture.dispose();
            this.pub.texture = null;
        }
    };
    FontAsset.prototype._loadTTFont = function () {
        if (this.pub.font.byteLength === 0)
            return;
        var typedArray = new Uint8Array(this.pub.font);
        var blob = new Blob([typedArray], { type: "font/*" });
        this.url = URL.createObjectURL(blob);
        this.pub.name = "Font" + this.id;
        this.font = new FontFace(this.pub.name, "url(" + this.url + ")");
        document.fonts.add(this.font);
    };
    FontAsset.prototype._loadBitmapFont = function () {
        var _this = this;
        if (this.pub.bitmap.byteLength === 0)
            return;
        var image = new Image();
        var typedArray = new Uint8Array(this.pub.bitmap);
        var blob = new Blob([typedArray], { type: "image/*" });
        this.url = URL.createObjectURL(blob);
        image.src = this.url;
        this.pub.texture = new THREE.Texture(image);
        if (this.pub.filtering === "pixelated") {
            this.pub.texture.magFilter = THREE.NearestFilter;
            this.pub.texture.minFilter = THREE.NearestFilter;
        }
        if (!image.complete)
            image.addEventListener("load", function () { _this.pub.texture.needsUpdate = true; });
    };
    FontAsset.prototype._setupFiltering = function () {
        if (this.pub.filtering === "pixelated") {
            this.pub.texture.magFilter = THREE.NearestFilter;
            this.pub.texture.minFilter = THREE.NearestFilter;
        }
        else {
            this.pub.texture.magFilter = THREE.LinearFilter;
            this.pub.texture.minFilter = THREE.LinearFilter;
        }
        this.pub.texture.needsUpdate = true;
    };
    FontAsset.prototype.server_upload = function (client, font, callback) {
        if (!(font instanceof Buffer)) {
            callback("Image must be an ArrayBuffer", null);
            return;
        }
        if (this.pub.isBitmap)
            this.pub.bitmap = font;
        else
            this.pub.font = font;
        callback(null, font);
        this.emit("change");
    };
    FontAsset.prototype.client_upload = function (font) {
        if (this.pub.isBitmap)
            this.pub.bitmap = font;
        else
            this.pub.font = font;
        this._loadFont();
    };
    FontAsset.prototype.client_setProperty = function (path, value) {
        _super.prototype.client_setProperty.call(this, path, value);
        if (path === "isBitmap")
            this._loadFont();
        if (path === "filtering")
            this._setupFiltering();
    };
    FontAsset.currentFormatVersion = 1;
    FontAsset.schema = {
        formatVersion: { type: "integer" },
        isBitmap: { type: "boolean", mutable: true },
        filtering: { type: "enum", items: ["pixelated", "smooth"], mutable: true },
        pixelsPerUnit: { type: "number", minExcluded: 0, mutable: true },
        font: { type: "buffer" },
        size: { type: "number", min: 1, mutable: true },
        color: { type: "string", length: 6, mutable: true },
        bitmap: { type: "buffer" },
        gridWidth: { type: "number", min: 1, mutable: true },
        gridHeight: { type: "number", min: 1, mutable: true },
        charset: { type: "string?", mutable: true },
        charsetOffset: { type: "number", min: 0, mutable: true },
    };
    return FontAsset;
})(SupCore.Data.Base.Asset);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FontAsset;
