var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Attributes = (function (_super) {
    __extends(Attributes, _super);
    function Attributes(pub) {
        _super.call(this, pub, Attributes.schema);
    }
    Attributes.schema = {
        name: { type: "string", minLength: 1, maxLength: 80, mutable: true },
        type: { type: "enum", items: ["f", "c", "v2", "v3", "v4"], mutable: true }
    };
    return Attributes;
})(SupCore.Data.Base.ListById);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Attributes;
