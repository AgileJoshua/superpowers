var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var base = require("./index");
var events_1 = require("events");
var ListById = (function (_super) {
    __extends(ListById, _super);
    function ListById(pub, schema, generateNextId) {
        var _this = this;
        _super.call(this);
        this.nextId = 0;
        this.byId = {};
        this.pub = pub;
        this.schema = schema;
        this.generateNextId = generateNextId;
        var maxItemId = -1;
        for (var _i = 0, _a = this.pub; _i < _a.length; _i++) {
            var item = _a[_i];
            // NOTE: Legacy stuff from Superpowers 0.4
            if (typeof item.id === "number")
                item.id = item.id.toString();
            this.byId[item.id] = item;
            maxItemId = Math.max(maxItemId, item.id);
        }
        if (this.generateNextId == null) {
            this.generateNextId = function () {
                var id = _this.nextId.toString();
                _this.nextId++;
                return id;
            };
            this.nextId = maxItemId + 1;
        }
    }
    ListById.prototype.add = function (item, index, callback) {
        if (item.id != null && this.schema.id == null) {
            callback("Found unexpected id key");
            return;
        }
        var missingKeys = Object.keys(this.schema);
        for (var key in item) {
            var value = item[key];
            var rule = this.schema[key];
            if (rule == null) {
                if (key === "id" && value == null)
                    continue;
                callback("Invalid key: " + key);
                return;
            }
            var violation = base.getRuleViolation(value, rule, true);
            if (violation != null) {
                callback("Invalid value for " + key + ": " + base.formatRuleViolation(violation));
                return;
            }
            missingKeys.splice(missingKeys.indexOf(key), 1);
        }
        if (missingKeys.length > 0) {
            callback("Missing key: " + missingKeys[0]);
            return;
        }
        if (item.id == null)
            item.id = this.generateNextId();
        this.byId[item.id] = item;
        // Fix index if it's out of bounds
        if (index == null || index < 0 || index >= this.pub.length)
            index = this.pub.length;
        this.pub.splice(index, 0, item);
        callback(null, index);
        this.emit("change");
    };
    ListById.prototype.client_add = function (item, index) {
        this.byId[item.id] = item;
        this.pub.splice(index, 0, item);
    };
    ListById.prototype.move = function (id, index, callback) {
        var item = this.byId[id];
        if (item == null) {
            callback("Invalid item id: " + id);
            return;
        }
        if (index == null || index < 0 || index >= this.pub.length)
            index = this.pub.length;
        var oldIndex = this.pub.indexOf(item);
        this.pub.splice(oldIndex, 1);
        var actualIndex = index;
        if (oldIndex < actualIndex)
            actualIndex--;
        this.pub.splice(actualIndex, 0, item);
        callback(null, index);
        this.emit("change");
    };
    ListById.prototype.client_move = function (id, newIndex) {
        var item = this.byId[id];
        var oldIndex = this.pub.indexOf(item);
        this.pub.splice(oldIndex, 1);
        if (oldIndex < newIndex)
            newIndex--;
        this.pub.splice(newIndex, 0, item);
    };
    ListById.prototype.remove = function (id, callback) {
        var item = this.byId[id];
        if (item == null) {
            callback("Invalid item id: " + id);
            return;
        }
        var index = this.pub.indexOf(item);
        this.pub.splice(index, 1);
        delete this.byId[id];
        callback(null, index);
        this.emit("change");
    };
    ListById.prototype.client_remove = function (id) {
        var item = this.byId[id];
        this.pub.splice(this.pub.indexOf(item), 1);
        delete this.byId[id];
    };
    // clear: ->
    ListById.prototype.setProperty = function (id, path, value, callback) {
        var item = this.byId[id];
        if (item == null) {
            callback("Invalid item id: " + id);
            return;
        }
        var parts = path.split(".");
        var rule = this.schema[parts[0]];
        for (var _i = 0, _a = parts.slice(1); _i < _a.length; _i++) {
            var part = _a[_i];
            rule = rule.properties[part];
            if (rule.type === "any")
                break;
        }
        if (rule == null) {
            callback("Invalid key: " + path);
            return;
        }
        if (rule.type !== "any") {
            var violation = base.getRuleViolation(value, rule);
            if (violation != null) {
                callback("Invalid value for " + path + ": " + base.formatRuleViolation(violation));
                return;
            }
        }
        for (var _b = 0, _c = parts.slice(0, parts.length - 1); _b < _c.length; _b++) {
            var part = _c[_b];
            item = item[part];
        }
        item[parts[parts.length - 1]] = value;
        callback(null, value);
        this.emit("change");
    };
    ListById.prototype.client_setProperty = function (id, path, value) {
        var parts = path.split(".");
        var item = this.byId[id];
        for (var _i = 0, _a = parts.slice(0, parts.length - 1); _i < _a.length; _i++) {
            var part = _a[_i];
            item = item[part];
        }
        item[parts[parts.length - 1]] = value;
    };
    return ListById;
})(events_1.EventEmitter);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ListById;
