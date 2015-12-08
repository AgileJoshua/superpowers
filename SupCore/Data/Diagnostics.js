var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ListById_1 = require("./Base/ListById");
var Diagnostics = (function (_super) {
    __extends(Diagnostics, _super);
    function Diagnostics(pub) {
        _super.call(this, pub, Diagnostics.schema);
    }
    Diagnostics.schema = {
        id: { type: "string" },
        type: { type: "string" },
        data: { type: "any" }
    };
    return Diagnostics;
})(ListById_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Diagnostics;
