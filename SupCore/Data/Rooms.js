var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var SupData = require("./index");
var path = require("path");
var roomRegex = /^[A-Za-z0-9_]{1,20}$/;
var Rooms = (function (_super) {
    __extends(Rooms, _super);
    function Rooms(server) {
        _super.call(this);
        this.server = server;
    }
    Rooms.prototype.acquire = function (id, owner, callback) {
        var _this = this;
        if (!roomRegex.test(id)) {
            callback(new Error("Invalid room id: " + id));
            return;
        }
        _super.prototype.acquire.call(this, id, owner, function (err, item) {
            if (err != null) {
                callback(err);
                return;
            }
            if (owner == null) {
                callback(null, item);
                return;
            }
            item.join(owner, function (err, roomUser, index) {
                if (err != null) {
                    callback(new Error(err));
                    return;
                }
                _this.server.io.in("sub:rooms:" + id).emit("edit:rooms", id, "join", roomUser, index);
                callback(null, item);
            });
        });
    };
    Rooms.prototype.release = function (id, owner, options) {
        var _this = this;
        _super.prototype.release.call(this, id, owner, options);
        if (owner == null)
            return;
        this.byId[id].leave(owner, function (err, roomUserId) {
            if (err != null)
                throw new Error(err);
            _this.server.io.in("sub:rooms:" + id).emit("edit:rooms", id, "leave", roomUserId);
        });
    };
    Rooms.prototype._load = function (id) {
        var room = new SupData.Room(null);
        room.load(path.join(this.server.projectPath, "rooms/" + id));
        return room;
    };
    return Rooms;
})(SupData.Base.Dictionary);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Rooms;
