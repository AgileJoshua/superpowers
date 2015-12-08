var index_1 = require("./index");
exports.mode = "text";
function importModel(files, callback) {
    if (files.length > 1) {
        callback([index_1.createLogError("The OBJ importer only accepts one file at a time")]);
        return;
    }
    var reader = new FileReader;
    reader.onload = function (event) { parse(files[0].name, event.target.result, callback); };
    reader.readAsText(files[0]);
}
exports.importModel = importModel;
function parse(filename, text, callback) {
    var log = [];
    var arrays = { position: [], uv: [], normal: [] };
    var positionsByIndex = [];
    var uvsByIndex = [];
    var normalsByIndex = [];
    var lines = text.replace(/\r\n/g, "\n").split("\n");
    for (var lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        var line = lines[lineIndex].trim();
        // Ignore empty lines and comments
        if (line.length === 0 || line[0] === "#")
            continue;
        var _a = line.split(/\s+/), command = _a[0], valueStrings = _a.slice(1);
        switch (command) {
            case "v": {
                if (valueStrings.length !== 3) {
                    callback([index_1.createLogError("Invalid v command: found " + valueStrings.length + " values, expected 3", filename, lineIndex)]);
                    return;
                }
                var values = [];
                for (var _i = 0; _i < valueStrings.length; _i++) {
                    var valueString = valueStrings[_i];
                    values.push(+valueString);
                }
                positionsByIndex.push(values);
                break;
            }
            case "vt": {
                if (valueStrings.length < 2) {
                    callback([index_1.createLogError("Invalid vt command: found " + valueStrings.length + " values, expected 2", filename, lineIndex)]);
                    return;
                }
                if (valueStrings.length > 2)
                    log.push(index_1.createLogWarning("Ignoring extra texture coordinates (" + valueStrings.length + " found, using 2), only U and V are supported.", filename, lineIndex));
                var values = [];
                for (var i = 0; i < valueStrings.length; i++)
                    values.push(+valueStrings[i]);
                uvsByIndex.push(values);
                break;
            }
            case "vn": {
                if (valueStrings.length !== 3) {
                    callback([index_1.createLogError("Invalid vn command: found " + valueStrings.length + " values, expected 3", filename, lineIndex)]);
                    return;
                }
                var values = [];
                for (var _b = 0; _b < valueStrings.length; _b++) {
                    var valueString = valueStrings[_b];
                    values.push(+valueString);
                }
                normalsByIndex.push(values);
                break;
            }
            case "f":
                if (valueStrings.length !== 3 && valueStrings.length !== 4) {
                    log.push(index_1.createLogWarning("Ignoring unsupported face with " + valueStrings.length + " vertices, only triangles and quads are supported.", filename, lineIndex));
                    break;
                }
                var positions = [];
                var uvs = [];
                var normals = [];
                for (var _c = 0; _c < valueStrings.length; _c++) {
                    var valueString = valueStrings[_c];
                    var _d = valueString.split("/"), posIndexString = _d[0], uvIndexString = _d[1], normalIndexString = _d[2];
                    var posIndex = posIndexString | 0;
                    var pos = (posIndex >= 0) ? positionsByIndex[posIndex - 1]
                        : positionsByIndex[positionsByIndex.length + posIndex];
                    positions.push(pos);
                    if (uvIndexString != null && uvIndexString.length > 0) {
                        var uvIndex = uvIndexString | 0;
                        var uv = (uvIndex >= 0) ? uvsByIndex[uvIndex - 1]
                            : uvsByIndex[uvsByIndex.length + uvIndex];
                        uvs.push(uv);
                    }
                    if (normalIndexString != null) {
                        var normalIndex = normalIndexString | 0;
                        var normal = (normalIndex >= 0) ? normalsByIndex[normalIndex - 1]
                            : normalsByIndex[normalsByIndex.length + normalIndex];
                        normals.push(normal);
                    }
                }
                if (valueStrings.length === 3) {
                    // Triangle
                    arrays.position.push(positions[0][0], positions[0][1], positions[0][2]);
                    arrays.position.push(positions[1][0], positions[1][1], positions[1][2]);
                    arrays.position.push(positions[2][0], positions[2][1], positions[2][2]);
                    if (uvs.length > 0) {
                        arrays.uv.push(uvs[0][0], uvs[0][1]);
                        arrays.uv.push(uvs[1][0], uvs[1][1]);
                        arrays.uv.push(uvs[2][0], uvs[2][1]);
                    }
                    if (normals.length > 0) {
                        arrays.normal.push(normals[0][0], normals[0][1], normals[0][2]);
                        arrays.normal.push(normals[1][0], normals[1][1], normals[1][2]);
                        arrays.normal.push(normals[2][0], normals[2][1], normals[2][2]);
                    }
                }
                else {
                    // Quad
                    arrays.position.push(positions[0][0], positions[0][1], positions[0][2]);
                    arrays.position.push(positions[1][0], positions[1][1], positions[1][2]);
                    arrays.position.push(positions[2][0], positions[2][1], positions[2][2]);
                    arrays.position.push(positions[0][0], positions[0][1], positions[0][2]);
                    arrays.position.push(positions[2][0], positions[2][1], positions[2][2]);
                    arrays.position.push(positions[3][0], positions[3][1], positions[3][2]);
                    if (uvs.length > 0) {
                        arrays.uv.push(uvs[0][0], uvs[0][1]);
                        arrays.uv.push(uvs[1][0], uvs[1][1]);
                        arrays.uv.push(uvs[2][0], uvs[2][1]);
                        arrays.uv.push(uvs[0][0], uvs[0][1]);
                        arrays.uv.push(uvs[2][0], uvs[2][1]);
                        arrays.uv.push(uvs[3][0], uvs[3][1]);
                    }
                    if (normals.length > 0) {
                        arrays.normal.push(normals[0][0], normals[0][1], normals[0][2]);
                        arrays.normal.push(normals[1][0], normals[1][1], normals[1][2]);
                        arrays.normal.push(normals[2][0], normals[2][1], normals[2][2]);
                        arrays.normal.push(normals[0][0], normals[0][1], normals[0][2]);
                        arrays.normal.push(normals[2][0], normals[2][1], normals[2][2]);
                        arrays.normal.push(normals[3][0], normals[3][1], normals[3][2]);
                    }
                }
                break;
            default:
                log.push(index_1.createLogWarning("Ignoring unsupported OBJ command: " + command, filename, lineIndex));
        }
    }
    var buffers = {
        position: new Float32Array(arrays.position).buffer,
        uv: undefined, normal: undefined
    };
    var importedAttributes = [];
    if (arrays.uv.length > 0) {
        importedAttributes.push("texture coordinates");
        buffers.uv = new Float32Array(arrays.uv).buffer;
    }
    if (arrays.normal.length > 0) {
        importedAttributes.push("normals");
        buffers.normal = new Float32Array(arrays.normal).buffer;
    }
    var importInfo = (importedAttributes.length > 0) ? " with " + importedAttributes.join(", ") : "";
    log.push(index_1.createLogInfo("Imported " + arrays.position.length / 3 + " vertices" + importInfo + ".", filename));
    callback(log, { attributes: buffers });
}
