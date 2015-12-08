var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var THREE = SupEngine.THREE;
var TileSetRendererUpdater_1 = require("./TileSetRendererUpdater");
var TileSetRenderer = (function (_super) {
    __extends(TileSetRenderer, _super);
    function TileSetRenderer(actor, asset) {
        _super.call(this, actor, "TileSetRenderer");
        var gridActor = new SupEngine.Actor(this.actor.gameInstance, "Grid");
        gridActor.setLocalPosition(new THREE.Vector3(0, 0, 1));
        this.gridRenderer = new SupEngine.editorComponentClasses["GridRenderer"](gridActor, {
            width: 1, height: 1,
            direction: -1, orthographicScale: 10,
            ratio: { x: 1, y: 1 }
        });
        this.selectedTileActor = new SupEngine.Actor(this.actor.gameInstance, "Selection", null, { visible: false });
        new SupEngine.editorComponentClasses["FlatColorRenderer"](this.selectedTileActor, 0x900090, 1, 1);
        this.setTileSet(asset);
    }
    TileSetRenderer.prototype.setTileSet = function (asset) {
        this._clearMesh();
        this.asset = asset;
        if (this.asset == null)
            return;
        var geometry = new THREE.PlaneBufferGeometry(asset.data.texture.image.width, asset.data.texture.image.height);
        var material = new THREE.MeshBasicMaterial({ map: asset.data.texture, alphaTest: 0.1, side: THREE.DoubleSide });
        this.mesh = new THREE.Mesh(geometry, material);
        this.actor.threeObject.add(this.mesh);
        this.refreshScaleRatio();
        this.selectedTileActor.threeObject.visible = true;
    };
    TileSetRenderer.prototype.select = function (x, y, width, height) {
        if (width === void 0) { width = 1; }
        if (height === void 0) { height = 1; }
        var ratio = this.asset.data.grid.width / this.asset.data.grid.height;
        this.selectedTileActor.setLocalPosition(new THREE.Vector3(x, -y / ratio, 2));
        this.selectedTileActor.setLocalScale(new THREE.Vector3(width, -height / ratio, 1));
    };
    TileSetRenderer.prototype.refreshScaleRatio = function () {
        var scaleX = 1 / this.asset.data.grid.width;
        var scaleY = 1 / this.asset.data.grid.height;
        this.mesh.scale.set(scaleX, scaleX, 1);
        var material = this.mesh.material;
        this.mesh.position.setX(material.map.image.width / 2 * scaleX);
        this.mesh.position.setY(-material.map.image.height / 2 * scaleX);
        this.mesh.updateMatrixWorld(false);
        this.select(0, 0);
    };
    TileSetRenderer.prototype._clearMesh = function () {
        if (this.mesh == null)
            return;
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        this.actor.threeObject.remove(this.mesh);
        this.mesh = null;
        this.selectedTileActor.threeObject.visible = false;
    };
    TileSetRenderer.prototype._destroy = function () {
        this._clearMesh();
        this.actor.gameInstance.destroyActor(this.gridRenderer.actor);
        this.actor.gameInstance.destroyActor(this.selectedTileActor);
        this.asset = null;
        _super.prototype._destroy.call(this);
    };
    TileSetRenderer.prototype.setIsLayerActive = function (active) { if (this.mesh != null)
        this.mesh.visible = active; };
    TileSetRenderer.Updater = TileSetRendererUpdater_1.default;
    return TileSetRenderer;
})(SupEngine.ActorComponent);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TileSetRenderer;
