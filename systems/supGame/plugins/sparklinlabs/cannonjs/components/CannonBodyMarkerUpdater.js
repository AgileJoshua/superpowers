var CannonBodyMarkerUpdater = (function () {
    function CannonBodyMarkerUpdater(client, bodyRenderer, config) {
        this.client = client;
        this.bodyRenderer = bodyRenderer;
        this.config = config;
        switch (this.config.shape) {
            case "box":
                this.bodyRenderer.setBox(this.config.halfSize);
                break;
            case "sphere":
                this.bodyRenderer.setSphere(this.config.radius);
                break;
            case "cylinder":
                this.bodyRenderer.setCylinder(this.config.radius, this.config.height);
                break;
        }
        this.bodyRenderer.setOffset(this.config.offset);
    }
    CannonBodyMarkerUpdater.prototype.destroy = function () { };
    CannonBodyMarkerUpdater.prototype.config_setProperty = function (path, value) {
        if (path.indexOf("halfSize") !== -1 || (path === "shape" && value === "box")) {
            this.bodyRenderer.setBox(this.config.halfSize);
            this.bodyRenderer.setOffset(this.config.offset);
        }
        if (path.indexOf("offset") !== -1) {
            this.bodyRenderer.setOffset(this.config.offset);
        }
        if ((path === "radius" && this.config.shape === "cylinder") || (path === "shape" && value === "cylinder") || path === "height") {
            this.bodyRenderer.setCylinder(this.config.radius, this.config.height);
            this.bodyRenderer.setOffset(this.config.offset);
        }
        if ((path === "radius" && this.config.shape === "sphere") || (path === "shape" && value === "sphere")) {
            this.bodyRenderer.setSphere(this.config.radius);
            this.bodyRenderer.setOffset(this.config.offset);
        }
    };
    return CannonBodyMarkerUpdater;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CannonBodyMarkerUpdater;
