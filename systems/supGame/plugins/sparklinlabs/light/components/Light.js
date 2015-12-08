var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var THREE = SupEngine.THREE;
var LightUpdater_1 = require("./LightUpdater");
var Light = (function (_super) {
    __extends(Light, _super);
    function Light(actor) {
        _super.call(this, actor, "Light");
        this.color = 0xffffff;
        this.intensity = 1;
        this.distance = 0;
        this.angle = Math.PI / 3;
        this.target = new THREE.Vector3(0, 0, 0);
        this.castShadow = false;
        this.shadow = {
            mapSize: new THREE.Vector2(512, 512),
            bias: 0,
            // FIXME: Three.js has changed the default to 1.0, should we update?
            darkness: 0.5,
            camera: {
                near: 0.1,
                far: 100,
                fov: 50,
                left: -100,
                right: 100,
                top: 100,
                bottom: -100
            }
        };
        this.actor.gameInstance.threeRenderer.shadowMap.enabled = true;
    }
    Light.prototype.setType = function (type) {
        if (this.light != null)
            this.actor.threeObject.remove(this.light);
        this.type = type;
        switch (type) {
            case "ambient":
                this.light = new THREE.AmbientLight(this.color);
                break;
            case "point":
                this.light = new THREE.PointLight(this.color, this.intensity, this.distance);
                break;
            case "spot":
                var spotLight = new THREE.SpotLight(this.color, this.intensity, this.distance, this.angle * Math.PI / 180);
                spotLight.target.position.copy(this.target);
                spotLight.target.updateMatrixWorld(false);
                spotLight.shadow.mapSize.copy(this.shadow.mapSize);
                spotLight.shadow.bias = this.shadow.bias;
                spotLight.shadow.darkness = this.shadow.darkness;
                spotLight.shadow.camera = new THREE.PerspectiveCamera(this.shadow.camera.fov, this.shadow.mapSize.x / this.shadow.mapSize.y, this.shadow.camera.near, this.shadow.camera.far);
                this.light = spotLight;
                this.setCastShadow(this.castShadow);
                break;
            case "directional":
                var directionalLight = new THREE.DirectionalLight(this.color, this.intensity);
                directionalLight.target.position.copy(this.target);
                directionalLight.target.updateMatrixWorld(false);
                directionalLight.shadow.mapSize.copy(this.shadow.mapSize);
                directionalLight.shadow.bias = this.shadow.bias;
                directionalLight.shadow.darkness = this.shadow.darkness;
                directionalLight.shadow.camera = new THREE.OrthographicCamera(this.shadow.camera.left, this.shadow.camera.right, this.shadow.camera.top, this.shadow.camera.bottom, this.shadow.camera.near, this.shadow.camera.far);
                this.light = directionalLight;
                this.setCastShadow(this.castShadow);
                break;
        }
        this.actor.threeObject.add(this.light);
        this.light.updateMatrixWorld(false);
        this.actor.gameInstance.threeScene.traverse(function (object) {
            var material = object.material;
            if (material != null)
                material.needsUpdate = true;
        });
    };
    Light.prototype.setColor = function (color) {
        this.color = color;
        this.light.color.setHex(this.color);
    };
    Light.prototype.setIntensity = function (intensity) {
        this.intensity = intensity;
        if (this.type !== "ambient")
            this.light.intensity = intensity;
    };
    Light.prototype.setDistance = function (distance) {
        this.distance = distance;
        if (this.type === "point" || this.type === "spot")
            this.light.distance = distance;
    };
    Light.prototype.setAngle = function (angle) {
        this.angle = angle;
        if (this.type === "spot")
            this.light.angle = this.angle * Math.PI / 180;
    };
    Light.prototype.setTarget = function (x, y, z) {
        if (x != null)
            this.target.setX(x);
        if (y != null)
            this.target.setY(y);
        if (z != null)
            this.target.setZ(z);
        if (this.type === "spot" || this.type === "directional") {
            this.light.target.position.copy(this.target);
            this.light.target.updateMatrixWorld(true);
        }
    };
    Light.prototype.setCastShadow = function (castShadow) {
        this.castShadow = castShadow;
        if (this.type !== "spot" && this.type !== "directional")
            return;
        this.light.castShadow = this.castShadow;
        this.actor.gameInstance.threeScene.traverse(function (object) {
            var material = object.material;
            if (material != null)
                material.needsUpdate = true;
        });
    };
    Light.prototype.setShadowMapSize = function (width, height) {
        if (width != null)
            this.shadow.mapSize.x = width;
        if (height != null)
            this.shadow.mapSize.y = height;
        if (this.type !== "spot" && this.type !== "directional")
            return;
        var shadow = this.light.shadow;
        shadow.mapSize.copy(this.shadow.mapSize);
        this.setType(this.type);
    };
    Light.prototype.setShadowBias = function (bias) {
        this.shadow.bias = bias;
        if (this.type !== "spot" && this.type !== "directional")
            return;
        var shadow = this.light.shadow;
        shadow.bias = this.shadow.bias;
    };
    Light.prototype.setShadowDarkness = function (darkness) {
        this.shadow.darkness = darkness;
        if (this.type !== "spot" && this.type !== "directional")
            return;
        var shadow = this.light.shadow;
        shadow.darkness = this.shadow.darkness;
    };
    Light.prototype.setShadowCameraNearPlane = function (near) {
        this.shadow.camera.near = near;
        if (this.type !== "spot" && this.type !== "directional")
            return;
        var shadow = this.light.shadow;
        var camera = shadow.camera;
        camera.near = this.shadow.camera.near;
        camera.updateProjectionMatrix();
    };
    Light.prototype.setShadowCameraFarPlane = function (far) {
        this.shadow.camera.far = far;
        if (this.type !== "spot" && this.type !== "directional")
            return;
        var shadow = this.light.shadow;
        var camera = shadow.camera;
        camera.far = this.shadow.camera.far;
        camera.updateProjectionMatrix();
    };
    Light.prototype.setShadowCameraFov = function (fov) {
        this.shadow.camera.fov;
        if (this.type !== "spot")
            return;
        var shadow = this.light.shadow;
        var camera = shadow.camera;
        camera.fov = this.shadow.camera.fov;
        camera.updateProjectionMatrix();
    };
    Light.prototype.setShadowCameraSize = function (top, bottom, left, right) {
        if (top != null)
            this.shadow.camera.top = top;
        if (bottom != null)
            this.shadow.camera.bottom = bottom;
        if (left != null)
            this.shadow.camera.left = left;
        if (right != null)
            this.shadow.camera.right = right;
        if (this.type !== "directional")
            return;
        var camera = this.light.shadow.camera;
        camera.top = this.shadow.camera.top;
        camera.bottom = this.shadow.camera.bottom;
        camera.left = this.shadow.camera.left;
        camera.right = this.shadow.camera.right;
        camera.updateProjectionMatrix();
    };
    Light.prototype._destroy = function () {
        this.actor.threeObject.remove(this.light);
        if (this.castShadow) {
            this.actor.gameInstance.threeScene.traverse(function (object) {
                var material = object.material;
                if (material != null)
                    material.needsUpdate = true;
            });
        }
        _super.prototype._destroy.call(this);
    };
    Light.prototype.setIsLayerActive = function (active) { this.light.visible = active; };
    Light.Updater = LightUpdater_1.default;
    return Light;
})(SupEngine.ActorComponent);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Light;
