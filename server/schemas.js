var tv4 = require("tv4");
// Server config
var config = {
    type: "object",
    properties: {
        // Deprecated, use mainPort instead
        port: { type: "number" },
        mainPort: { type: "number" },
        buildPort: { type: "number" },
        password: { type: "string" },
        maxRecentBuilds: { type: "number", min: 1 }
    }
};
// Project manifest
var projectManifest = {
    type: "object",
    properties: {
        id: { type: "string", minLength: 4, maxLength: 4 },
        name: { type: "string", minLength: 1, maxLength: 80 },
        description: { type: "string", maxLength: 300 },
        // Introduced in Superpowers v0.15
        system: { type: "string" },
        formatVersion: { type: "integer", min: 0 }
    },
    required: ["id", "name", "description"]
};
// Project entries
var projectEntry = {
    type: "object",
    properties: {
        // IDs used to be integers but are now serialized as strings
        id: { type: ["integer", "string"] },
        name: { type: "string", minLength: 1, maxLength: 80 },
        type: { type: ["string", "null"] },
        children: {
            type: "array",
            items: { $ref: "#/definitions/projectEntry" }
        }
    },
    required: ["id", "name"]
};
var projectEntries = {
    definitions: { projectEntry: projectEntry },
    type: "array",
    items: { $ref: "#/definitions/projectEntry" }
};
var schemas = { config: config, projectManifest: projectManifest, projectEntries: projectEntries };
function validate(obj, schemaName) {
    var schema = schemas[schemaName];
    var result = tv4.validateResult(obj, schema);
    if (!result.valid) {
        throw new Error(result.error.dataPath + " (" + result.error.schemaPath + "): " + result.error.message);
    }
    return true;
}
exports.validate = validate;
