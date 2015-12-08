var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var THREE = require("three");
var ActorComponent_1 = require("../ActorComponent");
var Camera = (function (_super) {
    __extends(Camera, _super);
    function Camera(actor) {
        var _this = this;
        _super.call(this, actor, "Camera");
        this.fov = 45;
        this.orthographicScale = 10;
        this.viewport = { x: 0, y: 0, width: 1, height: 1 };
        this.layers = [];
        this.depth = 0;
        this.nearClippingPlane = 0.1;
        this.farClippingPlane = 1000;
        this._computeAspectRatio = function () {
            var canvas = _this.actor.gameInstance.threeRenderer.domElement;
            _this.cachedRatio = (canvas.clientWidth * _this.viewport.width) / (canvas.clientHeight * _this.viewport.height);
            _this.projectionNeedsUpdate = true;
        };
        this.unifiedThreeCamera = {
            type: "perspective",
            matrixWorld: null,
            projectionMatrix: null,
            updateMatrixWorld: function () { },
        };
        this.setOrthographicMode(false);
        this._computeAspectRatio();
        this.actor.gameInstance.on("resize", this._computeAspectRatio);
    }
    Camera.prototype._destroy = function () {
        this.actor.gameInstance.removeListener("resize", this._computeAspectRatio);
        var index = this.actor.gameInstance.renderComponents.indexOf(this);
        if (index !== -1)
            this.actor.gameInstance.renderComponents.splice(index, 1);
        this.threeCamera = null;
        _super.prototype._destroy.call(this);
    };
    Camera.prototype.setIsLayerActive = function (active) { };
    Camera.prototype.setOrthographicMode = function (isOrthographic) {
        this.isOrthographic = isOrthographic;
        if (this.isOrthographic) {
            this.threeCamera = new THREE.OrthographicCamera(-this.orthographicScale * this.cachedRatio / 2, this.orthographicScale * this.cachedRatio / 2, this.orthographicScale / 2, -this.orthographicScale / 2, this.nearClippingPlane, this.farClippingPlane);
        }
        else
            this.threeCamera = new THREE.PerspectiveCamera(this.fov, this.cachedRatio, this.nearClippingPlane, this.farClippingPlane);
        this.unifiedThreeCamera.type = isOrthographic ? "orthographic" : "perspective";
        this.unifiedThreeCamera.matrixWorld = this.threeCamera.matrixWorld;
        this.unifiedThreeCamera.projectionMatrix = this.threeCamera.projectionMatrix;
        this.projectionNeedsUpdate = true;
    };
    Camera.prototype.setFOV = function (fov) {
        this.fov = fov;
        if (!this.isOrthographic)
            this.projectionNeedsUpdate = true;
    };
    Camera.prototype.setOrthographicScale = function (orthographicScale) {
        this.orthographicScale = orthographicScale;
        if (this.isOrthographic)
            this.projectionNeedsUpdate = true;
    };
    Camera.prototype.setViewport = function (x, y, width, height) {
        this.viewport.x = x;
        this.viewport.y = y;
        this.viewport.width = width;
        this.viewport.height = height;
        this.projectionNeedsUpdate = true;
        this._computeAspectRatio();
    };
    Camera.prototype.setDepth = function (depth) {
        this.depth = depth;
    };
    Camera.prototype.setNearClippingPlane = function (nearClippingPlane) {
        this.nearClippingPlane = nearClippingPlane;
        this.threeCamera.near = this.nearClippingPlane;
        this.projectionNeedsUpdate = true;
    };
    Camera.prototype.setFarClippingPlane = function (farClippingPlane) {
        this.farClippingPlane = farClippingPlane;
        this.threeCamera.far = this.farClippingPlane;
        this.projectionNeedsUpdate = true;
    };
    Camera.prototype.start = function () { this.actor.gameInstance.renderComponents.push(this); };
    Camera.prototype.render = function () {
        this.threeCamera.position.copy(this.actor.threeObject.getWorldPosition());
        this.threeCamera.quaternion.copy(this.actor.threeObject.getWorldQuaternion());
        if (this.projectionNeedsUpdate) {
            this.projectionNeedsUpdate = false;
            if (this.isOrthographic) {
                var orthographicCamera = this.threeCamera;
                orthographicCamera.left = -this.orthographicScale * this.cachedRatio / 2;
                orthographicCamera.right = this.orthographicScale * this.cachedRatio / 2;
                orthographicCamera.top = this.orthographicScale / 2;
                orthographicCamera.bottom = -this.orthographicScale / 2;
                orthographicCamera.updateProjectionMatrix();
            }
            else {
                var perspectiveCamera = this.threeCamera;
                perspectiveCamera.fov = this.fov;
                perspectiveCamera.aspect = this.cachedRatio;
                perspectiveCamera.updateProjectionMatrix();
            }
        }
        var canvas = this.actor.gameInstance.threeRenderer.domElement;
        this.actor.gameInstance.threeRenderer.setViewport(this.viewport.x * canvas.width, (1 - this.viewport.y - this.viewport.height) * canvas.height, this.viewport.width * canvas.width, this.viewport.height * canvas.height);
        if (this.layers.length > 0) {
            for (var _i = 0, _a = this.layers; _i < _a.length; _i++) {
                var layer = _a[_i];
                this.actor.gameInstance.setActiveLayer(layer);
                this.actor.gameInstance.threeRenderer.render(this.actor.gameInstance.threeScene, this.threeCamera);
            }
        }
        else {
            for (var layer = 0; layer < this.actor.gameInstance.layers.length; layer++) {
                this.actor.gameInstance.setActiveLayer(layer);
                this.actor.gameInstance.threeRenderer.render(this.actor.gameInstance.threeScene, this.threeCamera);
            }
        }
        this.actor.gameInstance.setActiveLayer(null);
    };
    return Camera;
})(ActorComponent_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Camera;
