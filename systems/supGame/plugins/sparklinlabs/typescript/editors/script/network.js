var ui_1 = require("./ui");
var async = require("async");
exports.data = {
    clientId: null,
    projectClient: null,
    typescriptWorker: new Worker("typescriptWorker.js"),
    assetsById: {},
    asset: null,
    fileNames: [],
    files: {},
    fileNamesByScriptId: {}
};
exports.socket = SupClient.connect(SupClient.query.project);
exports.socket.on("welcome", onWelcome);
exports.socket.on("disconnect", SupClient.onDisconnected);
var onEditCommands = {};
function onWelcome(clientId) {
    exports.data.clientId = clientId;
    loadPlugins();
}
function loadPlugins() {
    window.fetch("/systems/" + SupCore.system.name + "/plugins.json").then(function (response) { return response.json(); }).then(function (pluginsInfo) {
        async.each(pluginsInfo.list, function (pluginName, pluginCallback) {
            if (pluginName === "sparklinlabs/typescript") {
                pluginCallback();
                return;
            }
            var apiScript = document.createElement("script");
            apiScript.src = "/systems/" + SupCore.system.name + "/plugins/" + pluginName + "/api.js";
            apiScript.addEventListener("load", function () { pluginCallback(); });
            apiScript.addEventListener("error", function () { pluginCallback(); });
            document.body.appendChild(apiScript);
        }, function (err) {
            // Read API definitions
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
            exports.data.fileNames.push("lib.d.ts");
            exports.data.files["lib.d.ts"] = { id: "lib.d.ts", text: globalDefs, version: "" };
            exports.data.projectClient = new SupClient.ProjectClient(exports.socket);
            exports.data.projectClient.subEntries(entriesSubscriber);
            ui_1.setupEditor(exports.data.clientId);
        });
    });
}
var entriesSubscriber = {
    onEntriesReceived: function (entries) {
        entries.walk(function (entry) {
            if (entry.type !== "script")
                return;
            var fileName = exports.data.projectClient.entries.getPathFromId(entry.id) + ".ts";
            exports.data.fileNames.push(fileName);
            exports.data.fileNamesByScriptId[entry.id] = fileName;
            exports.data.projectClient.subAsset(entry.id, "script", scriptSubscriber);
        });
    },
    onEntryAdded: function (newEntry, parentId, index) {
        if (newEntry.type !== "script")
            return;
        var fileName = exports.data.projectClient.entries.getPathFromId(newEntry.id) + ".ts";
        var i = 0;
        exports.data.projectClient.entries.walk(function (entry) {
            if (entry.type !== "script")
                return;
            if (entry.id === newEntry.id)
                exports.data.fileNames.splice(i, 0, fileName);
            i++;
        });
        exports.data.fileNamesByScriptId[newEntry.id] = fileName;
        exports.data.projectClient.subAsset(newEntry.id, "script", scriptSubscriber);
    },
    onEntryMoved: function (id, parentId, index) {
        var entry = exports.data.projectClient.entries.byId[id];
        if (entry.type !== "script")
            return;
        var oldFileName = exports.data.fileNamesByScriptId[id];
        var newFileName = exports.data.projectClient.entries.getPathFromId(id) + ".ts";
        exports.data.fileNames.splice(exports.data.fileNames.indexOf(oldFileName), 1);
        var i = 0;
        exports.data.projectClient.entries.walk(function (entry) {
            if (entry.type !== "script")
                return;
            if (entry.id === id)
                exports.data.fileNames.splice(i, 0, newFileName);
            i++;
        });
        exports.data.fileNamesByScriptId[id] = newFileName;
        var file = exports.data.files[oldFileName];
        exports.data.files[newFileName] = file;
        if (newFileName !== oldFileName)
            delete exports.data.files[oldFileName];
        exports.data.typescriptWorker.postMessage({ type: "removeFile", fileName: oldFileName });
        exports.data.typescriptWorker.postMessage({ type: "addFile", fileName: newFileName, index: exports.data.fileNames.indexOf(newFileName), file: file });
        scheduleErrorCheck();
    },
    onSetEntryProperty: function (id, key, value) {
        var entry = exports.data.projectClient.entries.byId[id];
        if (entry.type !== "script" || key !== "name")
            return;
        var oldFileName = exports.data.fileNamesByScriptId[id];
        var newFileName = exports.data.projectClient.entries.getPathFromId(entry.id) + ".ts";
        if (newFileName === oldFileName)
            return;
        var scriptIndex = exports.data.fileNames.indexOf(oldFileName);
        exports.data.fileNames[scriptIndex] = newFileName;
        exports.data.fileNamesByScriptId[id] = newFileName;
        var file = exports.data.files[oldFileName];
        exports.data.files[newFileName] = file;
        delete exports.data.files[oldFileName];
        exports.data.typescriptWorker.postMessage({ type: "removeFile", fileName: oldFileName });
        exports.data.typescriptWorker.postMessage({ type: "addFile", fileName: newFileName, index: exports.data.fileNames.indexOf(newFileName), file: file });
        scheduleErrorCheck();
    },
    onEntryTrashed: function (id) {
        var fileName = exports.data.fileNamesByScriptId[id];
        if (fileName == null)
            return;
        exports.data.fileNames.splice(exports.data.fileNames.indexOf(fileName), 1);
        delete exports.data.files[fileName];
        delete exports.data.fileNamesByScriptId[id];
        exports.data.typescriptWorker.postMessage({ type: "removeFile", fileName: fileName });
        scheduleErrorCheck();
    },
};
var allScriptsReceived = false;
var scriptSubscriber = {
    onAssetReceived: function (err, asset) {
        exports.data.assetsById[asset.id] = asset;
        var fileName = exports.data.projectClient.entries.getPathFromId(asset.id) + ".ts";
        var file = { id: asset.id, text: asset.pub.text, version: asset.pub.revisionId.toString() };
        exports.data.files[fileName] = file;
        if (asset.id === SupClient.query.asset) {
            exports.data.asset = asset;
            ui_1.default.errorPaneStatus.classList.toggle("has-draft", exports.data.asset.hasDraft);
            ui_1.default.editor.setText(exports.data.asset.pub.draft);
            if (SupClient.query["line"] != null && SupClient.query["ch"] != null)
                ui_1.default.editor.codeMirrorInstance.getDoc().setCursor({ line: parseInt(SupClient.query["line"], 10), ch: parseInt(SupClient.query["ch"], 10) });
        }
        if (!allScriptsReceived) {
            if (Object.keys(exports.data.files).length === exports.data.fileNames.length) {
                allScriptsReceived = true;
                exports.data.typescriptWorker.postMessage({ type: "setup", fileNames: exports.data.fileNames, files: exports.data.files });
                scheduleErrorCheck();
            }
        }
        else {
            // All scripts have been received so this must be a newly created script
            exports.data.typescriptWorker.postMessage({ type: "addFile", fileName: fileName, index: exports.data.fileNames.indexOf(fileName), file: file });
            scheduleErrorCheck();
        }
    },
    onAssetEdited: function (id, command) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        if (id !== SupClient.query.asset) {
            if (command === "saveText") {
                var fileName = exports.data.projectClient.entries.getPathFromId(id) + ".ts";
                var asset = exports.data.assetsById[id];
                var file = exports.data.files[fileName];
                file.text = asset.pub.text;
                file.version = asset.pub.revisionId.toString();
                exports.data.typescriptWorker.postMessage({ type: "updateFile", fileName: fileName, text: file.text, version: file.version });
                scheduleErrorCheck();
            }
            return;
        }
        if (onAssetCommands[command] != null)
            onAssetCommands[command].apply(exports.data.asset, args);
    },
    onAssetTrashed: function (id) {
        if (id !== SupClient.query.asset)
            return;
        ui_1.default.editor.clear();
        if (ui_1.default.errorCheckTimeout != null)
            clearTimeout(ui_1.default.errorCheckTimeout);
        if (ui_1.default.completionTimeout != null)
            clearTimeout(ui_1.default.completionTimeout);
        SupClient.onAssetTrashed();
    },
};
var onAssetCommands = {};
onAssetCommands.editText = function (operationData) {
    ui_1.default.errorPaneStatus.classList.add("has-draft");
    ui_1.default.editor.receiveEditText(operationData);
};
onAssetCommands.saveText = function () {
    ui_1.default.errorPaneStatus.classList.remove("has-draft");
};
var isCheckingForErrors = false;
var hasScheduledErrorCheck = false;
var activeCompletion;
var nextCompletion;
exports.data.typescriptWorker.onmessage = function (event) {
    switch (event.data.type) {
        case "errors":
            ui_1.refreshErrors(event.data.errors);
            isCheckingForErrors = false;
            if (hasScheduledErrorCheck)
                startErrorCheck();
            break;
        case "completion":
            if (nextCompletion != null) {
                activeCompletion = null;
                startAutocomplete();
                return;
            }
            for (var _i = 0, _a = event.data.list; _i < _a.length; _i++) {
                var item = _a[_i];
                item.render = function (parentElt, data, item) {
                    parentElt.style.maxWidth = "100em";
                    var rowElement = document.createElement("div");
                    rowElement.style.display = "flex";
                    parentElt.appendChild(rowElement);
                    var kindElement = document.createElement("div");
                    kindElement.style.marginRight = "0.5em";
                    kindElement.style.width = "6em";
                    kindElement.textContent = item.kind;
                    rowElement.appendChild(kindElement);
                    var nameElement = document.createElement("div");
                    nameElement.style.marginRight = "0.5em";
                    nameElement.style.width = "15em";
                    nameElement.style.fontWeight = "bold";
                    nameElement.textContent = item.name;
                    rowElement.appendChild(nameElement);
                    var infoElement = document.createElement("div");
                    infoElement.textContent = item.info;
                    rowElement.appendChild(infoElement);
                };
            }
            var from = { line: activeCompletion.cursor.line, ch: activeCompletion.token.start };
            var to = { line: activeCompletion.cursor.line, ch: activeCompletion.token.end };
            activeCompletion.callback({ list: event.data.list, from: from, to: to });
            activeCompletion = null;
            break;
        case "quickInfo":
            if (ui_1.default.infoTimeout == null) {
                ui_1.default.infoElement.textContent = event.data.text;
                ui_1.default.editor.codeMirrorInstance.addWidget(ui_1.default.infoPosition, ui_1.default.infoElement, false);
            }
            break;
        case "parameterHint":
            ui_1.clearParameterPopup();
            if (event.data.texts != null)
                ui_1.showParameterPopup(event.data.texts, event.data.selectedItemIndex, event.data.selectedArgumentIndex);
            break;
        case "definition":
            if (window.parent != null) {
                var entry = SupClient.findEntryByPath(exports.data.projectClient.entries.pub, event.data.fileName);
                window.parent.postMessage({ type: "openEntry", id: entry.id, options: { line: event.data.line, ch: event.data.ch } }, window.location.origin);
            }
            break;
    }
};
function startErrorCheck() {
    if (isCheckingForErrors)
        return;
    isCheckingForErrors = true;
    hasScheduledErrorCheck = false;
    exports.data.typescriptWorker.postMessage({ type: "checkForErrors" });
}
activeCompletion = null;
function scheduleErrorCheck() {
    if (ui_1.default.errorCheckTimeout != null)
        clearTimeout(ui_1.default.errorCheckTimeout);
    ui_1.default.errorCheckTimeout = window.setTimeout(function () {
        hasScheduledErrorCheck = true;
        if (!isCheckingForErrors)
            startErrorCheck();
    }, 300);
}
exports.scheduleErrorCheck = scheduleErrorCheck;
function startAutocomplete() {
    if (activeCompletion != null)
        return;
    activeCompletion = nextCompletion;
    nextCompletion = null;
    exports.data.typescriptWorker.postMessage({
        type: "getCompletionAt",
        tokenString: activeCompletion.token.string,
        name: exports.data.fileNamesByScriptId[SupClient.query.asset],
        start: activeCompletion.start
    });
}
function setNextCompletion(completion) {
    nextCompletion = completion;
    if (activeCompletion == null)
        startAutocomplete();
}
exports.setNextCompletion = setNextCompletion;
