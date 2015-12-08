var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var THREE = SupEngine.THREE;
var P2BodyMarkerUpdater_1 = require("./P2BodyMarkerUpdater");
var P2BodyMarker = (function (_super) {
    __extends(P2BodyMarker, _super);
    function P2BodyMarker(actor) {
        _super.call(this, actor, "P2BodyMarker");
        this.offset = new THREE.Vector3(0, 0, 0);
    }
    P2BodyMarker.prototype.setIsLayerActive = function (active) {
        if (this.mesh != null)
            this.mesh.visible = active;
    };
    P2BodyMarker.prototype.setBox = function (width, height) {
        if (this.mesh != null)
            this._clearRenderer();
        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(-width / 2, -height / 2, 0), new THREE.Vector3(width / 2, -height / 2, 0), new THREE.Vector3(width / 2, height / 2, 0), new THREE.Vector3(-width / 2, height / 2, 0), new THREE.Vector3(-width / 2, -height / 2, 0));
        var material = new THREE.LineBasicMaterial({ color: 0xf459e4 });
        this.mesh = new THREE.Line(geometry, material);
        this.actor.threeObject.add(this.mesh);
        this.mesh.position.copy(this.offset);
        this.mesh.updateMatrixWorld(false);
    };
    P2BodyMarker.prototype.setCircle = function (radius) {
        if (this.mesh != null)
            this._clearRenderer();
        var geometry = new THREE.CircleGeometry(radius, 16);
        var material = new THREE.MeshBasicMaterial({ color: 0xf459e4, wireframe: true });
        this.mesh = new THREE.Mesh(geometry, material);
        this.actor.threeObject.add(this.mesh);
        this.mesh.position.copy(this.offset);
        this.mesh.updateMatrixWorld(false);
    };
    P2BodyMarker.prototype.setOffset = function (xOffset, yOffset) {
        this.offset.set(xOffset, yOffset, 0);
        this.mesh.position.copy(this.offset);
        this.mesh.updateMatrixWorld(false);
    };
    P2BodyMarker.prototype._clearRenderer = function () {
        this.actor.threeObject.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        this.mesh = null;
    };
    P2BodyMarker.prototype._destroy = function () {
        if (this.mesh != null)
            this._clearRenderer();
        _super.prototype._destroy.call(this);
    };
    P2BodyMarker.Updater = P2BodyMarkerUpdater_1.default;
    return P2BodyMarker;
})(SupEngine.ActorComponent);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = P2BodyMarker;
