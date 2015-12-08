var ArcadeBody2DUpdater = (function () {
    function ArcadeBody2DUpdater(projectClient, bodyRenderer, config) {
        this.projectClient = projectClient;
        this.bodyRenderer = bodyRenderer;
        this.config = config;
        this.setType();
    }
    ArcadeBody2DUpdater.prototype.destroy = function () { };
    ArcadeBody2DUpdater.prototype.config_setProperty = function (path, value) {
        if (path === "width" || path === "height")
            this.bodyRenderer.setBox(this.config.width, this.config.height);
        if (path === "offset.x" || path === "offset.y")
            this.bodyRenderer.setOffset(this.config.offset.x, this.config.offset.y);
        if (path === "type")
            this.setType();
    };
    ArcadeBody2DUpdater.prototype.setType = function () {
        if (this.config.type === "box") {
            this.bodyRenderer.setBox(this.config.width, this.config.height);
            this.bodyRenderer.setOffset(this.config.offset.x, this.config.offset.y);
        }
        else
            this.bodyRenderer.setTileMap();
    };
    return ArcadeBody2DUpdater;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ArcadeBody2DUpdater;
