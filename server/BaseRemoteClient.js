var BaseRemoteClient = (function () {
    function BaseRemoteClient(server, socket) {
        var _this = this;
        this.server = server;
        this.socket = socket;
        this.subscriptions = [];
        /*
        _error(message: string) {
          this.socket.emit("error", message);
          this.socket.disconnect();
        }
        */
        this.onDisconnect = function () {
            for (var _i = 0, _a = _this.subscriptions; _i < _a.length; _i++) {
                var subscription = _a[_i];
                var _b = subscription.split(":"), endpoint = _b[1], id = _b[2];
                if (id == null)
                    continue;
                _this.server.data[endpoint].release(id, _this);
            }
            _this.server.removeRemoteClient(_this.socket.id);
        };
        this.onSubscribe = function (endpoint, id, callback) {
            var data = _this.server.data[endpoint];
            if (data == null) {
                callback("No such endpoint", null);
                return;
            }
            var roomName = (id != null) ? "sub:" + endpoint + ":" + id : "sub:" + endpoint;
            if (_this.subscriptions.indexOf(roomName) !== -1) {
                callback("You're already subscribed to " + id, null);
                return;
            }
            if (id == null) {
                _this.socket.join(roomName);
                _this.subscriptions.push(roomName);
                callback(null, data.pub);
                return;
            }
            data.acquire(id, _this, function (err, item) {
                if (err != null) {
                    callback("Could not acquire asset: " + err, null);
                    return;
                }
                _this.socket.join(roomName);
                _this.subscriptions.push(roomName);
                callback(null, item.pub);
                return;
            });
        };
        this.onUnsubscribe = function (endpoint, id) {
            var data = _this.server.data[endpoint];
            if (data == null)
                return;
            var roomName = (id != null) ? "sub:" + endpoint + ":" + id : "sub:" + endpoint;
            var index = _this.subscriptions.indexOf(roomName);
            if (index === -1)
                return;
            if (id != null) {
                data.release(id, _this);
            }
            _this.socket.leave(roomName);
            _this.subscriptions.splice(index, 1);
        };
        this.socket.on("error", function (err) { SupCore.log(err.stack); });
        this.socket.on("disconnect", this.onDisconnect);
        this.socket.on("sub", this.onSubscribe);
        this.socket.on("unsub", this.onUnsubscribe);
    }
    BaseRemoteClient.prototype.errorIfCant = function (action, callback) {
        if (!this.can(action)) {
            if (callback != null)
                callback("Forbidden");
            return false;
        }
        return true;
    };
    BaseRemoteClient.prototype.can = function (action) { throw new Error("BaseRemoteClient.can() must be overridden"); };
    return BaseRemoteClient;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BaseRemoteClient;
