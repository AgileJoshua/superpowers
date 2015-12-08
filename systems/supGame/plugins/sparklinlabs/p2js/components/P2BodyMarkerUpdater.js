var P2BodyMarkerUpdater = (function () {
    function P2BodyMarkerUpdater(client, bodyRenderer, config) {
        this.bodyRenderer = bodyRenderer;
        this.config = config;
        switch (this.config.shape) {
            case "box": {
                this.bodyRenderer.setBox(this.config.width, this.config.height);
                break;
            }
            case "circle": {
                this.bodyRenderer.setCircle(this.config.radius);
                break;
            }
        }
        this.bodyRenderer.setOffset(this.config.offsetX, this.config.offsetY);
    }
    P2BodyMarkerUpdater.prototype.destroy = function () { };
    P2BodyMarkerUpdater.prototype.config_setProperty = function (path, value) {
        if (path === "width" || path === "height" || (path === "shape" && value === "box")) {
            this.bodyRenderer.setBox(this.config.width, this.config.height);
        }
        if (path === "radius" || (path === "shape" && value === "circle")) {
            this.bodyRenderer.setCircle(this.config.radius);
        }
        if (path === "offsetX" || path === "offsetY") {
            this.bodyRenderer.setOffset(this.config.offsetX, this.config.offsetY);
        }
    };
    return P2BodyMarkerUpdater;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = P2BodyMarkerUpdater;
