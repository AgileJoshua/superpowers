var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ListById_1 = require("./Base/ListById");
var _ = require("lodash");
var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
var Projects = (function (_super) {
    __extends(Projects, _super);
    function Projects(pub) {
        _super.call(this, pub, Projects.schema, this.generateProjectId);
    }
    Projects.sort = function (a, b) {
        return a.name.localeCompare(b.name);
    };
    Projects.prototype.generateProjectId = function () {
        var id = null;
        while (true) {
            id = "";
            for (var i = 0; i < 4; i++)
                id += _.sample(characters);
            if (this.byId[id] == null)
                break;
        }
        return id;
    };
    Projects.schema = {
        name: { type: "string", minLength: 1, maxLength: 80 },
        description: { type: "string", maxLength: 300 },
        formatVersion: { type: "number?" },
        system: { type: "string" }
    };
    return Projects;
})(ListById_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Projects;
