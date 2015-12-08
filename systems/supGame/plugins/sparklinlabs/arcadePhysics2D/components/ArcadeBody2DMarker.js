var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ArcadeBody2DUpdater_1 = require("./ArcadeBody2DUpdater");
var THREE = SupEngine.THREE;
var tmpVector3 = new THREE.Vector3();
var ArcadeBody2DMarker = (function (_super) {
    __extends(ArcadeBody2DMarker, _super);
    function ArcadeBody2DMarker(actor) {
        _super.call(this, actor, "ArcadeBody2DMarker");
        this.offset = new THREE.Vector3(0, 0, 0);
        this.markerActor = new SupEngine.Actor(this.actor.gameInstance, "Marker", null, { layer: -1 });
    }
    ArcadeBody2DMarker.prototype.setIsLayerActive = function (active) {
        if (this.line != null)
            this.line.visible = active;
    };
    ArcadeBody2DMarker.prototype.update = function () {
        _super.prototype.update.call(this);
        this.markerActor.setGlobalPosition(this.actor.getGlobalPosition(tmpVector3));
    };
    ArcadeBody2DMarker.prototype.setBox = function (width, height) {
        if (this.line != null)
            this._clearRenderer();
        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(-width / 2, -height / 2, 0.01), new THREE.Vector3(width / 2, -height / 2, 0.01), new THREE.Vector3(width / 2, height / 2, 0.01), new THREE.Vector3(-width / 2, height / 2, 0.01), new THREE.Vector3(-width / 2, -height / 2, 0.01));
        var material = new THREE.LineBasicMaterial({ color: 0xf459e4 });
        this.line = new THREE.Line(geometry, material);
        this.markerActor.threeObject.add(this.line);
        this.setOffset();
    };
    ArcadeBody2DMarker.prototype.setOffset = function (x, y) {
        if (x != null && y != null)
            this.offset.set(x, y, 0);
        this.line.position.set(this.offset.x, this.offset.y, 0);
        this.line.updateMatrixWorld(false);
    };
    ArcadeBody2DMarker.prototype.setTileMap = function () {
        if (this.line != null)
            this._clearRenderer();
        // TODO ?
    };
    ArcadeBody2DMarker.prototype._clearRenderer = function () {
        this.markerActor.threeObject.remove(this.line);
        this.line.geometry.dispose();
        this.line.material.dispose();
        this.line = null;
    };
    ArcadeBody2DMarker.prototype._destroy = function () {
        if (this.line != null)
            this._clearRenderer();
        this.actor.gameInstance.destroyActor(this.markerActor);
        this.markerActor = null;
        _super.prototype._destroy.call(this);
    };
    ArcadeBody2DMarker.Updater = ArcadeBody2DUpdater_1.default;
    return ArcadeBody2DMarker;
})(SupEngine.ActorComponent);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ArcadeBody2DMarker;
