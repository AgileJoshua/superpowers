var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var THREE = require("three");
var ActorComponent_1 = require("../ActorComponent");
var SelectionRenderer = (function (_super) {
    __extends(SelectionRenderer, _super);
    function SelectionRenderer(actor) {
        _super.call(this, actor, "SelectionRenderer");
    }
    SelectionRenderer.prototype.setIsLayerActive = function (active) { if (this.mesh != null)
        this.mesh.visible = active; };
    SelectionRenderer.prototype.setSize = function (width, height) {
        if (this.mesh != null)
            this._clearMesh();
        this.width = width;
        this.height = height;
        this._createMesh();
    };
    SelectionRenderer.prototype._createMesh = function () {
        var geomtry = new THREE.Geometry();
        geomtry.vertices.push(new THREE.Vector3(-this.width / 2, -this.height / 2, 0), new THREE.Vector3(this.width / 2, -this.height / 2, 0), new THREE.Vector3(this.width / 2, this.height / 2, 0), new THREE.Vector3(-this.width / 2, this.height / 2, 0), new THREE.Vector3(-this.width / 2, -this.height / 2, 0));
        geomtry.verticesNeedUpdate = true;
        var material = new THREE.LineBasicMaterial({ color: 0x000000, opacity: 1, depthTest: false, depthWrite: false, transparent: true });
        this.mesh = new THREE.Line(geomtry, material);
        this.actor.threeObject.add(this.mesh);
        this.mesh.updateMatrixWorld(false);
    };
    SelectionRenderer.prototype._clearMesh = function () {
        if (this.mesh == null)
            return;
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        this.actor.threeObject.remove(this.mesh);
        this.mesh = null;
    };
    SelectionRenderer.prototype._destroy = function () {
        this._clearMesh();
        _super.prototype._destroy.call(this);
    };
    return SelectionRenderer;
})(ActorComponent_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SelectionRenderer;
