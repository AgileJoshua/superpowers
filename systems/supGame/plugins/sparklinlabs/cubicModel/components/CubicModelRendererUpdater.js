var THREE = SupEngine.THREE;
var CubicModelRendererUpdater = (function () {
    function CubicModelRendererUpdater(client, cubicModelRenderer, config, receiveAssetCallbacks, editAssetCallbacks) {
        var _this = this;
        this.cubicModelAsset = null;
        this.cubicModelSubscriber = {
            onAssetReceived: this._onCubicModelAssetReceived.bind(this),
            onAssetEdited: this._onCubicModelAssetEdited.bind(this),
            onAssetTrashed: this._onCubicModelAssetTrashed.bind(this)
        };
        this._onEditCommand_moveNode = function (id, parentId, index) {
            var rendererNode = _this.cubicModelRenderer.byNodeId[id];
            var pivot = rendererNode.pivot;
            var matrix = pivot.matrixWorld.clone();
            var previousParentId = pivot.parent.userData.cubicNodeId;
            if (previousParentId != null) {
                var parentNode = _this.cubicModelRenderer.byNodeId[previousParentId];
                parentNode.children.splice(parentNode.children.indexOf(rendererNode), 1);
            }
            var parent = (parentId != null) ? _this.cubicModelRenderer.byNodeId[parentId].pivot : _this.cubicModelRenderer.threeRoot;
            parent.add(pivot);
            matrix.multiplyMatrices(new THREE.Matrix4().getInverse(parent.matrixWorld), matrix);
            matrix.decompose(pivot.position, pivot.quaternion, pivot.scale);
            pivot.updateMatrixWorld(false);
        };
        this._onEditCommand_moveNodePivot = function (id, value) {
            var rendererNode = _this.cubicModelRenderer.byNodeId[id];
            var node = _this.cubicModelAsset.nodes.byId[id];
            var parentNode = _this.cubicModelAsset.nodes.parentNodesById[id];
            var parentOffset = (parentNode != null) ? parentNode.shape.offset : { x: 0, y: 0, z: 0 };
            rendererNode.pivot.position.set(value.x + parentOffset.x, value.y + parentOffset.y, value.z + parentOffset.z);
            rendererNode.pivot.quaternion.set(node.orientation.x, node.orientation.y, node.orientation.z, node.orientation.w);
            rendererNode.shape.position.set(node.shape.offset.x, node.shape.offset.y, node.shape.offset.z);
            var walk = function (rendererNode, parentOffset) {
                var node = _this.cubicModelAsset.nodes.byId[rendererNode.nodeId];
                rendererNode.pivot.position.set(node.position.x + parentOffset.x, node.position.y + parentOffset.y, node.position.z + parentOffset.z);
                for (var _i = 0, _a = rendererNode.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    walk(child, node.shape.offset);
                }
            };
            for (var _i = 0, _a = rendererNode.children; _i < _a.length; _i++) {
                var child = _a[_i];
                walk(child, node.shape.offset);
            }
            rendererNode.pivot.updateMatrixWorld(false);
        };
        this._onEditCommand_setNodeProperty = function (id, path, value) {
            var rendererNode = _this.cubicModelRenderer.byNodeId[id];
            var node = _this.cubicModelAsset.nodes.byId[id];
            switch (path) {
                case "name":
                    rendererNode.pivot.name = value;
                    break;
                case "position":
                    var parentNode = _this.cubicModelAsset.nodes.parentNodesById[id];
                    var parentOffset = (parentNode != null) ? parentNode.shape.offset : { x: 0, y: 0, z: 0 };
                    rendererNode.pivot.position.set(value.x + parentOffset.x, value.y + parentOffset.y, value.z + parentOffset.z);
                    rendererNode.pivot.updateMatrixWorld(false);
                    break;
                case "orientation":
                    rendererNode.pivot.quaternion.set(value.x, value.y, value.z, value.w);
                    rendererNode.pivot.updateMatrixWorld(false);
                    break;
                case "shape.offset":
                    rendererNode.shape.position.set(value.x, value.y, value.z);
                    var walk = function (rendererNode, parentOffset) {
                        var node = _this.cubicModelAsset.nodes.byId[rendererNode.nodeId];
                        rendererNode.pivot.position.set(node.position.x + parentOffset.x, node.position.y + parentOffset.y, node.position.z + parentOffset.z);
                        for (var _i = 0, _a = rendererNode.children; _i < _a.length; _i++) {
                            var child = _a[_i];
                            walk(child, node.shape.offset);
                        }
                    };
                    for (var _i = 0, _a = rendererNode.children; _i < _a.length; _i++) {
                        var child = _a[_i];
                        walk(child, node.shape.offset);
                    }
                    rendererNode.pivot.updateMatrixWorld(false);
                    break;
                default: {
                    switch (node.shape.type) {
                        case "box":
                            switch (path) {
                                case "shape.settings.size":
                                    var geometry = rendererNode.shape.geometry = new THREE.BoxGeometry(value.x, value.y, value.z);
                                    _this.cubicModelRenderer.updateBoxNodeUv(geometry, node);
                                    break;
                                case "shape.settings.stretch":
                                    rendererNode.shape.scale.set(value.x, value.y, value.z);
                                    rendererNode.shape.updateMatrixWorld(false);
                                    break;
                            }
                            break;
                    }
                    break;
                }
            }
        };
        this._onEditCommand_duplicateNode = function (rootNode, newNodes) {
            for (var _i = 0; _i < newNodes.length; _i++) {
                var newNode = newNodes[_i];
                _this._createRendererNode(newNode.node);
            }
        };
        this._onEditCommand_removeNode = function (id) {
            _this._recurseClearNode(id);
        };
        this._onEditCommand_changeTextureWidth = function () { _this._onChangeTextureSize(); };
        this._onEditCommand_changeTextureHeight = function () { _this._onChangeTextureSize(); };
        this.client = client;
        this.cubicModelRenderer = cubicModelRenderer;
        this.receiveAssetCallbacks = receiveAssetCallbacks;
        this.editAssetCallbacks = editAssetCallbacks;
        this.cubicModelAssetId = config.cubicModelAssetId;
        if (this.cubicModelAssetId != null)
            this.client.subAsset(this.cubicModelAssetId, "cubicModel", this.cubicModelSubscriber);
    }
    CubicModelRendererUpdater.prototype.destroy = function () {
        if (this.cubicModelAssetId != null)
            this.client.unsubAsset(this.cubicModelAssetId, this.cubicModelSubscriber);
    };
    CubicModelRendererUpdater.prototype._onCubicModelAssetReceived = function (assetId, asset) {
        this.cubicModelAsset = asset;
        this._setCubicModel();
        if (this.receiveAssetCallbacks != null)
            this.receiveAssetCallbacks.cubicModel();
    };
    CubicModelRendererUpdater.prototype._setCubicModel = function () {
        if (this.cubicModelAsset == null) {
            this.cubicModelRenderer.setCubicModel(null);
            return;
        }
        this.cubicModelRenderer.setCubicModel(this.cubicModelAsset.pub);
    };
    CubicModelRendererUpdater.prototype._onCubicModelAssetEdited = function (id, command) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        var commandCallback = this[("_onEditCommand_" + command)];
        if (commandCallback != null)
            commandCallback.apply(this, args);
        if (this.editAssetCallbacks != null) {
            var editCallback = this.editAssetCallbacks.cubicModel[command];
            if (editCallback != null)
                editCallback.apply(null, args);
        }
    };
    CubicModelRendererUpdater.prototype._onEditCommand_setProperty = function (path, value) {
        switch (path) {
            case "pixelsPerUnit":
                var scale = 1 / value;
                this.cubicModelRenderer.threeRoot.scale.set(scale, scale, scale);
                this.cubicModelRenderer.threeRoot.updateMatrixWorld(false);
                break;
        }
    };
    CubicModelRendererUpdater.prototype._onEditCommand_addNode = function (node, parentId, index) {
        this._createRendererNode(node);
    };
    CubicModelRendererUpdater.prototype._createRendererNode = function (node) {
        var parentNode = this.cubicModelAsset.nodes.parentNodesById[node.id];
        var parentRendererNode = (parentNode != null) ? this.cubicModelRenderer.byNodeId[parentNode.id] : null;
        var offset = (parentNode != null) ? parentNode.shape.offset : { x: 0, y: 0, z: 0 };
        this.cubicModelRenderer._makeNode(node, parentRendererNode, offset);
    };
    CubicModelRendererUpdater.prototype._recurseClearNode = function (nodeId) {
        var rendererNode = this.cubicModelRenderer.byNodeId[nodeId];
        for (var _i = 0, _a = rendererNode.children; _i < _a.length; _i++) {
            var childNode = _a[_i];
            this._recurseClearNode(childNode.nodeId);
        }
        var parentPivot = rendererNode.pivot.parent;
        var parentNodeId = parentPivot.userData.cubicNodeId;
        if (parentNodeId != null) {
            var parentRendererNode = this.cubicModelRenderer.byNodeId[parentNodeId];
            parentRendererNode.children.splice(parentRendererNode.children.indexOf(rendererNode), 1);
        }
        rendererNode.shape.parent.remove(rendererNode.shape);
        rendererNode.shape.geometry.dispose();
        rendererNode.shape.material.dispose();
        rendererNode.pivot.parent.remove(rendererNode.pivot);
        delete this.cubicModelRenderer.byNodeId[nodeId];
    };
    CubicModelRendererUpdater.prototype._onEditCommand_moveNodeTextureOffset = function (nodeIds, offset) {
        for (var _i = 0; _i < nodeIds.length; _i++) {
            var id = nodeIds[_i];
            var node = this.cubicModelAsset.nodes.byId[id];
            var geometry = this.cubicModelRenderer.byNodeId[id].shape.geometry;
            this.cubicModelRenderer.updateBoxNodeUv(geometry, node);
        }
    };
    CubicModelRendererUpdater.prototype._onChangeTextureSize = function () {
        for (var id in this.cubicModelAsset.nodes.byId) {
            var node = this.cubicModelAsset.nodes.byId[id];
            var shape = this.cubicModelRenderer.byNodeId[id].shape;
            this.cubicModelRenderer.updateBoxNodeUv(shape.geometry, node);
            var material = shape.material;
            material.map = this.cubicModelAsset.pub.textures["map"];
            material.needsUpdate = true;
        }
    };
    CubicModelRendererUpdater.prototype._onCubicModelAssetTrashed = function () {
        this.cubicModelAsset = null;
        this.cubicModelRenderer.setCubicModel(null);
        // FIXME: the updater shouldn't be dealing with SupClient.onAssetTrashed directly
        if (this.editAssetCallbacks != null)
            SupClient.onAssetTrashed();
    };
    CubicModelRendererUpdater.prototype.config_setProperty = function (path, value) {
        switch (path) {
            case "cubicModelAssetId":
                if (this.cubicModelAssetId != null)
                    this.client.unsubAsset(this.cubicModelAssetId, this.cubicModelSubscriber);
                this.cubicModelAssetId = value;
                this.cubicModelAsset = null;
                this.cubicModelRenderer.setCubicModel(null, null);
                if (this.cubicModelAssetId != null)
                    this.client.subAsset(this.cubicModelAssetId, "cubicModel", this.cubicModelSubscriber);
                break;
        }
    };
    return CubicModelRendererUpdater;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CubicModelRendererUpdater;
