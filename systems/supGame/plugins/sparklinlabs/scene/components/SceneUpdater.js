var tmpVector3 = new SupEngine.THREE.Vector3();
var tmpQuaternion = new SupEngine.THREE.Quaternion();
var SceneUpdater = (function () {
    function SceneUpdater(projectClient, engine, config, receiveAssetCallbacks, editAssetCallbacks) {
        var _this = this;
        this.bySceneNodeId = {};
        this.sceneSubscriber = {
            onAssetReceived: this._onSceneAssetReceived.bind(this),
            onAssetEdited: this._onSceneAssetEdited.bind(this),
            onAssetTrashed: this._onSceneAssetTrashed.bind(this)
        };
        this._onEditCommand_moveNode = function (id, parentId, index) {
            var nodeActor = _this.bySceneNodeId[id].actor;
            var parentNodeActor = (_this.bySceneNodeId[parentId] != null) ? _this.bySceneNodeId[parentId].actor : null;
            nodeActor.setParent(parentNodeActor);
            _this._onUpdateMarkerRecursive(id);
        };
        this._onEditCommand_setNodeProperty = function (id, path, value) {
            var nodeEditorData = _this.bySceneNodeId[id];
            switch (path) {
                case "position":
                    nodeEditorData.actor.setLocalPosition(value);
                    if (!_this.isInPrefab)
                        _this._onUpdateMarkerRecursive(id);
                    break;
                case "orientation":
                    nodeEditorData.actor.setLocalOrientation(value);
                    if (!_this.isInPrefab)
                        _this._onUpdateMarkerRecursive(id);
                    break;
                case "scale":
                    nodeEditorData.actor.setLocalScale(value);
                    if (!_this.isInPrefab)
                        _this._onUpdateMarkerRecursive(id);
                    break;
                case "prefab.sceneAssetId":
                    nodeEditorData.prefabUpdater.config_setProperty("sceneAssetId", value);
                    break;
            }
        };
        this._onEditCommand_duplicateNode = function (rootNode, newNodes) {
            for (var _i = 0; _i < newNodes.length; _i++) {
                var newNode = newNodes[_i];
                _this._createNodeActor(newNode.node);
            }
        };
        this._onEditCommand_removeNode = function (id) {
            _this._recurseClearActor(id);
        };
        this._onEditCommand_addComponent = function (nodeId, nodeComponent, index) {
            _this._createNodeActorComponent(_this.sceneAsset.nodes.byId[nodeId], nodeComponent, _this.bySceneNodeId[nodeId].actor);
        };
        this._onEditCommand_editComponent = function (nodeId, componentId, command) {
            var args = [];
            for (var _i = 3; _i < arguments.length; _i++) {
                args[_i - 3] = arguments[_i];
            }
            var componentUpdater = _this.bySceneNodeId[nodeId].bySceneComponentId[componentId].componentUpdater;
            if (componentUpdater[("config_" + command)] != null)
                (_a = componentUpdater[("config_" + command)]).call.apply(_a, [componentUpdater].concat(args));
            var _a;
        };
        this._onEditCommand_removeComponent = function (nodeId, componentId) {
            _this.gameInstance.destroyComponent(_this.bySceneNodeId[nodeId].bySceneComponentId[componentId].component);
            _this.bySceneNodeId[nodeId].bySceneComponentId[componentId].componentUpdater.destroy();
            delete _this.bySceneNodeId[nodeId].bySceneComponentId[componentId];
        };
        this.projectClient = projectClient;
        this.receiveAssetCallbacks = receiveAssetCallbacks;
        this.editAssetCallbacks = editAssetCallbacks;
        this.gameInstance = engine.gameInstance;
        this.rootActor = engine.actor;
        this.sceneAssetId = config.sceneAssetId;
        this.isInPrefab = config.isInPrefab;
        if (this.sceneAssetId != null)
            this.projectClient.subAsset(this.sceneAssetId, "scene", this.sceneSubscriber);
    }
    SceneUpdater.prototype.destroy = function () {
        this._clearScene();
        if (this.sceneAssetId != null)
            this.projectClient.unsubAsset(this.sceneAssetId, this.sceneSubscriber);
    };
    SceneUpdater.prototype._onSceneAssetReceived = function (assetId, asset) {
        var _this = this;
        this.sceneAsset = asset;
        var walk = function (node) {
            _this._createNodeActor(node);
            if (node.children != null && node.children.length > 0) {
                for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    walk(child);
                }
            }
        };
        for (var _i = 0, _a = asset.nodes.pub; _i < _a.length; _i++) {
            var node = _a[_i];
            walk(node);
        }
        if (this.receiveAssetCallbacks != null)
            this.receiveAssetCallbacks.scene();
    };
    SceneUpdater.prototype._onSceneAssetEdited = function (id, command) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        var commandFunction = this[("_onEditCommand_" + command)];
        if (commandFunction != null)
            commandFunction.apply(this, args);
        if (this.editAssetCallbacks != null) {
            var editCallback = this.editAssetCallbacks.scene[command];
            if (editCallback != null)
                editCallback.apply(null, args);
        }
    };
    SceneUpdater.prototype._onEditCommand_addNode = function (node, parentId, index) {
        this._createNodeActor(node);
    };
    SceneUpdater.prototype._onUpdateMarkerRecursive = function (nodeId) {
        var _this = this;
        this.sceneAsset.nodes.walkNode(this.sceneAsset.nodes.byId[nodeId], null, function (descendantNode) {
            var nodeEditorData = _this.bySceneNodeId[descendantNode.id];
            nodeEditorData.markerActor.setGlobalPosition(nodeEditorData.actor.getGlobalPosition(tmpVector3));
            nodeEditorData.markerActor.setGlobalOrientation(nodeEditorData.actor.getGlobalOrientation(tmpQuaternion));
        });
    };
    SceneUpdater.prototype._recurseClearActor = function (nodeId) {
        var nodeEditorData = this.bySceneNodeId[nodeId];
        if (nodeEditorData.prefabUpdater == null) {
            for (var _i = 0, _a = nodeEditorData.actor.children; _i < _a.length; _i++) {
                var childActor = _a[_i];
                var sceneNodeId = childActor.sceneNodeId;
                if (sceneNodeId != null)
                    this._recurseClearActor(sceneNodeId);
            }
        }
        else {
            nodeEditorData.prefabUpdater.destroy();
        }
        for (var componentId in nodeEditorData.bySceneComponentId) {
            nodeEditorData.bySceneComponentId[componentId].componentUpdater.destroy();
        }
        if (!this.isInPrefab)
            this.gameInstance.destroyActor(nodeEditorData.markerActor);
        this.gameInstance.destroyActor(nodeEditorData.actor);
        delete this.bySceneNodeId[nodeId];
    };
    SceneUpdater.prototype._onSceneAssetTrashed = function () {
        this._clearScene();
        if (this.editAssetCallbacks != null)
            SupClient.onAssetTrashed();
    };
    SceneUpdater.prototype.config_setProperty = function (path, value) {
        switch (path) {
            case "sceneAssetId":
                if (this.sceneAssetId != null)
                    this.projectClient.unsubAsset(this.sceneAssetId, this.sceneSubscriber);
                this.sceneAssetId = value;
                this._clearScene();
                this.sceneAsset = null;
                if (this.sceneAssetId != null)
                    this.projectClient.subAsset(this.sceneAssetId, "scene", this.sceneSubscriber);
                break;
        }
    };
    SceneUpdater.prototype._createNodeActor = function (node) {
        var parentNode = this.sceneAsset.nodes.parentNodesById[node.id];
        var parentActor;
        if (parentNode != null)
            parentActor = this.bySceneNodeId[parentNode.id].actor;
        else
            parentActor = this.rootActor;
        var nodeActor = new SupEngine.Actor(this.gameInstance, node.name, parentActor);
        var nodeId = (this.rootActor == null) ? node.id : this.rootActor.threeObject.userData.nodeId;
        nodeActor.threeObject.userData.nodeId = nodeId;
        nodeActor.threeObject.position.copy(node.position);
        nodeActor.threeObject.quaternion.copy(node.orientation);
        nodeActor.threeObject.scale.copy(node.scale);
        nodeActor.threeObject.updateMatrixWorld(false);
        nodeActor.sceneNodeId = node.id;
        var markerActor;
        if (!this.isInPrefab) {
            markerActor = new SupEngine.Actor(this.gameInstance, nodeId + " Marker", null, { layer: -1 });
            markerActor.setGlobalPosition(nodeActor.getGlobalPosition(tmpVector3));
            markerActor.setGlobalOrientation(nodeActor.getGlobalOrientation(tmpQuaternion));
            new SupEngine.editorComponentClasses["TransformMarker"](markerActor);
        }
        this.bySceneNodeId[node.id] = { actor: nodeActor, markerActor: markerActor, bySceneComponentId: {}, prefabUpdater: null };
        if (node.prefab != null) {
            this.bySceneNodeId[node.id].prefabUpdater = new SceneUpdater(this.projectClient, { gameInstance: this.gameInstance, actor: nodeActor }, { sceneAssetId: node.prefab.sceneAssetId, isInPrefab: true });
        }
        if (node.components != null)
            for (var _i = 0, _a = node.components; _i < _a.length; _i++) {
                var component = _a[_i];
                this._createNodeActorComponent(node, component, nodeActor);
            }
        return nodeActor;
    };
    SceneUpdater.prototype._createNodeActorComponent = function (sceneNode, sceneComponent, nodeActor) {
        var componentClass = SupEngine.editorComponentClasses[(sceneComponent.type + "Marker")];
        if (componentClass == null)
            componentClass = SupEngine.componentClasses[sceneComponent.type];
        var actorComponent = new componentClass(nodeActor);
        this.bySceneNodeId[sceneNode.id].bySceneComponentId[sceneComponent.id] = {
            component: actorComponent,
            componentUpdater: new componentClass.Updater(this.projectClient, actorComponent, sceneComponent.config),
        };
    };
    SceneUpdater.prototype._clearScene = function () {
        for (var sceneNodeId in this.bySceneNodeId) {
            var sceneNode = this.bySceneNodeId[sceneNodeId];
            if (!this.isInPrefab)
                this.gameInstance.destroyActor(sceneNode.markerActor);
            for (var componentId in sceneNode.bySceneComponentId)
                sceneNode.bySceneComponentId[componentId].componentUpdater.destroy();
            this.gameInstance.destroyActor(sceneNode.actor);
        }
        this.bySceneNodeId = {};
    };
    return SceneUpdater;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SceneUpdater;
