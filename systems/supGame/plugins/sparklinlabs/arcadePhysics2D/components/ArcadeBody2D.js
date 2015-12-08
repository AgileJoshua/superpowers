var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var THREE = SupEngine.THREE;
var ArcadeBody2D = (function (_super) {
    __extends(ArcadeBody2D, _super);
    function ArcadeBody2D(actor, type) {
        _super.call(this, actor, "ArcadeBody2D");
        this.enabled = true;
        this.movable = false;
        this.width = 1;
        this.height = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.bounceX = 0;
        this.bounceY = 0;
        this.layersIndex = [];
        this.customGravity = { x: null, y: null };
        this.touches = { top: false, bottom: false, right: false, left: false };
        SupEngine.ArcadePhysics2D.allBodies.push(this);
    }
    ArcadeBody2D.prototype.setIsLayerActive = function (active) { };
    ArcadeBody2D.prototype.setupBox = function (config) {
        this.type = "box";
        this.movable = config.movable;
        this.width = config.width;
        this.height = config.height;
        if (config.offset != null) {
            this.offsetX = config.offset.x;
            this.offsetY = config.offset.y;
        }
        if (config.bounceX != null)
            this.bounceX = config.bounceX;
        if (config.bounceY != null)
            this.bounceY = config.bounceY;
        this.actorPosition = this.actor.getGlobalPosition(new THREE.Vector3());
        this.position = this.actorPosition.clone();
        this.position.x += this.offsetX;
        this.position.y += this.offsetY;
        this.previousPosition = this.position.clone();
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.velocityMin = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
        this.velocityMax = new THREE.Vector3(Infinity, Infinity, Infinity);
        this.velocityMultiplier = new THREE.Vector3(1, 1, 1);
    };
    ArcadeBody2D.prototype.setupTileMap = function (config) {
        this.type = "tileMap";
        this.tileMapAsset = config.tileMapAsset;
        this.tileSetAsset = config.tileSetAsset;
        this.mapToSceneFactor = {
            x: this.tileSetAsset.__inner.data.grid.width / this.tileMapAsset.__inner.data.pixelsPerUnit,
            y: this.tileSetAsset.__inner.data.grid.height / this.tileMapAsset.__inner.data.pixelsPerUnit,
        };
        this.tileSetPropertyName = config.tileSetPropertyName;
        if (config.layersIndex != null) {
            var layers = config.layersIndex.split(",");
            for (var _i = 0; _i < layers.length; _i++) {
                var layer = layers[_i];
                this.layersIndex.push(parseInt(layer.trim()));
            }
        }
        else {
            for (var i = 0; i < this.tileMapAsset.__inner.data.layers.length; i++)
                this.layersIndex.push(i);
        }
        this.position = this.actor.getGlobalPosition(new THREE.Vector3());
    };
    ArcadeBody2D.prototype.earlyUpdate = function () {
        if (this.type === "tileMap")
            return;
        this.previousPosition.copy(this.position);
        if (!this.movable || !this.enabled)
            return;
        this.velocity.x += this.customGravity.x != null ? this.customGravity.x : SupEngine.ArcadePhysics2D.gravity.x;
        this.velocity.x *= this.velocityMultiplier.x;
        this.velocity.x = Math.min(Math.max(this.velocity.x, this.velocityMin.x), this.velocityMax.x);
        this.velocity.y += this.customGravity.y != null ? this.customGravity.y : SupEngine.ArcadePhysics2D.gravity.y;
        this.velocity.y *= this.velocityMultiplier.y;
        this.velocity.y = Math.min(Math.max(this.velocity.y, this.velocityMin.y), this.velocityMax.y);
        this.position.add(this.velocity);
        this.refreshActorPosition();
    };
    ArcadeBody2D.prototype.warpPosition = function (x, y) {
        this.position.x = x + this.offsetX;
        this.position.y = y + this.offsetY;
        this.refreshActorPosition();
    };
    ArcadeBody2D.prototype.refreshActorPosition = function () {
        this.actor.getGlobalPosition(this.actorPosition);
        this.actorPosition.x = this.position.x - this.offsetX;
        this.actorPosition.y = this.position.y - this.offsetY;
        this.actor.setGlobalPosition(this.actorPosition);
    };
    ArcadeBody2D.prototype._destroy = function () {
        SupEngine.ArcadePhysics2D.allBodies.splice(SupEngine.ArcadePhysics2D.allBodies.indexOf(this), 1);
        _super.prototype._destroy.call(this);
    };
    ArcadeBody2D.prototype.right = function () { return this.position.x + this.width / 2; };
    ArcadeBody2D.prototype.left = function () { return this.position.x - this.width / 2; };
    ArcadeBody2D.prototype.top = function () { return this.position.y + this.height / 2; };
    ArcadeBody2D.prototype.bottom = function () { return this.position.y - this.height / 2; };
    ArcadeBody2D.prototype.deltaX = function () { return this.position.x - this.previousPosition.x; };
    ArcadeBody2D.prototype.deltaY = function () { return this.position.y - this.previousPosition.y; };
    return ArcadeBody2D;
})(SupEngine.ActorComponent);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ArcadeBody2D;
