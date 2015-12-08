var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var THREE = SupEngine.THREE;
var CameraUpdater_1 = require("./CameraUpdater");
var CameraMarker = (function (_super) {
    __extends(CameraMarker, _super);
    function CameraMarker(actor) {
        _super.call(this, actor, "Marker");
        this.viewport = { x: 0, y: 0, width: 1, height: 1 };
        this.projectionNeedsUpdate = true;
        var geometry = new THREE.Geometry();
        for (var i = 0; i < 24; i++)
            geometry.vertices.push(new THREE.Vector3(0, 0, 0));
        this.line = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true }));
        this.actor.threeObject.add(this.line);
        this.line.updateMatrixWorld(false);
    }
    CameraMarker.prototype.setIsLayerActive = function (active) { this.line.visible = active; };
    CameraMarker.prototype.setConfig = function (config) {
        this.setOrthographicMode(config.mode === "orthographic");
        this.setFOV(config.fov);
        this.setOrthographicScale(config.orthographicScale);
        this.setViewport(config.viewport.x, config.viewport.y, config.viewport.width, config.viewport.height);
        this.setNearClippingPlane(config.nearClippingPlane);
        this.setFarClippingPlane(config.farClippingPlane);
        this.projectionNeedsUpdate = false;
        this._resetGeometry();
    };
    CameraMarker.prototype.setOrthographicMode = function (isOrthographic) {
        this.isOrthographic = isOrthographic;
        this.projectionNeedsUpdate = true;
    };
    CameraMarker.prototype.setFOV = function (fov) {
        this.fov = fov;
        if (!this.isOrthographic)
            this.projectionNeedsUpdate = true;
    };
    CameraMarker.prototype.setOrthographicScale = function (orthographicScale) {
        this.orthographicScale = orthographicScale;
        if (this.isOrthographic)
            this.projectionNeedsUpdate = true;
    };
    CameraMarker.prototype.setViewport = function (x, y, width, height) {
        this.viewport.x = x;
        this.viewport.y = y;
        this.viewport.width = width;
        this.viewport.height = height;
        this.projectionNeedsUpdate = true;
    };
    CameraMarker.prototype.setNearClippingPlane = function (nearClippingPlane) {
        this.nearClippingPlane = nearClippingPlane;
        this.projectionNeedsUpdate = true;
    };
    CameraMarker.prototype.setFarClippingPlane = function (farClippingPlane) {
        this.farClippingPlane = farClippingPlane;
        this.projectionNeedsUpdate = true;
    };
    CameraMarker.prototype.setRatio = function (ratio) {
        this.ratio = ratio;
        this.projectionNeedsUpdate = true;
    };
    CameraMarker.prototype._resetGeometry = function () {
        var near = this.nearClippingPlane;
        var far = this.farClippingPlane;
        var farTopRight;
        var nearTopRight;
        if (this.isOrthographic) {
            var right = this.orthographicScale / 2 * this.viewport.width / this.viewport.height;
            if (this.ratio != null)
                right *= this.ratio;
            farTopRight = new THREE.Vector3(right, this.orthographicScale / 2, far);
            nearTopRight = new THREE.Vector3(right, this.orthographicScale / 2, near);
        }
        else {
            var tan = Math.tan(THREE.Math.degToRad(this.fov / 2));
            farTopRight = new THREE.Vector3(far * tan, far * tan, far);
            nearTopRight = farTopRight.clone().normalize().multiplyScalar(near);
        }
        var vertices = this.line.geometry.vertices;
        // Near plane
        vertices[0].set(-nearTopRight.x, nearTopRight.y, -near);
        vertices[1].set(nearTopRight.x, nearTopRight.y, -near);
        vertices[2].set(nearTopRight.x, nearTopRight.y, -near);
        vertices[3].set(nearTopRight.x, -nearTopRight.y, -near);
        vertices[4].set(nearTopRight.x, -nearTopRight.y, -near);
        vertices[5].set(-nearTopRight.x, -nearTopRight.y, -near);
        vertices[6].set(-nearTopRight.x, -nearTopRight.y, -near);
        vertices[7].set(-nearTopRight.x, nearTopRight.y, -near);
        // Far plane
        vertices[8].set(-farTopRight.x, farTopRight.y, -far);
        vertices[9].set(farTopRight.x, farTopRight.y, -far);
        vertices[10].set(farTopRight.x, farTopRight.y, -far);
        vertices[11].set(farTopRight.x, -farTopRight.y, -far);
        vertices[12].set(farTopRight.x, -farTopRight.y, -far);
        vertices[13].set(-farTopRight.x, -farTopRight.y, -far);
        vertices[14].set(-farTopRight.x, -farTopRight.y, -far);
        vertices[15].set(-farTopRight.x, farTopRight.y, -far);
        // Lines
        vertices[16].set(-nearTopRight.x, nearTopRight.y, -near);
        vertices[17].set(-farTopRight.x, farTopRight.y, -far);
        vertices[18].set(nearTopRight.x, nearTopRight.y, -near);
        vertices[19].set(farTopRight.x, farTopRight.y, -far);
        vertices[20].set(nearTopRight.x, -nearTopRight.y, -near);
        vertices[21].set(farTopRight.x, -farTopRight.y, -far);
        vertices[22].set(-nearTopRight.x, -nearTopRight.y, -near);
        vertices[23].set(-farTopRight.x, -farTopRight.y, -far);
        this.line.geometry.verticesNeedUpdate = true;
    };
    CameraMarker.prototype._destroy = function () {
        this.actor.threeObject.remove(this.line);
        this.line.geometry.dispose();
        this.line.material.dispose();
        this.line = null;
        _super.prototype._destroy.call(this);
    };
    CameraMarker.prototype.update = function () {
        if (this.projectionNeedsUpdate) {
            this.projectionNeedsUpdate = false;
            this._resetGeometry();
        }
    };
    CameraMarker.Updater = CameraUpdater_1.default;
    return CameraMarker;
})(SupEngine.ActorComponent);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CameraMarker;
