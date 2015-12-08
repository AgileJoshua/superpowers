var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BehaviorUpdater_1 = require("./BehaviorUpdater");
var BehaviorMarker = (function (_super) {
    __extends(BehaviorMarker, _super);
    function BehaviorMarker(actor) {
        _super.call(this, actor, "BehaviorMarker");
    }
    BehaviorMarker.prototype.setIsLayerActive = function (active) { };
    BehaviorMarker.Updater = BehaviorUpdater_1.default;
    return BehaviorMarker;
})(SupEngine.ActorComponent);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BehaviorMarker;
