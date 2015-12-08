var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var THREE = SupEngine.THREE;
var Light_1 = require("./Light");
var LightMarker = (function (_super) {
    __extends(LightMarker, _super);
    function LightMarker() {
        _super.apply(this, arguments);
    }
    LightMarker.prototype.setType = function (type) {
        if (this.lightMarker != null)
            this.actor.gameInstance.threeScene.remove(this.lightMarker);
        if (this.cameraHelper != null) {
            this.actor.gameInstance.threeScene.remove(this.cameraHelper);
            this.cameraHelper = null;
        }
        _super.prototype.setType.call(this, type);
        switch (type) {
            case "ambient":
                this.lightMarker = null;
                break;
            case "point":
                this.lightMarker = new THREE.PointLightHelper(this.light, 1);
                break;
            case "spot":
                this.lightMarker = new THREE.SpotLightHelper(this.light, 1, 1);
                //if (this.castShadow) this.cameraHelper = new THREE.CameraHelper((<THREE.SpotLight>this.light).shadowCamera);
                break;
            case "directional":
                this.lightMarker = new THREE.DirectionalLightHelper(this.light, 1);
                //if (this.castShadow) this.cameraHelper = new THREE.CameraHelper((<THREE.DirectionalLight>this.light).shadowCamera);
                break;
        }
        if (this.lightMarker != null) {
            this.actor.gameInstance.threeScene.add(this.lightMarker);
            this.lightMarker.updateMatrixWorld(true);
        }
        //if (type === "spot" && this.cameraHelper != null && this.castShadow) this.actor.gameInstance.threeScene.add(this.cameraHelper);
    };
    LightMarker.prototype.setColor = function (color) {
        _super.prototype.setColor.call(this, color);
        if (this.lightMarker != null)
            this.lightMarker.update();
    };
    LightMarker.prototype.setIntensity = function (intensity) {
        _super.prototype.setIntensity.call(this, intensity);
        if (this.lightMarker != null)
            this.lightMarker.update();
    };
    LightMarker.prototype.setDistance = function (distance) {
        _super.prototype.setDistance.call(this, distance);
        if (this.lightMarker != null)
            this.lightMarker.update();
    };
    LightMarker.prototype.setAngle = function (angle) {
        _super.prototype.setAngle.call(this, angle);
        if (this.lightMarker != null)
            this.lightMarker.update();
    };
    LightMarker.prototype.setTarget = function (x, y, z) {
        _super.prototype.setTarget.call(this, x, y, z);
        if (this.lightMarker != null)
            this.lightMarker.update();
    };
    LightMarker.prototype.setCastShadow = function (castShadow) {
        _super.prototype.setCastShadow.call(this, castShadow);
        if (castShadow) {
            this.cameraHelper = new THREE.CameraHelper(this.light.shadow.camera);
            this.actor.gameInstance.threeScene.add(this.cameraHelper);
        }
        else {
            this.actor.gameInstance.threeScene.remove(this.cameraHelper);
            this.cameraHelper = null;
        }
    };
    LightMarker.prototype.setShadowCameraNearPlane = function (near) {
        _super.prototype.setShadowCameraNearPlane.call(this, near);
        if (this.cameraHelper != null)
            this.cameraHelper.update();
    };
    LightMarker.prototype.setShadowCameraFarPlane = function (far) {
        _super.prototype.setShadowCameraFarPlane.call(this, far);
        if (this.cameraHelper != null)
            this.cameraHelper.update();
    };
    LightMarker.prototype.setShadowCameraFov = function (fov) {
        _super.prototype.setShadowCameraFov.call(this, fov);
        if (this.cameraHelper != null)
            this.cameraHelper.update();
    };
    LightMarker.prototype.setShadowCameraSize = function (top, bottom, left, right) {
        _super.prototype.setShadowCameraSize.call(this, top, bottom, left, right);
        if (this.cameraHelper != null)
            this.cameraHelper.update();
    };
    LightMarker.prototype.update = function () {
        // TODO: Only do that when the transform has changed
        if (this.lightMarker != null) {
            this.lightMarker.updateMatrixWorld(true);
            this.lightMarker.update();
        }
        this.actor.gameInstance.threeScene.updateMatrixWorld(false);
    };
    LightMarker.prototype._destroy = function () {
        if (this.lightMarker != null)
            this.actor.gameInstance.threeScene.remove(this.lightMarker);
        if (this.cameraHelper != null)
            this.actor.gameInstance.threeScene.remove(this.cameraHelper);
        _super.prototype._destroy.call(this);
    };
    return LightMarker;
})(Light_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LightMarker;
