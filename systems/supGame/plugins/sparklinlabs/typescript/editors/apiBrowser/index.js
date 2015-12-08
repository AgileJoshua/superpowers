var async = require("async");
var highlight = require("highlight.js"); // import * as highlight from "highlight.js";
SupClient.setupHotkeys();
var searchElt = document.querySelector("input[type=search]");
var noSearchResultsElt = document.querySelector("main article");
var navListElt = document.querySelector("nav ul");
var mainElt = document.querySelector("main");
var preElts;
function findText(containerNode, offset) {
    var node = containerNode;
    var index = 0;
    while (node != null) {
        if (node.nodeType == Node.TEXT_NODE) {
            var length_1 = node.data.length;
            if (index + length_1 > offset)
                return { node: node, index: offset - index };
            else
                index += length_1;
        }
        if (node.hasChildNodes())
            node = node.firstChild;
        else if (node === containerNode)
            return null;
        else if (node.nextSibling != null)
            node = node.nextSibling;
        else {
            var ancestorNode = node;
            do {
                if (ancestorNode === containerNode)
                    return null;
                ancestorNode = ancestorNode.parentNode;
            } while (ancestorNode.nextSibling == null);
            node = ancestorNode.nextSibling;
        }
    }
}
var socket = SupClient.connect(SupClient.query.project);
socket.on("welcome", onWelcome);
function onWelcome(clientId, config) {
    window.fetch("/systems/" + config.systemName + "/plugins.json").then(function (response) { return response.json(); }).then(function (pluginsInfo) {
        async.each(pluginsInfo.list, function (pluginName, pluginCallback) {
            async.series([
                function (cb) {
                    var apiScript = document.createElement("script");
                    apiScript.src = "/systems/" + config.systemName + "/plugins/" + pluginName + "/api.js";
                    apiScript.addEventListener("load", function (event) { cb(null, null); });
                    apiScript.addEventListener("error", function (event) { cb(null, null); });
                    document.body.appendChild(apiScript);
                }
            ], pluginCallback);
        }, onAPILoaded);
    });
}
function onAPILoaded() {
    var allDefs = {};
    var actorComponentAccessors = [];
    for (var pluginName in SupCore.system.api.contexts["typescript"].plugins) {
        var plugin = SupCore.system.api.contexts["typescript"].plugins[pluginName];
        name = pluginName;
        if (name === "lib")
            name = "Built-ins";
        if (plugin.exposeActorComponent != null) {
            name = plugin.exposeActorComponent.className;
            actorComponentAccessors.push(plugin.exposeActorComponent.propertyName + ": " + plugin.exposeActorComponent.className + ";");
        }
        if (plugin.defs != null)
            allDefs[name] = plugin.defs;
    }
    allDefs["Sup.Actor"] = allDefs["Sup.Actor"].replace("// INSERT_COMPONENT_ACCESSORS", actorComponentAccessors.join("\n    "));
    var sortedDefNames = Object.keys(allDefs);
    sortedDefNames.sort(function (a, b) { return (a.toLowerCase() < b.toLowerCase()) ? -1 : 1; });
    sortedDefNames.unshift(sortedDefNames.splice(sortedDefNames.indexOf("Built-ins"), 1)[0]);
    preElts = [];
    for (var _i = 0; _i < sortedDefNames.length; _i++) {
        var name_1 = sortedDefNames[_i];
        var defs = allDefs[name_1];
        var liElt = document.createElement("li");
        navListElt.appendChild(liElt);
        var anchorElt = document.createElement("a");
        anchorElt.id = "link-" + name_1;
        anchorElt.href = "#" + name_1;
        liElt.appendChild(anchorElt);
        var nameElt = document.createElement("span");
        nameElt.className = "name";
        nameElt.textContent = name_1;
        anchorElt.appendChild(nameElt);
        var resultsElt = document.createElement("span");
        resultsElt.className = "results";
        anchorElt.appendChild(resultsElt);
        var articleElt = document.createElement("article");
        articleElt.id = "doc-" + name_1;
        mainElt.appendChild(articleElt);
        var preElt = document.createElement("pre");
        var content = highlight.highlight("typescript", defs, true).value;
        content = "<div>" + content.replace(/\n\n/g, "\n \n").replace(/\n/g, "</div><div>") + "</div>";
        preElt.innerHTML = content;
        articleElt.appendChild(preElt);
        preElts.push(preElt);
    }
    var results = [];
    var resultIndex = 0;
    document.addEventListener("keydown", function (event) {
        if (event.ctrlKey && event.keyCode === 70 /* F */) {
            searchElt.focus();
            searchElt.select();
            event.preventDefault();
        }
    });
    searchElt.addEventListener("input", function (event) {
        results = null;
        // Clear result badges
        for (var _i = 0; _i < sortedDefNames.length; _i++) {
            var defName = sortedDefNames[_i];
            document.getElementById("link-" + defName).firstChild.nextSibling.textContent = "";
        }
    });
    searchElt.form.addEventListener("submit", function (event) {
        event.preventDefault();
        var needle = searchElt.value.toLowerCase();
        if (needle.length < 3)
            return;
        var resultsByDefName = {};
        if (results == null) {
            results = [];
            resultIndex = 0;
            var i = 0;
            for (var i_1 = 0; i_1 < sortedDefNames.length; i_1++) {
                var defName = sortedDefNames[i_1];
                var def = allDefs[defName].toLowerCase().replace(/\n\n/g, " ").replace(/\n/g, "");
                var preElt = preElts[i_1];
                if (preElt.parentElement.classList.contains("active"))
                    resultIndex = results.length;
                var resultsCount = 0;
                var targetIndex = -1;
                while (true) {
                    targetIndex = def.indexOf(needle, targetIndex + 1);
                    if (targetIndex === -1)
                        break;
                    var start = findText(preElt, targetIndex);
                    var end = findText(preElt, targetIndex + needle.length);
                    results.push({ articleElt: preElt.parentElement, start: start, end: end });
                    resultsCount++;
                }
                // Setup results badge
                document.getElementById("link-" + defName).firstChild.nextSibling.textContent = resultsCount > 0 ? resultsCount.toString() : "";
            }
        }
        else
            resultIndex++;
        resultIndex %= results.length;
        if (results.length > 0) {
            var result = results[resultIndex];
            if (!result.articleElt.classList.contains("active")) {
                clearActiveArticle();
                result.articleElt.classList.add("active");
                document.getElementById("link-" + result.articleElt.id.slice(4)).classList.add("active");
            }
            var range = document.createRange();
            range.setStart(result.start.node, result.start.index);
            range.setEnd(result.end.node, result.end.index);
            var selection = document.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            // Scroll into view if needed
            var element = result.start.node.parentElement;
            var elementRect = element.getBoundingClientRect();
            var containerRect = mainElt.getBoundingClientRect();
            if (elementRect.top < containerRect.top)
                element.scrollIntoView(true);
            else if (elementRect.bottom > containerRect.bottom)
                element.scrollIntoView(false);
        }
        else {
            clearActiveArticle();
            noSearchResultsElt.classList.add("active");
        }
        searchElt.focus();
    });
    navListElt.addEventListener("click", function (event) {
        if (event.target.tagName !== "A")
            return;
        clearActiveArticle();
        event.target.classList.add("active");
        document.getElementById("doc-" + event.target.firstChild.textContent).classList.add("active");
    });
    if (window.location.hash.length > 1) {
        var hash = window.location.hash.substring(1);
        var articleElt = document.getElementById("doc-" + hash);
        if (articleElt != null) {
            articleElt.classList.add("active");
            document.getElementById("link-" + hash).classList.add("active");
            return;
        }
    }
    navListElt.querySelector("li a").classList.add("active");
    noSearchResultsElt.nextElementSibling.classList.add("active");
}
function clearActiveArticle() {
    var activeItem = navListElt.querySelector("li a.active");
    if (activeItem != null)
        activeItem.classList.remove("active");
    mainElt.querySelector("article.active").classList.remove("active");
}
