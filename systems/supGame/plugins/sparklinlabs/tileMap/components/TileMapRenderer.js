var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var THREE = SupEngine.THREE;
var TileLayerGeometry_1 = require("./TileLayerGeometry");
var TileMapRendererUpdater_1 = require("./TileMapRendererUpdater");
var TileMapRenderer = (function (_super) {
    __extends(TileMapRenderer, _super);
    function TileMapRenderer(actor) {
        var _this = this;
        _super.call(this, actor, "TileMapRenderer");
        this.castShadow = false;
        this.receiveShadow = false;
        this.materialType = "basic";
        this._onSetTileAt = function (layerIndex, x, y) { _this.refreshTileAt(layerIndex, x, y); };
    }
    TileMapRenderer.prototype.setTileMap = function (asset, materialType, customShader) {
        if (this.layerMeshes != null)
            this._clearLayerMeshes();
        this.tileMap = asset;
        if (materialType != null)
            this.materialType = materialType;
        this.customShader = customShader;
        if (this.tileSet == null || this.tileSet.data.texture == null || this.tileMap == null)
            return;
        this._createLayerMeshes();
    };
    TileMapRenderer.prototype.setTileSet = function (asset) {
        if (this.layerMeshes != null)
            this._clearLayerMeshes();
        this.tileSet = asset;
        if (this.tileSet == null || this.tileSet.data.texture == null)
            return;
        this.tilesPerRow = this.tileSet.data.texture.image.width / this.tileSet.data.grid.width;
        this.tilesPerColumn = this.tileSet.data.texture.image.height / this.tileSet.data.grid.height;
        if (this.tileMap != null)
            this._createLayerMeshes();
    };
    TileMapRenderer.prototype._createLayerMeshes = function () {
        this.layerMeshes = [];
        this.layerMeshesById = {};
        this.layerVisibleById = {};
        for (var layerIndex = 0; layerIndex < this.tileMap.getLayersCount(); layerIndex++) {
            var layerId = this.tileMap.getLayerId(layerIndex);
            this.addLayer(layerId, layerIndex);
        }
        this.setCastShadow(this.castShadow);
        this.tileMap.on("setTileAt", this._onSetTileAt);
    };
    TileMapRenderer.prototype._clearLayerMeshes = function () {
        for (var _i = 0, _a = this.layerMeshes; _i < _a.length; _i++) {
            var layerMesh = _a[_i];
            layerMesh.geometry.dispose();
            layerMesh.material.dispose();
            this.actor.threeObject.remove(layerMesh);
        }
        this.layerMeshes = null;
        this.layerMeshesById = null;
        this.layerVisibleById = null;
        this.tileMap.removeListener("setTileAt", this._onSetTileAt);
    };
    TileMapRenderer.prototype._destroy = function () {
        if (this.layerMeshes != null)
            this._clearLayerMeshes();
        this.tileMap = null;
        this.tileSet = null;
        _super.prototype._destroy.call(this);
    };
    TileMapRenderer.prototype.addLayer = function (layerId, layerIndex) {
        var width = this.tileMap.getWidth() * this.tileSet.data.grid.width;
        var height = this.tileMap.getHeight() * this.tileSet.data.grid.height;
        var geometry = new TileLayerGeometry_1.default(width, height, this.tileMap.getWidth(), this.tileMap.getHeight());
        var material;
        if (this.materialType === "shader") {
            material = SupEngine.componentClasses["Shader"].createShaderMaterial(this.customShader, { map: this.tileSet.data.texture }, geometry);
            material.map = this.tileSet.data.texture;
        }
        else {
            if (this.materialType === "basic")
                material = new THREE.MeshBasicMaterial();
            else if (this.materialType === "phong")
                material = new THREE.MeshPhongMaterial();
            material.map = this.tileSet.data.texture;
            material.alphaTest = 0.1;
            material.side = THREE.DoubleSide;
            material.transparent = true;
        }
        var layerMesh = new THREE.Mesh(geometry, material);
        layerMesh.receiveShadow = this.receiveShadow;
        var scaleRatio = 1 / this.tileMap.getPixelsPerUnit();
        layerMesh.scale.set(scaleRatio, scaleRatio, 1);
        layerMesh.updateMatrixWorld(false);
        this.layerMeshes.splice(layerIndex, 0, layerMesh);
        this.layerMeshesById[layerId] = layerMesh;
        this.layerVisibleById[layerId] = true;
        this.actor.threeObject.add(layerMesh);
        for (var y = 0; y < this.tileMap.getHeight(); y++) {
            for (var x = 0; x < this.tileMap.getWidth(); x++) {
                this.refreshTileAt(layerIndex, x, y);
            }
        }
        this.refreshLayersDepth();
    };
    TileMapRenderer.prototype.deleteLayer = function (layerIndex) {
        this.actor.threeObject.remove(this.layerMeshes[layerIndex]);
        this.layerMeshes.splice(layerIndex, 1);
        this.refreshLayersDepth();
    };
    TileMapRenderer.prototype.moveLayer = function (layerId, newIndex) {
        var layer = this.layerMeshesById[layerId];
        var oldIndex = this.layerMeshes.indexOf(layer);
        this.layerMeshes.splice(oldIndex, 1);
        if (oldIndex < newIndex)
            newIndex--;
        this.layerMeshes.splice(newIndex, 0, layer);
        this.refreshLayersDepth();
    };
    TileMapRenderer.prototype.setCastShadow = function (castShadow) {
        this.castShadow = castShadow;
        for (var _i = 0, _a = this.layerMeshes; _i < _a.length; _i++) {
            var layerMesh = _a[_i];
            layerMesh.castShadow = castShadow;
        }
        if (!castShadow)
            return;
        this.actor.gameInstance.threeScene.traverse(function (object) {
            var material = object.material;
            if (material != null)
                material.needsUpdate = true;
        });
    };
    TileMapRenderer.prototype.setReceiveShadow = function (receiveShadow) {
        this.receiveShadow = receiveShadow;
        for (var _i = 0, _a = this.layerMeshes; _i < _a.length; _i++) {
            var layerMesh = _a[_i];
            layerMesh.receiveShadow = receiveShadow;
            layerMesh.material.needsUpdate = true;
        }
    };
    TileMapRenderer.prototype.refreshPixelsPerUnit = function (pixelsPerUnit) {
        var scaleRatio = 1 / this.tileMap.getPixelsPerUnit();
        for (var _i = 0, _a = this.layerMeshes; _i < _a.length; _i++) {
            var layerMesh = _a[_i];
            layerMesh.scale.set(scaleRatio, scaleRatio, 1);
            layerMesh.updateMatrixWorld(false);
        }
    };
    TileMapRenderer.prototype.refreshLayersDepth = function () {
        for (var layerMeshIndex = 0; layerMeshIndex < this.layerMeshes.length; layerMeshIndex++) {
            var layerMesh = this.layerMeshes[layerMeshIndex];
            layerMesh.position.setZ(layerMeshIndex * this.tileMap.getLayersDepthOffset());
            layerMesh.updateMatrixWorld(false);
        }
    };
    TileMapRenderer.prototype.refreshEntireMap = function () {
        for (var layerIndex = 0; layerIndex < this.tileMap.getLayersCount(); layerIndex++) {
            for (var y = 0; y < this.tileMap.getWidth(); y++) {
                for (var x = 0; x < this.tileMap.getHeight(); x++) {
                    this.refreshTileAt(layerIndex, x, y);
                }
            }
        }
        this.refreshLayersDepth();
    };
    TileMapRenderer.prototype.refreshTileAt = function (layerIndex, x, y) {
        var tileX = -1;
        var tileY = -1;
        var flipX = false;
        var flipY = false;
        var angle = 0;
        var tileInfo = this.tileMap.getTileAt(layerIndex, x, y);
        if (tileInfo !== 0) {
            tileX = tileInfo[0];
            tileY = tileInfo[1];
            flipX = tileInfo[2];
            flipY = tileInfo[3];
            angle = tileInfo[4];
        }
        if (tileX == -1 || tileY == -1 || tileX >= this.tilesPerRow || tileY >= this.tilesPerColumn ||
            (tileX === this.tilesPerRow - 1 && tileY === this.tilesPerColumn - 1)) {
            tileX = this.tilesPerRow - 1;
            tileY = this.tilesPerColumn - 1;
        }
        var image = this.tileSet.data.texture.image;
        var left = (tileX * this.tileSet.data.grid.width + 0.2) / image.width;
        var right = ((tileX + 1) * this.tileSet.data.grid.width - 0.2) / image.width;
        var bottom = 1 - ((tileY + 1) * this.tileSet.data.grid.height - 0.2) / image.height;
        var top = 1 - (tileY * this.tileSet.data.grid.height + 0.2) / image.height;
        if (flipX) {
            var temp = right;
            right = left;
            left = temp;
        }
        if (flipY) {
            var temp = bottom;
            bottom = top;
            top = temp;
        }
        var quadIndex = (x + y * this.tileMap.getWidth());
        var layerMesh = this.layerMeshes[layerIndex];
        var uvs = layerMesh.geometry.getAttribute("uv");
        uvs.needsUpdate = true;
        switch (angle) {
            case 0:
                uvs.array[quadIndex * 8 + 0] = left;
                uvs.array[quadIndex * 8 + 1] = bottom;
                uvs.array[quadIndex * 8 + 2] = right;
                uvs.array[quadIndex * 8 + 3] = bottom;
                uvs.array[quadIndex * 8 + 4] = right;
                uvs.array[quadIndex * 8 + 5] = top;
                uvs.array[quadIndex * 8 + 6] = left;
                uvs.array[quadIndex * 8 + 7] = top;
                break;
            case 90:
                uvs.array[quadIndex * 8 + 0] = left;
                uvs.array[quadIndex * 8 + 1] = top;
                uvs.array[quadIndex * 8 + 2] = left;
                uvs.array[quadIndex * 8 + 3] = bottom;
                uvs.array[quadIndex * 8 + 4] = right;
                uvs.array[quadIndex * 8 + 5] = bottom;
                uvs.array[quadIndex * 8 + 6] = right;
                uvs.array[quadIndex * 8 + 7] = top;
                break;
            case 180:
                uvs.array[quadIndex * 8 + 0] = right;
                uvs.array[quadIndex * 8 + 1] = top;
                uvs.array[quadIndex * 8 + 2] = left;
                uvs.array[quadIndex * 8 + 3] = top;
                uvs.array[quadIndex * 8 + 4] = left;
                uvs.array[quadIndex * 8 + 5] = bottom;
                uvs.array[quadIndex * 8 + 6] = right;
                uvs.array[quadIndex * 8 + 7] = bottom;
                break;
            case 270:
                uvs.array[quadIndex * 8 + 0] = right;
                uvs.array[quadIndex * 8 + 1] = bottom;
                uvs.array[quadIndex * 8 + 2] = right;
                uvs.array[quadIndex * 8 + 3] = top;
                uvs.array[quadIndex * 8 + 4] = left;
                uvs.array[quadIndex * 8 + 5] = top;
                uvs.array[quadIndex * 8 + 6] = left;
                uvs.array[quadIndex * 8 + 7] = bottom;
                break;
        }
    };
    TileMapRenderer.prototype.setIsLayerActive = function (active) {
        if (this.layerMeshes == null)
            return;
        for (var layerId in this.layerMeshesById)
            this.layerMeshesById[layerId].visible = active && this.layerVisibleById[layerId];
    };
    TileMapRenderer.Updater = TileMapRendererUpdater_1.default;
    return TileMapRenderer;
})(SupEngine.ActorComponent);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TileMapRenderer;
