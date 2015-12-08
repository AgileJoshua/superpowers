var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var SceneComponents = (function (_super) {
    __extends(SceneComponents, _super);
    function SceneComponents(pub, sceneAsset) {
        _super.call(this, pub, SceneComponents.schema);
        this.configsById = {};
        this.sceneAsset = sceneAsset;
        var system = (this.sceneAsset.server != null) ? this.sceneAsset.server.system : SupCore.system;
        for (var _i = 0, _a = this.pub; _i < _a.length; _i++) {
            var item = _a[_i];
            var componentConfigClass = system.data.componentConfigClasses[item.type];
            if (componentConfigClass == null) {
                if (sceneAsset != null) {
                    var scenePath = sceneAsset.server.data.entries.getPathFromId(sceneAsset.id);
                    throw new Error("Could not find component config class for type " + item.type + " in scene " + scenePath + " of project " + sceneAsset.server.data.manifest.pub.name + " (" + sceneAsset.server.data.manifest.pub.id + ")");
                }
                else {
                    throw new Error("Could not find component config class for type " + item.type);
                }
            }
            this.configsById[item.id] = new componentConfigClass(item.config, this.sceneAsset);
        }
    }
    SceneComponents.prototype.add = function (component, index, callback) {
        var _this = this;
        _super.prototype.add.call(this, component, index, function (err, actualIndex) {
            if (err != null) {
                callback(err, null);
                return;
            }
            var componentConfigClass = _this.sceneAsset.server.system.data.componentConfigClasses[component.type];
            _this.configsById[component.id] = new componentConfigClass(component.config, _this.sceneAsset);
            callback(null, actualIndex);
        });
    };
    SceneComponents.prototype.client_add = function (component, index) {
        _super.prototype.client_add.call(this, component, index);
        var componentConfigClass = SupCore.system.data.componentConfigClasses[component.type];
        this.configsById[component.id] = new componentConfigClass(component.config);
    };
    SceneComponents.prototype.remove = function (id, callback) {
        var _this = this;
        _super.prototype.remove.call(this, id, function (err) {
            if (err != null) {
                callback(err);
                return;
            }
            _this.configsById[id].destroy();
            delete _this.configsById[id];
            callback(null);
        });
    };
    SceneComponents.prototype.client_remove = function (id) {
        _super.prototype.client_remove.call(this, id);
        delete this.configsById[id];
    };
    SceneComponents.schema = {
        type: { type: "string" },
        config: { type: "any" },
    };
    return SceneComponents;
})(SupCore.Data.Base.ListById);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SceneComponents;
