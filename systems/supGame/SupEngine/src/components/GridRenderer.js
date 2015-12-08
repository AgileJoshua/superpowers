var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var THREE = require("three");
var ActorComponent_1 = require("../ActorComponent");
var GridRenderer = (function (_super) {
    __extends(GridRenderer, _super);
    function GridRenderer(actor, data) {
        _super.call(this, actor, "GridRenderer");
        if (data != null)
            this.setGrid(data);
    }
    GridRenderer.prototype.setIsLayerActive = function (active) { if (this.mesh != null)
        this.mesh.visible = active; };
    GridRenderer.prototype.setGrid = function (data) {
        this._clearMesh();
        this.width = data.width;
        this.height = data.height;
        this.direction = (data.direction) ? data.direction : 1;
        this.orthographicScale = data.orthographicScale;
        this.ratio = data.ratio;
        this._createMesh();
    };
    GridRenderer.prototype.resize = function (width, height) {
        this.width = width;
        this.height = height;
        this._clearMesh();
        this._createMesh();
    };
    GridRenderer.prototype.setOrthgraphicScale = function (orthographicScale) {
        this.orthographicScale = orthographicScale;
        this._clearMesh();
        this._createMesh();
    };
    GridRenderer.prototype.setRatio = function (ratio) {
        this.ratio = ratio;
        this._clearMesh();
        this._createMesh();
    };
    GridRenderer.prototype._createMesh = function () {
        var geometry = new THREE.Geometry();
        // Vertical lines
        var x = 0;
        while (x <= this.width) {
            geometry.vertices.push(new THREE.Vector3(x / this.ratio.x, 0, 0));
            geometry.vertices.push(new THREE.Vector3(x / this.ratio.x, this.direction * this.height / this.ratio.y, 0));
            x += 1;
        }
        // Horizontal lines
        var y = 0;
        while (y <= this.height) {
            geometry.vertices.push(new THREE.Vector3(0, this.direction * y / this.ratio.y, 0));
            geometry.vertices.push(new THREE.Vector3(this.width / this.ratio.x, this.direction * y / this.ratio.y, 0));
            y += 1;
        }
        geometry.computeLineDistances();
        var material = new THREE.LineDashedMaterial({
            color: 0x000000, transparent: true, opacity: 0.4,
            dashSize: 5 / 1000, gapSize: 5 / 1000, scale: 1 / this.orthographicScale
        });
        this.mesh = new THREE.LineSegments(geometry, material);
        this.actor.threeObject.add(this.mesh);
        this.mesh.updateMatrixWorld(false);
    };
    GridRenderer.prototype._clearMesh = function () {
        if (this.mesh == null)
            return;
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        this.actor.threeObject.remove(this.mesh);
        this.mesh = null;
    };
    GridRenderer.prototype._destroy = function () {
        this._clearMesh();
        _super.prototype._destroy.call(this);
    };
    return GridRenderer;
})(ActorComponent_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GridRenderer;
