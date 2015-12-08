var async = require("async");
var marked = require("marked");
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
            SupClient.activePluginPath = "/systems/" + SupCore.system.name + "/plugins/" + pluginName;
            var documentationScript = document.createElement("script");
            documentationScript.src = SupClient.activePluginPath + "/documentation.js";
            documentationScript.addEventListener("load", function () { pluginCallback(); });
            documentationScript.addEventListener("error", function () { pluginCallback(); });
            document.body.appendChild(documentationScript);
        }, function (err) { setupDocs(); });
    });
}
function setupDocs() {
    var navListElt = document.querySelector("nav ul");
    var mainElt = document.querySelector("main");
    var sortedNames = Object.keys(SupClient.plugins["documentation"]);
    sortedNames.sort(function (a, b) { return (a.toLowerCase() < b.toLowerCase()) ? -1 : 1; });
    var language = window.navigator.language;
    var separatorIndex = language.indexOf("-");
    if (separatorIndex !== -1)
        language = language.slice(0, separatorIndex);
    sortedNames.forEach(function (name) {
        var liElt = document.createElement("li");
        var anchorElt = document.createElement("a");
        anchorElt.dataset["name"] = name;
        anchorElt.href = "#" + name;
        liElt.appendChild(anchorElt);
        navListElt.appendChild(liElt);
        var articleElt = document.createElement("article");
        articleElt.id = "documentation-" + name;
        mainElt.appendChild(articleElt);
        function onDocumentationLoaded(content) {
            articleElt.innerHTML = marked(content);
            anchorElt.textContent = articleElt.firstElementChild.textContent;
            var linkElts = articleElt.querySelectorAll("a");
            if (SupClient.isApp) {
                var shell = top.global.require("remote").require("shell");
                for (var i = 0; i < linkElts.length; i++) {
                    linkElts[i].addEventListener("click", function (event) {
                        event.preventDefault();
                        shell.openExternal(event.target.href);
                    });
                }
            }
            else {
                for (var i = 0; i < linkElts.length; i++)
                    linkElts[i].target = "_blank";
            }
        }
        window.fetch(SupClient.plugins["documentation"][name].path + "/documentation/" + name + "." + language + ".md")
            .then(function (response) {
            if (response.status === 404) {
                window.fetch(SupClient.plugins["documentation"][name].path + "/documentation/" + name + ".en.md")
                    .then(function (response) { return response.text(); }).then(onDocumentationLoaded);
                return;
            }
            return response.text().then(onDocumentationLoaded);
        });
    });
    navListElt.addEventListener("click", function (event) {
        if (event.target.tagName !== "A")
            return;
        navListElt.querySelector("li a.active").classList.remove("active");
        mainElt.querySelector("article.active").classList.remove("active");
        event.target.classList.add("active");
        document.getElementById("documentation-" + event.target.dataset["name"]).classList.add("active");
    });
    navListElt.querySelector("li a").classList.add("active");
    mainElt.querySelector("article").classList.add("active");
}
