/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../typings/github-electron/github-electron-main.d.ts" />
var app = require("app");
var BrowserWindow = require("browser-window");
var ipc = require("ipc");
var dialog = require("dialog");
var _ = require("lodash");
var async = require("async");
var fs = require("fs");
var path = require("path");
var http = require("http");
var mkdirp = require("mkdirp");
var appApiVersion = JSON.parse(fs.readFileSync(__dirname + "/../package.json", { encoding: "utf8" })).superpowers.appApiVersion;
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow;
app.on("window-all-closed", function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin")
        app.quit();
});
app.on("ready", function () {
    mainWindow = new BrowserWindow({
        title: "Superpowers", icon: __dirname + "/public/images/icon.png",
        width: 800, height: 480,
        frame: false, resizable: false
    });
    mainWindow.setMenuBarVisibility(false);
    mainWindow.loadUrl("file://" + __dirname + "/public/index.html");
    mainWindow.on("closed", function () { mainWindow = null; });
});
var openServersById = {};
ipc.on("new-server-window", function (event, address) {
    var openServer = {
        window: new BrowserWindow({
            title: "Superpowers", icon: __dirname + "/public/images/icon.png",
            width: 1000, height: 600,
            "min-width": 800, "min-height": 480,
            frame: false
        }),
        address: address,
        closed: false
    };
    openServer.window.setMenuBarVisibility(false);
    openServersById[openServer.window.id] = openServer;
    openServer.window.on("close", function () {
        openServer.closed = true;
        openServer.window.webContents.removeAllListeners();
        delete openServersById[openServer.window.id];
    });
    var status = "Connecting to " + openServer.address + "...";
    openServer.window.loadUrl("file://" + __dirname + "/public/connectionStatus.html?status=" + encodeURIComponent(status) + "&address=" + encodeURIComponent(openServer.address));
    openServer.window.webContents.addListener("did-finish-load", onServerWindowLoaded);
    function onServerWindowLoaded(event) {
        openServer.window.webContents.removeListener("did-finish-load", onServerWindowLoaded);
        connect(openServersById[openServer.window.id]);
    }
});
function connect(openServer) {
    http.get("http://" + openServer.address + "/superpowers.json", function (res) {
        var content = "";
        res.on("data", function (chunk) {
            content += chunk;
        });
        res.on("end", function () {
            var serverInfo = null;
            if (res.statusCode === 200) {
                try {
                    serverInfo = JSON.parse(content);
                }
                catch (err) { }
            }
            if (serverInfo == null) {
                showError("The server at " + openServer.address + " doesn't seem to be running Superpowers.");
                return;
            }
            if (serverInfo.appApiVersion !== appApiVersion) {
                showError(("The server at " + openServer.address + " runs an incompatible version of Superpowers ") +
                    ("(got app API version " + serverInfo.appApiVersion + ", expected " + appApiVersion + ")."));
                return;
            }
            openServer.window.loadUrl("http://" + openServer.address);
            openServer.window.webContents.addListener("did-finish-load", onServerLoaded);
            openServer.window.webContents.addListener("did-fail-load", onServerFailed);
        });
    })
        .on("error", function (err) {
        showError("Could not connect to " + openServer.address + " (" + err.message + ").");
        // TODO: Add help link!
    });
    function onServerLoaded(event) {
        openServer.window.webContents.removeListener("did-finish-load", onServerLoaded);
        openServer.window.webContents.removeListener("did-fail-load", onServerFailed);
    }
    function onServerFailed(event) {
        openServer.window.webContents.removeListener("did-finish-load", onServerLoaded);
        openServer.window.webContents.removeListener("did-fail-load", onServerFailed);
        showError("Could not connect to " + openServer.address + ".");
        // TODO: Add help link!
    }
    function showError(error) {
        // NOTE: As of Electron v0.35.1, if we don't wrap the call to loadUrl
        // in a callback, the app closes unexpectedly most of the time.
        setTimeout(function () {
            if (openServer.closed)
                return;
            openServer.window.loadUrl("file://" + __dirname + "/public/connectionStatus.html?status=" + encodeURIComponent(error) + "&address=" + encodeURIComponent(openServer.address) + "&reload=true");
        }, 0);
    }
}
var standaloneWindowsById = {};
ipc.on("new-standalone-window", function (event, address) {
    var standaloneWindow = new BrowserWindow({
        title: "Superpowers", icon: __dirname + "/public/images/icon.png",
        width: 1000, height: 600,
        "min-width": 800, "min-height": 480,
        "auto-hide-menu-bar": true
    });
    standaloneWindowsById[standaloneWindow.id] = standaloneWindow;
    standaloneWindow.on("closed", function () { delete standaloneWindowsById[standaloneWindow.id]; });
    standaloneWindow.loadUrl(address);
});
ipc.on("reconnect", function (event, id) { connect(openServersById[id]); });
ipc.on("choose-export-folder", function (event) {
    dialog.showOpenDialog({ properties: ["openDirectory"] }, function (directory) {
        if (directory == null)
            return;
        var outputFolder = directory[0];
        var isFolderEmpty = false;
        try {
            isFolderEmpty = fs.readdirSync(outputFolder).length === 0;
        }
        catch (e) {
            event.sender.send("export-folder-failed", "Error while checking if folder was empty: " + e.message);
            return;
        }
        if (!isFolderEmpty) {
            event.sender.send("export-folder-failed", "Output folder must be empty.");
            return;
        }
        event.sender.send("export-folder-success", outputFolder);
    });
});
ipc.on("export", function (event, data) {
    var exportWindow = new BrowserWindow({
        title: "Superpowers", icon: __dirname + "/public/images/icon.png",
        width: 1000, height: 600,
        "min-width": 800, "min-height": 480,
        "node-integration": true
    });
    exportWindow.setMenuBarVisibility(false);
    exportWindow.loadUrl(data.address + ":" + data.mainPort + "/build.html");
    var doExport = function () {
        exportWindow.webContents.removeListener("did-finish-load", doExport);
        exportWindow.webContents.send("setText", { title: "Superpowers — Exporting...", text: "Exporting..." });
        exportWindow.setProgressBar(0);
        var progress = 0;
        var progressMax = data.files.length;
        var buildPath = "/builds/" + data.projectId + "/" + data.buildId;
        var systemsPath = "/systems/";
        async.eachLimit(data.files, 10, function (file, cb) {
            var outputFilename = file;
            if (_.startsWith(outputFilename, buildPath)) {
                // Project build files are served on the build port
                outputFilename = outputFilename.substr(buildPath.length);
                file = data.address + ":" + data.buildPort + file;
            }
            else {
                // Other files are served on the main port
                file = data.address + ":" + data.mainPort + file;
                if (_.startsWith(outputFilename, systemsPath)) {
                    // Output system files at the root
                    outputFilename = outputFilename.substr(outputFilename.indexOf("/", systemsPath.length));
                }
            }
            outputFilename = outputFilename.replace(/\//g, path.sep);
            var outputPath = "" + data.outputFolder + outputFilename;
            exportWindow.webContents.send("setText", { text: outputPath });
            http.get(file, function (response) {
                mkdirp(path.dirname(outputPath), function (err) {
                    var localFile = fs.createWriteStream(outputPath);
                    localFile.on("finish", function () {
                        progress++;
                        exportWindow.setProgressBar(progress / progressMax);
                        cb(null);
                    });
                    response.pipe(localFile);
                });
            }).on("error", cb);
        }, function (err) {
            exportWindow.setProgressBar(-1);
            if (err != null) {
                alert(err);
                return;
            }
            exportWindow.webContents.send("setText", { title: "Superpowers — Exported", text: "Exported to ", showItemInFolder: { text: data.outputFolder, target: data.outputFolder } });
        });
    };
    exportWindow.webContents.addListener("did-finish-load", doExport);
});
