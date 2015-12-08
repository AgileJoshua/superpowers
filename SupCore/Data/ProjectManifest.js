var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Hash_1 = require("./Base/Hash");
var ProjectManifest = (function (_super) {
    __extends(ProjectManifest, _super);
    function ProjectManifest(pub) {
        this.migratedFromFormatVersion = ProjectManifest.migrate(pub);
        _super.call(this, pub, ProjectManifest.schema);
    }
    ProjectManifest.migrate = function (pub) {
        if (pub.formatVersion === ProjectManifest.currentFormatVersion)
            return null;
        if (pub.formatVersion == null)
            pub.formatVersion = 0;
        if (pub.formatVersion > ProjectManifest.currentFormatVersion) {
            throw new Error("This project was created using a more recent version of Superpowers and cannot be loaded. " +
                ("Format version is " + pub.formatVersion + " but this version of Superpowers only supports up to " + ProjectManifest.currentFormatVersion + "."));
        }
        var oldFormatVersion = pub.formatVersion;
        if (oldFormatVersion === 0) {
        }
        if (oldFormatVersion <= 1) {
            pub.system = "supGame";
        }
        pub.formatVersion = ProjectManifest.currentFormatVersion;
        return oldFormatVersion;
    };
    ProjectManifest.schema = {
        id: { type: "string" },
        name: { type: "string", minLength: 1, maxLength: 80, mutable: true },
        description: { type: "string", maxLength: 300, mutable: true },
        system: { type: "string" },
        formatVersion: { type: "integer" }
    };
    ProjectManifest.currentFormatVersion = 2;
    return ProjectManifest;
})(Hash_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ProjectManifest;
