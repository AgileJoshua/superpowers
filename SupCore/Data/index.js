/* tslint:disable:no-unused-variable */
var Base = require("./Base");
exports.Base = Base;
var Projects_1 = require("./Projects");
exports.Projects = Projects_1.default;
var ProjectManifest_1 = require("./ProjectManifest");
exports.ProjectManifest = ProjectManifest_1.default;
var Diagnostics_1 = require("./Diagnostics");
exports.Diagnostics = Diagnostics_1.default;
var Entries_1 = require("./Entries");
exports.Entries = Entries_1.default;
var Assets_1 = require("./Assets");
exports.Assets = Assets_1.default;
var Resources_1 = require("./Resources");
exports.Resources = Resources_1.default;
var Rooms_1 = require("./Rooms");
exports.Rooms = Rooms_1.default;
var Room_1 = require("./Room");
exports.Room = Room_1.default;
var RoomUsers_1 = require("./RoomUsers");
exports.RoomUsers = RoomUsers_1.default;
/* tslint:enable:no-unused-variable */
function hasDuplicateName(id, name, siblings) {
    for (var _i = 0; _i < siblings.length; _i++) {
        var sibling = siblings[_i];
        if (sibling.id !== id && sibling.name === name)
            return true;
    }
    return false;
}
exports.hasDuplicateName = hasDuplicateName;
function ensureUniqueName(id, name, siblings) {
    name = name.trim();
    var candidateName = name;
    var nameNumber = 1;
    while (hasDuplicateName(id, candidateName, siblings))
        candidateName = name + " (" + nameNumber++ + ")";
    return candidateName;
}
exports.ensureUniqueName = ensureUniqueName;
