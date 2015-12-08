var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var THREE = SupEngine.THREE;
require("./TransformControls");
var TransformHandle = (function (_super) {
    __extends(TransformHandle, _super);
    function TransformHandle(actor, threeCamera) {
        _super.call(this, actor, "TransformHandle");
        this.mode = "translate";
        this.space = "world";
        this.controlVisible = false;
        this.control = new THREE.TransformControls(threeCamera, actor.gameInstance.threeRenderer.domElement);
        this.actor.gameInstance.threeScene.add(this.control);
    }
    TransformHandle.prototype.setIsLayerActive = function (active) { this.control.visible = active && this.controlVisible; };
    TransformHandle.prototype.update = function () {
        this.control.update();
        this.control.updateMatrixWorld(true);
    };
    TransformHandle.prototype.setMode = function (mode) {
        this.mode = mode;
        if (this.target != null) {
            this.control.setMode(mode);
            this.control.setSpace(this.mode === "scale" ? "local" : this.space);
        }
    };
    TransformHandle.prototype.setSpace = function (space) {
        this.space = space;
        if (this.target != null && this.mode !== "scale")
            this.control.setSpace(space);
    };
    TransformHandle.prototype.setTarget = function (target) {
        this.target = target;
        if (this.target != null) {
            this.controlVisible = true;
            this.control.attach(this.actor.threeObject);
            this.control.setSpace(this.mode === "scale" ? "local" : this.space);
            this.control.setMode(this.mode);
            this.move();
        }
        else {
            this.controlVisible = false;
            this.control.detach();
        }
    };
    TransformHandle.prototype.move = function () {
        this.actor.threeObject.position.copy(this.target.getWorldPosition());
        this.actor.threeObject.quaternion.copy(this.target.getWorldQuaternion());
        this.actor.threeObject.scale.copy(this.target.scale);
        this.actor.threeObject.updateMatrixWorld(false);
        this.control.update();
        this.control.updateMatrixWorld(true);
    };
    TransformHandle.prototype._destroy = function () {
        this.controlVisible = false;
        this.control.detach();
        this.actor.gameInstance.threeScene.remove(this.control);
        _super.prototype._destroy.call(this);
    };
    return TransformHandle;
})(SupEngine.ActorComponent);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TransformHandle;
