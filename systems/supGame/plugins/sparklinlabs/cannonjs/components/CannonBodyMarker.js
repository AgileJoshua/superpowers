var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var THREE = SupEngine.THREE;
var CannonBodyMarkerUpdater_1 = require("./CannonBodyMarkerUpdater");
var CannonBodyMarker = (function (_super) {
    __extends(CannonBodyMarker, _super);
    function CannonBodyMarker(actor) {
        _super.call(this, actor, "CannonBodyMarker");
    }
    CannonBodyMarker.prototype.setIsLayerActive = function (active) { if (this.mesh != null)
        this.mesh.visible = active; };
    CannonBodyMarker.prototype.setBox = function (halfSize) {
        if (this.mesh != null)
            this._clearRenderer();
        var geometry = new THREE.BoxGeometry(halfSize.x * 2, halfSize.y * 2, halfSize.z * 2);
        var material = new THREE.MeshBasicMaterial({ wireframe: true, color: 0xf459e4, transparent: true, opacity: 0.2 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.actor.threeObject.add(this.mesh);
        this.mesh.updateMatrixWorld(false);
    };
    CannonBodyMarker.prototype.setSphere = function (radius) {
        if (this.mesh != null)
            this._clearRenderer();
        var geometry = new THREE.SphereGeometry(radius);
        var material = new THREE.MeshBasicMaterial({ wireframe: true, color: 0xf459e4, transparent: true, opacity: 0.2 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.actor.threeObject.add(this.mesh);
        this.mesh.updateMatrixWorld(false);
    };
    CannonBodyMarker.prototype.setCylinder = function (radius, height) {
        if (this.mesh != null)
            this._clearRenderer();
        var geometry = new THREE.CylinderGeometry(radius, radius, height);
        var material = new THREE.MeshBasicMaterial({ wireframe: true, color: 0xf459e4, transparent: true, opacity: 0.2 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
        this.actor.threeObject.add(this.mesh);
        this.mesh.updateMatrixWorld(false);
    };
    CannonBodyMarker.prototype.setOffset = function (offset) {
        this.mesh.position.copy(offset);
        this.mesh.updateMatrixWorld(false);
    };
    CannonBodyMarker.prototype._clearRenderer = function () {
        this.actor.threeObject.remove(this.mesh);
        this.mesh.traverse(function (obj) {
            if (obj.dispose != null)
                obj.dispose();
        });
        this.mesh = null;
    };
    CannonBodyMarker.prototype._destroy = function () {
        if (this.mesh != null)
            this._clearRenderer();
        _super.prototype._destroy.call(this);
    };
    CannonBodyMarker.Updater = CannonBodyMarkerUpdater_1.default;
    return CannonBodyMarker;
})(SupEngine.ActorComponent);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CannonBodyMarker;
