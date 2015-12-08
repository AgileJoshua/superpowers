function default_1(file, type, callback) {
    var reader = new FileReader;
    reader.onload = function (event) {
        var result;
        switch (type) {
            case "json":
                try {
                    result = JSON.parse(event.target.result);
                }
                catch (err) {
                    callback(err, null);
                    return;
                }
                break;
            default:
                result = event.target.result;
        }
        callback(null, result);
    };
    switch (type) {
        case "text":
        case "json":
            reader.readAsText(file);
            break;
        case "arraybuffer":
            reader.readAsArrayBuffer(file);
            break;
        default:
            throw new Error("Unsupported readFile type: " + type);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
