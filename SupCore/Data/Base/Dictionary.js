var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var events_1 = require("events");
var Dictionary = (function (_super) {
    __extends(Dictionary, _super);
    function Dictionary(unloadDelaySeconds) {
        if (unloadDelaySeconds === void 0) { unloadDelaySeconds = 60; }
        _super.call(this);
        this.unloadTimeoutsById = {};
        this.byId = {};
        this.refCountById = {};
        this.unloadDelaySeconds = unloadDelaySeconds;
    }
    Dictionary.prototype.acquire = function (id, owner, callback) {
        var _this = this;
        if (this.refCountById[id] == null)
            this.refCountById[id] = 0;
        this.refCountById[id]++;
        // console.log(`Acquiring ${id}: ${this.refCountById[id]} refs`);
        // Cancel pending unload timeout if any
        var timeout = this.unloadTimeoutsById[id];
        if (timeout != null) {
            // console.log(`Cancelling unload timeout for ${id}`);
            clearTimeout(timeout);
            delete this.unloadTimeoutsById[id];
        }
        var item = this.byId[id];
        if (item == null) {
            try {
                item = this._load(id);
            }
            catch (e) {
                callback(e, null);
                return;
            }
            this.byId[id] = item;
            item.on("load", function () {
                // Bail if entry was evicted from the cache
                if (_this.byId[id] == null)
                    return;
                _this.emit("itemLoad", id, item);
            });
        }
        if (item.pub != null)
            callback(null, item);
        else
            item.on("load", function () {
                // Bail if entry was evicted from the cache
                if (_this.byId[id] == null)
                    return;
                callback(null, item);
                return;
            });
    };
    Dictionary.prototype.release = function (id, owner, options) {
        var _this = this;
        if (this.refCountById[id] == null) {
            // This might happen if .releaseAll(id) was called elsewhere since we called acquire
            // Just log and ignore
            console.log("Can't release " + id + ", ref count is null");
            return;
        }
        this.refCountById[id]--;
        // console.log(`Releasing ${id}: ${this.refCountById[id]} refs left`);
        if (this.refCountById[id] === 0) {
            delete this.refCountById[id];
            // Schedule unloading the asset after a while
            if (options != null && options.skipUnloadDelay)
                this._unload(id);
            else
                this.unloadTimeoutsById[id] = setTimeout(function () { _this._unload(id); }, this.unloadDelaySeconds * 1000);
        }
    };
    Dictionary.prototype._load = function (id) { throw new Error("This method must be overridden by derived classes"); };
    Dictionary.prototype._unload = function (id) {
        // console.log(`Unloading ${id}`);
        this.byId[id].unload();
        delete this.byId[id];
        delete this.unloadTimeoutsById[id];
    };
    Dictionary.prototype.releaseAll = function (id) {
        // Cancel pending unload timeout if any
        var timeout = this.unloadTimeoutsById[id];
        if (timeout != null) {
            clearTimeout(timeout);
            delete this.unloadTimeoutsById[id];
        }
        delete this.refCountById[id];
        delete this.byId[id];
    };
    return Dictionary;
})(events_1.EventEmitter);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Dictionary;
