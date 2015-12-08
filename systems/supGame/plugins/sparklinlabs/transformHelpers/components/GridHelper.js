var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var THREE = SupEngine.THREE;
var GridHelper = (function (_super) {
    __extends(GridHelper, _super);
    function GridHelper(actor, size, step) {
        _super.call(this, actor, "GridHelper");
        this.visible = true;
        this.setup(size, step);
    }
    GridHelper.prototype.setIsLayerActive = function (active) { this.gridHelper.visible = active && this.visible; };
    GridHelper.prototype.setup = function (size, step) {
        if (this.gridHelper != null) {
            this.actor.threeObject.remove(this.gridHelper);
            this.gridHelper.geometry.dispose();
            this.gridHelper.material.dispose();
        }
        var actualSize = Math.ceil(size / step) * step;
        this.gridHelper = new THREE.GridHelper(actualSize, step);
        this.gridHelper.color1.setRGB(1, 1, 1);
        this.gridHelper.color2.setRGB(1, 1, 1);
        this.gridHelper.material.transparent = true;
        this.gridHelper.material.opacity = 0.25;
        this.actor.threeObject.add(this.gridHelper);
        this.gridHelper.visible = this.visible;
        this.gridHelper.updateMatrixWorld(false);
    };
    GridHelper.prototype.setVisible = function (visible) {
        this.gridHelper.visible = this.visible = visible;
    };
    return GridHelper;
})(SupEngine.ActorComponent);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GridHelper;
