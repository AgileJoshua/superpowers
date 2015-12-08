var TextRenderer_1 = require("../../components/TextRenderer");
var TextRendererUpdater_1 = require("../../components/TextRendererUpdater");
var data;
var ui = {};
var socket;
function start() {
    socket = SupClient.connect(SupClient.query.project);
    socket.on("connect", onConnected);
    socket.on("disconnect", SupClient.onDisconnected);
    SupClient.setupHotkeys();
    ui.gameInstance = new SupEngine.GameInstance(document.querySelector("canvas"));
    ui.gameInstance.threeRenderer.setClearColor(0xbbbbbb);
    ui.gameInstance.update();
    ui.gameInstance.draw();
    var cameraActor = new SupEngine.Actor(ui.gameInstance, "Camera");
    cameraActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, 1));
    var cameraComponent = new SupEngine.componentClasses["Camera"](cameraActor);
    cameraComponent.setOrthographicMode(true);
    cameraComponent.setOrthographicScale(5);
    new SupEngine.editorComponentClasses["Camera2DControls"](cameraActor, cameraComponent, {
        zoomSpeed: 1.5,
        zoomMin: 1,
        zoomMax: 200
    });
    // Sidebar
    var fileSelect = document.querySelector("input.file-select");
    fileSelect.addEventListener("change", onFileSelectChange);
    document.querySelector("button.upload").addEventListener("click", function () { fileSelect.click(); });
    ui.allSettings = ["isBitmap", "filtering", "pixelsPerUnit", "size", "color", "gridWidth", "gridHeight", "charset", "charsetOffset"];
    ui.settings = {};
    ui.allSettings.forEach(function (setting) {
        var settingObj = ui.settings[setting] = document.querySelector(".property-" + setting);
        settingObj.dataset.name = setting;
        if (setting === "filtering" || setting === "color") {
            settingObj.addEventListener("change", function (event) {
                socket.emit("edit:assets", SupClient.query.asset, "setProperty", event.target.dataset.name, event.target.value, function (err) { if (err != null)
                    alert(err); });
            });
        }
        else if (setting === "charset") {
            settingObj.addEventListener("change", function (event) {
                var charset = (event.target.value !== "") ? event.target.value : null;
                socket.emit("edit:assets", SupClient.query.asset, "setProperty", event.target.dataset.name, charset, function (err) { if (err != null)
                    alert(err); });
            });
        }
        else if (setting === "isBitmap") {
            settingObj.addEventListener("click", function (event) {
                socket.emit("edit:assets", SupClient.query.asset, "setProperty", event.target.dataset.name, event.target.checked, function (err) { if (err != null)
                    alert(err); });
            });
        }
        else {
            settingObj.addEventListener("change", function (event) {
                socket.emit("edit:assets", SupClient.query.asset, "setProperty", event.target.dataset.name, parseInt(event.target.value), function (err) { if (err != null)
                    alert(err); });
            });
        }
    });
    ui.colorPicker = document.querySelector("input.color-picker");
    ui.colorPicker.addEventListener("change", function (event) {
        socket.emit("edit:assets", SupClient.query.asset, "setProperty", "color", event.target.value.slice(1), function (err) { if (err != null)
            alert(err); });
    });
    ui.vectorFontTBody = document.querySelector("tbody.vector-font");
    ui.bitmapFontTBody = document.querySelector("tbody.bitmap-font");
    requestAnimationFrame(draw);
}
// Network callbacks
var onEditCommands = {};
function onConnected() {
    data = {};
    data.projectClient = new SupClient.ProjectClient(socket);
    var textActor = new SupEngine.Actor(ui.gameInstance, "Text");
    var textRenderer = new TextRenderer_1.default(textActor);
    var config = { fontAssetId: SupClient.query.asset, text: "The quick brown fox jumps over the lazy dog", alignment: "center" };
    var receiveCallbacks = { font: onAssetReceived };
    var editCallbacks = { font: onEditCommands };
    data.textUpdater = new TextRendererUpdater_1.default(data.projectClient, textRenderer, config, receiveCallbacks, editCallbacks);
}
function onAssetReceived() {
    ui.allSettings.forEach(function (setting) {
        if (setting === "isBitmap") {
            ui.settings[setting].checked = data.textUpdater.fontAsset.pub.isBitmap;
            refreshFontMode();
        }
        else {
            ui.settings[setting].value = data.textUpdater.fontAsset.pub[setting];
        }
    });
    ui.colorPicker.value = "#" + data.textUpdater.fontAsset.pub.color;
    ui.settings["charsetOffset"].disabled = data.textUpdater.fontAsset.pub.isBitmap && data.textUpdater.fontAsset.pub.charset != null;
}
onEditCommands.setProperty = function (path, value) {
    if (path === "isBitmap") {
        ui.settings[path].checked = value;
        refreshFontMode();
    }
    else
        ui.settings[path].value = value;
    if (path === "color")
        ui.colorPicker.value = "#" + value;
    else if (path === "charset") {
        ui.settings["charsetOffset"].disabled = data.textUpdater.fontAsset.pub.isBitmap && data.textUpdater.fontAsset.pub.charset != null;
    }
};
function refreshFontMode() {
    document.querySelector(".sidebar .font-or-image th").textContent = data.textUpdater.fontAsset.pub.isBitmap ? "Texture" : "Font";
    if (data.textUpdater.fontAsset.pub.isBitmap) {
        ui.vectorFontTBody.hidden = true;
        ui.bitmapFontTBody.hidden = false;
    }
    else {
        ui.vectorFontTBody.hidden = false;
        ui.bitmapFontTBody.hidden = true;
    }
}
// User interface
function onFileSelectChange(event) {
    if (event.target.files.length === 0)
        return;
    var reader = new FileReader();
    reader.onload = function (event) {
        socket.emit("edit:assets", SupClient.query.asset, "upload", event.target.result, function (err) {
            if (err != null) {
                alert(err);
                return;
            }
        });
    };
    reader.readAsArrayBuffer(event.target.files[0]);
    event.target.parentElement.reset();
}
function draw() {
    requestAnimationFrame(draw);
    ui.gameInstance.update();
    ui.gameInstance.draw();
}
start();
