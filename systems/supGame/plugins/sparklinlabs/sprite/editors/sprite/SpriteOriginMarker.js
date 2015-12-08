var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var THREE = SupEngine.THREE;
var SpriteOriginMarker = (function (_super) {
    __extends(SpriteOriginMarker, _super);
    function SpriteOriginMarker(actor) {
        _super.call(this, actor, "SpriteOriginMarker");
        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(-0.2, 0, 0), new THREE.Vector3(0.2, 0, 0), new THREE.Vector3(0, -0.2, 0), new THREE.Vector3(0, 0.2, 0));
        this.line = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0x333333, opacity: 0.25, transparent: true }));
        this.actor.threeObject.add(this.line);
        this.line.updateMatrixWorld(false);
    }
    SpriteOriginMarker.prototype.setIsLayerActive = function (active) {
        this.line.visible = active;
    };
    SpriteOriginMarker.prototype.setScale = function (scale) {
        this.line.scale.set(scale, scale, scale);
        this.line.updateMatrixWorld(false);
    };
    SpriteOriginMarker.prototype._destroy = function () {
        this.actor.threeObject.remove(this.line);
        this.line.geometry.dispose();
        this.line.material.dispose();
        this.line = null;
        _super.prototype._destroy.call(this);
    };
    return SpriteOriginMarker;
})(SupEngine.ActorComponent);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SpriteOriginMarker;
