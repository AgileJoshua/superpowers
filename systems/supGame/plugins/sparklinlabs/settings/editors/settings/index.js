var async = require("async");
var data;
var socket = SupClient.connect(SupClient.query.project);
socket.on("welcome", onWelcome);
socket.on("disconnect", SupClient.onDisconnected);
SupClient.setupHotkeys();
function onWelcome() {
    data = { projectClient: new SupClient.ProjectClient(socket), };
    loadPlugins();
}
function loadPlugins() {
    window.fetch("/systems/" + SupCore.system.name + "/plugins.json")
        .then(function (response) { return response.json(); })
        .then(function (pluginsInfo) {
        async.eachSeries(pluginsInfo.list, function (pluginName, pluginCallback) {
            async.series([
                function (cb) {
                    var dataScript = document.createElement("script");
                    dataScript.src = "/systems/" + SupCore.system.name + "/plugins/" + pluginName + "/data.js";
                    dataScript.addEventListener("load", function () { cb(null, null); });
                    dataScript.addEventListener("error", function () { cb(null, null); });
                    document.body.appendChild(dataScript);
                },
                function (cb) {
                    SupClient.activePluginPath = "/systems/" + SupCore.system.name + "/plugins/" + pluginName;
                    var settingsEditorScript = document.createElement("script");
                    settingsEditorScript.src = SupClient.activePluginPath + "/settingsEditors.js";
                    settingsEditorScript.addEventListener("load", function () { cb(null, null); });
                    settingsEditorScript.addEventListener("error", function () { cb(null, null); });
                    document.body.appendChild(settingsEditorScript);
                },
            ], pluginCallback);
        }, function (err) { setupSettings(); });
    });
}
function setupSettings() {
    var mainElt = document.querySelector("main");
    var sortedNames = Object.keys(SupClient.plugins["settingsEditors"]);
    sortedNames.sort(function (a, b) { return (a.toLowerCase() < b.toLowerCase()) ? -1 : 1; });
    var createSection = function (namespace) {
        var sectionHeaderElt = document.createElement("header");
        sectionHeaderElt.textContent = namespace;
        mainElt.appendChild(sectionHeaderElt);
        var sectionRootElt = document.createElement("div");
        sectionRootElt.classList.add("namespace-" + namespace);
        mainElt.appendChild(sectionRootElt);
        return sectionRootElt;
    };
    // Create general section first so we are sure it is displayed above
    createSection("General");
    for (var _i = 0; _i < sortedNames.length; _i++) {
        var name_1 = sortedNames[_i];
        var namespace = SupClient.plugins["settingsEditors"][name_1].content.namespace;
        var sectionRootElt = mainElt.querySelector("div.namespace-" + namespace);
        if (sectionRootElt == null)
            sectionRootElt = createSection(namespace);
        var liElt = document.createElement("li");
        var anchorElt = document.createElement("a");
        anchorElt.id = "link-" + name_1;
        anchorElt.href = "#" + name_1;
        anchorElt.textContent = name_1;
        liElt.appendChild(anchorElt);
        var sectionElt = document.createElement("section");
        sectionElt.id = "settings-" + name_1;
        sectionRootElt.appendChild(sectionElt);
        var headerElt = document.createElement("header");
        var sectionAnchorElt = document.createElement("a");
        sectionAnchorElt.name = name_1;
        sectionAnchorElt.textContent = name_1;
        headerElt.appendChild(sectionAnchorElt);
        sectionElt.appendChild(headerElt);
        var divElt = document.createElement("div");
        sectionElt.appendChild(divElt);
        var settingEditorClass = SupClient.plugins["settingsEditors"][name_1].content.editor;
        /* tslint:disable:no-unused-expression */
        new settingEditorClass(divElt, data.projectClient);
    }
}
