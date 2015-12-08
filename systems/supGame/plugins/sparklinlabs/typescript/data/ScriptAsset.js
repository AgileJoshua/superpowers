/// <reference path="../../textEditorWidget/operational-transform.d.ts" />
/// <reference path="../../../../../../node_modules/typescript/lib/typescriptServices.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var OT = require("operational-transform");
var fs = require("fs");
var path = require("path");
var _ = require("lodash");
if (global.window == null) {
    var serverRequire = require;
    var ts = serverRequire("typescript");
    var compileTypeScript = serverRequire("../runtime/compileTypeScript").default;
    var globalDefs = "";
    var actorComponentAccessors = [];
    for (var pluginName in SupCore.system.api.contexts["typescript"].plugins) {
        var plugin = SupCore.system.api.contexts["typescript"].plugins[pluginName];
        if (plugin.defs != null)
            globalDefs += plugin.defs;
        if (plugin.exposeActorComponent != null)
            actorComponentAccessors.push(plugin.exposeActorComponent.propertyName + ": " + plugin.exposeActorComponent.className + ";");
    }
    globalDefs = globalDefs.replace("// INSERT_COMPONENT_ACCESSORS", actorComponentAccessors.join("\n    "));
}
var ScriptAsset = (function (_super) {
    __extends(ScriptAsset, _super);
    function ScriptAsset(id, pub, server) {
        _super.call(this, id, pub, ScriptAsset.schema, server);
    }
    ScriptAsset.prototype.init = function (options, callback) {
        var _this = this;
        // Transform "script asset name" into "ScriptAssetNameBehavior"
        var behaviorName = options.name.trim().replace(/[()[\]{}-]/g, "");
        behaviorName = behaviorName.slice(0, 1).toUpperCase() + behaviorName.slice(1);
        if (behaviorName === "Behavior" || behaviorName === "Behaviour") {
            var parentEntry = this.server.data.entries.parentNodesById[this.id];
            if (parentEntry != null) {
                behaviorName = parentEntry.name.slice(0, 1).toUpperCase() + parentEntry.name.slice(1) + behaviorName;
            }
        }
        while (true) {
            var index = behaviorName.indexOf(" ");
            if (index === -1)
                break;
            behaviorName =
                behaviorName.slice(0, index) +
                    behaviorName.slice(index + 1, index + 2).toUpperCase() +
                    behaviorName.slice(index + 2);
        }
        if (!_.endsWith(behaviorName, "Behavior") && !_.endsWith(behaviorName, "Behaviour"))
            behaviorName += "Behavior";
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
            var defaultContent = "class " + behaviorName + " extends Sup.Behavior {\n" + tab + "awake() {\n" + tab + tab + "\n" + tab + "}\n\n" + tab + "update() {\n" + tab + tab + "\n" + tab + "}\n}\nSup.registerBehavior(" + behaviorName + ");\n";
            _this.pub = {
                text: defaultContent,
                draft: defaultContent,
                revisionId: 0
            };
            _this.server.data.resources.acquire("behaviorProperties", null, function (err, behaviorProperties) {
                if (behaviorProperties.pub.behaviors[behaviorName] == null) {
                    var behaviors = {};
                    behaviors[behaviorName] = { properties: [], parentBehavior: null };
                    behaviorProperties.setScriptBehaviors(_this.id, behaviors);
                }
                _this.server.data.resources.release("behaviorProperties", null);
                _super.prototype.init.call(_this, options, callback);
            });
        });
    };
    ScriptAsset.prototype.setup = function () {
        this.document = new OT.Document(this.pub.draft, this.pub.revisionId);
        this.hasDraft = this.pub.text !== this.pub.draft;
    };
    ScriptAsset.prototype.restore = function () {
        if (this.hasDraft)
            this.emit("setDiagnostic", "draft", "info");
    };
    ScriptAsset.prototype.destroy = function (callback) {
        var _this = this;
        this.server.data.resources.acquire("behaviorProperties", null, function (err, behaviorProperties) {
            behaviorProperties.clearScriptBehaviors(_this.id);
            _this.server.data.resources.release("behaviorProperties", null);
            callback();
        });
    };
    ScriptAsset.prototype.load = function (assetPath) {
        var _this = this;
        // NOTE: asset.json was removed in Superpowers 0.10
        // The empty callback is required to not fail if the file already doesn't exist
        fs.unlink(path.join(assetPath, "asset.json"), function (err) { });
        // NOTE: We must not set this.pub with a temporary value right now, otherwise
        // the asset will be considered loaded by Dictionary.acquire
        // and the acquire callback will be called immediately
        var pub;
        var readDraft = function (text) {
            fs.readFile(path.join(assetPath, "draft.ts"), { encoding: "utf8" }, function (err, draft) {
                // NOTE: draft.txt was renamed to draft.ts in Superpowers 0.11
                if (err != null && err.code === "ENOENT") {
                    fs.readFile(path.join(assetPath, "draft.txt"), { encoding: "utf8" }, function (err, draft) {
                        pub = { revisionId: 0, text: text, draft: (draft != null) ? draft : text };
                        _this._onLoaded(assetPath, pub);
                        if (draft != null) {
                            if (draft !== text)
                                fs.writeFile(path.join(assetPath, "draft.ts"), draft, { encoding: "utf8" });
                            fs.unlink(path.join(assetPath, "draft.txt"), function (err) { });
                        }
                    });
                }
                else {
                    pub = { revisionId: 0, text: text, draft: (draft != null) ? draft : text };
                    _this._onLoaded(assetPath, pub);
                }
            });
        };
        fs.readFile(path.join(assetPath, "script.ts"), { encoding: "utf8" }, function (err, text) {
            // NOTE: script.txt was renamed to script.ts in Superpowers 0.11
            if (err != null && err.code === "ENOENT") {
                fs.readFile(path.join(assetPath, "script.txt"), { encoding: "utf8" }, function (err, text) {
                    readDraft(text);
                    fs.writeFile(path.join(assetPath, "script.ts"), text, { encoding: "utf8" });
                    fs.unlink(path.join(assetPath, "script.txt"), function (err) { });
                });
            }
            else
                readDraft(text);
        });
    };
    ScriptAsset.prototype.save = function (assetPath, callback) {
        var _this = this;
        fs.writeFile(path.join(assetPath, "script.ts"), this.pub.text, { encoding: "utf8" }, function (err) {
            if (err != null) {
                callback(err);
                return;
            }
            if (_this.hasDraft) {
                fs.writeFile(path.join(assetPath, "draft.ts"), _this.pub.draft, { encoding: "utf8" }, callback);
            }
            else {
                fs.unlink(path.join(assetPath, "draft.ts"), function (err) {
                    if (err != null && err.code !== "ENOENT") {
                        callback(err);
                        return;
                    }
                    callback(null);
                });
            }
        });
    };
    ScriptAsset.prototype.server_editText = function (client, operationData, revisionIndex, callback) {
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
            operation = this.document.apply(operation, revisionIndex);
        }
        catch (err) {
            callback("Operation can't be applied");
            return;
        }
        this.pub.draft = this.document.text;
        this.pub.revisionId++;
        callback(null, operation.serialize(), this.document.getRevisionId() - 1);
        if (!this.hasDraft) {
            this.hasDraft = true;
            this.emit("setDiagnostic", "draft", "info");
        }
        this.emit("change");
    };
    ScriptAsset.prototype.client_editText = function (operationData, revisionIndex) {
        var operation = new OT.TextOperation();
        operation.deserialize(operationData);
        this.document.apply(operation, revisionIndex);
        this.pub.draft = this.document.text;
        this.pub.revisionId++;
    };
    ScriptAsset.prototype.server_saveText = function (client, callback) {
        var _this = this;
        this.pub.text = this.pub.draft;
        var scriptNames = [];
        var scripts = {};
        var ownScriptName = "";
        var finish = function () {
            callback(null);
            if (_this.hasDraft) {
                _this.hasDraft = false;
                _this.emit("clearDiagnostic", "draft");
            }
            _this.emit("change");
        };
        var compile = function () {
            try {
                var results = compileTypeScript(scriptNames, scripts, globalDefs, { sourceMap: false });
            }
            catch (e) {
                finish();
                return;
            }
            if (results.errors.length > 0) {
                finish();
                return;
            }
            var libLocals = results.program.getSourceFile("lib.d.ts").locals;
            var supTypeSymbols = {
                "Sup.Actor": libLocals["Sup"].exports["Actor"],
                "Sup.Behavior": libLocals["Sup"].exports["Behavior"],
                "Sup.Math.Vector2": libLocals["Sup"].exports["Math"].exports["Vector2"],
                "Sup.Math.Vector3": libLocals["Sup"].exports["Math"].exports["Vector3"],
                "Sup.Asset": libLocals["Sup"].exports["Asset"],
            };
            var supportedSupPropertyTypes = [
                supTypeSymbols["Sup.Math.Vector2"],
                supTypeSymbols["Sup.Math.Vector3"]
            ];
            var behaviors = {};
            var ownLocals = results.program.getSourceFile(ownScriptName).locals;
            for (var symbolName in ownLocals) {
                var symbol = ownLocals[symbolName];
                if ((symbol.flags & ts.SymbolFlags.Class) !== ts.SymbolFlags.Class)
                    continue;
                var parentTypeNode = ts.getClassExtendsHeritageClauseElement(symbol.valueDeclaration);
                if (parentTypeNode == null)
                    continue;
                var parentTypeSymbol = results.typeChecker.getSymbolAtLocation(parentTypeNode.expression);
                var baseTypeNode = parentTypeNode;
                var baseTypeSymbol = parentTypeSymbol;
                while (true) {
                    if (baseTypeSymbol === supTypeSymbols["Sup.Behavior"])
                        break;
                    baseTypeNode = ts.getClassExtendsHeritageClauseElement(baseTypeSymbol.valueDeclaration);
                    if (baseTypeNode == null)
                        break;
                    baseTypeSymbol = results.typeChecker.getSymbolAtLocation(baseTypeNode.expression);
                }
                if (baseTypeSymbol !== supTypeSymbols["Sup.Behavior"])
                    continue;
                var properties = [];
                var parentBehavior = null;
                if (parentTypeSymbol !== supTypeSymbols["Sup.Behavior"])
                    parentBehavior = results.typeChecker.getFullyQualifiedName(parentTypeSymbol);
                behaviors[symbolName] = { properties: properties, parentBehavior: parentBehavior };
                for (var memberName in symbol.members) {
                    var member = symbol.members[memberName];
                    // Skip non-properties
                    if ((member.flags & ts.SymbolFlags.Property) !== ts.SymbolFlags.Property)
                        continue;
                    // Skip static, private and protected members
                    var modifierFlags = (member.valueDeclaration.modifiers != null) ? member.valueDeclaration.modifiers.flags : null;
                    if (modifierFlags != null && (modifierFlags & (ts.NodeFlags.Private | ts.NodeFlags.Protected | ts.NodeFlags.Static)) !== 0)
                        continue;
                    // TODO: skip members annotated as "non-customizable"
                    var type = results.typeChecker.getTypeAtLocation(member.valueDeclaration);
                    var typeName = void 0; // "unknown"
                    var typeSymbol = type.getSymbol();
                    if (supportedSupPropertyTypes.indexOf(typeSymbol) !== -1) {
                        typeName = typeSymbol.getName();
                        var parentSymbol = typeSymbol.parent;
                        while (parentSymbol != null) {
                            typeName = parentSymbol.getName() + "." + typeName;
                            parentSymbol = parentSymbol.parent;
                        }
                    }
                    else if (type.intrinsicName != null)
                        typeName = type.intrinsicName;
                    if (typeName != null)
                        properties.push({ name: member.name, type: typeName });
                }
            }
            _this.server.data.resources.acquire("behaviorProperties", null, function (err, behaviorProperties) {
                behaviorProperties.setScriptBehaviors(_this.id, behaviors);
                _this.server.data.resources.release("behaviorProperties", null);
                finish();
            });
        };
        var remainingAssetsToLoad = Object.keys(this.server.data.entries.byId).length;
        var assetsLoading = 0;
        this.server.data.entries.walk(function (entry) {
            remainingAssetsToLoad--;
            if (entry.type !== "script") {
                if (remainingAssetsToLoad === 0 && assetsLoading === 0)
                    compile();
                return;
            }
            var name = _this.server.data.entries.getPathFromId(entry.id) + ".ts";
            scriptNames.push(name);
            assetsLoading++;
            _this.server.data.assets.acquire(entry.id, null, function (err, asset) {
                scripts[name] = asset.pub.text;
                if (asset === _this)
                    ownScriptName = name;
                _this.server.data.assets.release(entry.id, null);
                assetsLoading--;
                if (remainingAssetsToLoad === 0 && assetsLoading === 0)
                    compile();
            });
        });
    };
    ScriptAsset.prototype.client_saveText = function () { this.pub.text = this.pub.draft; };
    ScriptAsset.schema = {
        text: { type: "string" },
        draft: { type: "string" },
        revisionId: { type: "integer" }
    };
    return ScriptAsset;
})(SupCore.Data.Base.Asset);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ScriptAsset;
