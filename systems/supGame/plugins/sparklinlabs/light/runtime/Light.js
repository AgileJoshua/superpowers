var THREE = SupEngine.THREE;
function init(player, callback) {
    switch (player.resources.lightSettings.shadowMapType) {
        case "basic":
            player.gameInstance.threeRenderer.shadowMap.type = THREE.BasicShadowMap;
            break;
        case "pcf":
            player.gameInstance.threeRenderer.shadowMap.type = THREE.PCFShadowMap;
            break;
        case "pcfSoft":
            player.gameInstance.threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
            break;
    }
    callback();
}
exports.init = init;
function setupComponent(player, component, config) {
    component.__outer.type = ["ambient", "point", "spot", "directional"].indexOf(config.type);
    component.color = parseInt(config.color, 16);
    component.intensity = config.intensity;
    component.distance = config.distance;
    component.angle = config.angle;
    component.target.set(config.target.x, config.target.y, config.target.z);
    component.castShadow = config.castShadow;
    component.shadow.mapSize.set(config.shadowMapSize.width, config.shadowMapSize.height);
    component.shadow.bias = config.shadowBias;
    component.shadow.darkness = config.shadowDarkness;
    component.shadow.camera.near = config.shadowCameraNearPlane;
    component.shadow.camera.far = config.shadowCameraFarPlane;
    component.shadow.camera.fov = config.shadowCameraFov;
    component.shadow.camera.left = config.shadowCameraSize.left;
    component.shadow.camera.right = config.shadowCameraSize.right;
    component.shadow.camera.top = config.shadowCameraSize.top;
    component.shadow.camera.bottom = config.shadowCameraSize.bottom;
    component.setType(config.type);
}
exports.setupComponent = setupComponent;
