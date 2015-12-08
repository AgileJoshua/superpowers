var ui_1 = require("./ui");
var network_1 = require("./network");
var Shader_1 = require("../../components/Shader");
var THREE = SupEngine.THREE;
var canvasElt = document.querySelector("canvas");
var gameInstance = new SupEngine.GameInstance(canvasElt);
var cameraActor = new SupEngine.Actor(gameInstance, "Camera");
cameraActor.setLocalPosition(new THREE.Vector3(0, 0, 10));
var cameraComponent = new SupEngine.componentClasses["Camera"](cameraActor);
/* tslint:disable:no-unused-expression */
new SupEngine.editorComponentClasses["Camera3DControls"](cameraActor, cameraComponent);
/* tslint:enable:no-unused-expression */
var loader = new THREE.TextureLoader();
var leonardTexture = loader.load("leonard.png", undefined);
leonardTexture.magFilter = THREE.NearestFilter;
leonardTexture.minFilter = THREE.NearestFilter;
var previewActor;
var material;
function setupPreview(options) {
    if (options === void 0) { options = { useDraft: false }; }
    if (previewActor != null) {
        gameInstance.destroyActor(previewActor);
        previewActor = null;
    }
    if (network_1.data.previewComponentUpdater != null) {
        network_1.data.previewComponentUpdater.destroy();
        network_1.data.previewComponentUpdater = null;
    }
    if (material != null) {
        material.dispose();
        material = null;
    }
    if (ui_1.default.previewTypeSelect.value === "Asset" && ui_1.default.previewEntry == null)
        return;
    previewActor = new SupEngine.Actor(gameInstance, "Preview");
    var previewGeometry;
    switch (ui_1.default.previewTypeSelect.value) {
        case "Plane":
            previewGeometry = new THREE.PlaneBufferGeometry(2, 2);
            break;
        case "Box":
            previewGeometry = new THREE.BufferGeometry().fromGeometry(new THREE.BoxGeometry(2, 2, 2));
            break;
        case "Sphere":
            previewGeometry = new THREE.BufferGeometry().fromGeometry(new THREE.SphereGeometry(2, 12, 12));
            break;
        case "Asset":
            var componentClassName;
            var config = { materialType: "shader", shaderAssetId: SupClient.query.asset, spriteAssetId: null, modelAssetId: null };
            if (ui_1.default.previewEntry.type === "sprite") {
                componentClassName = "SpriteRenderer";
                config.spriteAssetId = ui_1.default.previewEntry.id;
            }
            else {
                componentClassName = "ModelRenderer";
                config.modelAssetId = ui_1.default.previewEntry.id;
            }
            var componentClass = SupEngine.componentClasses[componentClassName];
            var component = new componentClass(previewActor);
            network_1.data.previewComponentUpdater = new componentClass.Updater(network_1.data.projectClient, component, config);
            return;
    }
    material = Shader_1.createShaderMaterial(network_1.data.shaderAsset.pub, { map: leonardTexture }, previewGeometry, options);
    previewActor.threeObject.add(new THREE.Mesh(previewGeometry, material));
    gameInstance.update();
    gameInstance.draw();
}
exports.setupPreview = setupPreview;
var lastTimestamp = 0;
var accumulatedTime = 0;
function tick(timestamp) {
    if (timestamp === void 0) { timestamp = 0; }
    requestAnimationFrame(tick);
    accumulatedTime += timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    var _a = gameInstance.tick(accumulatedTime), updates = _a.updates, timeLeft = _a.timeLeft;
    accumulatedTime = timeLeft;
    if (updates !== 0 && material != null)
        for (var i = 0; i < updates; i++)
            material.uniforms.time.value += 1 / gameInstance.framesPerSecond;
    gameInstance.draw();
}
requestAnimationFrame(tick);
