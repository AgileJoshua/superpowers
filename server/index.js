/// <reference path="index.d.ts" />
var path = require("path");
var fs = require("fs");
var http = require("http");
var express = require("express");
var cookieParser = require("cookie-parser");
var socketio = require("socket.io");
var paths = require("./paths");
var config_1 = require("./config");
var SupCore = require("../SupCore");
var loadSystems_1 = require("./loadSystems");
var ProjectHub_1 = require("./ProjectHub");
var debug = require('debug')('serverstart');
// Globals
global.SupCore = SupCore;
var _a = JSON.parse(fs.readFileSync(__dirname + "/../package.json", { encoding: "utf8" })), version = _a.version, appApiVersion = _a.superpowers.appApiVersion;
SupCore.log("Server v" + version + " starting...");
process.on("uncaughtException", function (err) {
    SupCore.log("The server crashed.\n" + err.stack);
    process.exit(1);
});
function handle404(err, req, res, next) {
    if (err.status === 404) {
        res.status(404).end("File not found");
        return;
    }
    next();
}
var hub = null;
// Public version
fs.writeFileSync(__dirname + "/../public/superpowers.json", JSON.stringify({ version: version, appApiVersion: appApiVersion }, null, 2));
// Main HTTP server
var mainApp = express();
mainApp.use(cookieParser());
function redirectIfNoAuth(req, res, next) {
    if (req.cookies["supServerAuth"] == null) {
        res.redirect("/login?redirect=" + encodeURIComponent(req.originalUrl));
        return;
    }
    next();
}
mainApp.get("/", function (req, res) { res.redirect("/hub"); });
mainApp.get("/hub", redirectIfNoAuth);
mainApp.get("/project", redirectIfNoAuth);
mainApp.use("/", express.static(__dirname + "/../public"));
mainApp.use("/projects/:projectId/*", function (req, res) {
    var projectPath = hub.serversById[req.params.projectId].projectPath;
    res.sendFile(req.params[0], { root: projectPath + "/public" }, function (err) {
        if (req.params[0] === "icon.png")
            res.sendFile("/images/default-project-icon.png", { root: __dirname + "/../public" });
    });
});




var mainHttpServer = http.createServer(mainApp);
mainHttpServer.on("error", function (err) {
    if (err.code === "EADDRINUSE") {
        SupCore.log("Could not start the server: another application is already listening on port " + config_1.default.mainPort + ".");
        process.exit();
    }
    else
        throw (err);
});

var io = socketio(mainHttpServer, { transports: ["websocket"] });
// Build HTTP server
//var buildApp = express();
function redirectToHub(req, res) {
    res.redirect("http://" + req.hostname + ":" + config_1.default.mainPort + "/hub/");
}
//buildApp.get("/", redirectToHub);
mainApp.get("/systems/:systemName/SupCore.js", function (req, res) {
    res.sendFile("SupCore.js", { root: __dirname + "/../public" });
});
//buildApp.use("/", express.static(__dirname + "/../public"));
mainApp.get("/builds/:projectId/:buildId/*", function (req, res) {
    var projectServer = hub.serversById[req.params.projectId];
    if (projectServer == null) {
        res.status(404).end("No such project");
        return;
    }
    res.sendFile(path.join(projectServer.buildsPath, req.params.buildId, req.params[0]));
});


var buildHttpServer;// = http.createServer(buildApp);
//var mainHttpServer;
var buildApp;
loadSystems_1.default(mainApp, buildApp, function () {
    mainApp.use(handle404);
    //buildApp.use(handle404);
    // Project hub
    hub = new ProjectHub_1.default(io, function(err) {
        if (err != null) {
            SupCore.log("Failed to start server:\n" + err.stack);
            return;
        }
        mainApp.set('port', process.env.PORT || 3000);
        SupCore.log("Loaded " + Object.keys(hub.serversById).length + " projects from " + paths.projects + ".");
        var hostname = (config_1.default.password.length === 0) ? "localhost" : "";
        mainHttpServer.listen(mainApp.get('port'), hostname, function() {
            //alternate hosting logic


            // mainHttpServer = mainApp.listen(mainApp.get('port'), function () {
            debug('Main Express server listening on port ' + mainHttpServer.address().port);

            //alternate hosting logic
            //      buildApp.set('port', process.env.PORT || 3000);

            //     var buildHttpServer = buildApp.listen(buildApp.get('port'), function () {
            //        debug('Build Express server listening on port ' + buildApp.address().port);
            //        if (hostname === "localhost")
            //            SupCore.log("NOTE: Setup a password to allow other people to connect to your server.");
            //    });
            /*
            buildHttpServer.listen(config_1.default.buildPort, hostname, function () {
                SupCore.log("Main server started on port " + config_1.default.mainPort + ", build server started on port " + config_1.default.buildPort + ".");
                if (hostname === "localhost")
                    SupCore.log("NOTE: Setup a password to allow other people to connect to your server.");
            });
             * */
        });
    });
});



// Save on exit and handle crashes
var isQuitting = false;
function onExit() {
    if (isQuitting)
        return;
    isQuitting = true;
    mainHttpServer.close();
    //buildHttpServer.close();
    SupCore.log("Saving all projects...");
    hub.saveAll(function (err) {
        if (err != null)
            SupCore.log("Error while exiting:\n" + err.stack);
        else
            SupCore.log("Exited cleanly.");
        process.exit();
    });
}
process.on("SIGINT", onExit);
process.on("message", function (msg) { if (msg === "stop")
    onExit(); });
