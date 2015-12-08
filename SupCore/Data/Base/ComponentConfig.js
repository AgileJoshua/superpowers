var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Hash_1 = require("./Hash");
var ComponentConfig = (function (_super) {
    __extends(ComponentConfig, _super);
    function ComponentConfig(pub, schema) {
        _super.call(this, pub, schema);
    }
    ComponentConfig.prototype.restore = function () { };
    ComponentConfig.prototype.destroy = function () { };
    ComponentConfig.prototype.server_setProperty = function (client, path, value, callback) {
        this.setProperty(path, value, function (err, actualValue) {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, path, actualValue);
        });
    };
    return ComponentConfig;
})(Hash_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ComponentConfig;
