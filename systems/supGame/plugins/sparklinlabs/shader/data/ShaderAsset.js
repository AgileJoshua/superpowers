/// <reference path="../../textEditorWidget/operational-transform.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var OT = require("operational-transform");
var fs = require("fs");
var path = require("path");
var async = require("async");
var _ = require("lodash");
var Uniforms_1 = require("./Uniforms");
var Attributes_1 = require("./Attributes");
var ShaderAsset = (function (_super) {
    __extends(ShaderAsset, _super);
    function ShaderAsset(id, pub, server) {
        _super.call(this, id, pub, ShaderAsset.schema, server);
    }
    ShaderAsset.prototype.init = function (options, callback) {
        var _this = this;
        this.server.data.resources.acquire("textEditorSettings", null, function (err, textEditorSettings) {
            _this.server.data.resources.release("textEditorSettings", null);
            var tab;
            if (textEditorSettings.pub.softTab) {
                tab = "";
                for (var i = 0; i < textEditorSettings.pub.tabSize; i++)
                    tab = tab + " ";
            }
            else
                tab = "\t";
            var defaultVertexContent = "varying vec2 vUv;\n\nvoid main() {\n" + tab + "vUv = uv;\n" + tab + "gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);\n}\n";
            var defaultFragmentContent = "uniform sampler2D map;\nvarying vec2 vUv;\n\nvoid main() {\n" + tab + "gl_FragColor = texture2D(map, vUv);\n}\n";
            _this.pub = {
                formatVersion: ShaderAsset.currentFormatVersion,
                uniforms: [{ id: "0", name: "map", type: "t", value: "map" }],
                useLightUniforms: false,
                attributes: [],
                vertexShader: {
                    text: defaultVertexContent,
                    draft: defaultVertexContent,
                    revisionId: 0
                },
                fragmentShader: {
                    text: defaultFragmentContent,
                    draft: defaultFragmentContent,
                    revisionId: 0
                }
            };
            _super.prototype.init.call(_this, options, callback);
        });
    };
    ShaderAsset.prototype.setup = function () {
        this.uniforms = new Uniforms_1.default(this.pub.uniforms);
        this.attributes = new Attributes_1.default(this.pub.attributes);
        this.vertexDocument = new OT.Document(this.pub.vertexShader.draft, this.pub.vertexShader.revisionId);
        this.fragmentDocument = new OT.Document(this.pub.fragmentShader.draft, this.pub.fragmentShader.revisionId);
    };
    ShaderAsset.prototype.load = function (assetPath) {
        var _this = this;
        var pub;
        var loadShaders = function () {
            // NOTE: Migration for Superpowers 0.10
            if (typeof pub.vertexShader === "string") {
                pub.vertexShader = {
                    text: pub.vertexShader,
                    draft: pub.vertexShader,
                    revisionId: 0
                };
                pub.fragmentShader = {
                    text: pub.fragmentShader,
                    draft: pub.fragmentShader,
                    revisionId: 0
                };
                _this._onLoaded(assetPath, pub);
                return;
            }
            pub.vertexShader = { text: null, draft: null, revisionId: 0 };
            pub.fragmentShader = { text: null, draft: null, revisionId: 0 };
            // TODO: Rename to .glsl instead of .txt
            async.series([
                function (cb) {
                    fs.readFile(path.join(assetPath, "vertexShader.txt"), { encoding: "utf8" }, function (err, text) {
                        pub.vertexShader.text = text;
                        cb(null);
                    });
                },
                function (cb) {
                    fs.readFile(path.join(assetPath, "vertexShaderDraft.txt"), { encoding: "utf8" }, function (err, draft) {
                        pub.vertexShader.draft = (draft != null) ? draft : pub.vertexShader.text;
                        cb(null);
                    });
                },
                function (cb) {
                    fs.readFile(path.join(assetPath, "fragmentShader.txt"), { encoding: "utf8" }, function (err, text) {
                        pub.fragmentShader.text = text;
                        cb(null);
                    });
                },
                function (cb) {
                    fs.readFile(path.join(assetPath, "fragmentShaderDraft.txt"), { encoding: "utf8" }, function (err, draft) {
                        pub.fragmentShader.draft = (draft != null) ? draft : pub.fragmentShader.text;
                        _this._onLoaded(assetPath, pub);
                    });
                }
            ]);
        };
        fs.readFile(path.join(assetPath, "shader.json"), { encoding: "utf8" }, function (err, json) {
            // NOTE: "asset.json" was renamed to "shader.json" in Superpowers 0.11
            if (err != null && err.code === "ENOENT") {
                fs.readFile(path.join(assetPath, "asset.json"), { encoding: "utf8" }, function (err, json) {
                    fs.rename(path.join(assetPath, "asset.json"), path.join(assetPath, "shader.json"), function (err) {
                        pub = JSON.parse(json);
                        loadShaders();
                    });
                });
            }
            else {
                pub = JSON.parse(json);
                loadShaders();
            }
        });
    };
    ShaderAsset.prototype.migrate = function (assetPath, pub, callback) {
        if (pub.formatVersion === ShaderAsset.currentFormatVersion) {
            callback(false);
            return;
        }
        if (pub.formatVersion == null) {
            // NOTE: Introduced in Superpowers 0.11
            if (pub.useLightUniforms == null)
                pub.useLightUniforms = false;
            pub.formatVersion = 1;
        }
        callback(true);
    };
    ShaderAsset.prototype.save = function (assetPath, callback) {
        // NOTE: Doing a clone here because of asynchronous operations below
        // We should use the (future) asset locking system instead
        var vertexShader = _.cloneDeep(this.pub.vertexShader);
        delete this.pub.vertexShader;
        var fragmentShader = _.cloneDeep(this.pub.fragmentShader);
        delete this.pub.fragmentShader;
        var json = JSON.stringify(this.pub, null, 2);
        this.pub.vertexShader = vertexShader;
        this.pub.fragmentShader = fragmentShader;
        // TODO: Rename to .glsl instead of .txt
        async.series([
            function (cb) {
                fs.writeFile(path.join(assetPath, "shader.json"), json, { encoding: "utf8" }, function (err) {
                    if (err != null)
                        cb(err);
                    else
                        cb(null);
                });
            },
            function (cb) {
                fs.writeFile(path.join(assetPath, "vertexShader.txt"), vertexShader.text, { encoding: "utf8" }, function (err) {
                    if (err != null)
                        cb(err);
                    else
                        cb(null);
                });
            },
            function (cb) {
                if (vertexShader.draft !== vertexShader.text) {
                    fs.writeFile(path.join(assetPath, "vertexShaderDraft.txt"), vertexShader.draft, { encoding: "utf8" }, function (err) {
                        if (err != null && err.code !== "ENOENT")
                            cb(err);
                        else
                            cb(null);
                    });
                }
                else {
                    fs.unlink(path.join(assetPath, "vertexShaderDraft.txt"), function (err) {
                        if (err != null && err.code !== "ENOENT")
                            cb(err);
                        else
                            cb(null);
                    });
                }
            },
            function (cb) {
                fs.writeFile(path.join(assetPath, "fragmentShader.txt"), fragmentShader.text, { encoding: "utf8" }, function (err) {
                    if (err != null)
                        cb(err);
                    else
                        cb(null);
                });
            },
            function (cb) {
                if (fragmentShader.draft !== fragmentShader.text) {
                    fs.writeFile(path.join(assetPath, "fragmentShaderDraft.txt"), fragmentShader.draft, { encoding: "utf8" }, function (err) {
                        if (err != null && err.code !== "ENOENT")
                            cb(err);
                        else
                            cb(null);
                    });
                }
                else {
                    fs.unlink(path.join(assetPath, "fragmentShaderDraft.txt"), function (err) {
                        if (err != null && err.code !== "ENOENT")
                            cb(err);
                        else
                            cb(null);
                    });
                }
            }
        ], function (err) { callback(err); });
    };
    ShaderAsset.prototype.server_newUniform = function (client, name, callback) {
        var _this = this;
        for (var _i = 0, _a = this.pub.uniforms; _i < _a.length; _i++) {
            var uniform_1 = _a[_i];
            if (uniform_1.name === name) {
                callback("An uniform named " + name + " already exists", null, null);
                return;
            }
        }
        var uniform = { id: null, name: name, type: "f", value: "0.0" };
        this.uniforms.add(uniform, null, function (err, actualIndex) {
            if (err != null) {
                callback(err, null, null);
                return;
            }
            callback(null, uniform, actualIndex);
            _this.emit("change");
        });
    };
    ShaderAsset.prototype.client_newUniform = function (uniform, actualIndex) {
        this.uniforms.client_add(uniform, actualIndex);
    };
    ShaderAsset.prototype.server_deleteUniform = function (client, id, callback) {
        var _this = this;
        this.uniforms.remove(id, function (err) {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, id);
            _this.emit("change");
        });
    };
    ShaderAsset.prototype.client_deleteUniform = function (id) {
        this.uniforms.client_remove(id);
        return;
    };
    ShaderAsset.prototype.server_setUniformProperty = function (client, id, key, value, callback) {
        var _this = this;
        if (key === "name") {
            if (typeof (value) !== "string") {
                callback("Invalid value");
                return;
            }
            value = value.trim();
            if (SupCore.Data.hasDuplicateName(id, value, this.uniforms.pub)) {
                callback("There's already an uniform with this name");
                return;
            }
        }
        this.uniforms.setProperty(id, key, value, function (err, actualValue) {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, id, key, actualValue);
            _this.emit("change");
        });
    };
    ShaderAsset.prototype.client_setUniformProperty = function (id, key, actualValue) {
        this.uniforms.client_setProperty(id, key, actualValue);
    };
    ShaderAsset.prototype.server_newAttribute = function (client, name, callback) {
        var _this = this;
        for (var _i = 0, _a = this.pub.attributes; _i < _a.length; _i++) {
            var attribute_1 = _a[_i];
            if (attribute_1.name === name) {
                callback("An attribute named " + name + " already exists", null, null);
                return;
            }
        }
        var attribute = { id: null, name: name, type: "f" };
        this.attributes.add(attribute, null, function (err, actualIndex) {
            if (err != null) {
                callback(err, null, null);
                return;
            }
            callback(null, attribute, actualIndex);
            _this.emit("change");
        });
    };
    ShaderAsset.prototype.client_newAttribute = function (attribute, actualIndex) {
        this.attributes.client_add(attribute, actualIndex);
    };
    ShaderAsset.prototype.server_deleteAttribute = function (client, id, callback) {
        var _this = this;
        this.attributes.remove(id, function (err) {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, id);
            _this.emit("change");
        });
    };
    ShaderAsset.prototype.client_deleteAttribute = function (id) {
        this.attributes.client_remove(id);
        return;
    };
    ShaderAsset.prototype.server_setAttributeProperty = function (client, id, key, value, callback) {
        var _this = this;
        if (key === "name") {
            if (typeof (value) !== "string") {
                callback("Invalid value");
                return;
            }
            value = value.trim();
            if (SupCore.Data.hasDuplicateName(id, value, this.attributes.pub)) {
                callback("There's already an attribute with this name");
                return;
            }
        }
        this.attributes.setProperty(id, key, value, function (err, actualValue) {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, id, key, actualValue);
            _this.emit("change");
        });
    };
    ShaderAsset.prototype.client_setAttributeProperty = function (id, key, actualValue) {
        this.attributes.client_setProperty(id, key, actualValue);
    };
    ShaderAsset.prototype.server_editVertexShader = function (client, operationData, revisionIndex, callback) {
        if (operationData.userId !== client.id) {
            callback("Invalid client id");
            return;
        }
        var operation = new OT.TextOperation();
        if (!operation.deserialize(operationData)) {
            callback("Invalid operation data");
            return;
        }
        try {
            operation = this.vertexDocument.apply(operation, revisionIndex);
        }
        catch (err) {
            callback("Operation can't be applied");
            return;
        }
        this.pub.vertexShader.draft = this.vertexDocument.text;
        this.pub.vertexShader.revisionId++;
        callback(null, operation.serialize(), this.vertexDocument.getRevisionId() - 1);
        this.emit("change");
    };
    ShaderAsset.prototype.client_editVertexShader = function (operationData, revisionIndex) {
        var operation = new OT.TextOperation();
        operation.deserialize(operationData);
        this.vertexDocument.apply(operation, revisionIndex);
        this.pub.vertexShader.draft = this.vertexDocument.text;
        this.pub.vertexShader.revisionId++;
    };
    ShaderAsset.prototype.server_saveVertexShader = function (client, callback) {
        this.pub.vertexShader.text = this.pub.vertexShader.draft;
        callback(null);
        this.emit("change");
    };
    ShaderAsset.prototype.client_saveVertexShader = function () {
        this.pub.vertexShader.text = this.pub.vertexShader.draft;
    };
    ShaderAsset.prototype.server_editFragmentShader = function (client, operationData, revisionIndex, callback) {
        if (operationData.userId !== client.id) {
            callback("Invalid client id");
            return;
        }
        var operation = new OT.TextOperation();
        if (!operation.deserialize(operationData)) {
            callback("Invalid operation data");
            return;
        }
        try {
            operation = this.fragmentDocument.apply(operation, revisionIndex);
        }
        catch (err) {
            callback("Operation can't be applied");
            return;
        }
        this.pub.fragmentShader.draft = this.fragmentDocument.text;
        this.pub.fragmentShader.revisionId++;
        callback(null, operation.serialize(), this.fragmentDocument.getRevisionId() - 1);
        this.emit("change");
    };
    ShaderAsset.prototype.client_editFragmentShader = function (operationData, revisionIndex) {
        var operation = new OT.TextOperation();
        operation.deserialize(operationData);
        this.fragmentDocument.apply(operation, revisionIndex);
        this.pub.fragmentShader.draft = this.fragmentDocument.text;
        this.pub.fragmentShader.revisionId++;
    };
    ShaderAsset.prototype.server_saveFragmentShader = function (client, callback) {
        this.pub.fragmentShader.text = this.pub.fragmentShader.draft;
        callback(null);
        this.emit("change");
    };
    ShaderAsset.prototype.client_saveFragmentShader = function () {
        this.pub.fragmentShader.text = this.pub.fragmentShader.draft;
    };
    ShaderAsset.currentFormatVersion = 1;
    ShaderAsset.schema = {
        formatVersion: { type: "integer" },
        uniforms: { type: "array" },
        useLightUniforms: { type: "boolean", mutable: true },
        attributes: { type: "array" },
        vertexShader: {
            type: "hash",
            properties: {
                text: { type: "string" },
                draft: { type: "string" },
                revisionId: { type: "integer" }
            }
        },
        fragmentShader: {
            type: "hash",
            properties: {
                text: { type: "string" },
                draft: { type: "string" },
                revisionId: { type: "integer" }
            }
        }
    };
    return ShaderAsset;
})(SupCore.Data.Base.Asset);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ShaderAsset;
