var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var SupData = require("./index");
var path = require("path");
// Plugin resources are assets managed by plugins outside the project's asset tree
// They might be used for project-wide plugin-specific settings for instance
var Resources = (function (_super) {
    __extends(Resources, _super);
    function Resources(server) {
        _super.call(this);
        this.server = server;
    }
    Resources.prototype.acquire = function (id, owner, callback) {
        if (this.server.system.data.resourceClasses[id] == null) {
            callback(new Error("Invalid resource id: " + id), null);
            return;
        }
        _super.prototype.acquire.call(this, id, owner, callback);
    };
    Resources.prototype._load = function (id) {
        var resourceClass = this.server.system.data.resourceClasses[id];
        var resource = new resourceClass(null, this.server);
        resource.load(path.join(this.server.projectPath, "resources/" + id));
        return resource;
    };
    return Resources;
})(SupData.Base.Dictionary);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Resources;
