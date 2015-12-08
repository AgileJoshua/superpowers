var path = require("path");
var fs = require("fs");
var SupCore = require("../SupCore");
var yargs = require("yargs");
var argv = yargs
    .describe("data-path", "Path to store/read data files from, including config and projects")
    .argv;
// User data folder
exports.userData = path.join(__dirname, "..");
if (argv["data-path"] != null) {
    exports.userData = path.resolve(argv["data-path"]);
}
else {
    if (!fs.existsSync(path.join(exports.userData, "config.json"))) {
        switch (process.platform) {
            case "win32":
                if (process.env.APPDATA != null)
                    exports.userData = path.join(process.env.APPDATA, "Superpowers");
                else
                    SupCore.log("Warning: Could not find APPDATA environment variable.");
                break;
            case "darwin":
                if (process.env.HOME != null)
                    exports.userData = path.join(process.env.HOME, "Library", "Superpowers");
                else
                    SupCore.log("Warning: Could not find HOME environment variable.");
                break;
            default:
                if (process.env.XDG_DATA_HOME != null)
                    exports.userData = path.join(process.env.XDG_DATA_HOME, "Superpowers");
                else if (process.env.HOME != null)
                    exports.userData = path.join(process.env.HOME, ".local/share", "Superpowers");
                else
                    SupCore.log("Warning: Could not find neither XDG_DATA_HOME nor HOME environment variables.");
        }
    }
}
exports.projects = path.join(exports.userData, "projects");
exports.builds = path.join(exports.userData, "builds");
exports.config = path.join(exports.userData, "config.json");
SupCore.log("Using data from " + exports.userData + ".");
try {
    fs.mkdirSync(exports.userData);
}
catch (err) {
    if (err.code !== "EEXIST")
        throw err;
}
try {
    fs.mkdirSync(exports.projects);
}
catch (err) {
    if (err.code !== "EEXIST")
        throw err;
}
try {
    fs.mkdirSync(exports.builds);
}
catch (err) {
    if (err.code !== "EEXIST")
        throw err;
}
