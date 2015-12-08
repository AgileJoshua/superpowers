var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var THREE = require("three");
var ActorComponent_1 = require("../ActorComponent");
var FlatColorRenderer = (function (_super) {
    __extends(FlatColorRenderer, _super);
    function FlatColorRenderer(actor, color, scaleRatio, width, height) {
        _super.call(this, actor, "GridRenderer");
        this.setup(color, scaleRatio, width, height);
    }
    FlatColorRenderer.prototype.setIsLayerActive = function (active) { if (this.mesh != null)
        this.mesh.visible = active; };
    FlatColorRenderer.prototype.setup = function (color, scaleRatio, width, height) {
        if (color == null || scaleRatio == null || width == null)
            return;
        this._clearMesh();
        this.width = width;
        this.height = (height) ? height : this.width;
        var geometry = new THREE.PlaneBufferGeometry(this.width, this.height);
        var material = new THREE.MeshBasicMaterial({
            color: color,
            alphaTest: 0.1,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.actor.threeObject.add(this.mesh);
        this.refreshScale(scaleRatio);
    };
    FlatColorRenderer.prototype.refreshScale = function (scaleRatio) {
        this.mesh.scale.set(scaleRatio, scaleRatio, scaleRatio);
        this.mesh.position.set(this.width / 2 * scaleRatio, this.height / 2 * scaleRatio, -0.01);
        this.mesh.updateMatrixWorld(false);
    };
    FlatColorRenderer.prototype._clearMesh = function () {
        if (this.mesh == null)
            return;
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        this.actor.threeObject.remove(this.mesh);
        this.mesh = null;
    };
    FlatColorRenderer.prototype._destroy = function () {
        this._clearMesh();
        _super.prototype._destroy.call(this);
    };
    return FlatColorRenderer;
})(ActorComponent_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FlatColorRenderer;
