var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var SceneUpdater_1 = require("./SceneUpdater");
var SceneComponent = (function (_super) {
    __extends(SceneComponent, _super);
    function SceneComponent(actor) {
        _super.call(this, actor, "Scene");
    }
    SceneComponent.prototype.setIsLayerActive = function (active) { };
    SceneComponent.Updater = SceneUpdater_1.default;
    return SceneComponent;
})(SupEngine.ActorComponent);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SceneComponent;
