var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var SceneComponents_1 = require("./SceneComponents");
var SceneNodes = (function (_super) {
    __extends(SceneNodes, _super);
    function SceneNodes(pub, sceneAsset) {
        var _this = this;
        _super.call(this, pub, SceneNodes.schema);
        this.componentsByNodeId = {};
        this.sceneAsset = sceneAsset;
        this.walk(function (node, parentNode) {
            // NOTE: Node visibility and layer were introduced in Superpowers 0.8
            if (typeof node.visible === "undefined") {
                node.visible = true;
                node.layer = 0;
            }
            _this.componentsByNodeId[node.id] = new SceneComponents_1.default(node.components, _this.sceneAsset);
        });
    }
    SceneNodes.prototype.add = function (node, parentId, index, callback) {
        var _this = this;
        _super.prototype.add.call(this, node, parentId, index, function (err, actualIndex) {
            if (err != null) {
                callback(err, null);
                return;
            }
            if (node.components != null) {
                var components = new SceneComponents_1.default(node.components, _this.sceneAsset);
                _this.componentsByNodeId[node.id] = components;
                node.components = components.pub;
            }
            callback(null, actualIndex);
        });
    };
    SceneNodes.prototype.client_add = function (node, parentId, index) {
        _super.prototype.client_add.call(this, node, parentId, index);
        if (node.components != null)
            this.componentsByNodeId[node.id] = new SceneComponents_1.default(node.components, this.sceneAsset);
    };
    SceneNodes.prototype.remove = function (id, callback) {
        var _this = this;
        var node = this.byId[id];
        if (node == null) {
            callback("Invalid node id: " + id);
            return;
        }
        if (node.prefab != null && node.prefab.sceneAssetId != null)
            this.emit("removeDependencies", [node.prefab.sceneAssetId], id + "_" + node.prefab.sceneAssetId);
        this.walkNode(node, null, function (node) {
            for (var componentId in _this.componentsByNodeId[node.id].configsById) {
                _this.componentsByNodeId[node.id].configsById[componentId].destroy();
            }
            delete _this.componentsByNodeId[node.id];
        });
        _super.prototype.remove.call(this, id, callback);
    };
    SceneNodes.prototype.client_remove = function (id) {
        var _this = this;
        var node = this.byId[id];
        if (node.components != null) {
            this.walkNode(node, null, function (node) {
                for (var componentId in _this.componentsByNodeId[node.id].configsById) {
                    _this.componentsByNodeId[node.id].configsById[componentId].destroy();
                }
                delete _this.componentsByNodeId[node.id];
            });
        }
        _super.prototype.client_remove.call(this, id);
    };
    SceneNodes.prototype.addComponent = function (id, component, index, callback) {
        var components = this.componentsByNodeId[id];
        if (components == null) {
            callback("Invalid node id: " + id, null);
            return;
        }
        components.add(component, index, callback);
    };
    SceneNodes.prototype.client_addComponent = function (id, component, index) {
        this.componentsByNodeId[id].client_add(component, index);
    };
    SceneNodes.prototype.setProperty = function (id, key, value, callback) {
        var _this = this;
        var oldDepId;
        var finish = function () {
            _super.prototype.setProperty.call(_this, id, key, value, function (err, actualValue) {
                if (err != null) {
                    callback(err);
                    return;
                }
                if (key === "prefab.sceneAssetId") {
                    if (oldDepId != null)
                        _this.emit("removeDependencies", [oldDepId], id + "_" + oldDepId);
                    if (actualValue != null)
                        _this.emit("addDependencies", [actualValue], id + "_" + actualValue);
                }
                callback(null, actualValue);
            });
        };
        if (key !== "prefab.sceneAssetId") {
            finish();
            return;
        }
        // Ensure prefab is valid
        oldDepId = this.byId[id].prefab != null ? this.byId[id].prefab.sceneAssetId : null;
        if (value == null) {
            finish();
            return;
        }
        if (value === this.sceneAsset.id) {
            callback("A prefab can't reference itself");
            return;
        }
        // Check for infinite loop
        var canUseScene = true;
        var acquiringScene = 0;
        var checkScene = function (sceneId) {
            acquiringScene++;
            _this.sceneAsset.server.data.assets.acquire(sceneId, _this, function (error, asset) {
                _this.sceneAsset.server.data.assets.release(sceneId, _this);
                // Check the scene has only one root actor
                if (asset.pub.nodes.length !== 1) {
                    callback("A prefab must have only one root actor");
                    return;
                }
                var walk = function (node) {
                    if (!canUseScene)
                        return;
                    if (node.prefab != null && node.prefab.sceneAssetId != null) {
                        if (node.prefab.sceneAssetId === _this.sceneAsset.id)
                            canUseScene = false;
                        else
                            checkScene(node.prefab.sceneAssetId);
                    }
                    for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                        var child = _a[_i];
                        walk(child);
                    }
                };
                for (var _i = 0, _a = asset.pub.nodes; _i < _a.length; _i++) {
                    var rootNode = _a[_i];
                    walk(rootNode);
                }
                acquiringScene--;
                if (acquiringScene === 0) {
                    if (canUseScene)
                        finish();
                    else
                        callback("Cannot use this scene, it will create an infinite loop");
                }
            });
        };
        checkScene(value);
    };
    SceneNodes.schema = {
        name: { type: "string", minLength: 1, maxLength: 80, mutable: true },
        children: { type: "array" },
        position: {
            mutable: true,
            type: "hash",
            properties: {
                x: { type: "number", mutable: true },
                y: { type: "number", mutable: true },
                z: { type: "number", mutable: true },
            }
        },
        orientation: {
            mutable: true,
            type: "hash",
            properties: {
                x: { type: "number", mutable: true },
                y: { type: "number", mutable: true },
                z: { type: "number", mutable: true },
                w: { type: "number", mutable: true },
            }
        },
        scale: {
            mutable: true,
            type: "hash",
            properties: {
                x: { type: "number", mutable: true },
                y: { type: "number", mutable: true },
                z: { type: "number", mutable: true },
            }
        },
        visible: { type: "boolean", mutable: true },
        layer: { type: "integer", min: 0, mutable: true },
        prefab: {
            type: "hash?",
            properties: {
                "sceneAssetId": { type: "string?", mutable: true },
            }
        },
        components: { type: "array?" }
    };
    return SceneNodes;
})(SupCore.Data.Base.TreeById);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SceneNodes;
