var network_1 = require("./network");
/* tslint:disable */
var PerfectResize = require("perfect-resize");
/* tslint:enable */
var ui = {};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ui;
SupClient.setupHotkeys();
window.addEventListener("message", function (event) {
    if (event.data.type === "activate")
        ui.editor.codeMirrorInstance.focus();
    if (event.data.line != null && event.data.ch != null)
        ui.editor.codeMirrorInstance.getDoc().setCursor({ line: parseInt(event.data.line, 10), ch: parseInt(event.data.ch, 10) });
});
// Context menu
if (window.navigator.userAgent.indexOf("Electron") !== -1) {
    var remote = top.global.require("remote");
    var win = remote.getCurrentWindow();
    var Menu = remote.require("menu");
    var MenuItem = remote.require("menu-item");
    var menu = new Menu();
    menu.append(new MenuItem({ label: "Cut (Ctrl+X)", click: function () { document.execCommand("cut"); } }));
    menu.append(new MenuItem({ label: "Copy (Ctrl+C)", click: function () { document.execCommand("copy"); } }));
    menu.append(new MenuItem({ label: "Paste (Ctrl+V)", click: function () { document.execCommand("paste"); } }));
    document.querySelector(".text-editor-container").addEventListener("contextmenu", function (event) {
        event.preventDefault();
        var bounds = win.getBounds();
        menu.popup(win, event.screenX - bounds.x, event.screenY - bounds.y);
        return false;
    });
}
// Setup editor
function setupEditor(clientId) {
    var textArea = document.querySelector(".text-editor");
    ui.editor = new TextEditorWidget(network_1.data.projectClient, clientId, textArea, {
        mode: "text/typescript",
        extraKeys: {
            "Ctrl-Space": function () {
                scheduleParameterHint();
                scheduleCompletion();
            },
            "Cmd-Space": function () {
                scheduleParameterHint();
                scheduleCompletion();
            },
            "Shift-Ctrl-F": function () { onGlobalSearch(); },
            "Shift-Cmd-F": function () { onGlobalSearch(); },
            "F8": function () {
                var cursor = ui.editor.codeMirrorInstance.getDoc().getCursor();
                var token = ui.editor.codeMirrorInstance.getTokenAt(cursor);
                if (token.string === ".")
                    token.start = token.end;
                var start = 0;
                for (var i = 0; i < cursor.line; i++)
                    start += ui.editor.codeMirrorInstance.getDoc().getLine(i).length + 1;
                start += cursor.ch;
                network_1.data.typescriptWorker.postMessage({
                    type: "getDefinitionAt",
                    name: network_1.data.fileNamesByScriptId[SupClient.query.asset],
                    start: start
                });
            }
        },
        editCallback: onEditText,
        sendOperationCallback: onSendOperation,
        saveCallback: onSaveText
    });
    ui.previousLine = -1;
    ui.editor.codeMirrorInstance.on("keyup", function (instance, event) {
        clearInfoPopup();
        // "("" character triggers the parameter hint
        if (event.keyCode === 53 ||
            (ui.parameterElement.parentElement != null && event.keyCode !== 27 && event.keyCode !== 38 && event.keyCode !== 40))
            scheduleParameterHint();
        // Ignore Ctrl, Cmd, Escape, Return, Tab, arrow keys, F8
        if (event.ctrlKey || event.metaKey || [27, 9, 13, 37, 38, 39, 40, 119, 16].indexOf(event.keyCode) !== -1)
            return;
        // If the completion popup is active, the hint() method will automatically
        // call for more autocomplete, so we don't need to do anything here.
        if (ui.editor.codeMirrorInstance.state.completionActive != null && ui.editor.codeMirrorInstance.state.completionActive.active())
            return;
        scheduleCompletion();
    });
    ui.editor.codeMirrorInstance.on("cursorActivity", function () {
        var currentLine = ui.editor.codeMirrorInstance.getDoc().getCursor().line;
        if (Math.abs(currentLine - ui.previousLine) >= 1)
            clearParameterPopup();
        else if (ui.parameterElement.parentElement != null)
            scheduleParameterHint();
        ui.previousLine = currentLine;
    });
    ui.editor.codeMirrorInstance.on("endCompletion", function () {
        ui.completionOpened = false;
        if (ui.parameterElement.parentElement != null)
            ui.editor.codeMirrorInstance.addKeyMap(parameterPopupKeyMap);
    });
}
exports.setupEditor = setupEditor;
var localVersionNumber = 0;
function onEditText(text, origin) {
    var localFileName = network_1.data.fileNamesByScriptId[SupClient.query.asset];
    var localFile = network_1.data.files[localFileName];
    localFile.text = text;
    localVersionNumber++;
    localFile.version = "l" + localVersionNumber;
    // We ignore the initial setValue
    if (origin !== "setValue") {
        network_1.data.typescriptWorker.postMessage({ type: "updateFile", fileName: localFileName, text: localFile.text, version: localFile.version });
        network_1.scheduleErrorCheck();
    }
}
function onSendOperation(operation) {
    network_1.socket.emit("edit:assets", SupClient.query.asset, "editText", operation, network_1.data.asset.document.getRevisionId(), function (err) {
        if (err != null) {
            alert(err);
            SupClient.onDisconnected();
        }
    });
}
// Error pane
ui.errorPane = document.querySelector(".error-pane");
ui.errorPaneStatus = ui.errorPane.querySelector(".status");
ui.errorPaneInfo = ui.errorPaneStatus.querySelector(".info");
ui.errorsTBody = ui.errorPane.querySelector(".errors tbody");
ui.errorsTBody.addEventListener("click", onErrorTBodyClick);
var errorPaneResizeHandle = new PerfectResize(ui.errorPane, "bottom");
errorPaneResizeHandle.on("drag", function () { ui.editor.codeMirrorInstance.refresh(); });
var errorPaneToggleButton = ui.errorPane.querySelector("button.toggle");
ui.errorPaneStatus.addEventListener("click", function (event) {
    if (event.target.tagName === "BUTTON" && event.target.parentElement.className === "draft")
        return;
    var collapsed = ui.errorPane.classList.toggle("collapsed");
    errorPaneToggleButton.textContent = collapsed ? "+" : "–";
    errorPaneResizeHandle.handleElt.classList.toggle("disabled", collapsed);
    ui.editor.codeMirrorInstance.refresh();
});
function refreshErrors(errors) {
    // Remove all previous erros
    for (var _i = 0, _a = ui.editor.codeMirrorInstance.getDoc().getAllMarks(); _i < _a.length; _i++) {
        var textMarker = _a[_i];
        if (textMarker.className !== "line-error")
            continue;
        textMarker.clear();
    }
    ui.editor.codeMirrorInstance.clearGutter("line-error-gutter");
    ui.errorsTBody.innerHTML = "";
    if (errors.length === 0) {
        ui.errorPaneInfo.textContent = "No errors";
        ui.errorPaneStatus.classList.remove("has-errors");
        return;
    }
    ui.errorPaneStatus.classList.add("has-errors");
    var selfErrorsCount = 0;
    var lastSelfErrorRow = null;
    // Display new ones
    for (var _b = 0; _b < errors.length; _b++) {
        var error = errors[_b];
        var errorRow = document.createElement("tr");
        errorRow.dataset["line"] = error.position.line.toString();
        errorRow.dataset["character"] = error.position.character.toString();
        var positionCell = document.createElement("td");
        positionCell.textContent = (error.position.line + 1).toString();
        errorRow.appendChild(positionCell);
        var messageCell = document.createElement("td");
        messageCell.textContent = error.message;
        errorRow.appendChild(messageCell);
        var scriptCell = document.createElement("td");
        errorRow.appendChild(scriptCell);
        if (error.file !== "") {
            errorRow.dataset["assetId"] = network_1.data.files[error.file].id;
            scriptCell.textContent = error.file.substring(0, error.file.length - 3);
        }
        else
            scriptCell.textContent = "Internal";
        if (error.file !== network_1.data.fileNamesByScriptId[SupClient.query.asset]) {
            ui.errorsTBody.appendChild(errorRow);
            continue;
        }
        ui.errorsTBody.insertBefore(errorRow, (lastSelfErrorRow != null) ? lastSelfErrorRow.nextElementSibling : ui.errorsTBody.firstChild);
        lastSelfErrorRow = errorRow;
        selfErrorsCount++;
        var line = error.position.line;
        ui.editor.codeMirrorInstance.getDoc().markText({ line: line, ch: error.position.character }, { line: line, ch: error.position.character + error.length }, { className: "line-error" });
        var gutter = document.createElement("div");
        gutter.className = "line-error-gutter";
        gutter.innerHTML = "●";
        ui.editor.codeMirrorInstance.setGutterMarker(line, "line-error-gutter", gutter);
    }
    var otherErrorsCount = errors.length - selfErrorsCount;
    if (selfErrorsCount > 0) {
        if (otherErrorsCount === 0)
            ui.errorPaneInfo.textContent = selfErrorsCount + " error" + (selfErrorsCount > 1 ? "s" : "");
        else
            ui.errorPaneInfo.textContent = selfErrorsCount + " error" + (selfErrorsCount > 1 ? "s" : "") + " in this script, " + otherErrorsCount + " in other scripts";
    }
    else {
        ui.errorPaneInfo.textContent = errors.length + " error" + (errors.length > 1 ? "s" : "") + " in other scripts";
    }
}
exports.refreshErrors = refreshErrors;
function onErrorTBodyClick(event) {
    var target = event.target;
    while (true) {
        if (target.tagName === "TBODY")
            return;
        if (target.tagName === "TR")
            break;
        target = target.parentElement;
    }
    var assetId = target.dataset["assetId"];
    if (assetId == null)
        return;
    var line = target.dataset["line"];
    var character = target.dataset["character"];
    if (assetId === SupClient.query.asset) {
        ui.editor.codeMirrorInstance.getDoc().setCursor({ line: parseInt(line, 10), ch: parseInt(character, 10) });
        ui.editor.codeMirrorInstance.focus();
    }
    else {
        var origin = window.location.origin;
        if (window.parent != null)
            window.parent.postMessage({ type: "openEntry", id: assetId, options: { line: line, ch: character } }, origin);
    }
}
// Save button
var saveButton = ui.errorPane.querySelector(".draft button");
saveButton.addEventListener("click", function (event) {
    event.preventDefault();
    onSaveText();
});
function onSaveText() {
    network_1.socket.emit("edit:assets", SupClient.query.asset, "saveText", function (err) { if (err != null) {
        alert(err);
        SupClient.onDisconnected();
    } });
}
// Info popup
ui.infoElement = document.createElement("div");
ui.infoElement.classList.add("popup-info");
document.addEventListener("mouseout", function (event) { clearInfoPopup(); });
var previousMousePosition = { x: -1, y: -1 };
document.addEventListener("mousemove", function (event) {
    if (ui.editor == null)
        return;
    // On some systems, Chrome (at least v43) generates
    // spurious "mousemove" events every second or so.
    if (event.clientX === previousMousePosition.x && event.clientY === previousMousePosition.y)
        return;
    previousMousePosition.x = event.clientX;
    previousMousePosition.y = event.clientY;
    clearInfoPopup();
    ui.infoTimeout = window.setTimeout(function () {
        ui.infoPosition = ui.editor.codeMirrorInstance.coordsChar({ left: event.clientX, top: event.clientY });
        if (ui.infoPosition.outside)
            return;
        var start = 0;
        for (var i = 0; i < ui.infoPosition.line; i++)
            start += ui.editor.codeMirrorInstance.getDoc().getLine(i).length + 1;
        start += ui.infoPosition.ch;
        ui.infoTimeout = null;
        network_1.data.typescriptWorker.postMessage({
            type: "getQuickInfoAt",
            name: network_1.data.fileNamesByScriptId[SupClient.query.asset],
            start: start
        });
    }, 200);
});
function clearInfoPopup() {
    if (ui.infoElement.parentElement != null)
        ui.infoElement.parentElement.removeChild(ui.infoElement);
    if (ui.infoTimeout != null)
        clearTimeout(ui.infoTimeout);
}
// Parameter hint popup
ui.parameterElement = document.querySelector(".popup-parameter");
ui.parameterElement.parentElement.removeChild(ui.parameterElement);
ui.parameterElement.style.display = "";
var parameterPopupKeyMap = {
    "Esc": function () { clearParameterPopup(); },
    "Up": function () { updateParameterHint(ui.selectedSignatureIndex - 1); },
    "Down": function () { updateParameterHint(ui.selectedSignatureIndex + 1); },
    "Enter": function () {
        var selectedSignature = ui.signatureTexts[ui.selectedSignatureIndex];
        if (selectedSignature.parameters.length === 0)
            return;
        var cursorPosition = ui.editor.codeMirrorInstance.getDoc().getCursor();
        var text = "";
        for (var parameterIndex = 0; parameterIndex < selectedSignature.parameters.length; parameterIndex++) {
            if (parameterIndex !== 0)
                text += ", ";
            text += selectedSignature.parameters[parameterIndex];
        }
        ui.editor.codeMirrorInstance.getDoc().replaceRange(text, cursorPosition, null);
        var endSelection = { line: cursorPosition.line, ch: cursorPosition.ch + selectedSignature.parameters[0].length };
        ui.editor.codeMirrorInstance.getDoc().setSelection(cursorPosition, endSelection);
    },
    "Tab": function () {
        var selectedSignature = ui.signatureTexts[ui.selectedSignatureIndex];
        if (selectedSignature.parameters.length === 0)
            return;
        if (ui.selectedArgumentIndex === selectedSignature.parameters.length - 1)
            return;
        var cursorPosition = ui.editor.codeMirrorInstance.getDoc().getCursor();
        cursorPosition.ch += 2;
        var endSelection = { line: cursorPosition.line, ch: cursorPosition.ch + selectedSignature.parameters[ui.selectedArgumentIndex + 1].length };
        ui.editor.codeMirrorInstance.getDoc().setSelection(cursorPosition, endSelection);
    }
};
function showParameterPopup(texts, selectedItemIndex, selectedArgumentIndex) {
    ui.signatureTexts = texts;
    ui.selectedArgumentIndex = selectedArgumentIndex;
    updateParameterHint(selectedItemIndex);
    var position = ui.editor.codeMirrorInstance.getDoc().getCursor();
    var coordinates = ui.editor.codeMirrorInstance.cursorCoords(position, "page");
    ui.parameterElement.style.top = Math.round(coordinates.top - 30) + "px";
    ui.parameterElement.style.left = coordinates.left + "px";
    document.body.appendChild(ui.parameterElement);
    if (!ui.completionOpened)
        ui.editor.codeMirrorInstance.addKeyMap(parameterPopupKeyMap);
}
exports.showParameterPopup = showParameterPopup;
function updateParameterHint(index) {
    if (index < 0)
        index = ui.signatureTexts.length - 1;
    else if (index >= ui.signatureTexts.length)
        index = 0;
    ui.selectedSignatureIndex = index;
    ui.parameterElement.querySelector(".item").textContent = "(" + (index + 1) + "/" + ui.signatureTexts.length + ")";
    var text = ui.signatureTexts[index];
    var prefix = text.prefix;
    var parameter = "";
    var suffix = "";
    for (var parameterIndex = 0; parameterIndex < text.parameters.length; parameterIndex++) {
        var parameterItem = text.parameters[parameterIndex];
        if (parameterIndex < ui.selectedArgumentIndex) {
            if (parameterIndex !== 0)
                prefix += ", ";
            prefix += parameterItem;
        }
        else if (parameterIndex === ui.selectedArgumentIndex) {
            if (parameterIndex !== 0)
                prefix += ", ";
            parameter = parameterItem;
        }
        else {
            if (parameterIndex !== 0)
                suffix += ", ";
            suffix += parameterItem;
        }
    }
    ui.parameterElement.querySelector(".prefix").textContent = prefix;
    ui.parameterElement.querySelector(".parameter").textContent = parameter;
    suffix += text.suffix;
    ui.parameterElement.querySelector(".suffix").textContent = suffix;
}
function clearParameterPopup() {
    if (ui.parameterElement.parentElement != null)
        ui.parameterElement.parentElement.removeChild(ui.parameterElement);
    ui.editor.codeMirrorInstance.removeKeyMap(parameterPopupKeyMap);
}
exports.clearParameterPopup = clearParameterPopup;
function scheduleParameterHint() {
    if (ui.parameterTimeout != null)
        clearTimeout(ui.parameterTimeout);
    ui.parameterTimeout = window.setTimeout(function () {
        var cursor = ui.editor.codeMirrorInstance.getDoc().getCursor();
        var token = ui.editor.codeMirrorInstance.getTokenAt(cursor);
        if (token.string === ".")
            token.start = token.end;
        var start = 0;
        for (var i = 0; i < cursor.line; i++)
            start += ui.editor.codeMirrorInstance.getDoc().getLine(i).length + 1;
        start += cursor.ch;
        network_1.data.typescriptWorker.postMessage({
            type: "getParameterHintAt",
            name: network_1.data.fileNamesByScriptId[SupClient.query.asset],
            start: start
        });
        ui.parameterTimeout = null;
    }, 100);
}
function hint(instance, callback) {
    var cursor = ui.editor.codeMirrorInstance.getDoc().getCursor();
    var token = ui.editor.codeMirrorInstance.getTokenAt(cursor);
    if (token.string === ".")
        token.start = token.end;
    var start = 0;
    for (var i = 0; i < cursor.line; i++)
        start += ui.editor.codeMirrorInstance.getDoc().getLine(i).length + 1;
    start += cursor.ch;
    network_1.setNextCompletion({ callback: callback, cursor: cursor, token: token, start: start });
}
hint.async = true;
var hintCustomKeys = {
    "Up": function (cm, commands) { commands.moveFocus(-1); },
    "Down": function (cm, commands) { commands.moveFocus(1); },
    "Enter": function (cm, commands) { commands.pick(); },
    "Tab": function (cm, commands) { commands.pick(); },
    "Esc": function (cm, commands) { commands.close(); },
};
function scheduleCompletion() {
    if (ui.completionTimeout != null)
        clearTimeout(ui.completionTimeout);
    ui.completionTimeout = window.setTimeout(function () {
        ui.completionOpened = true;
        if (ui.parameterElement.parentElement != null)
            ui.editor.codeMirrorInstance.removeKeyMap(parameterPopupKeyMap);
        ui.editor.codeMirrorInstance.showHint({ completeSingle: false, customKeys: hintCustomKeys, hint: hint });
        ui.completionTimeout = null;
    }, 100);
}
// Global search
function onGlobalSearch() {
    if (window.parent == null) {
        // TODO: Find a way to make it work? or display a message saying that you can't?
        return;
    }
    var options = {
        placeholder: "Find in project",
        initialValue: ui.editor.codeMirrorInstance.getDoc().getSelection(),
        validationLabel: "Search"
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Search in all TypeScript scripts.", options, function (text) {
        /* tslint:enable:no-unused-expression */
        if (text == null) {
            ui.editor.codeMirrorInstance.focus();
            return;
        }
        window.parent.postMessage({ type: "openTool", name: "search", options: { text: text } }, window.location.origin);
    });
}
