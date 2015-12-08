var _ = require("lodash");
var fs = require("fs");
var schemas = require("./schemas");
var paths = require("./paths");
var configDefaults_1 = require("./configDefaults");
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = configDefaults_1.default;
if (fs.existsSync(paths.config)) {
    var config = JSON.parse(fs.readFileSync(paths.config, { encoding: "utf8" }));
    schemas.validate(config, "config");
    if (config.port != null) {
        config.mainPort = config.port;
        delete config.port;
    }
    _.merge(configDefaults_1.default, config);
}
else {
    fs.writeFileSync(paths.config, JSON.stringify(configDefaults_1.default, null, 2) + "\n", { encoding: "utf8" });
}
