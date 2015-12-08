(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var data = {};
var ui = {};
var socket = null;
function start() {
    socket = SupClient.connect(SupClient.query.project);
    socket.on("connect", onConnected);
    socket.on("disconnect", SupClient.onDisconnected);
    SupClient.setupHotkeys();
    // Main
    ui.audioElt = document.querySelector("audio");
    // Upload
    var fileSelect = document.querySelector("input.file-select");
    fileSelect.addEventListener("change", onFileSelectChange);
    document.querySelector("button.upload").addEventListener("click", function () { fileSelect.click(); });
    document.querySelector("button.download").addEventListener("click", onDownloadSound);
    // Sidebar
    ui.streamingSelect = document.querySelector(".property-streaming");
    ui.streamingSelect.addEventListener("change", function (event) {
        socket.emit("edit:assets", SupClient.query.asset, "setProperty", "streaming", ui.streamingSelect.value === "true", function (err) {
            if (err != null) {
                alert(err);
                return;
            }
        });
    });
}
// Network callbacks
var onAssetCommands = {};
function onConnected() {
    data.projectClient = new SupClient.ProjectClient(socket);
    var soundSubscriber = {
        onAssetReceived: onAssetReceived,
        onAssetEdited: onAssetEdited,
        onAssetTrashed: SupClient.onAssetTrashed
    };
    data.projectClient.subAsset(SupClient.query.asset, "sound", soundSubscriber);
}
function onAssetReceived(err, asset) {
    data.asset = asset;
    setupSound();
    setupProperty("streaming", data.asset.pub.streaming);
}
function onAssetEdited(id, command) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (onAssetCommands[command] != null)
        onAssetCommands[command].apply(data.asset, args);
}
// User interface
var objectURL;
function onFileSelectChange(event) {
    if (event.target.files.length === 0)
        return;
    var reader = new FileReader();
    reader.onload = function (event) {
        socket.emit("edit:assets", SupClient.query.asset, "upload", reader.result, function (err) {
            if (err != null) {
                alert(err);
                return;
            }
        });
    };
    reader.readAsArrayBuffer(event.target.files[0]);
    event.target.parentElement.reset();
}
function onDownloadSound() {
    var options = {
        initialValue: "Sound.wav",
        validationLabel: "OK"
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter the name of the sound", options, function (name) {
        /* tslint:enable:no-unused-expression */
        if (name == null)
            return;
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style.display = "none";
        a.href = objectURL;
        // Not yet supported in IE and Safari (http://caniuse.com/#feat=download)
        a.download = name;
        a.click();
        document.body.removeChild(a);
    });
}
function setupSound() {
    if (objectURL != null)
        URL.revokeObjectURL(objectURL);
    var typedArray = new Uint8Array(data.asset.pub.sound);
    var blob = new Blob([typedArray], { type: "audio" });
    objectURL = URL.createObjectURL(blob);
    ui.audioElt.src = objectURL;
}
function setupProperty(path, value) {
    switch (path) {
        case "streaming":
            ui.streamingSelect.value = value;
            break;
    }
}
onAssetCommands.upload = setupSound;
onAssetCommands.setProperty = setupProperty;
// Start
start();

},{}]},{},[1]);
