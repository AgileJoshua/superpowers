var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var THREE = SupEngine.THREE;
var TransformMarker = (function (_super) {
    __extends(TransformMarker, _super);
    function TransformMarker(actor) {
        _super.call(this, actor, "TransformMarker");
        this.visible = true;
        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(-0.25, 0, 0), new THREE.Vector3(0.25, 0, 0), new THREE.Vector3(0, -0.25, 0), new THREE.Vector3(0, 0.25, 0), new THREE.Vector3(0, 0, -0.25), new THREE.Vector3(0, 0, 0.25));
        this.line = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.25, transparent: true }));
        this.actor.threeObject.add(this.line);
        this.line.updateMatrixWorld(false);
    }
    TransformMarker.prototype.setIsLayerActive = function (active) { this.line.visible = active && this.visible; };
    TransformMarker.prototype.move = function (target) {
        this.visible = this.line.visible = true;
        this.actor.threeObject.position.copy(target.getWorldPosition());
        this.actor.threeObject.quaternion.copy(target.getWorldQuaternion());
        this.actor.threeObject.updateMatrixWorld(false);
    };
    TransformMarker.prototype.hide = function () {
        this.visible = this.line.visible = false;
    };
    TransformMarker.prototype._destroy = function () {
        this.actor.threeObject.remove(this.line);
        this.line.geometry.dispose();
        this.line.material.dispose();
        this.line = null;
        _super.prototype._destroy.call(this);
    };
    return TransformMarker;
})(SupEngine.ActorComponent);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TransformMarker;
