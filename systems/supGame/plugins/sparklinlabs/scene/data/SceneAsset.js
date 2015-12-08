var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var serverRequire = require;
var THREE;
// NOTE: It is important that we require THREE through SupEngine
// so that we inherit any settings, like the global Euler order
// (or, alternatively, we could duplicate those settings...)
if (global.window == null)
    THREE = serverRequire("../../../../SupEngine").THREE;
else if (window.SupEngine != null)
    THREE = SupEngine.THREE;
var path = require("path");
var fs = require("fs");
var _ = require("lodash");
var SceneNodes_1 = require("./SceneNodes");
var SceneAsset = (function (_super) {
    __extends(SceneAsset, _super);
    function SceneAsset(id, pub, server) {
        _super.call(this, id, pub, SceneAsset.schema, server);
    }
    SceneAsset.prototype.init = function (options, callback) {
        this.pub = {
            formatVersion: SceneAsset.currentFormatVersion,
            nodes: []
        };
        _super.prototype.init.call(this, options, callback);
    };
    SceneAsset.prototype.load = function (assetPath) {
        var _this = this;
        fs.readFile(path.join(assetPath, "scene.json"), { encoding: "utf8" }, function (err, json) {
            if (err != null && err.code === "ENOENT") {
                fs.readFile(path.join(assetPath, "asset.json"), { encoding: "utf8" }, function (err, json) {
                    fs.rename(path.join(assetPath, "asset.json"), path.join(assetPath, "scene.json"), function (err) {
                        _this._onLoaded(assetPath, JSON.parse(json));
                    });
                });
            }
            else {
                _this._onLoaded(assetPath, JSON.parse(json));
            }
        });
    };
    SceneAsset.prototype.migrate = function (assetPath, pub, callback) {
        if (pub.formatVersion === SceneAsset.currentFormatVersion) {
            callback(false);
            return;
        }
        if (pub.formatVersion == null) {
            // node.prefabId used to be set to the empty string
            // when the node was a prefab but had no scene associated.
            //
            // It was replaced with node.prefab.sceneAssetId
            // in Superpowers v0.16.
            function migratePrefab(node) {
                var oldPrefabId = node.prefabId;
                if (oldPrefabId != null) {
                    delete node.prefabId;
                    node.prefab = { sceneAssetId: oldPrefabId.length > 0 ? oldPrefabId : null };
                }
                else {
                    for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                        var child = _a[_i];
                        migratePrefab(child);
                    }
                }
            }
            for (var _i = 0, _a = pub.nodes; _i < _a.length; _i++) {
                var rootNode = _a[_i];
                migratePrefab(rootNode);
            }
            pub.formatVersion = 1;
        }
        callback(true);
    };
    SceneAsset.prototype.save = function (assetPath, callback) {
        var json = JSON.stringify(this.pub, null, 2);
        fs.writeFile(path.join(assetPath, "scene.json"), json, { encoding: "utf8" }, callback);
    };
    SceneAsset.prototype.setup = function () {
        var _this = this;
        this.componentPathsByDependentAssetId = {};
        this.nodes = new SceneNodes_1.default(this.pub.nodes, this);
        this.nodes.on("addDependencies", function (depIds, componentPath) { _this._onAddComponentDependencies(componentPath, depIds); });
        this.nodes.on("removeDependencies", function (depIds, componentPath) { _this._onRemoveComponentDependencies(componentPath, depIds); });
        this.nodes.walk(function (node) {
            if (node.prefab != null && node.prefab.sceneAssetId != null)
                _this._onAddComponentDependencies(node.id + "_" + node.prefab.sceneAssetId, [node.prefab.sceneAssetId]);
        });
        for (var nodeId in this.nodes.componentsByNodeId) {
            var components = this.nodes.componentsByNodeId[nodeId];
            for (var componentId in components.configsById) {
                var config = components.configsById[componentId];
                var componentPath = nodeId + "_" + componentId;
                (function (config, componentPath) {
                    config.on("addDependencies", function (depIds) { _this._onAddComponentDependencies(componentPath, depIds); });
                    config.on("removeDependencies", function (depIds) { _this._onRemoveComponentDependencies(componentPath, depIds); });
                })(config, componentPath);
                config.restore();
            }
        }
    };
    /* NOTE: We're restore()'ing all the components during this.setup() since we need
     to rebuild this.componentPathsByDependentAssetId every time the scene asset
     is loaded.
  
     It's a bit weird but it all works out since this.setup() is called right before
     this.restore() anyway.*/
    SceneAsset.prototype.restore = function () {
        this.emit("addDependencies", Object.keys(this.componentPathsByDependentAssetId));
    };
    SceneAsset.prototype.server_addNode = function (client, name, options, callback) {
        var _this = this;
        if (name.indexOf("/") !== -1) {
            callback("Actor name cannot contain slashes", null, null, null);
            return;
        }
        var parentId = (options != null) ? options.parentId : null;
        var parentNode = this.nodes.byId[parentId];
        if (parentNode != null && parentNode.prefab != null) {
            callback("Can't create children node on prefabs", null, null, null);
            return;
        }
        if (this.nodes.pub.length !== 0 && parentNode == null) {
            var entry = this.server.data.entries.byId[this.id];
            if (entry.dependentAssetIds.length > 0) {
                callback("A prefab can have only one root actor", null, null, null);
                return;
            }
        }
        var sceneNode = {
            id: null, name: name, children: [], components: [],
            position: (options != null && options.transform != null && options.transform.position != null) ? options.transform.position : { x: 0, y: 0, z: 0 },
            orientation: (options != null && options.transform != null && options.transform.orientation != null) ? options.transform.orientation : { x: 0, y: 0, z: 0, w: 1 },
            scale: (options != null && options.transform != null && options.transform.scale != null) ? options.transform.scale : { x: 1, y: 1, z: 1 },
            visible: true, layer: 0, prefab: (options.prefab) ? { sceneAssetId: null } : null
        };
        var index = (options != null) ? options.index : null;
        this.nodes.add(sceneNode, parentId, index, function (err, actualIndex) {
            if (err != null) {
                callback(err, null, null, null);
                return;
            }
            callback(null, sceneNode, parentId, actualIndex);
            _this.emit("change");
        });
    };
    SceneAsset.prototype.client_addNode = function (node, parentId, index) {
        this.nodes.client_add(node, parentId, index);
    };
    SceneAsset.prototype.server_setNodeProperty = function (client, id, path, value, callback) {
        var _this = this;
        if (path === "name" && value.indexOf("/") !== -1) {
            callback("Actor name cannot contain slashes", null, null, null);
            return;
        }
        this.nodes.setProperty(id, path, value, function (err, actualValue) {
            if (err != null) {
                callback(err, null, null, null);
                return;
            }
            callback(null, id, path, actualValue);
            _this.emit("change");
        });
    };
    SceneAsset.prototype.client_setNodeProperty = function (id, path, value) {
        this.nodes.client_setProperty(id, path, value);
    };
    SceneAsset.prototype.server_moveNode = function (client, id, parentId, index, callback) {
        var _this = this;
        var node = this.nodes.byId[id];
        if (node == null) {
            callback("Invalid node id: " + id, null, null, null);
            return;
        }
        var parentNode = this.nodes.byId[parentId];
        if (parentNode != null && parentNode.prefab != null) {
            callback("Can't move children node on prefabs", null, null, null);
            return;
        }
        if (parentNode == null) {
            var entry = this.server.data.entries.byId[this.id];
            if (entry.dependentAssetIds.length > 0) {
                callback("A prefab can have only one root actor", null, null, null);
                return;
            }
        }
        var globalMatrix = this.computeGlobalMatrix(node);
        this.nodes.move(id, parentId, index, function (err, actualIndex) {
            if (err != null) {
                callback(err, null, null, null);
                return;
            }
            _this.applyGlobalMatrix(node, globalMatrix);
            callback(null, id, parentId, actualIndex);
            _this.emit("change");
        });
    };
    SceneAsset.prototype.computeGlobalMatrix = function (node) {
        var matrix = new THREE.Matrix4().compose(node.position, node.orientation, node.scale);
        var parentNode = this.nodes.parentNodesById[node.id];
        if (parentNode != null) {
            var parentGlobalMatrix = this.computeGlobalMatrix(parentNode);
            matrix.multiplyMatrices(parentGlobalMatrix, matrix);
        }
        return matrix;
    };
    SceneAsset.prototype.applyGlobalMatrix = function (node, matrix) {
        var parentNode = this.nodes.parentNodesById[node.id];
        if (parentNode != null) {
            var parentGlobalMatrix = this.computeGlobalMatrix(parentNode);
            matrix.multiplyMatrices(new THREE.Matrix4().getInverse(parentGlobalMatrix), matrix);
        }
        var position = new THREE.Vector3();
        var orientation = new THREE.Quaternion();
        var scale = new THREE.Vector3();
        matrix.decompose(position, orientation, scale);
        node.position = { x: position.x, y: position.y, z: position.z };
        node.orientation = { x: orientation.x, y: orientation.y, z: orientation.z, w: orientation.w };
        node.scale = { x: scale.x, y: scale.y, z: scale.z };
    };
    SceneAsset.prototype.client_moveNode = function (id, parentId, index) {
        var node = this.nodes.byId[id];
        var globalMatrix = this.computeGlobalMatrix(node);
        this.nodes.client_move(id, parentId, index);
        this.applyGlobalMatrix(node, globalMatrix);
    };
    SceneAsset.prototype.server_duplicateNode = function (client, newName, id, index, callback) {
        var _this = this;
        if (newName.indexOf("/") !== -1) {
            callback("Actor name cannot contain slashes", null, null);
            return;
        }
        var referenceNode = this.nodes.byId[id];
        if (referenceNode == null) {
            callback("Invalid node id: " + id, null, null);
            return;
        }
        var parentNode = this.nodes.parentNodesById[id];
        if (parentNode == null) {
            var entry = this.server.data.entries.byId[this.id];
            if (entry.dependentAssetIds.length > 0) {
                callback("A prefab can have only one root actor", null, null);
                return;
            }
        }
        var newNodes = [];
        var totalNodeCount = 0;
        var walk = function (node) {
            totalNodeCount += 1;
            for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                var childNode = _a[_i];
                walk(childNode);
            }
        };
        walk(referenceNode);
        var rootNode = {
            id: null, name: newName, children: [],
            components: _.cloneDeep(referenceNode.components),
            position: _.cloneDeep(referenceNode.position),
            orientation: _.cloneDeep(referenceNode.orientation),
            scale: _.cloneDeep(referenceNode.scale),
            visible: referenceNode.visible, layer: referenceNode.layer, prefab: _.cloneDeep(referenceNode.prefab)
        };
        var parentId = (parentNode != null) ? parentNode.id : null;
        var addNode = function (newNode, parentId, index, children) {
            _this.nodes.add(newNode, parentId, index, function (err, actualIndex) {
                if (err != null) {
                    callback(err, null, null);
                    return;
                }
                for (var componentId in _this.nodes.componentsByNodeId[newNode.id].configsById) {
                    var config = _this.nodes.componentsByNodeId[newNode.id].configsById[componentId];
                    var componentPath = newNode.id + "_" + componentId;
                    (function (config, componentPath) {
                        config.on("addDependencies", function (depIds) { _this._onAddComponentDependencies(componentPath, depIds); });
                        config.on("removeDependencies", function (depIds) { _this._onRemoveComponentDependencies(componentPath, depIds); });
                    })(config, componentPath);
                    config.restore();
                }
                newNodes.push({ node: newNode, parentId: parentId, index: actualIndex });
                if (newNodes.length === totalNodeCount) {
                    callback(null, rootNode, newNodes);
                    _this.emit("change");
                }
                for (var childIndex = 0; childIndex < children.length; childIndex++) {
                    var childNode = children[childIndex];
                    var node = {
                        id: null, name: childNode.name, children: [],
                        components: _.cloneDeep(childNode.components),
                        position: _.cloneDeep(childNode.position),
                        orientation: _.cloneDeep(childNode.orientation),
                        scale: _.cloneDeep(childNode.scale),
                        visible: childNode.visible, layer: childNode.layer, prefab: _.cloneDeep(childNode.prefab)
                    };
                    addNode(node, newNode.id, childIndex, childNode.children);
                }
            });
        };
        addNode(rootNode, parentId, index, referenceNode.children);
    };
    SceneAsset.prototype.client_duplicateNode = function (rootNode, newNodes) {
        for (var _i = 0; _i < newNodes.length; _i++) {
            var newNode = newNodes[_i];
            newNode.node.children.length = 0;
            this.nodes.client_add(newNode.node, newNode.parentId, newNode.index);
        }
    };
    SceneAsset.prototype.server_removeNode = function (client, id, callback) {
        var _this = this;
        this.nodes.remove(id, function (err) {
            if (err != null) {
                callback(err, null);
                return;
            }
            callback(null, id);
            _this.emit("change");
        });
    };
    SceneAsset.prototype.client_removeNode = function (id) {
        this.nodes.client_remove(id);
    };
    // Components
    SceneAsset.prototype._onAddComponentDependencies = function (componentPath, depIds) {
        //console.log `Adding component dependencies: ${componentPath} - ${depIds}`
        var addedDepIds = [];
        for (var _i = 0; _i < depIds.length; _i++) {
            var depId = depIds[_i];
            if (this.componentPathsByDependentAssetId[depId] == null)
                this.componentPathsByDependentAssetId[depId] = [];
            var componentPaths = this.componentPathsByDependentAssetId[depId];
            if (componentPaths.indexOf(componentPath) === -1) {
                componentPaths.push(componentPath);
                if (componentPaths.length === 1)
                    addedDepIds.push(depId);
            }
        }
        if (addedDepIds.length > 0)
            this.emit("addDependencies", addedDepIds);
    };
    SceneAsset.prototype._onRemoveComponentDependencies = function (componentPath, depIds) {
        //console.log `Removing component dependencies: ${componentPath} - ${depIds}`
        var removedDepIds = [];
        for (var _i = 0; _i < depIds.length; _i++) {
            var depId = depIds[_i];
            var componentPaths = this.componentPathsByDependentAssetId[depId];
            var index = (componentPaths != null) ? componentPaths.indexOf(componentPath) : null;
            if (index != null && index !== -1) {
                componentPaths.splice(index, 1);
                if (componentPaths.length === 0) {
                    removedDepIds.push(depId);
                    delete this.componentPathsByDependentAssetId[depId];
                }
            }
        }
        if (removedDepIds.length > 0)
            this.emit("removeDependencies", removedDepIds);
    };
    ;
    SceneAsset.prototype.server_addComponent = function (client, nodeId, componentType, index, callback) {
        var _this = this;
        var componentConfigClass = this.server.system.data.componentConfigClasses[componentType];
        if (componentConfigClass == null) {
            callback("Invalid component type", null, null, null);
            return;
        }
        var node = this.nodes.byId[nodeId];
        if (node != null && node.prefab != null) {
            callback("Can't add component on prefabs", null, null, null);
            return;
        }
        var component = {
            type: componentType,
            config: componentConfigClass.create(),
        };
        this.nodes.addComponent(nodeId, component, index, function (err, actualIndex) {
            if (err != null) {
                callback(err, null, null, null);
                return;
            }
            var config = _this.nodes.componentsByNodeId[nodeId].configsById[component.id];
            var componentPath = nodeId + "_" + component.id;
            config.on("addDependencies", function (depIds) { _this._onAddComponentDependencies(componentPath, depIds); });
            config.on("removeDependencies", function (depIds) { _this._onRemoveComponentDependencies(componentPath, depIds); });
            callback(null, nodeId, component, actualIndex);
            _this.emit("change");
        });
    };
    SceneAsset.prototype.client_addComponent = function (nodeId, component, index) {
        this.nodes.client_addComponent(nodeId, component, index);
    };
    SceneAsset.prototype.server_editComponent = function (client, nodeId, componentId, command) {
        var _this = this;
        var args = [];
        for (var _i = 4; _i < arguments.length; _i++) {
            args[_i - 4] = arguments[_i];
        }
        var callback = args.pop();
        var components = this.nodes.componentsByNodeId[nodeId];
        if (components == null) {
            callback("Invalid node id: " + nodeId, null, null, null, null);
            return;
        }
        var componentConfig = components.configsById[componentId];
        if (componentConfig == null) {
            callback("Invalid component id: " + componentId, null, null, null, null);
            return;
        }
        var commandMethod = componentConfig[("server_" + command)];
        if (commandMethod == null) {
            callback("Invalid component command", null, null, null, null);
            return;
        }
        commandMethod.call.apply(commandMethod, [componentConfig, client].concat(args, [function (err) {
            var callbackArgs = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                callbackArgs[_i - 1] = arguments[_i];
            }
            if (err != null) {
                callback(err, null, null, null, null);
                return;
            }
            callback.apply(void 0, [null, nodeId, componentId, command].concat(callbackArgs));
            _this.emit("change");
        }]));
    };
    SceneAsset.prototype.client_editComponent = function (nodeId, componentId, command) {
        var args = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            args[_i - 3] = arguments[_i];
        }
        var componentConfig = this.nodes.componentsByNodeId[nodeId].configsById[componentId];
        var commandMethod = componentConfig[("client_" + command)];
        commandMethod.call.apply(commandMethod, [componentConfig].concat(args));
    };
    SceneAsset.prototype.server_removeComponent = function (client, nodeId, componentId, callback) {
        var _this = this;
        var components = this.nodes.componentsByNodeId[nodeId];
        if (components == null) {
            callback("Invalid node id: " + nodeId, null, null);
            return;
        }
        components.remove(componentId, function (err) {
            if (err != null) {
                callback(err, null, null);
                return;
            }
            callback(null, nodeId, componentId);
            _this.emit("change");
        });
    };
    SceneAsset.prototype.client_removeComponent = function (nodeId, componentId) {
        this.nodes.componentsByNodeId[nodeId].client_remove(componentId);
    };
    SceneAsset.currentFormatVersion = 1;
    SceneAsset.schema = {
        nodes: { type: "array" },
    };
    return SceneAsset;
})(SupCore.Data.Base.Asset);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SceneAsset;
