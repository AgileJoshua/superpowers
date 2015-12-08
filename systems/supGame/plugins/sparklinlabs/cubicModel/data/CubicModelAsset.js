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
var async = require("async");
var _ = require("lodash");
var CubicModelNodes_1 = require("./CubicModelNodes");
var CubicModelAsset = (function (_super) {
    __extends(CubicModelAsset, _super);
    function CubicModelAsset(id, pub, server) {
        _super.call(this, id, pub, CubicModelAsset.schema, server);
        // Only used on client-side
        this.clientTextureDatas = {};
    }
    CubicModelAsset.prototype.init = function (options, callback) {
        var _this = this;
        this.server.data.resources.acquire("cubicModelSettings", null, function (err, cubicModelSettings) {
            var initialSize = 256;
            _this.pub = {
                pixelsPerUnit: cubicModelSettings.pub.pixelsPerUnit,
                nodes: [],
                textureWidth: initialSize,
                textureHeight: initialSize,
                maps: { map: new ArrayBuffer(initialSize * initialSize * 4) },
                mapSlots: {
                    map: "map",
                    light: null,
                    specular: null,
                    alpha: null,
                    normal: null
                }
            };
            var data = new Uint8ClampedArray(_this.pub.maps["map"]);
            for (var i = 0; i < data.length; i++)
                data[i] = 255;
            _super.prototype.init.call(_this, options, callback);
        });
    };
    CubicModelAsset.prototype.setup = function () {
        this.nodes = new CubicModelNodes_1.default(this);
        this.textureDatas = {};
        for (var mapName in this.pub.maps) {
            this.textureDatas[mapName] = new Uint8ClampedArray(this.pub.maps[mapName]);
        }
    };
    CubicModelAsset.prototype.load = function (assetPath) {
        var _this = this;
        fs.readFile(path.join(assetPath, "cubicModel.json"), { encoding: "utf8" }, function (err, json) {
            var pub = JSON.parse(json);
            var mapNames = pub.maps;
            pub.maps = {};
            async.each(mapNames, function (mapName, cb) {
                // TODO: Replace this with a PNG disk format
                fs.readFile(path.join(assetPath, "map-" + mapName + ".dat"), function (err, data) {
                    if (err) {
                        cb(err);
                        return;
                    }
                    pub.maps[mapName] = new Uint8ClampedArray(data).buffer;
                    cb();
                });
            }, function (err) {
                if (err)
                    throw err;
                _this._onLoaded(assetPath, pub);
            });
        });
    };
    CubicModelAsset.prototype.client_load = function () { this._loadTextures(); };
    CubicModelAsset.prototype.client_unload = function () { this._unloadTextures(); };
    CubicModelAsset.prototype.save = function (assetPath, saveCallback) {
        var maps = this.pub.maps;
        this.pub.maps = [];
        for (var key in maps) {
            if (maps[key] != null)
                this.pub.maps.push(key);
        }
        var json = JSON.stringify(this.pub, null, 2);
        this.pub.maps = maps;
        fs.writeFile(path.join(assetPath, "cubicModel.json"), json, { encoding: "utf8" }, function (err) {
            if (err) {
                saveCallback(err);
                return;
            }
            async.each(Object.keys(maps), function (mapName, cb) {
                var map = new Buffer(new Uint8ClampedArray(maps[mapName]));
                if (map == null) {
                    fs.unlink(path.join(assetPath, "map-" + mapName + ".dat"), function (err) {
                        if (err != null && err.code !== "ENOENT") {
                            cb(err);
                            return;
                        }
                        cb();
                    });
                    return;
                }
                fs.writeFile(path.join(assetPath, "map-" + mapName + ".dat"), map, cb);
            }, saveCallback);
        });
    };
    CubicModelAsset.prototype._unloadTextures = function () {
        for (var textureName in this.pub.textures)
            this.pub.textures[textureName].dispose();
    };
    CubicModelAsset.prototype._loadTextures = function () {
        this._unloadTextures();
        this.pub.textures = {};
        this.clientTextureDatas = {};
        // Texturing
        // NOTE: This is the unoptimized variant for editing
        // There should be an option you can pass to setModel to ask for editable version vs (default) optimized
        for (var mapName in this.pub.maps) {
            var canvas = document.createElement("canvas");
            canvas.width = this.pub.textureWidth;
            canvas.height = this.pub.textureHeight;
            var ctx = canvas.getContext("2d");
            var texture = this.pub.textures[mapName] = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            var imageData = new ImageData(this.textureDatas[mapName], this.pub.textureWidth, this.pub.textureHeight);
            ctx.putImageData(imageData, 0, 0);
            this.clientTextureDatas[mapName] = { imageData: imageData, ctx: ctx };
        }
    };
    // Nodes
    CubicModelAsset.prototype.server_addNode = function (client, name, options, callback) {
        var _this = this;
        var parentId = (options != null) ? options.parentId : null;
        var node = {
            id: null, name: name, children: [],
            position: (options != null && options.transform != null && options.transform.position != null) ? options.transform.position : { x: 0, y: 0, z: 0 },
            orientation: (options != null && options.transform != null && options.transform.orientation != null) ? options.transform.orientation : { x: 0, y: 0, z: 0, w: 1 },
            shape: (options != null && options.shape != null) ? options.shape : { type: "none", offset: { x: 0, y: 0, z: 0 }, textureOffset: {}, settings: null }
        };
        node.shape.textureLayoutCustom = false;
        if (node.shape.type !== "none") {
            var origin = { x: 0, y: 0 };
            var placed = false;
            var size = CubicModelNodes_1.getShapeTextureSize(node.shape);
            for (var j = 0; j < this.pub.textureHeight - size.height; j++) {
                for (var i = 0; i < this.pub.textureWidth; i++) {
                    var pushed = void 0;
                    do {
                        pushed = false;
                        for (var otherNodeId in this.nodes.byId) {
                            var otherNode = this.nodes.byId[otherNodeId];
                            if (otherNode.shape.type === "none")
                                continue;
                            // + 1 and - 1 because we need a one-pixel border
                            // to avoid filtering issues
                            for (var faceName in otherNode.shape.textureLayout) {
                                var faceOffset = otherNode.shape.textureLayout[faceName].offset;
                                var otherSize = CubicModelNodes_1.getShapeTextureFaceSize(otherNode.shape, faceName);
                                if ((i + size.width >= faceOffset.x - 1) && (j + size.height >= faceOffset.y - 1) &&
                                    (i <= faceOffset.x + otherSize.width + 1) && (j <= faceOffset.y + otherSize.height + 1)) {
                                    i = faceOffset.x + otherSize.width + 2;
                                    pushed = true;
                                    break;
                                }
                            }
                            if (pushed)
                                break;
                        }
                    } while (pushed);
                    if (i < this.pub.textureWidth && i + size.width < this.pub.textureWidth) {
                        origin.x = i;
                        origin.y = j;
                        placed = true;
                        break;
                    }
                }
                if (placed)
                    break;
            }
            if (!placed)
                console.log("Could not find any room for the node's texture. Texture needs to be expanded and all blocks should be re-laid out from bigger to smaller!");
            switch (node.shape.type) {
                case "box":
                    var size_1 = node.shape.settings.size;
                    node.shape.textureLayout = {
                        "top": {
                            offset: { x: origin.x + size_1.z, y: origin.y },
                            mirror: { x: false, y: false },
                            angle: 0
                        },
                        "bottom": {
                            offset: { x: origin.x + size_1.z + size_1.x, y: origin.y },
                            mirror: { x: false, y: false },
                            angle: 0
                        },
                        "front": {
                            offset: { x: origin.x + size_1.z, y: origin.y + size_1.z },
                            mirror: { x: false, y: false },
                            angle: 0
                        },
                        "back": {
                            offset: { x: origin.x + 2 * size_1.z + size_1.x, y: origin.y + size_1.z },
                            mirror: { x: false, y: false },
                            angle: 0
                        },
                        "left": {
                            offset: { x: origin.x, y: origin.y + size_1.z },
                            mirror: { x: false, y: false },
                            angle: 0
                        },
                        "right": {
                            offset: { x: origin.x + size_1.z + size_1.x, y: origin.y + size_1.z },
                            mirror: { x: false, y: false },
                            angle: 0
                        }
                    };
                    break;
                case "none":
                    node.shape.textureLayout = {};
                    break;
            }
        }
        var index = (options != null) ? options.index : null;
        this.nodes.add(node, parentId, index, function (err, actualIndex) {
            if (err != null) {
                callback(err, null, null, null);
                return;
            }
            callback(null, node, parentId, actualIndex);
            _this.emit("change");
        });
    };
    CubicModelAsset.prototype.client_addNode = function (node, parentId, index) {
        this.nodes.client_add(node, parentId, index);
    };
    CubicModelAsset.prototype.server_setNodeProperty = function (client, id, path, value, callback) {
        var _this = this;
        var oldSize = this.nodes.byId[id].shape.settings.size;
        this.nodes.setProperty(id, path, value, function (err, actualValue) {
            if (err != null) {
                callback(err, null, null, null);
                return;
            }
            if (path === "shape.settings.size")
                _this._updateNodeUvFromSize(oldSize, _this.nodes.byId[id].shape);
            callback(null, id, path, actualValue);
            _this.emit("change");
        });
    };
    CubicModelAsset.prototype.client_setNodeProperty = function (id, path, value) {
        var oldSize = this.nodes.byId[id].shape.settings.size;
        this.nodes.client_setProperty(id, path, value);
        if (path === "shape.settings.size")
            this._updateNodeUvFromSize(oldSize, this.nodes.byId[id].shape);
    };
    CubicModelAsset.prototype._updateNodeUvFromSize = function (oldSize, shape) {
        if (shape.textureLayoutCustom)
            return;
        switch (shape.type) {
            case "box":
                var newSize = shape.settings.size;
                var x = newSize.x - oldSize.x;
                var z = newSize.z - oldSize.z;
                shape.textureLayout["top"].offset.x += z;
                shape.textureLayout["bottom"].offset.x += x + z;
                shape.textureLayout["front"].offset.x += z;
                shape.textureLayout["right"].offset.x += x + z;
                shape.textureLayout["back"].offset.x += x + 2 * z;
                shape.textureLayout["front"].offset.y += z;
                shape.textureLayout["back"].offset.y += z;
                shape.textureLayout["left"].offset.y += z;
                shape.textureLayout["right"].offset.y += z;
                break;
        }
    };
    CubicModelAsset.prototype.server_moveNodePivot = function (client, id, value, callback) {
        var _this = this;
        var node = this.nodes.byId[id];
        var oldMatrix = (node != null) ? this.computeGlobalMatrix(node) : null;
        this.nodes.setProperty(id, "position", value, function (err, actualValue) {
            if (err != null) {
                callback(err, null, null);
                return;
            }
            var newInverseMatrix = _this.computeGlobalMatrix(node);
            newInverseMatrix.getInverse(newInverseMatrix);
            var offset = new THREE.Vector3(node.shape.offset.x, node.shape.offset.y, node.shape.offset.z);
            offset.applyMatrix4(oldMatrix).applyMatrix4(newInverseMatrix);
            node.shape.offset.x = offset.x;
            node.shape.offset.y = offset.y;
            node.shape.offset.z = offset.z;
            callback(null, id, actualValue);
            _this.emit("change");
        });
    };
    CubicModelAsset.prototype.client_moveNodePivot = function (id, value) {
        var node = this.nodes.byId[id];
        var oldMatrix = (node != null) ? this.computeGlobalMatrix(node) : null;
        this.nodes.client_setProperty(id, "position", value);
        var newInverseMatrix = this.computeGlobalMatrix(node);
        newInverseMatrix.getInverse(newInverseMatrix);
        var offset = new THREE.Vector3(node.shape.offset.x, node.shape.offset.y, node.shape.offset.z);
        offset.applyMatrix4(oldMatrix).applyMatrix4(newInverseMatrix);
        node.shape.offset.x = offset.x;
        node.shape.offset.y = offset.y;
        node.shape.offset.z = offset.z;
    };
    CubicModelAsset.prototype.server_moveNode = function (client, id, parentId, index, callback) {
        var _this = this;
        var node = this.nodes.byId[id];
        if (node == null) {
            callback("Invalid node id: " + id, null, null, null);
            return;
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
    CubicModelAsset.prototype.computeGlobalMatrix = function (node, includeShapeOffset) {
        if (includeShapeOffset === void 0) { includeShapeOffset = false; }
        var defaultScale = new THREE.Vector3(1, 1, 1);
        var matrix = new THREE.Matrix4().compose(node.position, node.orientation, defaultScale);
        var parentNode = this.nodes.parentNodesById[node.id];
        var parentMatrix = new THREE.Matrix4();
        var parentPosition = new THREE.Vector3();
        var parentOffset = new THREE.Vector3();
        while (parentNode != null) {
            parentPosition.set(parentNode.position.x, parentNode.position.y, parentNode.position.z);
            parentOffset.set(parentNode.shape.offset.x, parentNode.shape.offset.y, parentNode.shape.offset.z);
            parentOffset.applyQuaternion(parentNode.orientation);
            parentPosition.add(parentOffset);
            parentMatrix.identity().compose(parentPosition, parentNode.orientation, defaultScale);
            matrix.multiplyMatrices(parentMatrix, matrix);
            parentNode = this.nodes.parentNodesById[parentNode.id];
        }
        return matrix;
    };
    CubicModelAsset.prototype.applyGlobalMatrix = function (node, matrix) {
        var parentGlobalMatrix = new THREE.Matrix4();
        var parentNode = this.nodes.parentNodesById[node.id];
        var parentMatrix = new THREE.Matrix4();
        var defaultScale = new THREE.Vector3(1, 1, 1);
        var parentPosition = new THREE.Vector3();
        var parentOffset = new THREE.Vector3();
        while (parentNode != null) {
            parentPosition.set(parentNode.position.x, parentNode.position.y, parentNode.position.z);
            parentOffset.set(parentNode.shape.offset.x, parentNode.shape.offset.y, parentNode.shape.offset.z);
            parentOffset.applyQuaternion(parentNode.orientation);
            parentPosition.add(parentOffset);
            parentMatrix.identity().compose(parentPosition, parentNode.orientation, defaultScale);
            parentGlobalMatrix.multiplyMatrices(parentMatrix, parentGlobalMatrix);
            parentNode = this.nodes.parentNodesById[parentNode.id];
        }
        matrix.multiplyMatrices(parentGlobalMatrix.getInverse(parentGlobalMatrix), matrix);
        var position = new THREE.Vector3();
        var orientation = new THREE.Quaternion();
        matrix.decompose(position, orientation, defaultScale);
        node.position.x = position.x;
        node.position.y = position.y;
        node.position.z = position.z;
        node.orientation.x = orientation.x;
        node.orientation.y = orientation.y;
        node.orientation.z = orientation.z;
        node.orientation.w = orientation.w;
    };
    CubicModelAsset.prototype.client_moveNode = function (id, parentId, index) {
        var node = this.nodes.byId[id];
        var globalMatrix = this.computeGlobalMatrix(node);
        this.nodes.client_move(id, parentId, index);
        this.applyGlobalMatrix(node, globalMatrix);
    };
    CubicModelAsset.prototype.server_duplicateNode = function (client, newName, id, index, callback) {
        var _this = this;
        var referenceNode = this.nodes.byId[id];
        if (referenceNode == null) {
            callback("Invalid node id: " + id, null, null);
            return;
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
            position: _.cloneDeep(referenceNode.position),
            orientation: _.cloneDeep(referenceNode.orientation),
            shape: _.cloneDeep(referenceNode.shape)
        };
        var parentId = (this.nodes.parentNodesById[id] != null) ? this.nodes.parentNodesById[id].id : null;
        var addNode = function (newNode, parentId, index, children) {
            _this.nodes.add(newNode, parentId, index, function (err, actualIndex) {
                if (err != null) {
                    callback(err, null, null);
                    return;
                }
                // TODO: Copy shape
                newNodes.push({ node: newNode, parentId: parentId, index: actualIndex });
                if (newNodes.length === totalNodeCount) {
                    callback(null, rootNode, newNodes);
                    _this.emit("change");
                }
                for (var childIndex = 0; childIndex < children.length; childIndex++) {
                    var childNode = children[childIndex];
                    var node = {
                        id: null, name: childNode.name, children: [],
                        position: _.cloneDeep(childNode.position),
                        orientation: _.cloneDeep(childNode.orientation),
                        shape: _.cloneDeep(childNode.shape)
                    };
                    addNode(node, newNode.id, childIndex, childNode.children);
                }
            });
        };
        addNode(rootNode, parentId, index, referenceNode.children);
    };
    CubicModelAsset.prototype.client_duplicateNode = function (rootNode, newNodes) {
        for (var _i = 0; _i < newNodes.length; _i++) {
            var newNode = newNodes[_i];
            newNode.node.children.length = 0;
            this.nodes.client_add(newNode.node, newNode.parentId, newNode.index);
        }
    };
    CubicModelAsset.prototype.server_removeNode = function (client, id, callback) {
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
    CubicModelAsset.prototype.client_removeNode = function (id) {
        this.nodes.client_remove(id);
    };
    CubicModelAsset.prototype.server_moveNodeTextureOffset = function (client, nodeIds, offset, callback) {
        // TODO: add checks
        this.client_moveNodeTextureOffset(nodeIds, offset);
        callback(null, nodeIds, offset);
        this.emit("change");
    };
    CubicModelAsset.prototype.client_moveNodeTextureOffset = function (nodeIds, offset) {
        for (var _i = 0; _i < nodeIds.length; _i++) {
            var id = nodeIds[_i];
            var node = this.nodes.byId[id];
            for (var faceName in node.shape.textureLayout) {
                var faceOffset = node.shape.textureLayout[faceName].offset;
                faceOffset.x += offset.x;
                faceOffset.y += offset.y;
            }
        }
    };
    // Texture
    CubicModelAsset.prototype.server_changeTextureWidth = function (client, newWidth, callback) {
        if (CubicModelAsset.validTextureSizes.indexOf(newWidth) === -1) {
            callback("Invalid new texture width: " + newWidth, null);
            return;
        }
        this._changeTextureWidth(newWidth);
        callback(null, newWidth);
        this.emit("change");
    };
    CubicModelAsset.prototype.client_changeTextureWidth = function (newWidth) {
        this._changeTextureWidth(newWidth);
        this._loadTextures();
    };
    CubicModelAsset.prototype._changeTextureWidth = function (newWidth) {
        for (var mapName in this.pub.maps) {
            var oldMapData = this.textureDatas[mapName];
            var newMapBuffer = new ArrayBuffer(newWidth * this.pub.textureHeight * 4);
            var newMapData = new Uint8ClampedArray(newMapBuffer);
            for (var y = 0; y < this.pub.textureHeight; y++) {
                var x = 0;
                while (x < Math.max(this.pub.textureWidth, newWidth)) {
                    var oldIndex = (y * this.pub.textureWidth + x) * 4;
                    var newIndex = (y * newWidth + x) * 4;
                    for (var i = 0; i < 4; i++) {
                        var value = x >= this.pub.textureWidth ? 255 : oldMapData[oldIndex + i];
                        newMapData[newIndex + i] = value;
                    }
                    x++;
                }
            }
            this.pub.maps[mapName] = newMapBuffer;
            this.textureDatas[mapName] = newMapData;
        }
        this.pub.textureWidth = newWidth;
    };
    CubicModelAsset.prototype.server_changeTextureHeight = function (client, newHeight, callback) {
        if (CubicModelAsset.validTextureSizes.indexOf(newHeight) === -1) {
            callback("Invalid new texture height: " + newHeight, null);
            return;
        }
        this._changeTextureHeight(newHeight);
        callback(null, newHeight);
        this.emit("change");
    };
    CubicModelAsset.prototype.client_changeTextureHeight = function (newHeight) {
        this._changeTextureHeight(newHeight);
        this._loadTextures();
    };
    CubicModelAsset.prototype._changeTextureHeight = function (newHeight) {
        for (var mapName in this.pub.maps) {
            var oldMapData = this.textureDatas[mapName];
            var newMapBuffer = new ArrayBuffer(this.pub.textureWidth * newHeight * 4);
            var newMapData = new Uint8ClampedArray(newMapBuffer);
            for (var y = 0; y < Math.max(this.pub.textureHeight, newHeight); y++) {
                for (var x = 0; x < this.pub.textureWidth; x++) {
                    var index = (y * this.pub.textureWidth + x) * 4;
                    for (var i = 0; i < 4; i++) {
                        var value = y >= this.pub.textureHeight ? 255 : oldMapData[index + i];
                        newMapData[index + i] = value;
                    }
                }
            }
            this.pub.maps[mapName] = newMapBuffer;
            this.textureDatas[mapName] = newMapData;
        }
        this.pub.textureHeight = newHeight;
    };
    CubicModelAsset.prototype.server_editTexture = function (client, name, edits, callback) {
        if (this.pub.maps[name] == null) {
            callback("Invalid map name: " + name, null, null);
            return;
        }
        for (var _i = 0; _i < edits.length; _i++) {
            var edit = edits[_i];
            if (edit.x == null || edit.x < 0 || edit.x >= this.pub.textureWidth) {
                callback("Invalid edit x: " + edit.x, null, null);
                return;
            }
            if (edit.y == null || edit.y < 0 || edit.y >= this.pub.textureHeight) {
                callback("Invalid edit y: " + edit.y, null, null);
                return;
            }
            if (edit.value.r == null || edit.value.r < 0 || edit.value.r > 255) {
                callback("Invalid edit value r: " + edit.value.r, null, null);
                return;
            }
            if (edit.value.g == null || edit.value.g < 0 || edit.value.g > 255) {
                callback("Invalid edit value g: " + edit.value.g, null, null);
                return;
            }
            if (edit.value.b == null || edit.value.b < 0 || edit.value.b > 255) {
                callback("Invalid edit value b: " + edit.value.b, null, null);
                return;
            }
            if (edit.value.a == null || edit.value.a < 0 || edit.value.a > 255) {
                callback("Invalid edit value a: " + edit.value.a, null, null);
                return;
            }
        }
        this._editTextureData(name, edits);
        callback(null, name, edits);
        this.emit("change");
    };
    CubicModelAsset.prototype.client_editTexture = function (name, edits) {
        this._editTextureData(name, edits);
        var imageData = this.clientTextureDatas[name].imageData;
        this.clientTextureDatas[name].ctx.putImageData(imageData, 0, 0);
        this.pub.textures[name].needsUpdate = true;
    };
    CubicModelAsset.prototype._editTextureData = function (name, edits) {
        var array = this.textureDatas[name];
        for (var _i = 0; _i < edits.length; _i++) {
            var edit = edits[_i];
            var index = edit.y * this.pub.textureWidth + edit.x;
            index *= 4;
            array[index + 0] = edit.value.r;
            array[index + 1] = edit.value.g;
            array[index + 2] = edit.value.b;
            array[index + 3] = edit.value.a;
        }
    };
    CubicModelAsset.schema = {
        pixelsPerUnit: { type: "integer", min: 1, mutable: true },
        nodes: { type: "array" },
        textureWidth: { type: "number" },
        textureHeight: { type: "number" },
        maps: { type: "hash", values: { type: "buffer?" } },
        mapSlots: {
            type: "hash",
            properties: {
                map: { type: "string?", mutable: true },
                light: { type: "string?", mutable: true },
                specular: { type: "string?", mutable: true },
                alpha: { type: "string?", mutable: true },
                normal: { type: "string?", mutable: true }
            }
        }
    };
    CubicModelAsset.validTextureSizes = [32, 64, 128, 256, 512, 1024, 2048];
    return CubicModelAsset;
})(SupCore.Data.Base.Asset);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CubicModelAsset;
