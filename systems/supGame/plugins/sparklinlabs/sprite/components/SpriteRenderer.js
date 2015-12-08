var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var THREE = SupEngine.THREE;
var SpriteRendererUpdater_1 = require("./SpriteRendererUpdater");
var SpriteRenderer = (function (_super) {
    __extends(SpriteRenderer, _super);
    function SpriteRenderer(actor) {
        _super.call(this, actor, "SpriteRenderer");
        this.color = { r: 1, g: 1, b: 1 };
        this.hasFrameBeenUpdated = false;
        this.materialType = "basic";
        this.horizontalFlip = false;
        this.verticalFlip = false;
        this.castShadow = false;
        this.receiveShadow = false;
        this.playbackSpeed = 1;
    }
    SpriteRenderer.prototype.setSprite = function (asset, materialType, customShader) {
        this._clearMesh();
        this.asset = asset;
        if (materialType != null)
            this.materialType = materialType;
        this.animationName = null;
        this.animationsByName = {};
        if (this.asset == null || this.asset.textures[this.asset.mapSlots["map"]] == null)
            return;
        this.frameToSecond = this.actor.gameInstance.framesPerSecond / this.asset.framesPerSecond;
        this.updateAnimationsByName();
        this.geometry = new THREE.PlaneBufferGeometry(this.asset.grid.width, this.asset.grid.height);
        if (this.materialType === "shader") {
            this.material = SupEngine.componentClasses["Shader"].createShaderMaterial(customShader, this.asset.textures, this.geometry);
            this.material.map = this.asset.textures[this.asset.mapSlots["map"]];
        }
        else {
            var material;
            if (this.materialType === "basic")
                material = new THREE.MeshBasicMaterial();
            else if (this.materialType === "phong") {
                material = new THREE.MeshPhongMaterial();
                material.lightMap = this.asset.textures[this.asset.mapSlots["light"]];
            }
            material.map = this.asset.textures[this.asset.mapSlots["map"]];
            material.specularMap = this.asset.textures[this.asset.mapSlots["specular"]];
            material.alphaMap = this.asset.textures[this.asset.mapSlots["alpha"]];
            if (this.materialType === "phong")
                material.normalMap = this.asset.textures[this.asset.mapSlots["normal"]];
            material.alphaTest = this.asset.alphaTest;
            material.color.setRGB(this.color.r, this.color.g, this.color.b);
            this.material = material;
            this.setOpacity(this.opacity);
        }
        this.material.side = THREE.DoubleSide;
        this.threeMesh = new THREE.Mesh(this.geometry, this.material);
        this.setCastShadow(this.castShadow);
        this.threeMesh.receiveShadow = this.receiveShadow;
        this.setFrame(0);
        this.actor.threeObject.add(this.threeMesh);
        this.updateShape();
    };
    SpriteRenderer.prototype.updateShape = function () {
        if (this.threeMesh == null)
            return;
        var scaleRatio = 1 / this.asset.pixelsPerUnit;
        this.threeMesh.scale.set(scaleRatio, scaleRatio, scaleRatio);
        var x;
        if (this.horizontalFlip)
            x = this.asset.origin.x - 0.5;
        else
            x = 0.5 - this.asset.origin.x;
        var y;
        if (this.verticalFlip)
            y = this.asset.origin.y - 0.5;
        else
            y = 0.5 - this.asset.origin.y;
        this.threeMesh.position.setX(x * this.asset.grid.width * scaleRatio);
        this.threeMesh.position.setY(y * this.asset.grid.height * scaleRatio);
        this.threeMesh.updateMatrixWorld(false);
    };
    SpriteRenderer.prototype.setOpacity = function (opacity) {
        this.opacity = opacity;
        if (this.material == null)
            return;
        if (this.opacity != null) {
            this.material.transparent = true;
            this.material.opacity = this.opacity;
        }
        else {
            this.material.transparent = false;
            this.material.opacity = 1;
        }
        this.material.needsUpdate = true;
    };
    SpriteRenderer.prototype.setHorizontalFlip = function (horizontalFlip) {
        this.horizontalFlip = horizontalFlip;
        if (this.asset == null)
            return;
        this.updateShape();
        if (this.animationName == null)
            this.setFrame(0);
        else
            this.updateFrame(false);
    };
    SpriteRenderer.prototype.setVerticalFlip = function (verticalFlip) {
        this.verticalFlip = verticalFlip;
        if (this.asset == null)
            return;
        this.updateShape();
        if (this.animationName == null)
            this.setFrame(0);
        else
            this.updateFrame(false);
    };
    SpriteRenderer.prototype.updateAnimationsByName = function () {
        this.animationsByName = {};
        for (var _i = 0, _a = this.asset.animations; _i < _a.length; _i++) {
            var animation = _a[_i];
            this.animationsByName[animation.name] = animation;
        }
    };
    SpriteRenderer.prototype._clearMesh = function () {
        if (this.threeMesh == null)
            return;
        this.actor.threeObject.remove(this.threeMesh);
        this.threeMesh.geometry.dispose();
        this.threeMesh.material.dispose();
        this.threeMesh = null;
        this.material = null;
    };
    SpriteRenderer.prototype.setCastShadow = function (castShadow) {
        this.castShadow = castShadow;
        this.threeMesh.castShadow = castShadow;
        if (!castShadow)
            return;
        this.actor.gameInstance.threeScene.traverse(function (object) {
            var material = object.material;
            if (material != null)
                material.needsUpdate = true;
        });
    };
    SpriteRenderer.prototype._destroy = function () {
        this._clearMesh();
        this.asset = null;
        _super.prototype._destroy.call(this);
    };
    SpriteRenderer.prototype.setFrame = function (frame) {
        var map = this.material.map;
        var frameX, frameY;
        if (this.asset.frameOrder === "rows") {
            var framesPerRow = Math.floor(map.size.width / this.asset.grid.width);
            frameX = frame % framesPerRow;
            frameY = Math.floor(frame / framesPerRow);
        }
        else {
            var framesPerColumn = Math.floor(map.size.height / this.asset.grid.height);
            frameX = Math.floor(frame / framesPerColumn);
            frameY = frame % framesPerColumn;
        }
        var left = (frameX * this.asset.grid.width) / map.size.width;
        var right = ((frameX + 1) * this.asset.grid.width) / map.size.width;
        var bottom = (map.size.height - (frameY + 1) * this.asset.grid.height) / map.size.height;
        var top = (map.size.height - frameY * this.asset.grid.height) / map.size.height;
        if (this.horizontalFlip)
            _a = [right, left], left = _a[0], right = _a[1];
        if (this.verticalFlip)
            _b = [bottom, top], top = _b[0], bottom = _b[1];
        var uvs = this.geometry.getAttribute("uv");
        uvs.needsUpdate = true;
        uvs.array[0] = left;
        uvs.array[1] = top;
        uvs.array[2] = right;
        uvs.array[3] = top;
        uvs.array[4] = left;
        uvs.array[5] = bottom;
        uvs.array[6] = right;
        uvs.array[7] = bottom;
        var _a, _b;
    };
    SpriteRenderer.prototype.setAnimation = function (newAnimationName, newAnimationLooping) {
        if (newAnimationLooping === void 0) { newAnimationLooping = true; }
        if (newAnimationName != null) {
            var animation = this.animationsByName[newAnimationName];
            if (animation == null)
                throw new Error("Animation " + newAnimationName + " doesn't exist");
            this.animationLooping = newAnimationLooping;
            if (newAnimationName === this.animationName && this.isAnimationPlaying)
                return;
            this.animation = animation;
            this.animationName = newAnimationName;
            if (this.playbackSpeed * animation.speed >= 0)
                this.animationTimer = 0;
            else
                this.animationTimer = this.getAnimationFrameCount() / this.frameToSecond - 1;
            this.isAnimationPlaying = true;
            this.updateFrame();
        }
        else {
            this.animation = null;
            this.animationName = null;
            this.setFrame(0);
        }
    };
    SpriteRenderer.prototype.getAnimation = function () { return this.animationName; };
    SpriteRenderer.prototype.setAnimationFrameTime = function (frameTime) {
        if (this.animationName == null)
            return;
        if (frameTime < 0 || frameTime > this.getAnimationFrameCount())
            throw new Error("Frame time must be >= 0 and < " + this.getAnimationFrameCount());
        this.animationTimer = frameTime * this.frameToSecond;
        this.updateFrame();
    };
    SpriteRenderer.prototype.getAnimationFrameTime = function () {
        if (this.animationName == null)
            return 0;
        return this.computeAbsoluteFrameTime() - this.animation.startFrameIndex;
    };
    SpriteRenderer.prototype.getAnimationFrameIndex = function () {
        if (this.animationName == null)
            return 0;
        return Math.floor(this.computeAbsoluteFrameTime()) - this.animation.startFrameIndex;
    };
    SpriteRenderer.prototype.getAnimationFrameCount = function () {
        if (this.animationName == null)
            return 0;
        return this.animation.endFrameIndex - this.animation.startFrameIndex + 1;
    };
    SpriteRenderer.prototype.playAnimation = function (animationLooping) {
        if (animationLooping === void 0) { animationLooping = true; }
        this.animationLooping = animationLooping;
        this.isAnimationPlaying = true;
        if (this.animationLooping)
            return;
        if (this.playbackSpeed * this.animation.speed > 0 && this.getAnimationFrameIndex() === this.getAnimationFrameCount() - 1)
            this.animationTimer = 0;
        else if (this.playbackSpeed * this.animation.speed < 0 && this.getAnimationFrameIndex() === 0)
            this.animationTimer = (this.getAnimationFrameCount() - 0.01) * this.frameToSecond;
    };
    SpriteRenderer.prototype.pauseAnimation = function () { this.isAnimationPlaying = false; };
    SpriteRenderer.prototype.stopAnimation = function () {
        if (this.animationName == null)
            return;
        this.isAnimationPlaying = false;
        this.animationTimer = 0;
        this.updateFrame();
    };
    SpriteRenderer.prototype.computeAbsoluteFrameTime = function () {
        var frame = this.animation.startFrameIndex;
        frame += this.animationTimer / this.frameToSecond;
        return frame;
    };
    SpriteRenderer.prototype.updateFrame = function (flagFrameUpdated) {
        if (flagFrameUpdated === void 0) { flagFrameUpdated = true; }
        if (flagFrameUpdated)
            this.hasFrameBeenUpdated = true;
        var frame = Math.floor(this.computeAbsoluteFrameTime());
        if (frame > this.animation.endFrameIndex) {
            if (this.animationLooping) {
                frame = this.animation.startFrameIndex;
                this.animationTimer = this.playbackSpeed * this.animation.speed;
            }
            else {
                frame = this.animation.endFrameIndex;
                this.animationTimer = (this.getAnimationFrameCount() - 0.01) * this.frameToSecond;
                this.isAnimationPlaying = false;
            }
        }
        else if (frame < this.animation.startFrameIndex) {
            if (this.animationLooping) {
                frame = this.animation.endFrameIndex;
                this.animationTimer = (this.getAnimationFrameCount() - 0.01) * this.frameToSecond + this.playbackSpeed * this.animation.speed;
            }
            else {
                frame = this.animation.startFrameIndex;
                this.animationTimer = 0;
                this.isAnimationPlaying = false;
            }
        }
        this.setFrame(frame);
    };
    SpriteRenderer.prototype.update = function () {
        if (this.material != null) {
            var uniforms = this.material.uniforms;
            if (uniforms != null)
                uniforms.time.value += 1 / this.actor.gameInstance.framesPerSecond;
        }
        if (this.hasFrameBeenUpdated) {
            this.hasFrameBeenUpdated = false;
            return;
        }
        this._tickAnimation();
        this.hasFrameBeenUpdated = false;
    };
    SpriteRenderer.prototype._tickAnimation = function () {
        if (this.animationName == null || !this.isAnimationPlaying)
            return;
        this.animationTimer += this.playbackSpeed * this.animation.speed;
        this.updateFrame();
    };
    SpriteRenderer.prototype.setIsLayerActive = function (active) { if (this.threeMesh != null)
        this.threeMesh.visible = active; };
    SpriteRenderer.Updater = SpriteRendererUpdater_1.default;
    return SpriteRenderer;
})(SupEngine.ActorComponent);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SpriteRenderer;
