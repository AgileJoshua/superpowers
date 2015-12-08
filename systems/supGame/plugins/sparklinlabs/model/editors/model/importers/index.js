var obj = require("./obj");
var gltf = require("./gltf");
function createLogError(message, file, line) { return { file: file, line: line, type: "error", message: message }; }
exports.createLogError = createLogError;
function createLogWarning(message, file, line) { return { file: file, line: line, type: "warning", message: message }; }
exports.createLogWarning = createLogWarning;
function createLogInfo(message, file, line) { return { file: file, line: line, type: "info", message: message }; }
exports.createLogInfo = createLogInfo;
var modelImporters = { obj: obj, gltf: gltf };
function default_1(files, callback) {
    var modelImporter = null;
    for (var _i = 0; _i < files.length; _i++) {
        var file = files[_i];
        var filename = file.name;
        var extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        modelImporter = modelImporters[extension];
        if (modelImporter != null)
            break;
    }
    if (modelImporter == null) {
        callback([createLogError("No compatible importer found")]);
        return;
    }
    modelImporter.importModel(files, callback);
    return;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
