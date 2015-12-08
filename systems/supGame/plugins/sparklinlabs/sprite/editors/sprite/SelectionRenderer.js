var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var THREE = SupEngine.THREE;
var SelectionRenderer = (function (_super) {
    __extends(SelectionRenderer, _super);
    function SelectionRenderer(actor) {
        _super.call(this, actor, "SelectionRenderer");
        this.meshes = [];
    }
    SelectionRenderer.prototype.setIsLayerActive = function (active) {
        for (var _i = 0, _a = this.meshes; _i < _a.length; _i++) {
            var mesh = _a[_i];
            mesh.visible = active;
        }
    };
    SelectionRenderer.prototype.setup = function (width, height, start, end, frameOrder, framesPerDirection) {
        this.clearMesh();
        for (var i = start; i <= end; i++) {
            var geometry = new THREE.PlaneBufferGeometry(width, height);
            var material = new THREE.MeshBasicMaterial({
                color: 0x900090,
                alphaTest: 0.1,
                transparent: true,
                opacity: 0.5
            });
            var mesh = new THREE.Mesh(geometry, material);
            this.meshes.push(mesh);
            var x = void 0, y = void 0;
            if (frameOrder === "rows") {
                x = i % framesPerDirection;
                y = Math.floor(i / framesPerDirection);
            }
            else {
                x = Math.floor(i / framesPerDirection);
                y = i % framesPerDirection;
            }
            mesh.position.setX((x + 0.5) * width);
            mesh.position.setY(-(y + 0.5) * height);
            mesh.updateMatrixWorld(false);
            this.actor.threeObject.add(mesh);
        }
    };
    SelectionRenderer.prototype.clearMesh = function () {
        for (var _i = 0, _a = this.meshes; _i < _a.length; _i++) {
            var mesh = _a[_i];
            mesh.geometry.dispose();
            mesh.material.dispose();
            this.actor.threeObject.remove(mesh);
        }
        this.meshes.length = 0;
    };
    SelectionRenderer.prototype._destroy = function () {
        this.clearMesh();
        _super.prototype._destroy.call(this);
    };
    return SelectionRenderer;
})(SupEngine.ActorComponent);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SelectionRenderer;
