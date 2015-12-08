var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var THREE = SupEngine.THREE;
var TextRendererUpdater_1 = require("./TextRendererUpdater");
var TextRendererGeometry_1 = require("./TextRendererGeometry");
var TextRenderer = (function (_super) {
    __extends(TextRenderer, _super);
    function TextRenderer(actor) {
        _super.call(this, actor, "TextRenderer");
        this.threeMeshes = [];
        this.opacity = 1;
    }
    TextRenderer.prototype.setText = function (text) {
        this.text = text;
        this._createMesh();
    };
    TextRenderer.prototype.setFont = function (font) {
        this.font = font;
        this._createMesh();
    };
    TextRenderer.prototype.setOptions = function (options) {
        if (options.alignment == null)
            options.alignment = "center";
        if (options.verticalAlignment == null)
            options.verticalAlignment = "center";
        this.options = options;
        this._createMesh();
    };
    TextRenderer.prototype.setOpacity = function (opacity) {
        this.opacity = opacity;
        for (var _i = 0, _a = this.threeMeshes; _i < _a.length; _i++) {
            var mesh = _a[_i];
            mesh.material.opacity = this.opacity;
        }
    };
    TextRenderer.prototype._createMesh = function () {
        this.clearMesh();
        if (this.text == null || this.font == null)
            return;
        if (this.font.isBitmap)
            this._createBitmapMesh();
        else
            this._createFontMesh();
        for (var _i = 0, _a = this.threeMeshes; _i < _a.length; _i++) {
            var threeMesh = _a[_i];
            this.actor.threeObject.add(threeMesh);
            var scale = 1 / this.font.pixelsPerUnit;
            threeMesh.scale.set(scale, scale, scale);
            threeMesh.updateMatrixWorld(false);
        }
    };
    TextRenderer.prototype._createFontMesh = function () {
        var fontSize = (this.options.size != null) ? this.options.size : this.font.size;
        var texts = this.text.split("\n");
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        ctx.font = fontSize + "px " + this.font.name;
        var width = 1;
        for (var _i = 0; _i < texts.length; _i++) {
            var text = texts[_i];
            width = Math.max(width, ctx.measureText(text).width);
        }
        // Arbitrary value that should be enough for most fonts
        // We might want to make it configurable in the future
        var heightBorder = fontSize * 0.2;
        var heightWithoutBorder = fontSize * texts.length;
        var height = heightWithoutBorder + heightBorder * 2;
        canvas.width = width;
        canvas.height = height;
        var color = (this.options.color != null) ? this.options.color : this.font.color;
        ctx.fillStyle = "#" + color;
        ctx.font = fontSize + "px " + this.font.name;
        ctx.textBaseline = "middle";
        ctx.textAlign = this.options.alignment;
        var x = width / 2;
        switch (this.options.alignment) {
            case "left":
                x = 0;
                break;
            case "right":
                x = width;
                break;
        }
        for (var index = 0; index < texts.length; index++) {
            ctx.fillText(texts[index], x, heightBorder + (0.5 + (index - (texts.length - 1) / 2) / texts.length) * heightWithoutBorder);
        }
        this.texture = new THREE.Texture(canvas);
        if (this.font.filtering === "pixelated") {
            this.texture.magFilter = SupEngine.THREE.NearestFilter;
            this.texture.minFilter = SupEngine.THREE.NearestFilter;
        }
        else {
            // See https://github.com/mrdoob/three.js/blob/4582bf1276c30c238e415cb79f4871e8560d102d/src/renderers/WebGLRenderer.js#L5664
            this.texture.minFilter = SupEngine.THREE.LinearFilter;
        }
        this.texture.needsUpdate = true;
        var geometry = new THREE.PlaneBufferGeometry(width, height);
        var material = new THREE.MeshBasicMaterial({
            map: this.texture,
            alphaTest: 0.01,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: this.opacity
        });
        this.threeMeshes[0] = new THREE.Mesh(geometry, material);
        switch (this.options.alignment) {
            case "left":
                this.threeMeshes[0].position.setX(width / 2 / this.font.pixelsPerUnit);
                break;
            case "right":
                this.threeMeshes[0].position.setX(-width / 2 / this.font.pixelsPerUnit);
                break;
        }
        switch (this.options.verticalAlignment) {
            case "top":
                this.threeMeshes[0].position.setY(-height / 2 / this.font.pixelsPerUnit);
                break;
            case "bottom":
                this.threeMeshes[0].position.setY(height / 2 / this.font.pixelsPerUnit);
                break;
        }
    };
    TextRenderer.prototype._createBitmapMesh = function () {
        var texts = this.text.split("\n");
        for (var index = 0; index < texts.length; index++) {
            var text = texts[index];
            var geometry = new TextRendererGeometry_1.default(this.font.gridWidth * text.length, this.font.gridHeight, text.length, 1);
            var material = new THREE.MeshBasicMaterial({
                map: this.font.texture,
                alphaTest: 0.1,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: this.opacity
            });
            this.threeMeshes[index] = new THREE.Mesh(geometry, material);
            switch (this.options.alignment) {
                case "center":
                    this.threeMeshes[index].position.setX(-geometry.width / 2 / this.font.pixelsPerUnit);
                    break;
                case "right":
                    this.threeMeshes[index].position.setX(-geometry.width / this.font.pixelsPerUnit);
                    break;
            }
            var y = void 0;
            switch (this.options.verticalAlignment) {
                case "center":
                    y = (0.5 + (index - (texts.length - 1) / 2)) * this.font.gridHeight / this.font.pixelsPerUnit;
                    break;
                case "top":
                    y = (1 + index) * this.font.gridHeight / this.font.pixelsPerUnit;
                    break;
                case "bottom":
                    y = (index - texts.length + 1) * this.font.gridHeight / this.font.pixelsPerUnit;
                    break;
            }
            this.threeMeshes[index].position.setY(-y);
            var uvs = geometry.getAttribute("uv");
            uvs.needsUpdate = true;
            var charsByRow = this.font.texture.image.width / this.font.gridWidth;
            for (var x = 0; x < text.length; x++) {
                var index_1 = void 0;
                if (this.font.charset == null)
                    index_1 = text.charCodeAt(x) - this.font.charsetOffset;
                else
                    index_1 = this.font.charset.indexOf(text[x]);
                var tileX = index_1 % charsByRow;
                var tileY = Math.floor(index_1 / charsByRow);
                var left = ((tileX) * this.font.gridWidth + 0.2) / this.font.texture.image.width;
                var right = ((tileX + 1) * this.font.gridWidth - 0.2) / this.font.texture.image.width;
                var bottom = 1 - ((tileY + 1) * this.font.gridHeight - 0.2) / this.font.texture.image.height;
                var top_1 = 1 - (tileY * this.font.gridHeight + 0.2) / this.font.texture.image.height;
                uvs.array[x * 8 + 0] = left;
                uvs.array[x * 8 + 1] = bottom;
                uvs.array[x * 8 + 2] = right;
                uvs.array[x * 8 + 3] = bottom;
                uvs.array[x * 8 + 4] = right;
                uvs.array[x * 8 + 5] = top_1;
                uvs.array[x * 8 + 6] = left;
                uvs.array[x * 8 + 7] = top_1;
            }
        }
    };
    TextRenderer.prototype.clearMesh = function () {
        for (var _i = 0, _a = this.threeMeshes; _i < _a.length; _i++) {
            var threeMesh = _a[_i];
            this.actor.threeObject.remove(threeMesh);
            threeMesh.geometry.dispose();
            threeMesh.material.dispose();
            threeMesh = null;
        }
        this.threeMeshes.length = 0;
        if (this.texture != null) {
            this.texture.dispose();
            this.texture = null;
        }
    };
    TextRenderer.prototype._destroy = function () {
        this.clearMesh();
        _super.prototype._destroy.call(this);
    };
    TextRenderer.prototype.setIsLayerActive = function (active) { for (var _i = 0, _a = this.threeMeshes; _i < _a.length; _i++) {
        var threeMesh = _a[_i];
        threeMesh.visible = active;
    } };
    TextRenderer.Updater = TextRendererUpdater_1.default;
    return TextRenderer;
})(SupEngine.ActorComponent);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TextRenderer;
