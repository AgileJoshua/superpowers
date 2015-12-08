var THREE = SupEngine.THREE;
var LightUpdater = (function () {
    function LightUpdater(projectClient, light, config) {
        this.lightSettingsSubscriber = {
            onResourceReceived: this._onLightResourceRecevied.bind(this),
            onResourceEdited: this._onLightResourceEdited.bind(this)
        };
        this.projectClient = projectClient;
        this.light = light;
        this.light.color = parseInt(config.color, 16);
        this.light.intensity = config.intensity;
        this.light.distance = config.distance;
        this.light.angle = config.angle;
        this.light.target.set(config.target.x, config.target.y, config.target.z);
        this.light.castShadow = config.castShadow;
        this.light.shadow.mapSize.set(config.shadowMapSize.width, config.shadowMapSize.height);
        this.light.shadow.bias = config.shadowBias;
        this.light.shadow.darkness = config.shadowDarkness;
        this.light.shadow.camera.near = config.shadowCameraNearPlane;
        this.light.shadow.camera.far = config.shadowCameraFarPlane;
        this.light.shadow.camera.fov = config.shadowCameraFov;
        this.light.shadow.camera.left = config.shadowCameraSize.left;
        this.light.shadow.camera.right = config.shadowCameraSize.right;
        this.light.shadow.camera.top = config.shadowCameraSize.top;
        this.light.shadow.camera.bottom = config.shadowCameraSize.bottom;
        this.light.setType(config.type);
        this.projectClient.subResource("lightSettings", this.lightSettingsSubscriber);
    }
    LightUpdater.prototype.destroy = function () {
        this.projectClient.unsubResource("lightSettings", this.lightSettingsSubscriber);
    };
    LightUpdater.prototype.config_setProperty = function (path, value) {
        switch (path) {
            case "type":
                this.light.setType(value);
                break;
            case "color":
                this.light.setColor(parseInt(value, 16));
                break;
            case "intensity":
                this.light.setIntensity(value);
                break;
            case "distance":
                this.light.setDistance(value);
                break;
            case "angle":
                this.light.setAngle(value);
                break;
            case "target.x":
                this.light.setTarget(value, null, null);
                break;
            case "target.y":
                this.light.setTarget(null, value, null);
                break;
            case "target.z":
                this.light.setTarget(null, null, value);
                break;
            case "castShadow":
                this.light.setCastShadow(value);
                break;
            case "shadowMapSize.width":
                this.light.setShadowMapSize(value, null);
                break;
            case "shadowMapSize.height":
                this.light.setShadowMapSize(null, value);
                break;
            case "shadowBias":
                this.light.setShadowBias(value);
                break;
            case "shadowDarkness":
                this.light.setShadowDarkness(value);
                break;
            case "shadowCameraNearPlane":
                this.light.setShadowCameraNearPlane(value);
                break;
            case "shadowCameraFarPlane":
                this.light.setShadowCameraFarPlane(value);
                break;
            case "shadowCameraFov":
                this.light.setShadowCameraFov(value);
                break;
            case "shadowCameraSize.top":
                this.light.setShadowCameraSize(value, null, null, null);
                break;
            case "shadowCameraSize.bottom":
                this.light.setShadowCameraSize(null, value, null, null);
                break;
            case "shadowCameraSize.left":
                this.light.setShadowCameraSize(null, null, value, null);
                break;
            case "shadowCameraSize.right":
                this.light.setShadowCameraSize(null, null, null, value);
                break;
        }
    };
    LightUpdater.prototype._updateLightShadowMap = function () {
        switch (this.lightSettings.pub.shadowMapType) {
            case "basic":
                this.light.actor.gameInstance.threeRenderer.shadowMap.type = THREE.BasicShadowMap;
                break;
            case "pcf":
                this.light.actor.gameInstance.threeRenderer.shadowMap.type = THREE.PCFShadowMap;
                break;
            case "pcfSoft":
                this.light.actor.gameInstance.threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
                break;
        }
        this.light.actor.gameInstance.threeScene.traverse(function (object) {
            var material = object.material;
            if (material != null)
                material.needsUpdate = true;
        });
    };
    LightUpdater.prototype._onLightResourceRecevied = function (resourceId, resource) {
        this.lightSettings = resource;
        this._updateLightShadowMap();
    };
    LightUpdater.prototype._onLightResourceEdited = function (resourceId, command, propertyName) {
        if (command === "setProperty" && propertyName === "shadowMapType")
            this._updateLightShadowMap();
    };
    return LightUpdater;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LightUpdater;
