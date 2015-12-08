var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var THREE = SupEngine.THREE;
var CubicModelRendererUpdater_1 = require("./CubicModelRendererUpdater");
var CubicModelRenderer = (function (_super) {
    __extends(CubicModelRenderer, _super);
    // castShadow = false;
    // receiveShadow = false;
    function CubicModelRenderer(actor) {
        _super.call(this, actor, "ModelRenderer");
        this.materialType = "basic";
    }
    CubicModelRenderer.prototype._clearMesh = function () {
        this.actor.threeObject.remove(this.threeRoot);
        this.threeRoot.traverse(function (obj) { if (obj.dispose != null)
            obj.dispose(); });
        this.threeRoot = null;
        this.byNodeId = null;
    };
    CubicModelRenderer.prototype._destroy = function () {
        if (this.asset != null)
            this._clearMesh();
        this.asset = null;
        _super.prototype._destroy.call(this);
    };
    CubicModelRenderer.prototype.setCubicModel = function (asset, materialType, customShader) {
        var _this = this;
        if (this.asset != null)
            this._clearMesh();
        this.asset = asset;
        if (asset == null)
            return;
        // Nodes
        this.threeRoot = new THREE.Object3D();
        this.threeRoot.scale.set(1 / asset.pixelsPerUnit, 1 / asset.pixelsPerUnit, 1 / asset.pixelsPerUnit);
        this.byNodeId = {};
        var walkNode = function (node, parentRendererNode, parentOffset) {
            var rendererNode = _this._makeNode(node, parentRendererNode, parentOffset);
            for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                var childNode = _a[_i];
                walkNode(childNode, rendererNode, node.shape.offset);
            }
        };
        for (var _i = 0, _a = asset.nodes; _i < _a.length; _i++) {
            var rootNode = _a[_i];
            walkNode(rootNode, null, { x: 0, y: 0, z: 0 });
        }
        this.actor.threeObject.add(this.threeRoot);
        this.threeRoot.updateMatrixWorld(false);
    };
    CubicModelRenderer.prototype._makeNode = function (node, parentRendererNode, parentOffset) {
        var pivot;
        var material = new THREE.MeshBasicMaterial({
            map: this.asset.textures["map"],
            side: THREE.DoubleSide,
            transparent: true
        });
        pivot = new THREE.Object3D();
        pivot.name = node.name;
        pivot.userData.cubicNodeId = node.id;
        var shape;
        if (node.shape.type === "box") {
            var size = node.shape.settings.size;
            var boxGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
            this.updateBoxNodeUv(boxGeometry, node);
            shape = new THREE.Mesh(boxGeometry, material);
            shape.scale.set(node.shape.settings.stretch.x, node.shape.settings.stretch.y, node.shape.settings.stretch.z);
        }
        if (shape != null) {
            shape.position.set(node.shape.offset.x, node.shape.offset.y, node.shape.offset.z);
            pivot.add(shape);
        }
        var rendererNode = { pivot: pivot, shape: shape, nodeId: node.id, children: [] };
        this.byNodeId[node.id] = rendererNode;
        if (parentRendererNode != null)
            parentRendererNode.children.push(rendererNode);
        pivot.position.set(node.position.x + parentOffset.x, node.position.y + parentOffset.y, node.position.z + parentOffset.z);
        pivot.quaternion.set(node.orientation.x, node.orientation.y, node.orientation.z, node.orientation.w);
        // NOTE: Hierarchical scale is not supported for now, we'll see if the need arises
        // nodeObject.scale.set(node.scale.x, node.scale.y, node.scale.z);
        if (parentRendererNode == null)
            this.threeRoot.add(pivot);
        else
            parentRendererNode.pivot.add(pivot);
        pivot.updateMatrixWorld(false);
        return rendererNode;
    };
    CubicModelRenderer.prototype.updateBoxNodeUv = function (geometry, node) {
        var width = this.asset.textureWidth;
        var height = this.asset.textureHeight;
        var size = node.shape.settings.size;
        var offset;
        var bottomLeft = new THREE.Vector2();
        var bottomRight = new THREE.Vector2();
        var topLeft = new THREE.Vector2();
        var topRight = new THREE.Vector2();
        // Left Face
        offset = node.shape.textureLayout["left"].offset;
        bottomLeft.set((offset.x) / width, (height - offset.y - size.y) / height);
        bottomRight.set((offset.x + size.z) / width, (height - offset.y - size.y) / height);
        topLeft.set((offset.x) / width, (height - offset.y) / height);
        topRight.set((offset.x + size.z) / width, (height - offset.y) / height);
        geometry.faceVertexUvs[0][2][0].copy(topLeft);
        geometry.faceVertexUvs[0][2][1].copy(bottomLeft);
        geometry.faceVertexUvs[0][2][2].copy(topRight);
        geometry.faceVertexUvs[0][3][0].copy(bottomLeft);
        geometry.faceVertexUvs[0][3][1].copy(bottomRight);
        geometry.faceVertexUvs[0][3][2].copy(topRight);
        // Front Face
        offset = node.shape.textureLayout["front"].offset;
        bottomLeft.set((offset.x) / width, (height - offset.y - size.y) / height);
        bottomRight.set((offset.x + size.x) / width, (height - offset.y - size.y) / height);
        topLeft.set((offset.x) / width, (height - offset.y) / height);
        topRight.set((offset.x + size.x) / width, (height - offset.y) / height);
        geometry.faceVertexUvs[0][8][0].copy(topLeft);
        geometry.faceVertexUvs[0][8][1].copy(bottomLeft);
        geometry.faceVertexUvs[0][8][2].copy(topRight);
        geometry.faceVertexUvs[0][9][0].copy(bottomLeft);
        geometry.faceVertexUvs[0][9][1].copy(bottomRight);
        geometry.faceVertexUvs[0][9][2].copy(topRight);
        // Right Face
        offset = node.shape.textureLayout["right"].offset;
        bottomLeft.set((offset.x) / width, (height - offset.y - size.y) / height);
        bottomRight.set((offset.x + size.z) / width, (height - offset.y - size.y) / height);
        topLeft.set((offset.x) / width, (height - offset.y) / height);
        topRight.set((offset.x + size.z) / width, (height - offset.y) / height);
        geometry.faceVertexUvs[0][0][0].copy(topLeft);
        geometry.faceVertexUvs[0][0][1].copy(bottomLeft);
        geometry.faceVertexUvs[0][0][2].copy(topRight);
        geometry.faceVertexUvs[0][1][0].copy(bottomLeft);
        geometry.faceVertexUvs[0][1][1].copy(bottomRight);
        geometry.faceVertexUvs[0][1][2].copy(topRight);
        // Back Face
        offset = node.shape.textureLayout["back"].offset;
        bottomLeft.set((offset.x) / width, (height - offset.y - size.y) / height);
        bottomRight.set((offset.x + size.x) / width, (height - offset.y - size.y) / height);
        topLeft.set((offset.x) / width, (height - offset.y) / height);
        topRight.set((offset.x + size.x) / width, (height - offset.y) / height);
        geometry.faceVertexUvs[0][10][0].copy(topLeft);
        geometry.faceVertexUvs[0][10][1].copy(bottomLeft);
        geometry.faceVertexUvs[0][10][2].copy(topRight);
        geometry.faceVertexUvs[0][11][0].copy(bottomLeft);
        geometry.faceVertexUvs[0][11][1].copy(bottomRight);
        geometry.faceVertexUvs[0][11][2].copy(topRight);
        // Top Face
        offset = node.shape.textureLayout["top"].offset;
        bottomLeft.set((offset.x) / width, (height - offset.y - size.z) / height);
        bottomRight.set((offset.x + size.x) / width, (height - offset.y - size.z) / height);
        topLeft.set((offset.x) / width, (height - offset.y) / height);
        topRight.set((offset.x + size.x) / width, (height - offset.y) / height);
        geometry.faceVertexUvs[0][4][0].copy(topLeft);
        geometry.faceVertexUvs[0][4][1].copy(bottomLeft);
        geometry.faceVertexUvs[0][4][2].copy(topRight);
        geometry.faceVertexUvs[0][5][0].copy(bottomLeft);
        geometry.faceVertexUvs[0][5][1].copy(bottomRight);
        geometry.faceVertexUvs[0][5][2].copy(topRight);
        // Bottom Face
        offset = node.shape.textureLayout["bottom"].offset;
        bottomLeft.set((offset.x) / width, (height - offset.y - size.z) / height);
        bottomRight.set((offset.x + size.x) / width, (height - offset.y - size.z) / height);
        topLeft.set((offset.x) / width, (height - offset.y) / height);
        topRight.set((offset.x + size.x) / width, (height - offset.y) / height);
        geometry.faceVertexUvs[0][6][0].copy(topLeft);
        geometry.faceVertexUvs[0][6][1].copy(bottomLeft);
        geometry.faceVertexUvs[0][6][2].copy(topRight);
        geometry.faceVertexUvs[0][7][0].copy(bottomLeft);
        geometry.faceVertexUvs[0][7][1].copy(bottomRight);
        geometry.faceVertexUvs[0][7][2].copy(topRight);
        geometry.uvsNeedUpdate = true;
    };
    CubicModelRenderer.prototype.setIsLayerActive = function (active) { if (this.threeRoot != null)
        this.threeRoot.visible = active; };
    CubicModelRenderer.Updater = CubicModelRendererUpdater_1.default;
    return CubicModelRenderer;
})(SupEngine.ActorComponent);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CubicModelRenderer;
