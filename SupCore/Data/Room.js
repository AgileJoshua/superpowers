var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var SupData = require("./index");
var path = require("path");
var fs = require("fs");
var Room = (function (_super) {
    __extends(Room, _super);
    function Room(pub) {
        _super.call(this, pub, Room.schema);
        if (this.pub != null)
            this.users = new SupData.RoomUsers(this.pub.users);
    }
    Room.prototype.load = function (roomPath) {
        var _this = this;
        fs.readFile(path.join(roomPath + ".json"), { encoding: "utf8" }, function (err, json) {
            if (err != null && err.code !== "ENOENT")
                throw err;
            if (json == null)
                _this.pub = { history: [] };
            else
                _this.pub = JSON.parse(json);
            _this.pub.users = [];
            _this.users = new SupData.RoomUsers(_this.pub.users);
            _this.emit("load");
        });
    };
    Room.prototype.unload = function () { this.removeAllListeners(); return; };
    Room.prototype.save = function (roomPath, callback) {
        var users = this.pub.users;
        delete this.pub.users;
        var json = JSON.stringify(this.pub, null, 2);
        this.pub.users = users;
        fs.writeFile(path.join(roomPath + ".json"), json, { encoding: "utf8" }, callback);
    };
    Room.prototype.join = function (client, callback) {
        var item = this.users.byId[client.socket.username];
        if (item != null) {
            item.connectionCount++;
            callback(null, item);
            return;
        }
        item = { id: client.socket.username, connectionCount: 1 };
        this.users.add(item, null, function (err, actualIndex) {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, item, actualIndex);
        });
    };
    Room.prototype.client_join = function (item, index) {
        if (index != null)
            this.users.client_add(item, index);
        else
            this.users.byId[item.id].connectionCount++;
    };
    Room.prototype.leave = function (client, callback) {
        var item = this.users.byId[client.socket.username];
        if (item.connectionCount > 1) {
            item.connectionCount--;
            callback(null, client.socket.username);
            return;
        }
        this.users.remove(client.socket.username, function (err) {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, client.socket.username);
        });
    };
    Room.prototype.client_leave = function (id) {
        var item = this.users.byId[id];
        if (item.connectionCount > 1) {
            item.connectionCount--;
            return;
        }
        this.users.client_remove(id);
    };
    Room.prototype.server_appendMessage = function (client, text, callback) {
        if (typeof (text) !== "string" || text.length > 300) {
            callback("Your message was too long");
            return;
        }
        var entry = { timestamp: Date.now(), author: client.socket.username, text: text };
        this.pub.history.push(entry);
        if (this.pub.history.length > 100)
            this.pub.history.splice(0, 1);
        callback(null, entry);
        this.emit("change");
    };
    Room.prototype.client_appendMessage = function (entry) {
        this.pub.history.push(entry);
        if (this.pub.history.length > 100)
            this.pub.history.splice(0, 1);
    };
    Room.schema = {
        history: {
            type: "array",
            items: {
                type: "hash",
                properties: {
                    timestamp: { type: "number" },
                    author: { type: "string" },
                    text: { type: "string" },
                    users: { type: "array" }
                }
            }
        }
    };
    return Room;
})(SupData.Base.Hash);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Room;
