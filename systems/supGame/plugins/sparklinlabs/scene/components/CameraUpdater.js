var CameraUpdater = (function () {
    function CameraUpdater(projectClient, camera, config) {
        var _this = this;
        this.onResourceReceived = function (resourceId, resource) {
            _this.resource = resource;
            _this.updateRatio();
        };
        this.onResourceEdited = function (resourceId, command, propertyName) {
            _this.updateRatio();
        };
        this.projectClient = projectClient;
        this.camera = camera;
        this.config = config;
        this.camera.setConfig(this.config);
        this.camera.setRatio(5 / 3);
        this.projectClient.subResource("gameSettings", this);
    }
    CameraUpdater.prototype.destroy = function () {
        if (this.resource != null)
            this.projectClient.unsubResource("gameSettings", this);
    };
    CameraUpdater.prototype.config_setProperty = function (path, value) {
        this.camera.setConfig(this.config);
    };
    CameraUpdater.prototype.updateRatio = function () {
        if (this.resource.pub.ratioNumerator != null && this.resource.pub.ratioDenominator != null)
            this.camera.setRatio(this.resource.pub.ratioNumerator / this.resource.pub.ratioDenominator);
        else
            this.camera.setRatio(5 / 3);
    };
    return CameraUpdater;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CameraUpdater;
