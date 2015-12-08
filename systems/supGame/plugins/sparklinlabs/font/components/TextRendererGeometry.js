var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var THREE = SupEngine.THREE;
var TextRendererGeometry = (function (_super) {
    __extends(TextRendererGeometry, _super);
    function TextRendererGeometry(width, height, widthSegments, heightSegments) {
        _super.call(this);
        this.type = "TextRendererGeometry";
        this.width = width;
        this.height = height;
        var vertices = new Float32Array(widthSegments * heightSegments * 4 * 3);
        var normals = new Float32Array(widthSegments * heightSegments * 4 * 3);
        var uvs = new Float32Array(widthSegments * heightSegments * 4 * 2);
        var indices;
        if (vertices.length / 3 > 65535)
            indices = new Uint32Array(widthSegments * heightSegments * 6);
        else
            indices = new Uint16Array(widthSegments * heightSegments * 6);
        var offset = 0;
        var offset2 = 0;
        var offset3 = 0;
        for (var iy = 0; iy < heightSegments; iy++) {
            var y = iy * height / heightSegments;
            for (var ix = 0; ix < widthSegments; ix++) {
                var x = ix * width / widthSegments;
                // Left bottom
                vertices[offset + 0] = x;
                vertices[offset + 1] = y;
                normals[offset + 2] = 1;
                uvs[offset2 + 0] = ix / widthSegments;
                uvs[offset2 + 1] = iy / heightSegments;
                // Right bottom
                vertices[offset + 3] = x + width / widthSegments;
                vertices[offset + 4] = y;
                normals[offset + 5] = 1;
                uvs[offset2 + 2] = (ix + 1) / widthSegments;
                uvs[offset2 + 3] = iy / heightSegments;
                // Right top
                vertices[offset + 6] = x + width / widthSegments;
                vertices[offset + 7] = y + height / heightSegments;
                normals[offset + 8] = 1;
                uvs[offset2 + 4] = (ix + 1) / widthSegments;
                uvs[offset2 + 5] = (iy + 1) / heightSegments;
                // Left Top
                vertices[offset + 9] = x;
                vertices[offset + 10] = y + height / heightSegments;
                normals[offset + 11] = 1;
                uvs[offset2 + 6] = ix / widthSegments;
                uvs[offset2 + 7] = (iy + 1) / heightSegments;
                var ref = (ix + iy * widthSegments) * 4;
                // Bottom right corner
                indices[offset3 + 0] = ref + 0;
                indices[offset3 + 1] = ref + 1;
                indices[offset3 + 2] = ref + 2;
                // Top left corner
                indices[offset3 + 3] = ref + 0;
                indices[offset3 + 4] = ref + 3;
                indices[offset3 + 5] = ref + 2;
                offset += 4 * 3;
                offset2 += 4 * 2;
                offset3 += 6;
            }
        }
        this.setIndex(new THREE.BufferAttribute(indices, 1));
        this.addAttribute("position", new THREE.BufferAttribute(vertices, 3));
        this.addAttribute("normal", new THREE.BufferAttribute(normals, 3));
        this.addAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    }
    return TextRendererGeometry;
})(THREE.BufferGeometry);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TextRendererGeometry;
