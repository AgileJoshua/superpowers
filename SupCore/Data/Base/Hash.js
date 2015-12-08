var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var base = require("./index");
var events_1 = require("events");
var Hash = (function (_super) {
    __extends(Hash, _super);
    function Hash(pub, schema) {
        _super.call(this);
        this.pub = pub;
        this.schema = schema;
    }
    Hash.prototype.setProperty = function (path, value, callback) {
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
        var obj = this.pub;
        for (var _b = 0, _c = parts.slice(0, parts.length - 1); _b < _c.length; _b++) {
            var part = _c[_b];
            obj = obj[part];
        }
        obj[parts[parts.length - 1]] = value;
        callback(null, value);
        this.emit("change");
    };
    Hash.prototype.client_setProperty = function (path, value) {
        var parts = path.split(".");
        var obj = this.pub;
        for (var _i = 0, _a = parts.slice(0, parts.length - 1); _i < _a.length; _i++) {
            var part = _a[_i];
            obj = obj[part];
        }
        obj[parts[parts.length - 1]] = value;
    };
    return Hash;
})(events_1.EventEmitter);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Hash;
