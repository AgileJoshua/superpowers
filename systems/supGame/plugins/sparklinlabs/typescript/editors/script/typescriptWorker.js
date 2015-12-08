var ts = require("typescript");
var fuzzy = require("fuzzy");
var scripts;
var compilerOptions = { target: 1 /* ES5 */ };
var host = {
    getScriptFileNames: function () { return scripts.fileNames; },
    getScriptVersion: function (fileName) { return scripts.files[fileName].version; },
    getScriptSnapshot: function (fileName) { return ts.ScriptSnapshot.fromString(scripts.files[fileName].text); },
    getCurrentDirectory: function () { return ""; },
    getCompilationSettings: function () { return compilerOptions; },
    getDefaultLibFileName: function () { return "lib.d.ts"; }
};
var service;
onmessage = function (event) {
    if (event.data.type !== "setup" && service == null)
        return;
    switch (event.data.type) {
        case "setup":
            scripts = { fileNames: event.data.fileNames, files: event.data.files };
            service = ts.createLanguageService(host, ts.createDocumentRegistry());
            break;
        case "updateFile":
            var script = scripts.files[event.data.fileName];
            script.text = event.data.text;
            script.version = event.data.version;
            break;
        case "addFile":
            scripts.fileNames.splice(event.data.index, 0, event.data.fileName);
            scripts.files[event.data.fileName] = event.data.file;
            break;
        case "removeFile":
            scripts.fileNames.splice(scripts.fileNames.indexOf(event.data.fileName), 1);
            delete scripts.files[event.data.fileName];
            break;
        case "checkForErrors":
            var tsErrors;
            try {
                tsErrors = ts.getPreEmitDiagnostics(service.getProgram());
            }
            catch (e) {
                postMessage({ type: "errors", errors: [{ file: "", position: { line: 0, character: 1 }, length: 0, message: e.message }] });
                return;
            }
            var errors = tsErrors.map(function (e) {
                return {
                    file: e.file.fileName, length: e.length,
                    message: ts.flattenDiagnosticMessageText(e.messageText, "\n"),
                    position: e.file.getLineAndCharacterOfPosition(e.start)
                };
            });
            postMessage({ type: "errors", errors: errors });
            break;
        case "getCompletionAt":
            var list = [];
            if (event.data.tokenString !== "" && event.data.tokenString !== ";") {
                var completions = service.getCompletionsAtPosition(event.data.name, event.data.start);
                if (completions != null) {
                    var rawList = [];
                    for (var _i = 0, _a = completions.entries; _i < _a.length; _i++) {
                        var completion = _a[_i];
                        rawList.push(completion.name);
                    }
                    rawList.sort();
                    event.data.tokenString = (event.data.tokenString !== ".") ? event.data.tokenString : "";
                    var results = fuzzy.filter(event.data.tokenString, rawList);
                    var exactStartIndex = 0;
                    for (var index = 0; index < results.length; index++) {
                        var result = results[index];
                        var text = result.original;
                        if (text.slice(0, event.data.tokenString.length) === event.data.tokenString) {
                            results.splice(index, 1);
                            results.splice(exactStartIndex, 0, result);
                            exactStartIndex++;
                        }
                    }
                    for (var _b = 0; _b < results.length; _b++) {
                        var result = results[_b];
                        var details = service.getCompletionEntryDetails(event.data.name, event.data.start, result.original);
                        var kind = details.kind;
                        var info_1 = "";
                        if (["class", "module", "namespace", "interface", "keyword"].indexOf(kind) === -1)
                            info_1 = ts.displayPartsToString(details.displayParts);
                        list.push({ text: result.original, kind: kind, name: details.name, info: info_1 });
                    }
                }
            }
            postMessage({ type: "completion", list: list });
            break;
        case "getQuickInfoAt":
            var info = service.getQuickInfoAtPosition(event.data.name, event.data.start);
            if (info != null)
                postMessage({ type: "quickInfo", text: ts.displayPartsToString(info.displayParts) });
            break;
        case "getParameterHintAt":
            var texts;
            var selectedItemIndex;
            var selectedArgumentIndex;
            var help = service.getSignatureHelpItems(event.data.name, event.data.start);
            if (help != null) {
                texts = [];
                selectedItemIndex = help.selectedItemIndex;
                selectedArgumentIndex = help.argumentIndex;
                for (var _c = 0, _d = help.items; _c < _d.length; _c++) {
                    var item = _d[_c];
                    var prefix = ts.displayPartsToString(item.prefixDisplayParts);
                    var parameters = [];
                    for (var _e = 0, _f = item.parameters; _e < _f.length; _e++) {
                        var parameter = _f[_e];
                        parameters.push(ts.displayPartsToString(parameter.displayParts));
                    }
                    var suffix = ts.displayPartsToString(item.suffixDisplayParts);
                    texts.push({ prefix: prefix, parameters: parameters, suffix: suffix });
                }
            }
            postMessage({ type: "parameterHint", texts: texts, selectedItemIndex: selectedItemIndex, selectedArgumentIndex: selectedArgumentIndex });
            break;
        case "getDefinitionAt":
            var definitions = service.getDefinitionAtPosition(event.data.name, event.data.start);
            if (definitions == null)
                return;
            var definition = definitions[0];
            if (definition.fileName === "lib.d.ts") {
            }
            else {
                var file = scripts.files[definition.fileName].text;
                var textParts = file.split("\n");
                var line = 0;
                var position = 0;
                while (position + textParts[line].length <= definition.textSpan.start) {
                    position += textParts[line].length + 1;
                    line += 1;
                }
                var fileName = definition.fileName.slice(0, definition.fileName.length - 3);
                postMessage({ type: "definition", fileName: fileName, line: line, ch: definition.textSpan.start - position });
            }
            break;
        default:
            throw new Error("Unexpected message type: " + event.data.type);
    }
};
