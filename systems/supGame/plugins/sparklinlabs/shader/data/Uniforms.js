var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Uniforms = (function (_super) {
    __extends(Uniforms, _super);
    function Uniforms(pub) {
        _super.call(this, pub, Uniforms.schema);
    }
    Uniforms.prototype.setProperty = function (id, key, value, callback) {
        var _this = this;
        if (key === "value") {
            function checkArray(value, size) {
                if (!Array.isArray(value))
                    return false;
                if (value.length !== size)
                    return false;
                for (var _i = 0; _i < value.length; _i++) {
                    var item_1 = value[_i];
                    if (typeof item_1 !== "number")
                        return false;
                }
                return true;
            }
            var item = this.byId[id];
            switch (item.type) {
                case "f":
                    if (typeof value !== "number") {
                        callback("Invalid value", null);
                        return;
                    }
                    break;
                case "c":
                case "v3":
                    if (!checkArray(value, 3)) {
                        callback("Invalid value", null);
                        return;
                    }
                    break;
                case "v2":
                    if (!checkArray(value, 2)) {
                        callback("Invalid value", null);
                        return;
                    }
                    break;
                case "v4":
                    if (!checkArray(value, 4)) {
                        callback("Invalid value", null);
                        return;
                    }
                    break;
                case "t":
                    if (typeof value !== "string") {
                        callback("Invalid value", null);
                        return;
                    }
                    break;
            }
        }
        _super.prototype.setProperty.call(this, id, key, value, function (err, value) {
            if (err != null) {
                callback(err, null);
                return;
            }
            callback(null, value);
            if (key === "type")
                _this.updateItemValue(id, value);
        });
    };
    Uniforms.prototype.client_setProperty = function (id, key, value) {
        _super.prototype.client_setProperty.call(this, id, key, value);
        if (key === "type")
            this.updateItemValue(id, value);
    };
    Uniforms.prototype.updateItemValue = function (id, value) {
        var item = this.byId[id];
        switch (value) {
            case "f":
                item.value = 0;
                break;
            case "c":
                item.value = [1, 1, 1];
                break;
            case "v2":
                item.value = [0, 0];
                break;
            case "v3":
                item.value = [0, 0, 0];
                break;
            case "v4":
                item.value = [0, 0, 0, 0];
                break;
            case "t":
                item.value = "map";
                break;
        }
    };
    Uniforms.schema = {
        name: { type: "string", minLength: 1, maxLength: 80, mutable: true },
        type: { type: "enum", items: ["f", "c", "v2", "v3", "v4", "t"], mutable: true },
        value: { type: "any", mutable: true }
    };
    return Uniforms;
})(SupCore.Data.Base.ListById);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Uniforms;
