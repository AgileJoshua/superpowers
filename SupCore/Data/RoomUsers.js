var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ListById_1 = require("./Base/ListById");
var RoomUsers = (function (_super) {
    __extends(RoomUsers, _super);
    function RoomUsers(pub) {
        _super.call(this, pub, RoomUsers.schema);
    }
    RoomUsers.schema = {
        // TODO: use userId for id when we've got proper login
        id: { type: "string", minLength: 3, maxLength: 20 },
        connectionCount: { type: "number", min: 1 }
    };
    return RoomUsers;
})(ListById_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RoomUsers;
