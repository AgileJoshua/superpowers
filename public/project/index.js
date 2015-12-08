(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require("../window");
var CreateAssetDialog_1 = require("../dialogs/CreateAssetDialog");
var FindAssetDialog_1 = require("../dialogs/FindAssetDialog");
var async = require("async");
var nodeRequire = require;
/* tslint:disable */
var TreeView = require("dnd-tree-view");
var PerfectResize = require("perfect-resize");
var TabStrip = require("tab-strip");
/* tslint:enable */
var socket;
var data;
var ui = {};
// FIXME: Use propertype when Electron typings have been updated
var electron;
var runWindow;
if (SupClient.isApp) {
    electron = nodeRequire("electron");
    window.addEventListener("beforeunload", function () {
        if (runWindow != null)
            runWindow.removeListener("closed", onCloseRunWindow);
    });
}
function start() {
    if (SupClient.query.project == null)
        goToHub();
    // Development mode
    if (localStorage.getItem("superpowers-dev-mode") != null) {
        var projectManagementDiv = document.querySelector(".project-management");
        projectManagementDiv.style.backgroundColor = "#37d";
        // According to http://stackoverflow.com/a/12747364/915914, window.onerror
        // should be used rather than window.addEventListener("error", ...);
        // to get all errors, including syntax errors.
        window.onerror = onWindowDevError;
    }
    // Hot-keys
    SupClient.setupHotkeys();
    document.addEventListener("keydown", function (event) {
        if (document.querySelector(".dialog") != null)
            return;
        if (event.keyCode === 113) {
            event.preventDefault();
            onRenameEntryClick();
        }
        if (event.keyCode === 68 && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            onDuplicateEntryClick();
        }
        if (event.keyCode === 46) {
            event.preventDefault();
            onTrashEntryClick();
        }
    });
    // Make sidebar resizable
    new PerfectResize(document.querySelector(".sidebar"), "left");
    // Project info
    document.querySelector(".project-icon .go-to-hub").addEventListener("click", function () { goToHub(); });
    document.querySelector(".project-buttons .run").addEventListener("click", function () { runProject(); });
    document.querySelector(".project-buttons .publish").addEventListener("click", function () { publishProject(); });
    document.querySelector(".project-buttons .debug").addEventListener("click", function () { runProject({ debug: true }); });
    document.querySelector(".project-buttons .stop").addEventListener("click", function () { stopProject(); });
    if (!SupClient.isApp) {
        document.querySelector(".project-buttons .publish").title = "Publish project (only works from the Superpowers app for technical reasons)";
        document.querySelector(".project-buttons .debug").hidden = true;
        document.querySelector(".project-buttons .stop").hidden = true;
    }
    // Entries tree view
    ui.entriesTreeView = new TreeView(document.querySelector(".entries-tree-view"), { dropCallback: onEntryDrop });
    ui.entriesTreeView.on("selectionChange", updateSelectedEntry);
    ui.entriesTreeView.on("activate", onEntryActivate);
    document.querySelector(".entries-buttons .new-asset").addEventListener("click", onNewAssetClick);
    document.querySelector(".entries-buttons .new-folder").addEventListener("click", onNewFolderClick);
    document.querySelector(".entries-buttons .search").addEventListener("click", onSearchEntryDialog);
    document.querySelector(".entries-buttons .rename-entry").addEventListener("click", onRenameEntryClick);
    document.querySelector(".entries-buttons .duplicate-entry").addEventListener("click", onDuplicateEntryClick);
    document.querySelector(".entries-buttons .trash-entry").addEventListener("click", onTrashEntryClick);
    ui.openInNewWindowButton = document.createElement("button");
    ui.openInNewWindowButton.className = "open-in-new-window";
    ui.openInNewWindowButton.title = "Open in new window";
    ui.openInNewWindowButton.addEventListener("click", onOpenInNewWindowClick);
    // Tab strip
    var tabsBarElt = document.querySelector(".tabs-bar");
    ui.tabStrip = new TabStrip(tabsBarElt);
    ui.tabStrip.on("activateTab", onTabActivate);
    ui.tabStrip.on("closeTab", onTabClose);
    // Prevent <iframe> panes from getting mouse event while dragging tabs
    function restorePanesMouseEvent(event) {
        ui.panesElt.style.pointerEvents = "";
        document.removeEventListener("mouseup", restorePanesMouseEvent);
    }
    tabsBarElt.addEventListener("mousedown", function (event) {
        ui.panesElt.style.pointerEvents = "none";
        document.addEventListener("mouseup", restorePanesMouseEvent);
    });
    // Global controls
    var toggleNotificationsButton = document.querySelector(".top .controls button.toggle-notifications");
    toggleNotificationsButton.addEventListener("click", onClickToggleNotifications);
    if (localStorage.getItem("superpowers-disable-notifications") != null) {
        toggleNotificationsButton.classList.add("disabled");
        toggleNotificationsButton.title = "Click to enable notifications";
    }
    else {
        toggleNotificationsButton.classList.remove("disabled");
        toggleNotificationsButton.title = "Click to disable notifications";
    }
    // Panes and tools
    ui.panesElt = document.querySelector(".main .panes");
    ui.toolsElt = document.querySelector(".sidebar .tools ul");
    // Messaging
    window.addEventListener("message", onMessage);
    connect();
}
start();
function connect() {
    socket = SupClient.connect(SupClient.query.project, { reconnection: true });
    socket.on("error", onConnectionError);
    socket.on("disconnect", onDisconnected);
    socket.on("welcome", onWelcome);
    socket.on("setProperty:manifest", onSetManifestProperty);
    socket.on("updateIcon:manifest", onUpdateProjectIcon);
    socket.on("add:entries", onEntryAdded);
    socket.on("move:entries", onEntryMoved);
    socket.on("trash:entries", onEntryTrashed);
    socket.on("setProperty:entries", onSetEntryProperty);
    socket.on("set:diagnostics", onDiagnosticSet);
    socket.on("clear:diagnostics", onDiagnosticCleared);
    socket.on("add:dependencies", onDependenciesAdded);
    socket.on("remove:dependencies", onDependenciesRemoved);
}
function setupAssetTypes(editorPaths, callback) {
    data.editorsByAssetType = {};
    data.assetTypesByTitle = {};
    var pluginsRoot = "/systems/" + data.systemName + "/plugins";
    async.each(Object.keys(editorPaths), function (assetType, cb) {
        var pluginPath = editorPaths[assetType];
        window.fetch(pluginsRoot + "/" + pluginPath + "/editors/" + assetType + "/manifest.json").then(function (response) { return response.json(); }).then(function (manifest) {
            manifest.pluginPath = pluginPath;
            data.editorsByAssetType[assetType] = manifest;
            cb();
        });
    }, function () {
        var assetTypes = Object.keys(data.editorsByAssetType);
        assetTypes.sort(function (a, b) { return data.editorsByAssetType[a].title.localeCompare(data.editorsByAssetType[b].title); });
        for (var _i = 0; _i < assetTypes.length; _i++) {
            var assetType = assetTypes[_i];
            var manifest = data.editorsByAssetType[assetType];
            data.assetTypesByTitle[manifest.title] = assetType;
        }
        callback();
    });
}
function setupTools(toolPaths, callback) {
    data.toolsByName = {};
    var pluginsRoot = "/systems/" + data.systemName + "/plugins";
    async.each(Object.keys(toolPaths), function (toolName, cb) {
        var pluginPath = toolPaths[toolName];
        window.fetch(pluginsRoot + "/" + pluginPath + "/editors/" + toolName + "/manifest.json").then(function (response) { return response.json(); }).then(function (manifest) {
            data.toolsByName[toolName] = manifest;
            data.toolsByName[toolName].pluginPath = pluginPath;
            cb();
        });
    }, function () {
        ui.toolsElt.innerHTML = "";
        var toolNames = Object.keys(data.toolsByName);
        toolNames.sort(function (a, b) { return data.toolsByName[a].title.localeCompare(data.toolsByName[b].title); });
        for (var _i = 0; _i < toolNames.length; _i++) {
            var toolName = toolNames[_i];
            setupTool(toolName);
        }
        callback();
    });
}
function setupTool(toolName) {
    var tool = data.toolsByName[toolName];
    if (tool.pinned) {
        // TODO: Support multiple pinned tabs
        ui.homeTab = openTool(toolName);
        return;
    }
    var toolElt = document.createElement("li");
    toolElt.dataset["name"] = toolName;
    var containerElt = document.createElement("div");
    toolElt.appendChild(containerElt);
    var iconElt = document.createElement("img");
    iconElt.src = "/systems/" + data.systemName + "/plugins/" + tool.pluginPath + "/editors/" + toolName + "/icon.svg";
    containerElt.appendChild(iconElt);
    var nameSpanElt = document.createElement("span");
    nameSpanElt.className = "name";
    nameSpanElt.textContent = tool.title;
    containerElt.appendChild(nameSpanElt);
    toolElt.addEventListener("mouseenter", function (event) { event.target.appendChild(ui.openInNewWindowButton); });
    toolElt.addEventListener("mouseleave", function (event) {
        if (ui.openInNewWindowButton.parentElement != null)
            ui.openInNewWindowButton.parentElement.removeChild(ui.openInNewWindowButton);
    });
    nameSpanElt.addEventListener("click", function (event) { openTool(event.target.parentElement.parentElement.dataset.name); });
    ui.toolsElt.appendChild(toolElt);
}
// Network callbacks
function onConnectionError() {
    var redirect = encodeURIComponent("" + window.location.pathname + window.location.search);
    window.location.replace("/login?redirect=" + redirect);
}
function onDisconnected() {
    SupClient.dialogs.cancelDialogIfAny();
    data = null;
    ui.entriesTreeView.clearSelection();
    ui.entriesTreeView.treeRoot.innerHTML = "";
    updateSelectedEntry();
    document.querySelector(".project-buttons .run").disabled = true;
    document.querySelector(".project-buttons .debug").disabled = true;
    document.querySelector(".project-buttons .stop").disabled = true;
    document.querySelector(".project-buttons .publish").disabled = true;
    document.querySelector(".entries-buttons .new-asset").disabled = true;
    document.querySelector(".entries-buttons .new-folder").disabled = true;
    document.querySelector(".entries-buttons .search").disabled = true;
    document.querySelector(".connecting").hidden = false;
}
function onWelcome(clientId, config) {
    data = {
        buildPort: config.buildPort,
        systemName: config.systemName
    };
    window.fetch("/systems/" + data.systemName + "/plugins.json").then(function (response) { return response.json(); }).then(function (pluginsInfo) {
        async.parallel([
            function (cb) { setupAssetTypes(pluginsInfo.paths.editors, cb); },
            function (cb) { setupTools(pluginsInfo.paths.tools, cb); }
        ], function (err) {
            if (err)
                throw err;
            socket.emit("sub", "manifest", null, onManifestReceived);
            socket.emit("sub", "entries", null, onEntriesReceived);
        });
    });
}
function onManifestReceived(err, manifest) {
    data.manifest = new SupCore.Data.ProjectManifest(manifest);
    document.querySelector(".project-name").textContent = manifest.name;
    document.title = manifest.name + " \u2014 Superpowers";
}
function onEntriesReceived(err, entries) {
    data.entries = new SupCore.Data.Entries(entries);
    ui.entriesTreeView.clearSelection();
    ui.entriesTreeView.treeRoot.innerHTML = "";
    document.querySelector(".connecting").hidden = true;
    if (SupClient.isApp)
        document.querySelector(".project-buttons .publish").disabled = false;
    document.querySelector(".project-buttons .run").disabled = false;
    document.querySelector(".project-buttons .debug").disabled = false;
    document.querySelector(".entries-buttons .new-asset").disabled = false;
    document.querySelector(".entries-buttons .new-folder").disabled = false;
    document.querySelector(".entries-buttons .search").disabled = false;
    function walk(entry, parentEntry, parentElt) {
        var liElt = createEntryElement(entry);
        liElt.classList.add("collapsed");
        var nodeType = (entry.children != null) ? "group" : "item";
        ui.entriesTreeView.append(liElt, nodeType, parentElt);
        if (entry.children != null)
            for (var _i = 0, _a = entry.children; _i < _a.length; _i++) {
                var child = _a[_i];
                walk(child, entry, liElt);
            }
    }
    for (var _i = 0; _i < entries.length; _i++) {
        var entry = entries[_i];
        walk(entry, null, null);
    }
}
function onSetManifestProperty(key, value) {
    data.manifest.client_setProperty(key, value);
    switch (key) {
        case "name":
            document.querySelector(".project-name").textContent = value;
            break;
    }
}
function onUpdateProjectIcon() {
    // TODO: Update favicon?
}
function onEntryAdded(entry, parentId, index) {
    data.entries.client_add(entry, parentId, index);
    var liElt = createEntryElement(entry);
    var nodeType = (entry.children != null) ? "group" : "item";
    var parentElt;
    if (parentId != null) {
        parentElt = ui.entriesTreeView.treeRoot.querySelector("[data-id='" + parentId + "']");
        var parentEntry = data.entries.byId[parentId];
        var childrenElt = parentElt.querySelector("span.children");
        childrenElt.textContent = "(" + parentEntry.children.length + ")";
    }
    ui.entriesTreeView.insertAt(liElt, nodeType, index, parentElt);
}
var autoOpenAsset = true;
function onEntryAddedAck(err, id) {
    if (err != null) {
        alert(err);
        return;
    }
    ui.entriesTreeView.clearSelection();
    ui.entriesTreeView.addToSelection(ui.entriesTreeView.treeRoot.querySelector("li[data-id='" + id + "']"));
    updateSelectedEntry();
    if (autoOpenAsset)
        openEntry(id);
}
function onEntryMoved(id, parentId, index) {
    data.entries.client_move(id, parentId, index);
    var entryElt = ui.entriesTreeView.treeRoot.querySelector("[data-id='" + id + "']");
    var oldParentId = entryElt.dataset["parentId"];
    if (oldParentId != null) {
        var oldParentElt = ui.entriesTreeView.treeRoot.querySelector("[data-id='" + oldParentId + "']");
        var parentEntry = data.entries.byId[oldParentId];
        var childrenElt = oldParentElt.querySelector("span.children");
        childrenElt.textContent = "(" + parentEntry.children.length + ")";
    }
    var nodeType = (entryElt.classList.contains("group")) ? "group" : "item";
    var parentElt;
    if (parentId != null) {
        parentElt = ui.entriesTreeView.treeRoot.querySelector("[data-id='" + parentId + "']");
        var parentEntry = data.entries.byId[parentId];
        var childrenElt = parentElt.querySelector("span.children");
        childrenElt.textContent = "(" + parentEntry.children.length + ")";
    }
    ui.entriesTreeView.insertAt(entryElt, nodeType, index, parentElt);
    if (parentId != null)
        entryElt.dataset["parentId"] = parentId;
    else
        delete entryElt.dataset["parentId"];
    updateEntryElementPath(id);
    refreshAssetTabElement(data.entries.byId[id]);
}
function updateEntryElementPath(id) {
    var entryElt = ui.entriesTreeView.treeRoot.querySelector("[data-id='" + id + "']");
    entryElt.dataset["dndText"] = data.entries.getPathFromId(id);
    var node = data.entries.byId[id];
    if (node.children != null) {
        for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
            var child = _a[_i];
            updateEntryElementPath(child.id);
        }
    }
}
function onEntryTrashed(id) {
    data.entries.client_remove(id);
    var entryElt = ui.entriesTreeView.treeRoot.querySelector("[data-id='" + id + "']");
    var oldParentId = entryElt.dataset["parentId"];
    if (oldParentId != null) {
        var oldParentElt = ui.entriesTreeView.treeRoot.querySelector("[data-id='" + oldParentId + "']");
        var parentEntry = data.entries.byId[oldParentId];
        var childrenElt = oldParentElt.querySelector("span.children");
        childrenElt.textContent = "(" + parentEntry.children.length + ")";
    }
    ui.entriesTreeView.remove(entryElt);
}
function onSetEntryProperty(id, key, value) {
    data.entries.client_setProperty(id, key, value);
    var entryElt = ui.entriesTreeView.treeRoot.querySelector("[data-id='" + id + "']");
    switch (key) {
        case "name":
            entryElt.querySelector(".name").textContent = value;
            updateEntryElementPath(id);
            var walk = function (entry) {
                refreshAssetTabElement(entry);
                if (entry.children != null)
                    for (var _i = 0, _a = entry.children; _i < _a.length; _i++) {
                        var child = _a[_i];
                        walk(child);
                    }
            };
            walk(data.entries.byId[id]);
            break;
    }
}
function onDiagnosticSet(id, newDiag) {
    var diagnostics = data.entries.diagnosticsByEntryId[id];
    var existingDiag = diagnostics.byId[newDiag.id];
    if (existingDiag != null) {
        existingDiag.type = newDiag.type;
        existingDiag.data = newDiag.data;
    }
    else
        diagnostics.client_add(newDiag, null);
    var diagnosticsElt = ui.entriesTreeView.treeRoot.querySelector("[data-id='" + id + "'] .diagnostics");
    var diagSpan = document.createElement("span");
    diagSpan.className = newDiag.id;
    diagSpan.textContent = newDiag.id;
    diagnosticsElt.appendChild(diagSpan);
}
function onDiagnosticCleared(id, diagId) {
    var diagnostics = data.entries.diagnosticsByEntryId[id];
    diagnostics.client_remove(diagId);
    var diagElt = ui.entriesTreeView.treeRoot.querySelector("[data-id='" + id + "'] .diagnostics ." + diagId);
    diagElt.parentElement.removeChild(diagElt);
}
function onDependenciesAdded(id, depIds) {
    for (var _i = 0; _i < depIds.length; _i++) {
        var depId = depIds[_i];
        data.entries.byId[depId].dependentAssetIds.push(id);
    }
}
function onDependenciesRemoved(id, depIds) {
    for (var _i = 0; _i < depIds.length; _i++) {
        var depId = depIds[_i];
        var dependentAssetIds = data.entries.byId[depId].dependentAssetIds;
        dependentAssetIds.splice(dependentAssetIds.indexOf(id), 1);
    }
}
// User interface
function goToHub() { window.location.replace("/"); }
function runProject(options) {
    if (options === void 0) { options = { debug: false }; }
    if (SupClient.isApp) {
        if (runWindow == null) {
            runWindow = new electron.remote.BrowserWindow({
                title: "Superpowers", icon: "public/images/icon.png",
                width: 1000, height: 600,
                "min-width": 800, "min-height": 480
            });
            runWindow.setMenuBarVisibility(false);
            runWindow.on("closed", onCloseRunWindow);
            document.querySelector(".project-buttons").classList.toggle("running", true);
        }
        runWindow.loadUrl(window.location.origin + "/build.html");
        runWindow.focus();
        document.querySelector(".project-buttons .stop").disabled = false;
    }
    else
        window.open("/build.html", "player_" + SupClient.query.project);
    socket.emit("build:project", function (err, buildId) {
        if (err != null) {
            alert(err);
            return;
        }
        var url = window.location.protocol + "//" + window.location.hostname + ":" + data.buildPort + "/systems/" + data.systemName + "/?project=" + SupClient.query.project + "&build=" + buildId;
        if (options.debug)
            url += "&debug";
        if (SupClient.isApp) {
            if (runWindow != null)
                runWindow.loadUrl(url);
        }
        else
            window.open(url, "player_" + SupClient.query.project);
    });
}
function onCloseRunWindow() {
    runWindow = null;
    document.querySelector(".project-buttons .stop").disabled = true;
}
function stopProject() {
    runWindow.destroy();
    runWindow = null;
    document.querySelector(".project-buttons .stop").disabled = true;
}
function publishProject() {
    if (SupClient.isApp)
        electron.ipcRenderer.send("choose-export-folder");
}
if (SupClient.isApp) {
    electron.ipcRenderer.on("export-folder-failed", function (event, message) { alert(message); });
    electron.ipcRenderer.on("export-folder-success", function (event, outputFolder) {
        socket.emit("build:project", function (err, buildId, files) {
            var address = window.location.protocol + "//" + window.location.hostname;
            electron.ipcRenderer.send("export", { projectId: SupClient.query.project, buildId: buildId, address: address, mainPort: window.location.port, buildPort: data.buildPort, outputFolder: outputFolder, files: files });
        });
    });
}
function showDevTools() {
    if (electron != null)
        electron.remote.getCurrentWindow().toggleDevTools();
}
function createEntryElement(entry) {
    var liElt = document.createElement("li");
    liElt.dataset["id"] = entry.id;
    liElt.dataset["dndText"] = data.entries.getPathFromId(entry.id);
    var parentEntry = data.entries.parentNodesById[entry.id];
    if (parentEntry != null)
        liElt.dataset["parentId"] = parentEntry.id;
    if (entry.type != null) {
        var iconElt = document.createElement("img");
        iconElt.draggable = false;
        iconElt.src = "/systems/" + data.systemName + "/plugins/" + data.editorsByAssetType[entry.type].pluginPath + "/editors/" + entry.type + "/icon.svg";
        liElt.appendChild(iconElt);
    }
    var nameSpan = document.createElement("span");
    nameSpan.className = "name";
    nameSpan.textContent = entry.name;
    liElt.appendChild(nameSpan);
    if (entry.type != null) {
        liElt.addEventListener("mouseenter", function (event) { liElt.appendChild(ui.openInNewWindowButton); });
        liElt.addEventListener("mouseleave", function (event) {
            if (ui.openInNewWindowButton.parentElement != null)
                ui.openInNewWindowButton.parentElement.removeChild(ui.openInNewWindowButton);
        });
        var diagnosticsSpan = document.createElement("span");
        diagnosticsSpan.className = "diagnostics";
        for (var _i = 0, _a = entry.diagnostics; _i < _a.length; _i++) {
            var diag = _a[_i];
            var diagSpan = document.createElement("span");
            diagSpan.className = diag.id;
            diagSpan.textContent = diag.id;
            diagnosticsSpan.appendChild(diagSpan);
        }
        liElt.appendChild(diagnosticsSpan);
    }
    else {
        var childrenElt = document.createElement("span");
        childrenElt.className = "children";
        childrenElt.textContent = "(" + entry.children.length + ")";
        liElt.appendChild(childrenElt);
        childrenElt.style.display = "none";
        liElt.addEventListener("mouseenter", function (event) { childrenElt.style.display = ""; });
        liElt.addEventListener("mouseleave", function (event) { childrenElt.style.display = "none"; });
    }
    return liElt;
}
function onEntryDrop(dropInfo, orderedNodes) {
    var dropPoint = SupClient.getTreeViewDropPoint(dropInfo, data.entries);
    var entryIds = [];
    for (var _i = 0; _i < orderedNodes.length; _i++) {
        var entry = orderedNodes[_i];
        entryIds.push(entry.dataset.id);
    }
    var sourceParentNode = data.entries.parentNodesById[entryIds[0]];
    var sourceChildren = (sourceParentNode != null && sourceParentNode.children != null) ? sourceParentNode.children : data.entries.pub;
    var sameParent = (sourceParentNode != null && dropPoint.parentId === sourceParentNode.id);
    var i = 0;
    for (var _a = 0; _a < entryIds.length; _a++) {
        var id = entryIds[_a];
        socket.emit("move:entries", id, dropPoint.parentId, dropPoint.index + i, function (err) { if (err != null)
            alert(err); });
        if (!sameParent || sourceChildren.indexOf(data.entries.byId[id]) >= dropPoint.index)
            i++;
    }
    return false;
}
function updateSelectedEntry() {
    var allButtons = document.querySelectorAll(".entries-buttons button.edit");
    for (var index = 0; index < allButtons.length; index++) {
        var button = allButtons.item(index);
        var disabled = (ui.entriesTreeView.selectedNodes.length === 0 ||
            (button.classList.contains("single") && ui.entriesTreeView.selectedNodes.length !== 1) ||
            (button.classList.contains("asset-only") && ui.entriesTreeView.selectedNodes[0].classList.contains("group")));
        button.disabled = disabled;
    }
}
function onEntryActivate() {
    var activatedEntry = ui.entriesTreeView.selectedNodes[0];
    openEntry(activatedEntry.dataset.id);
}
function onMessage(event) {
    switch (event.data.type) {
        case "chat":
            onMessageChat(event.data.content);
            break;
        case "hotkey":
            onMessageHotKey(event.data.content);
            break;
        case "openEntry":
            openEntry(event.data.id, event.data.options);
            break;
        case "openTool":
            openTool(event.data.name, event.data.options);
            break;
        case "error":
            onWindowDevError();
            break;
    }
}
function onWindowDevError() {
    var projectManagementDiv = document.querySelector(".project-management");
    projectManagementDiv.style.backgroundColor = "#c42";
    return false;
}
function onMessageChat(message) {
    var isHomeTabVisible = ui.homeTab.classList.contains("active");
    if (isHomeTabVisible && !document.hidden)
        return;
    if (!isHomeTabVisible)
        ui.homeTab.classList.add("blink");
    if (localStorage.getItem("superpowers-disable-notifications") != null)
        return;
    function doNotification() {
        var notification = new window.Notification("New chat message in \"" + data.manifest.pub.name + "\" project", { icon: "/images/icon.png", body: message });
        var closeTimeoutId = setTimeout(function () { notification.close(); }, 5000);
        notification.addEventListener("click", function () {
            window.focus();
            onTabActivate(ui.homeTab);
            clearTimeout(closeTimeoutId);
            notification.close();
        });
    }
    if (window.Notification.permission === "granted")
        doNotification();
    else if (window.Notification.permission !== "denied") {
        window.Notification.requestPermission(function (status) {
            window.Notification.permission = status;
            if (window.Notification.permission === "granted")
                doNotification();
        });
    }
}
function onMessageHotKey(action) {
    switch (action) {
        case "newAsset":
            onNewAssetClick();
            break;
        case "newFolder":
            onNewFolderClick();
            break;
        case "searchEntry":
            onSearchEntryDialog();
            break;
        case "closeTab":
            onTabClose(ui.tabStrip.tabsRoot.querySelector(".active"));
            break;
        case "previousTab":
            onActivatePreviousTab();
            break;
        case "nextTab":
            onActivateNextTab();
            break;
        case "run":
            runProject();
            break;
        case "debug":
            runProject({ debug: true });
            break;
        case "devtools":
            showDevTools();
            break;
    }
}
function onClickToggleNotifications(event) {
    var disableNotifications = (localStorage.getItem("superpowers-disable-notifications") != null) ? true : false;
    disableNotifications = !disableNotifications;
    if (!disableNotifications) {
        localStorage.removeItem("superpowers-disable-notifications");
        event.target.classList.remove("disabled");
        event.target.title = "Click to disable notifications";
    }
    else {
        localStorage.setItem("superpowers-disable-notifications", "true");
        event.target.classList.add("disabled");
        event.target.title = "Click to enable notifications";
    }
}
function onSearchEntryDialog() {
    if (data == null)
        return;
    /* tslint:disable:no-unused-expression */
    new FindAssetDialog_1.default(data.entries, data.editorsByAssetType, function (entryId) {
        /* tslint:enable:no-unused-expression */
        if (entryId == null)
            return;
        openEntry(entryId);
    });
}
function openEntry(id, optionValues) {
    var entry = data.entries.byId[id];
    // Just toggle folders
    if (entry.type == null) {
        ui.entriesTreeView.selectedNodes[0].classList.toggle("collapsed");
        return;
    }
    var tab = ui.tabStrip.tabsRoot.querySelector("li[data-asset-id='" + id + "']");
    var iframe = ui.panesElt.querySelector("iframe[data-asset-id='" + id + "']");
    if (tab == null) {
        tab = createAssetTabElement(entry);
        ui.tabStrip.tabsRoot.appendChild(tab);
        iframe = document.createElement("iframe");
        var options = "";
        if (optionValues != null)
            for (var optionName in optionValues)
                options += "&" + optionName + "=" + optionValues[optionName];
        iframe.src = "/systems/" + data.systemName + "/plugins/" + data.editorsByAssetType[entry.type].pluginPath + "/editors/" + entry.type + "/?project=" + SupClient.query.project + "&asset=" + id + options;
        iframe.dataset["assetId"] = id;
        ui.panesElt.appendChild(iframe);
    }
    else if (optionValues != null) {
        var origin = window.location.origin;
        iframe.contentWindow.postMessage(optionValues, origin);
    }
    onTabActivate(tab);
}
function openTool(name, optionValues) {
    var tab = ui.tabStrip.tabsRoot.querySelector("li[data-pane='" + name + "']");
    var iframe = ui.panesElt.querySelector("iframe[data-name='" + name + "']");
    if (tab == null) {
        var tool = data.toolsByName[name];
        tab = createToolTabElement(name, tool);
        ui.tabStrip.tabsRoot.appendChild(tab);
        iframe = document.createElement("iframe");
        var options = "";
        if (optionValues != null)
            for (var optionName in optionValues)
                options += "&" + optionName + "=" + optionValues[optionName];
        iframe.src = "/systems/" + data.systemName + "/plugins/" + tool.pluginPath + "/editors/" + name + "/?project=" + SupClient.query.project + options;
        iframe.dataset["name"] = name;
        ui.panesElt.appendChild(iframe);
    }
    else if (optionValues != null) {
        var origin = window.location.origin;
        iframe.contentWindow.postMessage(optionValues, origin);
    }
    onTabActivate(tab);
    return tab;
}
function onNewAssetClick() {
    /* tslint:disable:no-unused-expression */
    new CreateAssetDialog_1.default(data.assetTypesByTitle, autoOpenAsset, function (name, type, open) {
        /* tslint:enable:no-unused-expression */
        if (name == null)
            return;
        if (name === "")
            name = data.editorsByAssetType[type].title;
        autoOpenAsset = open;
        socket.emit("add:entries", name, type, SupClient.getTreeViewInsertionPoint(ui.entriesTreeView), onEntryAddedAck);
    });
}
function onNewFolderClick() {
    var options = {
        placeholder: "Enter a name",
        initialValue: "Folder",
        validationLabel: "Create",
        pattern: SupClient.namePattern,
        title: SupClient.namePatternDescription
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter a name for the new folder.", options, function (name) {
        /* tslint:enable:no-unused-expression */
        if (name == null)
            return;
        socket.emit("add:entries", name, null, SupClient.getTreeViewInsertionPoint(ui.entriesTreeView), onEntryAddedAck);
    });
}
function onTrashEntryClick() {
    if (ui.entriesTreeView.selectedNodes.length === 0)
        return;
    var selectedEntries = [];
    function checkNextEntry() {
        selectedEntries.splice(0, 1);
        if (selectedEntries.length === 0) {
            /* tslint:disable:no-unused-expression */
            new SupClient.dialogs.ConfirmDialog("Are you sure you want to trash the selected entries?", "Trash", function (confirm) {
                /* tslint:enable:no-unused-expression */
                if (!confirm)
                    return;
                function trashEntry(entry) {
                    if (entry.type == null)
                        for (var _i = 0, _a = entry.children; _i < _a.length; _i++) {
                            var entryChild = _a[_i];
                            trashEntry(entryChild);
                        }
                    socket.emit("trash:entries", entry.id, function (err) {
                        if (err != null) {
                            alert(err);
                            return;
                        }
                    });
                }
                for (var _i = 0, _a = ui.entriesTreeView.selectedNodes; _i < _a.length; _i++) {
                    var selectedNode = _a[_i];
                    var entry = data.entries.byId[selectedNode.dataset.id];
                    trashEntry(entry);
                }
                ui.entriesTreeView.clearSelection();
            });
        }
        else
            warnBrokenDependency(selectedEntries[0]);
    }
    function warnBrokenDependency(entry) {
        if (entry.type == null)
            for (var _i = 0, _a = entry.children; _i < _a.length; _i++) {
                var entryChild = _a[_i];
                selectedEntries.push(entryChild);
            }
        if (entry.dependentAssetIds != null && entry.dependentAssetIds.length > 0) {
            var dependentAssetNames = [];
            for (var _b = 0, _c = entry.dependentAssetIds; _b < _c.length; _b++) {
                var usingId = _c[_b];
                dependentAssetNames.push(data.entries.byId[usingId].name);
            }
            /* tslint:disable:no-unused-expression */
            new SupClient.dialogs.InfoDialog(entry.name + " is used in " + dependentAssetNames.join(", ") + ".", "Close", function () { checkNextEntry(); });
        }
        else
            checkNextEntry();
    }
    for (var _i = 0, _a = ui.entriesTreeView.selectedNodes; _i < _a.length; _i++) {
        var selectedNode = _a[_i];
        selectedEntries.push(data.entries.byId[selectedNode.dataset.id]);
    }
    warnBrokenDependency(selectedEntries[0]);
}
function onOpenInNewWindowClick(event) {
    var id = event.target.parentElement.dataset.id;
    if (id != null) {
        var entry = data.entries.byId[id];
        var address = (window.location.origin + "/systems/" + data.systemName) +
            ("/plugins/" + data.editorsByAssetType[entry.type].pluginPath + "/editors/" + entry.type + "/") +
            ("?project=" + SupClient.query.project + "&asset=" + entry.id);
        if (SupClient.isApp)
            electron.ipcRenderer.send("new-standalone-window", address);
        else
            window.open(address);
    }
    else {
        var name_1 = event.target.parentElement.dataset.name;
        var address = (window.location.origin + "/systems/" + data.systemName) +
            ("/plugins/" + data.toolsByName[name_1].pluginPath + "/editors/" + name_1 + "/") +
            ("?project=" + SupClient.query.project);
        if (SupClient.isApp)
            electron.ipcRenderer.send("new-standalone-window", address);
        else
            window.open(address);
    }
}
function onRenameEntryClick() {
    if (ui.entriesTreeView.selectedNodes.length !== 1)
        return;
    var selectedNode = ui.entriesTreeView.selectedNodes[0];
    var entry = data.entries.byId[selectedNode.dataset.id];
    var options = {
        initialValue: entry.name,
        validationLabel: "Rename",
        pattern: SupClient.namePattern,
        title: SupClient.namePatternDescription
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter a new name for the asset.", options, function (newName) {
        /* tslint:enable:no-unused-expression */
        if (newName == null || newName === entry.name)
            return;
        socket.emit("setProperty:entries", entry.id, "name", newName, function (err) {
            if (err != null) {
                alert(err);
                return;
            }
        });
    });
}
function onDuplicateEntryClick() {
    if (ui.entriesTreeView.selectedNodes.length !== 1)
        return;
    var selectedNode = ui.entriesTreeView.selectedNodes[0];
    var entry = data.entries.byId[selectedNode.dataset.id];
    if (entry.type == null)
        return;
    var options = {
        initialValue: entry.name,
        validationLabel: "Duplicate",
        pattern: SupClient.namePattern,
        title: SupClient.namePatternDescription
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter a name for the new asset.", options, function (newName) {
        /* tslint:enable:no-unused-expression */
        if (newName == null)
            return;
        socket.emit("duplicate:entries", newName, entry.id, SupClient.getTreeViewInsertionPoint(ui.entriesTreeView), onEntryAddedAck);
    });
}
function refreshAssetTabElement(entry, tabElt) {
    if (tabElt == null)
        tabElt = ui.tabStrip.tabsRoot.querySelector("[data-asset-id='" + entry.id + "']");
    if (tabElt == null)
        return;
    var entryPath = data.entries.getPathFromId(entry.id);
    var entryLocation = "";
    var entryName = entry.name;
    var lastSlash = entryPath.lastIndexOf("/");
    if (lastSlash !== -1)
        entryLocation = entryPath.slice(0, lastSlash);
    var maxEntryLocationLength = 20;
    while (entryLocation.length > maxEntryLocationLength) {
        var slashIndex = entryLocation.indexOf("/", 2);
        if (slashIndex === -1)
            break;
        entryLocation = "\u2026/" + entryLocation.slice(slashIndex + 1);
    }
    tabElt.querySelector(".label .location").textContent = entryLocation;
    tabElt.querySelector(".label .name").textContent = entryName;
    tabElt.title = entryPath;
}
function createAssetTabElement(entry) {
    var tabElt = document.createElement("li");
    if (entry.type != null) {
        var iconElt = document.createElement("img");
        iconElt.classList.add("icon");
        iconElt.src = "/systems/" + data.systemName + "/plugins/" + data.editorsByAssetType[entry.type].pluginPath + "/editors/" + entry.type + "/icon.svg";
        tabElt.appendChild(iconElt);
    }
    var tabLabel = document.createElement("div");
    tabLabel.classList.add("label");
    tabElt.appendChild(tabLabel);
    var tabLabelLocation = document.createElement("div");
    tabLabelLocation.classList.add("location");
    tabLabel.appendChild(tabLabelLocation);
    var tabLabelName = document.createElement("div");
    tabLabelName.classList.add("name");
    tabLabel.appendChild(tabLabelName);
    var closeButton = document.createElement("button");
    closeButton.classList.add("close");
    closeButton.addEventListener("click", function () { onTabClose(tabElt); });
    tabElt.appendChild(closeButton);
    tabElt.dataset["assetId"] = entry.id;
    refreshAssetTabElement(entry, tabElt);
    return tabElt;
}
function createToolTabElement(toolName, tool) {
    var tabElt = document.createElement("li");
    var iconElt = document.createElement("img");
    iconElt.classList.add("icon");
    iconElt.src = "/systems/" + data.systemName + "/plugins/" + tool.pluginPath + "/editors/" + toolName + "/icon.svg";
    tabElt.appendChild(iconElt);
    if (!tool.pinned) {
        var tabLabel = document.createElement("div");
        tabLabel.classList.add("label");
        tabElt.appendChild(tabLabel);
        var tabLabelName = document.createElement("div");
        tabLabelName.classList.add("name");
        tabLabel.appendChild(tabLabelName);
        tabLabelName.textContent = tool.title;
        var closeButton = document.createElement("button");
        closeButton.classList.add("close");
        closeButton.addEventListener("click", function () { onTabClose(tabElt); });
        tabElt.appendChild(closeButton);
    }
    else {
        tabElt.classList.add("pinned");
    }
    tabElt.dataset["pane"] = toolName;
    return tabElt;
}
function onTabActivate(tabElement) {
    var activeTab = ui.tabStrip.tabsRoot.querySelector(".active");
    if (activeTab != null) {
        activeTab.classList.remove("active");
        var activeIframe = ui.panesElt.querySelector("iframe.active");
        activeIframe.contentWindow.postMessage({ type: "deactivate" }, window.location.origin);
        activeIframe.classList.remove("active");
    }
    tabElement.classList.add("active");
    tabElement.classList.remove("blink");
    var assetId = tabElement.dataset["assetId"];
    var tabIframe;
    if (assetId != null)
        tabIframe = ui.panesElt.querySelector("iframe[data-asset-id='" + assetId + "']");
    else
        tabIframe = ui.panesElt.querySelector("iframe[data-name='" + tabElement.dataset.pane + "']");
    tabIframe.classList.add("active");
    tabIframe.contentWindow.focus();
    tabIframe.contentWindow.postMessage({ type: "activate" }, window.location.origin);
}
function onTabClose(tabElement) {
    var assetId = tabElement.dataset["assetId"];
    var frameElt;
    if (assetId != null)
        frameElt = ui.panesElt.querySelector("iframe[data-asset-id='" + assetId + "']");
    else {
        var toolName = tabElement.dataset["pane"];
        if (toolName === "main")
            return;
        frameElt = ui.panesElt.querySelector("iframe[data-name='" + toolName + "']");
    }
    if (tabElement.classList.contains("active")) {
        var activeTabElement = (tabElement.nextSibling != null) ? tabElement.nextSibling : tabElement.previousSibling;
        if (activeTabElement != null)
            onTabActivate(activeTabElement);
    }
    tabElement.parentElement.removeChild(tabElement);
    frameElt.parentElement.removeChild(frameElt);
}
function onActivatePreviousTab() {
    var activeTabElt = ui.tabStrip.tabsRoot.querySelector(".active");
    for (var tabIndex = 0; ui.tabStrip.tabsRoot.children.length; tabIndex++) {
        var tabElt = ui.tabStrip.tabsRoot.children[tabIndex];
        if (tabElt === activeTabElt) {
            var newTabIndex = (tabIndex === 0) ? ui.tabStrip.tabsRoot.children.length - 1 : tabIndex - 1;
            onTabActivate(ui.tabStrip.tabsRoot.children[newTabIndex]);
            return;
        }
    }
}
function onActivateNextTab() {
    var activeTabElt = ui.tabStrip.tabsRoot.querySelector(".active");
    for (var tabIndex = 0; ui.tabStrip.tabsRoot.children.length; tabIndex++) {
        var tabElt = ui.tabStrip.tabsRoot.children[tabIndex];
        if (tabElt === activeTabElt) {
            var newTabIndex = (tabIndex === ui.tabStrip.tabsRoot.children.length - 1) ? 0 : tabIndex + 1;
            onTabActivate(ui.tabStrip.tabsRoot.children[newTabIndex]);
            return;
        }
    }
}

},{"../dialogs/CreateAssetDialog":2,"../dialogs/FindAssetDialog":3,"../window":4,"async":5,"dnd-tree-view":6,"perfect-resize":9,"tab-strip":11}],2:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var CreateAssetDialog = (function (_super) {
    __extends(CreateAssetDialog, _super);
    function CreateAssetDialog(typeLabels, open, callback) {
        var _this = this;
        _super.call(this);
        this.callback = callback;
        // Prompt name
        var labelElt = document.createElement("label");
        labelElt.textContent = "Select the type and enter a name for the new asset.";
        this.formElt.appendChild(labelElt);
        // Type
        this.typeSelectElt = document.createElement("select");
        for (var typeName in typeLabels) {
            var optionElt = document.createElement("option");
            optionElt.textContent = typeName;
            optionElt.value = typeLabels[typeName];
            this.typeSelectElt.appendChild(optionElt);
        }
        this.typeSelectElt.size = 12;
        this.formElt.appendChild(this.typeSelectElt);
        // Name
        this.nameInputElt = document.createElement("input");
        this.nameInputElt.placeholder = "Asset name (optional)";
        this.nameInputElt.pattern = SupClient.namePattern;
        this.nameInputElt.title = SupClient.namePatternDescription;
        this.formElt.appendChild(this.nameInputElt);
        // Auto-open checkbox
        var downElt = document.createElement("div");
        downElt.style.display = "flex";
        downElt.style.alignItems = "center";
        this.formElt.appendChild(downElt);
        this.openCheckboxElt = document.createElement("input");
        this.openCheckboxElt.id = "auto-open-checkbox";
        this.openCheckboxElt.type = "checkbox";
        this.openCheckboxElt.checked = open;
        this.openCheckboxElt.style.margin = "0 0.5em 0 0";
        downElt.appendChild(this.openCheckboxElt);
        var openLabelElt = document.createElement("label");
        openLabelElt.textContent = "Open after creation";
        openLabelElt.setAttribute("for", "auto-open-checkbox");
        openLabelElt.style.flex = "1";
        openLabelElt.style.margin = "0";
        downElt.appendChild(openLabelElt);
        // Buttons
        var buttonsElt = document.createElement("div");
        buttonsElt.className = "buttons";
        downElt.appendChild(buttonsElt);
        var cancelButtonElt = document.createElement("button");
        cancelButtonElt.type = "button";
        cancelButtonElt.textContent = "Cancel";
        cancelButtonElt.className = "cancel-button";
        cancelButtonElt.addEventListener("click", function (event) { event.preventDefault(); _this.cancel(); });
        this.validateButtonElt = document.createElement("button");
        this.validateButtonElt.textContent = "Create";
        this.validateButtonElt.className = "validate-button";
        if (navigator.platform === "Win32") {
            buttonsElt.appendChild(this.validateButtonElt);
            buttonsElt.appendChild(cancelButtonElt);
        }
        else {
            buttonsElt.appendChild(cancelButtonElt);
            buttonsElt.appendChild(this.validateButtonElt);
        }
        this.typeSelectElt.addEventListener("keydown", function (event) { if (event.keyCode === 13 /* Enter */)
            _this.submit(); });
        this.typeSelectElt.addEventListener("dblclick", function (event) { _this.submit(); });
        this.typeSelectElt.focus();
    }
    CreateAssetDialog.prototype.submit = function () {
        if (!_super.prototype.submit.call(this))
            return false;
        this.callback(this.nameInputElt.value, this.typeSelectElt.value, this.openCheckboxElt.checked);
        return true;
    };
    CreateAssetDialog.prototype.cancel = function () {
        _super.prototype.cancel.call(this);
        this.callback(null, null, null);
    };
    return CreateAssetDialog;
})(SupClient.dialogs.BaseDialog);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CreateAssetDialog;

},{}],3:[function(require,module,exports){
/// <reference path="./fuzzy.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var fuzzy = require("fuzzy");
/* tslint:disable */
var TreeView = require("dnd-tree-view");
/* tslint:enable */
var FindAssetDialog = (function (_super) {
    __extends(FindAssetDialog, _super);
    function FindAssetDialog(entries, editorsByAssetType, callback) {
        var _this = this;
        _super.call(this);
        this.entries = entries;
        this.editorsByAssetType = editorsByAssetType;
        this.callback = callback;
        this.entriesByPath = {};
        this.pathsList = [];
        this.pathsWithoutSlashesList = [];
        this.entryElts = [];
        this.onSearchInput = function (event) {
            var results = fuzzy.filter(_this.searchElt.value, _this.pathsList);
            var resultsWithoutSlashes = fuzzy.filter(_this.searchElt.value, _this.pathsWithoutSlashesList);
            results = results.concat(resultsWithoutSlashes);
            results.sort(function (a, b) { return b.score - a.score; });
            _this.treeView.clearSelection();
            _this.treeView.treeRoot.innerHTML = "";
            if (results.length === 0)
                return;
            for (var _i = 0; _i < results.length; _i++) {
                var result = results[_i];
                var liElt = _this.entryElts[result.index];
                _this.treeView.append(liElt, "item");
            }
            _this.treeView.addToSelection(_this.treeView.treeRoot.firstChild);
        };
        this.onSearchKeyDown = function (event) {
            if (event.keyCode === 38 /* Up */) {
                event.stopPropagation();
                event.preventDefault();
                _this.treeView._moveVertically(-1);
            }
            else if (event.keyCode === 40 /* Down */) {
                event.stopPropagation();
                event.preventDefault();
                _this.treeView._moveVertically(1);
            }
        };
        this.dialogElt.classList.add("find-asset-dialog");
        this.searchElt = document.createElement("input");
        this.searchElt.type = "search";
        this.searchElt.placeholder = "Search for assets";
        this.formElt.appendChild(this.searchElt);
        this.searchElt.addEventListener("input", this.onSearchInput);
        var treeViewContainer = document.createElement("div");
        treeViewContainer.className = "assets-tree-view";
        this.formElt.appendChild(treeViewContainer);
        this.treeView = new TreeView(treeViewContainer, { multipleSelection: false });
        this.treeView.on("activate", function () { _this.submit(); });
        this.entries.walk(function (node) {
            if (node.type == null)
                return;
            var path = _this.entries.getPathFromId(node.id);
            _this.entriesByPath[path] = node;
            _this.pathsList.push(path);
            _this.pathsWithoutSlashesList.push(path.replace(/\//g, " "));
            var liElt = _this.createEntryElement(node);
            _this.entryElts.push(liElt);
            _this.treeView.append(liElt, "item");
        });
        this.treeView.addToSelection(this.treeView.treeRoot.firstChild);
        this.searchElt.addEventListener("keydown", this.onSearchKeyDown);
        this.searchElt.focus();
    }
    FindAssetDialog.prototype.createEntryElement = function (entry) {
        var liElt = document.createElement("li");
        liElt.dataset["id"] = entry.id;
        var iconElt = document.createElement("img");
        iconElt.draggable = false;
        iconElt.src = "/systems/" + SupCore.system.name + "/plugins/" + this.editorsByAssetType[entry.type].pluginPath + "/editors/" + entry.type + "/icon.svg";
        liElt.appendChild(iconElt);
        var nameSpan = document.createElement("span");
        nameSpan.className = "name";
        nameSpan.textContent = this.entries.getPathFromId(entry.id);
        liElt.appendChild(nameSpan);
        return liElt;
    };
    FindAssetDialog.prototype.submit = function () {
        if (this.treeView.selectedNodes.length === 0)
            return false;
        if (!_super.prototype.submit.call(this))
            return false;
        this.callback(this.treeView.selectedNodes[0].dataset["id"]);
        return true;
    };
    FindAssetDialog.prototype.cancel = function () {
        _super.prototype.cancel.call(this);
        this.callback(null);
    };
    return FindAssetDialog;
})(SupClient.dialogs.BaseDialog);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FindAssetDialog;

},{"dnd-tree-view":6,"fuzzy":8}],4:[function(require,module,exports){
if (SupClient.isApp) {
    var nodeRequire = require;
    var remote = nodeRequire("remote");
    var win = remote.getCurrentWindow();
    function onMinimizeWindowClick() { win.minimize(); }
    function onMaximizeWindowClick() {
        var maximized = screen.availHeight <= win.getSize()[1];
        if (maximized)
            win.unmaximize();
        else
            win.maximize();
    }
    function onCloseWindowClick() { window.close(); }
    document.querySelector(".controls .minimize").addEventListener("click", onMinimizeWindowClick);
    document.querySelector(".controls .maximize").addEventListener("click", onMaximizeWindowClick);
    document.querySelector(".controls .close").addEventListener("click", onCloseWindowClick);
    var link = document.querySelector("a.superpowers");
    if (link != null)
        link.addEventListener("click", function (event) {
            event.preventDefault();
            var shell = nodeRequire("shell");
            shell.openExternal(event.target.href);
        });
}

},{}],5:[function(require,module,exports){
(function (process,global){
/*!
 * async
 * https://github.com/caolan/async
 *
 * Copyright 2010-2014 Caolan McMahon
 * Released under the MIT license
 */
(function () {

    var async = {};
    function noop() {}
    function identity(v) {
        return v;
    }
    function toBool(v) {
        return !!v;
    }
    function notId(v) {
        return !v;
    }

    // global on the server, window in the browser
    var previous_async;

    // Establish the root object, `window` (`self`) in the browser, `global`
    // on the server, or `this` in some virtual machines. We use `self`
    // instead of `window` for `WebWorker` support.
    var root = typeof self === 'object' && self.self === self && self ||
            typeof global === 'object' && global.global === global && global ||
            this;

    if (root != null) {
        previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        return function() {
            if (fn === null) throw new Error("Callback was already called.");
            fn.apply(this, arguments);
            fn = null;
        };
    }

    function _once(fn) {
        return function() {
            if (fn === null) return;
            fn.apply(this, arguments);
            fn = null;
        };
    }

    //// cross-browser compatiblity functions ////

    var _toString = Object.prototype.toString;

    var _isArray = Array.isArray || function (obj) {
        return _toString.call(obj) === '[object Array]';
    };

    // Ported from underscore.js isObject
    var _isObject = function(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    };

    function _isArrayLike(arr) {
        return _isArray(arr) || (
            // has a positive integer length property
            typeof arr.length === "number" &&
            arr.length >= 0 &&
            arr.length % 1 === 0
        );
    }

    function _arrayEach(arr, iterator) {
        var index = -1,
            length = arr.length;

        while (++index < length) {
            iterator(arr[index], index, arr);
        }
    }

    function _map(arr, iterator) {
        var index = -1,
            length = arr.length,
            result = Array(length);

        while (++index < length) {
            result[index] = iterator(arr[index], index, arr);
        }
        return result;
    }

    function _range(count) {
        return _map(Array(count), function (v, i) { return i; });
    }

    function _reduce(arr, iterator, memo) {
        _arrayEach(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    }

    function _forEachOf(object, iterator) {
        _arrayEach(_keys(object), function (key) {
            iterator(object[key], key);
        });
    }

    function _indexOf(arr, item) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === item) return i;
        }
        return -1;
    }

    var _keys = Object.keys || function (obj) {
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    function _keyIterator(coll) {
        var i = -1;
        var len;
        var keys;
        if (_isArrayLike(coll)) {
            len = coll.length;
            return function next() {
                i++;
                return i < len ? i : null;
            };
        } else {
            keys = _keys(coll);
            len = keys.length;
            return function next() {
                i++;
                return i < len ? keys[i] : null;
            };
        }
    }

    // Similar to ES6's rest param (http://ariya.ofilabs.com/2013/03/es6-and-rest-parameter.html)
    // This accumulates the arguments passed into an array, after a given index.
    // From underscore.js (https://github.com/jashkenas/underscore/pull/2140).
    function _restParam(func, startIndex) {
        startIndex = startIndex == null ? func.length - 1 : +startIndex;
        return function() {
            var length = Math.max(arguments.length - startIndex, 0);
            var rest = Array(length);
            for (var index = 0; index < length; index++) {
                rest[index] = arguments[index + startIndex];
            }
            switch (startIndex) {
                case 0: return func.call(this, rest);
                case 1: return func.call(this, arguments[0], rest);
            }
            // Currently unused but handle cases outside of the switch statement:
            // var args = Array(startIndex + 1);
            // for (index = 0; index < startIndex; index++) {
            //     args[index] = arguments[index];
            // }
            // args[startIndex] = rest;
            // return func.apply(this, args);
        };
    }

    function _withoutIndex(iterator) {
        return function (value, index, callback) {
            return iterator(value, callback);
        };
    }

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////

    // capture the global reference to guard against fakeTimer mocks
    var _setImmediate = typeof setImmediate === 'function' && setImmediate;

    var _delay = _setImmediate ? function(fn) {
        // not a direct alias for IE10 compatibility
        _setImmediate(fn);
    } : function(fn) {
        setTimeout(fn, 0);
    };

    if (typeof process === 'object' && typeof process.nextTick === 'function') {
        async.nextTick = process.nextTick;
    } else {
        async.nextTick = _delay;
    }
    async.setImmediate = _setImmediate ? _delay : async.nextTick;


    async.forEach =
    async.each = function (arr, iterator, callback) {
        return async.eachOf(arr, _withoutIndex(iterator), callback);
    };

    async.forEachSeries =
    async.eachSeries = function (arr, iterator, callback) {
        return async.eachOfSeries(arr, _withoutIndex(iterator), callback);
    };


    async.forEachLimit =
    async.eachLimit = function (arr, limit, iterator, callback) {
        return _eachOfLimit(limit)(arr, _withoutIndex(iterator), callback);
    };

    async.forEachOf =
    async.eachOf = function (object, iterator, callback) {
        callback = _once(callback || noop);
        object = object || [];

        var iter = _keyIterator(object);
        var key, completed = 0;

        while ((key = iter()) != null) {
            completed += 1;
            iterator(object[key], key, only_once(done));
        }

        if (completed === 0) callback(null);

        function done(err) {
            completed--;
            if (err) {
                callback(err);
            }
            // Check key is null in case iterator isn't exhausted
            // and done resolved synchronously.
            else if (key === null && completed <= 0) {
                callback(null);
            }
        }
    };

    async.forEachOfSeries =
    async.eachOfSeries = function (obj, iterator, callback) {
        callback = _once(callback || noop);
        obj = obj || [];
        var nextKey = _keyIterator(obj);
        var key = nextKey();
        function iterate() {
            var sync = true;
            if (key === null) {
                return callback(null);
            }
            iterator(obj[key], key, only_once(function (err) {
                if (err) {
                    callback(err);
                }
                else {
                    key = nextKey();
                    if (key === null) {
                        return callback(null);
                    } else {
                        if (sync) {
                            async.setImmediate(iterate);
                        } else {
                            iterate();
                        }
                    }
                }
            }));
            sync = false;
        }
        iterate();
    };



    async.forEachOfLimit =
    async.eachOfLimit = function (obj, limit, iterator, callback) {
        _eachOfLimit(limit)(obj, iterator, callback);
    };

    function _eachOfLimit(limit) {

        return function (obj, iterator, callback) {
            callback = _once(callback || noop);
            obj = obj || [];
            var nextKey = _keyIterator(obj);
            if (limit <= 0) {
                return callback(null);
            }
            var done = false;
            var running = 0;
            var errored = false;

            (function replenish () {
                if (done && running <= 0) {
                    return callback(null);
                }

                while (running < limit && !errored) {
                    var key = nextKey();
                    if (key === null) {
                        done = true;
                        if (running <= 0) {
                            callback(null);
                        }
                        return;
                    }
                    running += 1;
                    iterator(obj[key], key, only_once(function (err) {
                        running -= 1;
                        if (err) {
                            callback(err);
                            errored = true;
                        }
                        else {
                            replenish();
                        }
                    }));
                }
            })();
        };
    }


    function doParallel(fn) {
        return function (obj, iterator, callback) {
            return fn(async.eachOf, obj, iterator, callback);
        };
    }
    function doParallelLimit(fn) {
        return function (obj, limit, iterator, callback) {
            return fn(_eachOfLimit(limit), obj, iterator, callback);
        };
    }
    function doSeries(fn) {
        return function (obj, iterator, callback) {
            return fn(async.eachOfSeries, obj, iterator, callback);
        };
    }

    function _asyncMap(eachfn, arr, iterator, callback) {
        callback = _once(callback || noop);
        arr = arr || [];
        var results = _isArrayLike(arr) ? [] : {};
        eachfn(arr, function (value, index, callback) {
            iterator(value, function (err, v) {
                results[index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    }

    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = doParallelLimit(_asyncMap);

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.inject =
    async.foldl =
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachOfSeries(arr, function (x, i, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };

    async.foldr =
    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, identity).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };

    async.transform = function (arr, memo, iterator, callback) {
        if (arguments.length === 3) {
            callback = iterator;
            iterator = memo;
            memo = _isArray(arr) ? [] : {};
        }

        async.eachOf(arr, function(v, k, cb) {
            iterator(memo, v, k, cb);
        }, function(err) {
            callback(err, memo);
        });
    };

    function _filter(eachfn, arr, iterator, callback) {
        var results = [];
        eachfn(arr, function (x, index, callback) {
            iterator(x, function (v) {
                if (v) {
                    results.push({index: index, value: x});
                }
                callback();
            });
        }, function () {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    }

    async.select =
    async.filter = doParallel(_filter);

    async.selectLimit =
    async.filterLimit = doParallelLimit(_filter);

    async.selectSeries =
    async.filterSeries = doSeries(_filter);

    function _reject(eachfn, arr, iterator, callback) {
        _filter(eachfn, arr, function(value, cb) {
            iterator(value, function(v) {
                cb(!v);
            });
        }, callback);
    }
    async.reject = doParallel(_reject);
    async.rejectLimit = doParallelLimit(_reject);
    async.rejectSeries = doSeries(_reject);

    function _createTester(eachfn, check, getResult) {
        return function(arr, limit, iterator, cb) {
            function done() {
                if (cb) cb(getResult(false, void 0));
            }
            function iteratee(x, _, callback) {
                if (!cb) return callback();
                iterator(x, function (v) {
                    if (cb && check(v)) {
                        cb(getResult(true, x));
                        cb = iterator = false;
                    }
                    callback();
                });
            }
            if (arguments.length > 3) {
                eachfn(arr, limit, iteratee, done);
            } else {
                cb = iterator;
                iterator = limit;
                eachfn(arr, iteratee, done);
            }
        };
    }

    async.any =
    async.some = _createTester(async.eachOf, toBool, identity);

    async.someLimit = _createTester(async.eachOfLimit, toBool, identity);

    async.all =
    async.every = _createTester(async.eachOf, notId, notId);

    async.everyLimit = _createTester(async.eachOfLimit, notId, notId);

    function _findGetResult(v, x) {
        return x;
    }
    async.detect = _createTester(async.eachOf, identity, _findGetResult);
    async.detectSeries = _createTester(async.eachOfSeries, identity, _findGetResult);
    async.detectLimit = _createTester(async.eachOfLimit, identity, _findGetResult);

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                callback(null, _map(results.sort(comparator), function (x) {
                    return x.value;
                }));
            }

        });

        function comparator(left, right) {
            var a = left.criteria, b = right.criteria;
            return a < b ? -1 : a > b ? 1 : 0;
        }
    };

    async.auto = function (tasks, concurrency, callback) {
        if (!callback) {
            // concurrency is optional, shift the args.
            callback = concurrency;
            concurrency = null;
        }
        callback = _once(callback || noop);
        var keys = _keys(tasks);
        var remainingTasks = keys.length;
        if (!remainingTasks) {
            return callback(null);
        }
        if (!concurrency) {
            concurrency = remainingTasks;
        }

        var results = {};
        var runningTasks = 0;

        var listeners = [];
        function addListener(fn) {
            listeners.unshift(fn);
        }
        function removeListener(fn) {
            var idx = _indexOf(listeners, fn);
            if (idx >= 0) listeners.splice(idx, 1);
        }
        function taskComplete() {
            remainingTasks--;
            _arrayEach(listeners.slice(0), function (fn) {
                fn();
            });
        }

        addListener(function () {
            if (!remainingTasks) {
                callback(null, results);
            }
        });

        _arrayEach(keys, function (k) {
            var task = _isArray(tasks[k]) ? tasks[k]: [tasks[k]];
            var taskCallback = _restParam(function(err, args) {
                runningTasks--;
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _forEachOf(results, function(val, rkey) {
                        safeResults[rkey] = val;
                    });
                    safeResults[k] = args;
                    callback(err, safeResults);
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            });
            var requires = task.slice(0, task.length - 1);
            // prevent dead-locks
            var len = requires.length;
            var dep;
            while (len--) {
                if (!(dep = tasks[requires[len]])) {
                    throw new Error('Has inexistant dependency');
                }
                if (_isArray(dep) && _indexOf(dep, k) >= 0) {
                    throw new Error('Has cyclic dependencies');
                }
            }
            function ready() {
                return runningTasks < concurrency && _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            }
            if (ready()) {
                runningTasks++;
                task[task.length - 1](taskCallback, results);
            }
            else {
                addListener(listener);
            }
            function listener() {
                if (ready()) {
                    runningTasks++;
                    removeListener(listener);
                    task[task.length - 1](taskCallback, results);
                }
            }
        });
    };



    async.retry = function(times, task, callback) {
        var DEFAULT_TIMES = 5;
        var DEFAULT_INTERVAL = 0;

        var attempts = [];

        var opts = {
            times: DEFAULT_TIMES,
            interval: DEFAULT_INTERVAL
        };

        function parseTimes(acc, t){
            if(typeof t === 'number'){
                acc.times = parseInt(t, 10) || DEFAULT_TIMES;
            } else if(typeof t === 'object'){
                acc.times = parseInt(t.times, 10) || DEFAULT_TIMES;
                acc.interval = parseInt(t.interval, 10) || DEFAULT_INTERVAL;
            } else {
                throw new Error('Unsupported argument type for \'times\': ' + typeof t);
            }
        }

        var length = arguments.length;
        if (length < 1 || length > 3) {
            throw new Error('Invalid arguments - must be either (task), (task, callback), (times, task) or (times, task, callback)');
        } else if (length <= 2 && typeof times === 'function') {
            callback = task;
            task = times;
        }
        if (typeof times !== 'function') {
            parseTimes(opts, times);
        }
        opts.callback = callback;
        opts.task = task;

        function wrappedTask(wrappedCallback, wrappedResults) {
            function retryAttempt(task, finalAttempt) {
                return function(seriesCallback) {
                    task(function(err, result){
                        seriesCallback(!err || finalAttempt, {err: err, result: result});
                    }, wrappedResults);
                };
            }

            function retryInterval(interval){
                return function(seriesCallback){
                    setTimeout(function(){
                        seriesCallback(null);
                    }, interval);
                };
            }

            while (opts.times) {

                var finalAttempt = !(opts.times-=1);
                attempts.push(retryAttempt(opts.task, finalAttempt));
                if(!finalAttempt && opts.interval > 0){
                    attempts.push(retryInterval(opts.interval));
                }
            }

            async.series(attempts, function(done, data){
                data = data[data.length - 1];
                (wrappedCallback || opts.callback)(data.err, data.result);
            });
        }

        // If a callback is passed, run this as a controll flow
        return opts.callback ? wrappedTask() : wrappedTask;
    };

    async.waterfall = function (tasks, callback) {
        callback = _once(callback || noop);
        if (!_isArray(tasks)) {
            var err = new Error('First argument to waterfall must be an array of functions');
            return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        function wrapIterator(iterator) {
            return _restParam(function (err, args) {
                if (err) {
                    callback.apply(null, [err].concat(args));
                }
                else {
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    ensureAsync(iterator).apply(null, args);
                }
            });
        }
        wrapIterator(async.iterator(tasks))();
    };

    function _parallel(eachfn, tasks, callback) {
        callback = callback || noop;
        var results = _isArrayLike(tasks) ? [] : {};

        eachfn(tasks, function (task, key, callback) {
            task(_restParam(function (err, args) {
                if (args.length <= 1) {
                    args = args[0];
                }
                results[key] = args;
                callback(err);
            }));
        }, function (err) {
            callback(err, results);
        });
    }

    async.parallel = function (tasks, callback) {
        _parallel(async.eachOf, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel(_eachOfLimit(limit), tasks, callback);
    };

    async.series = function(tasks, callback) {
        _parallel(async.eachOfSeries, tasks, callback);
    };

    async.iterator = function (tasks) {
        function makeCallback(index) {
            function fn() {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            }
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        }
        return makeCallback(0);
    };

    async.apply = _restParam(function (fn, args) {
        return _restParam(function (callArgs) {
            return fn.apply(
                null, args.concat(callArgs)
            );
        });
    });

    function _concat(eachfn, arr, fn, callback) {
        var result = [];
        eachfn(arr, function (x, index, cb) {
            fn(x, function (err, y) {
                result = result.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, result);
        });
    }
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        callback = callback || noop;
        if (test()) {
            var next = _restParam(function(err, args) {
                if (err) {
                    callback(err);
                } else if (test.apply(this, args)) {
                    iterator(next);
                } else {
                    callback(null);
                }
            });
            iterator(next);
        } else {
            callback(null);
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        var calls = 0;
        return async.whilst(function() {
            return ++calls <= 1 || test.apply(this, arguments);
        }, iterator, callback);
    };

    async.until = function (test, iterator, callback) {
        return async.whilst(function() {
            return !test.apply(this, arguments);
        }, iterator, callback);
    };

    async.doUntil = function (iterator, test, callback) {
        return async.doWhilst(iterator, function() {
            return !test.apply(this, arguments);
        }, callback);
    };

    async.during = function (test, iterator, callback) {
        callback = callback || noop;

        var next = _restParam(function(err, args) {
            if (err) {
                callback(err);
            } else {
                args.push(check);
                test.apply(this, args);
            }
        });

        var check = function(err, truth) {
            if (err) {
                callback(err);
            } else if (truth) {
                iterator(next);
            } else {
                callback(null);
            }
        };

        test(check);
    };

    async.doDuring = function (iterator, test, callback) {
        var calls = 0;
        async.during(function(next) {
            if (calls++ < 1) {
                next(null, true);
            } else {
                test.apply(this, arguments);
            }
        }, iterator, callback);
    };

    function _queue(worker, concurrency, payload) {
        if (concurrency == null) {
            concurrency = 1;
        }
        else if(concurrency === 0) {
            throw new Error('Concurrency must not be zero');
        }
        function _insert(q, data, pos, callback) {
            if (callback != null && typeof callback !== "function") {
                throw new Error("task callback must be a function");
            }
            q.started = true;
            if (!_isArray(data)) {
                data = [data];
            }
            if(data.length === 0 && q.idle()) {
                // call drain immediately if there are no tasks
                return async.setImmediate(function() {
                    q.drain();
                });
            }
            _arrayEach(data, function(task) {
                var item = {
                    data: task,
                    callback: callback || noop
                };

                if (pos) {
                    q.tasks.unshift(item);
                } else {
                    q.tasks.push(item);
                }

                if (q.tasks.length === q.concurrency) {
                    q.saturated();
                }
            });
            async.setImmediate(q.process);
        }
        function _next(q, tasks) {
            return function(){
                workers -= 1;

                var removed = false;
                var args = arguments;
                _arrayEach(tasks, function (task) {
                    _arrayEach(workersList, function (worker, index) {
                        if (worker === task && !removed) {
                            workersList.splice(index, 1);
                            removed = true;
                        }
                    });

                    task.callback.apply(task, args);
                });
                if (q.tasks.length + workers === 0) {
                    q.drain();
                }
                q.process();
            };
        }

        var workers = 0;
        var workersList = [];
        var q = {
            tasks: [],
            concurrency: concurrency,
            payload: payload,
            saturated: noop,
            empty: noop,
            drain: noop,
            started: false,
            paused: false,
            push: function (data, callback) {
                _insert(q, data, false, callback);
            },
            kill: function () {
                q.drain = noop;
                q.tasks = [];
            },
            unshift: function (data, callback) {
                _insert(q, data, true, callback);
            },
            process: function () {
                if (!q.paused && workers < q.concurrency && q.tasks.length) {
                    while(workers < q.concurrency && q.tasks.length){
                        var tasks = q.payload ?
                            q.tasks.splice(0, q.payload) :
                            q.tasks.splice(0, q.tasks.length);

                        var data = _map(tasks, function (task) {
                            return task.data;
                        });

                        if (q.tasks.length === 0) {
                            q.empty();
                        }
                        workers += 1;
                        workersList.push(tasks[0]);
                        var cb = only_once(_next(q, tasks));
                        worker(data, cb);
                    }
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            },
            workersList: function () {
                return workersList;
            },
            idle: function() {
                return q.tasks.length + workers === 0;
            },
            pause: function () {
                q.paused = true;
            },
            resume: function () {
                if (q.paused === false) { return; }
                q.paused = false;
                var resumeCount = Math.min(q.concurrency, q.tasks.length);
                // Need to call q.process once per concurrent
                // worker to preserve full concurrency after pause
                for (var w = 1; w <= resumeCount; w++) {
                    async.setImmediate(q.process);
                }
            }
        };
        return q;
    }

    async.queue = function (worker, concurrency) {
        var q = _queue(function (items, cb) {
            worker(items[0], cb);
        }, concurrency, 1);

        return q;
    };

    async.priorityQueue = function (worker, concurrency) {

        function _compareTasks(a, b){
            return a.priority - b.priority;
        }

        function _binarySearch(sequence, item, compare) {
            var beg = -1,
                end = sequence.length - 1;
            while (beg < end) {
                var mid = beg + ((end - beg + 1) >>> 1);
                if (compare(item, sequence[mid]) >= 0) {
                    beg = mid;
                } else {
                    end = mid - 1;
                }
            }
            return beg;
        }

        function _insert(q, data, priority, callback) {
            if (callback != null && typeof callback !== "function") {
                throw new Error("task callback must be a function");
            }
            q.started = true;
            if (!_isArray(data)) {
                data = [data];
            }
            if(data.length === 0) {
                // call drain immediately if there are no tasks
                return async.setImmediate(function() {
                    q.drain();
                });
            }
            _arrayEach(data, function(task) {
                var item = {
                    data: task,
                    priority: priority,
                    callback: typeof callback === 'function' ? callback : noop
                };

                q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);

                if (q.tasks.length === q.concurrency) {
                    q.saturated();
                }
                async.setImmediate(q.process);
            });
        }

        // Start with a normal queue
        var q = async.queue(worker, concurrency);

        // Override push to accept second parameter representing priority
        q.push = function (data, priority, callback) {
            _insert(q, data, priority, callback);
        };

        // Remove unshift function
        delete q.unshift;

        return q;
    };

    async.cargo = function (worker, payload) {
        return _queue(worker, 1, payload);
    };

    function _console_fn(name) {
        return _restParam(function (fn, args) {
            fn.apply(null, args.concat([_restParam(function (err, args) {
                if (typeof console === 'object') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _arrayEach(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            })]));
        });
    }
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || identity;
        var memoized = _restParam(function memoized(args) {
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                async.setImmediate(function () {
                    callback.apply(null, memo[key]);
                });
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([_restParam(function (args) {
                    memo[key] = args;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                        q[i].apply(null, args);
                    }
                })]));
            }
        });
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
        return function () {
            return (fn.unmemoized || fn).apply(null, arguments);
        };
    };

    function _times(mapper) {
        return function (count, iterator, callback) {
            mapper(_range(count), iterator, callback);
        };
    }

    async.times = _times(async.map);
    async.timesSeries = _times(async.mapSeries);
    async.timesLimit = function (count, limit, iterator, callback) {
        return async.mapLimit(_range(count), limit, iterator, callback);
    };

    async.seq = function (/* functions... */) {
        var fns = arguments;
        return _restParam(function (args) {
            var that = this;

            var callback = args[args.length - 1];
            if (typeof callback == 'function') {
                args.pop();
            } else {
                callback = noop;
            }

            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([_restParam(function (err, nextargs) {
                    cb(err, nextargs);
                })]));
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        });
    };

    async.compose = function (/* functions... */) {
        return async.seq.apply(null, Array.prototype.reverse.call(arguments));
    };


    function _applyEach(eachfn) {
        return _restParam(function(fns, args) {
            var go = _restParam(function(args) {
                var that = this;
                var callback = args.pop();
                return eachfn(fns, function (fn, _, cb) {
                    fn.apply(that, args.concat([cb]));
                },
                callback);
            });
            if (args.length) {
                return go.apply(this, args);
            }
            else {
                return go;
            }
        });
    }

    async.applyEach = _applyEach(async.eachOf);
    async.applyEachSeries = _applyEach(async.eachOfSeries);


    async.forever = function (fn, callback) {
        var done = only_once(callback || noop);
        var task = ensureAsync(fn);
        function next(err) {
            if (err) {
                return done(err);
            }
            task(next);
        }
        next();
    };

    function ensureAsync(fn) {
        return _restParam(function (args) {
            var callback = args.pop();
            args.push(function () {
                var innerArgs = arguments;
                if (sync) {
                    async.setImmediate(function () {
                        callback.apply(null, innerArgs);
                    });
                } else {
                    callback.apply(null, innerArgs);
                }
            });
            var sync = true;
            fn.apply(this, args);
            sync = false;
        });
    }

    async.ensureAsync = ensureAsync;

    async.constant = _restParam(function(values) {
        var args = [null].concat(values);
        return function (callback) {
            return callback.apply(this, args);
        };
    });

    async.wrapSync =
    async.asyncify = function asyncify(func) {
        return _restParam(function (args) {
            var callback = args.pop();
            var result;
            try {
                result = func.apply(this, args);
            } catch (e) {
                return callback(e);
            }
            // if result is Promise object
            if (_isObject(result) && typeof result.then === "function") {
                result.then(function(value) {
                    callback(null, value);
                })["catch"](function(err) {
                    callback(err.message ? err : new Error(err));
                });
            } else {
                callback(null, result);
            }
        });
    };

    // Node.js
    if (typeof module === 'object' && module.exports) {
        module.exports = async;
    }
    // AMD / RequireJS
    else if (typeof define === 'function' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":10}],6:[function(require,module,exports){
(function (global){
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.TreeView = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../lib/TreeView.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var events_1 = require("events");
var TreeView = (function (_super) {
    __extends(TreeView, _super);
    function TreeView(container, options) {
        var _this = this;
        _super.call(this);
        this._onClick = function (event) {
            // Toggle groups
            var element = event.target;
            if (element.className === "toggle") {
                if (element.parentElement.tagName === "LI" && element.parentElement.classList.contains("group")) {
                    element.parentElement.classList.toggle("collapsed");
                    return;
                }
            }
            // Update selection
            if (_this._updateSelection(event))
                _this.emit("selectionChange");
        };
        this._onDoubleClick = function (event) {
            if (_this.selectedNodes.length !== 1)
                return;
            var element = event.target;
            if (element.className === "toggle")
                return;
            _this.emit("activate");
        };
        this._onKeyDown = function (event) {
            if (document.activeElement !== _this.treeRoot)
                return;
            if (_this._firstSelectedNode == null) {
                // TODO: Remove once we have this._focusedNode
                if (event.keyCode === 40) {
                    _this.addToSelection(_this.treeRoot.firstElementChild);
                    event.preventDefault();
                }
                return;
            }
            switch (event.keyCode) {
                case 38: // up
                case 40:
                    _this._moveVertically(event.keyCode === 40 ? 1 : -1);
                    event.preventDefault();
                    break;
                case 37: // left
                case 39:
                    _this._moveHorizontally(event.keyCode == 39 ? 1 : -1);
                    event.preventDefault();
                    break;
                case 13:
                    if (_this.selectedNodes.length !== 1)
                        return;
                    _this.emit("activate");
                    event.preventDefault();
                    break;
            }
        };
        this._moveHorizontally = function (offset) {
            // TODO: this._focusedNode;
            var node = _this._firstSelectedNode;
            if (offset === -1) {
                if (!node.classList.contains("group") || node.classList.contains("collapsed")) {
                    if (!node.parentElement.classList.contains("children"))
                        return;
                    node = node.parentElement.previousElementSibling;
                }
                else if (node.classList.contains("group")) {
                    node.classList.add("collapsed");
                }
            }
            else {
                if (node.classList.contains("group")) {
                    if (node.classList.contains("collapsed"))
                        node.classList.remove("collapsed");
                    else
                        node = node.nextSibling.firstChild;
                }
            }
            if (node == null)
                return;
            _this.clearSelection();
            _this.addToSelection(node);
            _this.scrollIntoView(node);
            _this.emit("selectionChange");
        };
        this._onDragStart = function (event) {
            var element = event.target;
            if (element.tagName !== "LI")
                return false;
            if (!element.classList.contains("item") && !element.classList.contains("group"))
                return false;
            // NOTE: Required for Firefox to start the actual dragging
            // "try" is required for IE11 to not raise an exception
            try {
                event.dataTransfer.setData("text/plain", element.dataset.dndText ? element.dataset.dndText : null);
            }
            catch (e) { }
            if (_this.selectedNodes.indexOf(element) === -1) {
                _this.clearSelection();
                _this.addToSelection(element);
                _this.emit("selectionChange");
            }
            return true;
        };
        this._onDragOver = function (event) {
            if (_this.selectedNodes.length === 0)
                return false;
            var dropInfo = _this._getDropInfo(event);
            // Prevent dropping onto null or descendant
            if (dropInfo == null)
                return false;
            if (dropInfo.where === "inside" && _this.selectedNodes.indexOf(dropInfo.target) !== -1)
                return false;
            for (var _i = 0, _a = _this.selectedNodes; _i < _a.length; _i++) {
                var selectedNode = _a[_i];
                if (selectedNode.classList.contains("group") && selectedNode.nextSibling.contains(dropInfo.target))
                    return false;
            }
            _this._hasDraggedOverAfterLeaving = true;
            _this._clearDropClasses();
            dropInfo.target.classList.add("drop-" + dropInfo.where);
            event.preventDefault();
        };
        this._onDragLeave = function (event) {
            _this._hasDraggedOverAfterLeaving = false;
            setTimeout(function () { if (!_this._hasDraggedOverAfterLeaving)
                _this._clearDropClasses(); }, 300);
        };
        this._onDrop = function (event) {
            event.preventDefault();
            if (_this.selectedNodes.length === 0)
                return;
            var dropInfo = _this._getDropInfo(event);
            if (dropInfo == null)
                return;
            _this._clearDropClasses();
            var children = _this.selectedNodes[0].parentElement.children;
            var orderedNodes = [];
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                if (_this.selectedNodes.indexOf(child) !== -1)
                    orderedNodes.push(child);
            }
            var reparent = (_this.dropCallback != null) ? _this.dropCallback(dropInfo, orderedNodes) : true;
            if (!reparent)
                return;
            var newParent;
            var referenceElt;
            switch (dropInfo.where) {
                case "inside":
                    if (!dropInfo.target.classList.contains("group"))
                        return;
                    newParent = dropInfo.target.nextSibling;
                    referenceElt = newParent.firstChild;
                    break;
                case "below":
                    newParent = dropInfo.target.parentElement;
                    referenceElt = dropInfo.target.nextSibling;
                    if (referenceElt != null && referenceElt.tagName === "OL")
                        referenceElt = referenceElt.nextSibling;
                    break;
                case "above":
                    newParent = dropInfo.target.parentElement;
                    referenceElt = dropInfo.target;
                    break;
            }
            var draggedChildren;
            for (var _i = 0; _i < orderedNodes.length; _i++) {
                var selectedNode = orderedNodes[_i];
                if (selectedNode.classList.contains("group")) {
                    draggedChildren = selectedNode.nextSibling;
                    draggedChildren.parentElement.removeChild(draggedChildren);
                }
                if (referenceElt === selectedNode) {
                    referenceElt = selectedNode.nextSibling;
                }
                selectedNode.parentElement.removeChild(selectedNode);
                newParent.insertBefore(selectedNode, referenceElt);
                referenceElt = selectedNode.nextSibling;
                if (draggedChildren != null) {
                    newParent.insertBefore(draggedChildren, referenceElt);
                    referenceElt = draggedChildren.nextSibling;
                }
            }
        };
        if (options == null)
            options = {};
        this.multipleSelection = (options.multipleSelection != null) ? options.multipleSelection : true;
        this.dropCallback = options.dropCallback;
        this.treeRoot = document.createElement("ol");
        this.treeRoot.tabIndex = 0;
        this.treeRoot.classList.add("tree");
        container.appendChild(this.treeRoot);
        this.selectedNodes = [];
        this._firstSelectedNode = null;
        this.treeRoot.addEventListener("click", this._onClick);
        this.treeRoot.addEventListener("dblclick", this._onDoubleClick);
        this.treeRoot.addEventListener("keydown", this._onKeyDown);
        container.addEventListener("keydown", function (event) {
            if (event.keyCode === 37 || event.keyCode === 39)
                event.preventDefault();
        });
        if (this.dropCallback != null) {
            this.treeRoot.addEventListener("dragstart", this._onDragStart);
            this.treeRoot.addEventListener("dragover", this._onDragOver);
            this.treeRoot.addEventListener("dragleave", this._onDragLeave);
            this.treeRoot.addEventListener("drop", this._onDrop);
        }
    }
    TreeView.prototype.clearSelection = function () {
        for (var _i = 0, _a = this.selectedNodes; _i < _a.length; _i++) {
            var selectedNode = _a[_i];
            selectedNode.classList.remove("selected");
        }
        this.selectedNodes.length = 0;
        this._firstSelectedNode = null;
    };
    TreeView.prototype.addToSelection = function (element) {
        if (this.selectedNodes.indexOf(element) !== -1)
            return;
        this.selectedNodes.push(element);
        element.classList.add("selected");
        if (this.selectedNodes.length === 1)
            this._firstSelectedNode = element;
    };
    TreeView.prototype.scrollIntoView = function (element) {
        var elementRect = element.getBoundingClientRect();
        var containerRect = this.treeRoot.parentElement.getBoundingClientRect();
        if (elementRect.top < containerRect.top)
            element.scrollIntoView(true);
        else if (elementRect.bottom > containerRect.bottom)
            element.scrollIntoView(false);
    };
    TreeView.prototype.append = function (element, type, parentGroupElement) {
        if (type !== "item" && type !== "group")
            throw new Error("Invalid type");
        var childrenElt;
        var siblingsElt;
        if (parentGroupElement != null) {
            if (parentGroupElement.tagName !== "LI" || !parentGroupElement.classList.contains("group"))
                throw new Error("Invalid parent group");
            siblingsElt = parentGroupElement.nextSibling;
        }
        else {
            siblingsElt = this.treeRoot;
        }
        if (!element.classList.contains(type)) {
            element.classList.add(type);
            if (this.dropCallback != null)
                element.draggable = true;
            if (type === "group") {
                var toggleElt = document.createElement("div");
                toggleElt.classList.add("toggle");
                element.insertBefore(toggleElt, element.firstChild);
                childrenElt = document.createElement("ol");
                childrenElt.classList.add("children");
            }
        }
        else if (type === "group") {
            childrenElt = element.nextSibling;
        }
        siblingsElt.appendChild(element);
        if (childrenElt != null)
            siblingsElt.appendChild(childrenElt);
        return element;
    };
    TreeView.prototype.insertBefore = function (element, type, referenceElement) {
        if (type !== "item" && type !== "group")
            throw new Error("Invalid type");
        if (referenceElement == null)
            throw new Error("A reference element is required");
        if (referenceElement.tagName !== "LI")
            throw new Error("Invalid reference element");
        var childrenElt;
        if (!element.classList.contains(type)) {
            element.classList.add(type);
            if (this.dropCallback != null)
                element.draggable = true;
            if (type === "group") {
                var toggleElt = document.createElement("div");
                toggleElt.classList.add("toggle");
                element.insertBefore(toggleElt, element.firstChild);
                childrenElt = document.createElement("ol");
                childrenElt.classList.add("children");
            }
        }
        else if (type === "group") {
            childrenElt = element.nextSibling;
        }
        referenceElement.parentElement.insertBefore(element, referenceElement);
        if (childrenElt != null)
            referenceElement.parentElement.insertBefore(childrenElt, element.nextSibling);
        return element;
    };
    TreeView.prototype.insertAt = function (element, type, index, parentElement) {
        var referenceElt;
        if (index != null) {
            referenceElt =
                (parentElement != null)
                    ? parentElement.nextSibling.querySelector(":scope > li:nth-of-type(" + (index + 1) + ")")
                    : this.treeRoot.querySelector(":scope > li:nth-of-type(" + (index + 1) + ")");
        }
        if (referenceElt != null)
            this.insertBefore(element, type, referenceElt);
        else
            this.append(element, type, parentElement);
    };
    TreeView.prototype.remove = function (element) {
        var selectedIndex = this.selectedNodes.indexOf(element);
        if (selectedIndex !== -1)
            this.selectedNodes.splice(selectedIndex, 1);
        if (this._firstSelectedNode === element)
            this._firstSelectedNode = this.selectedNodes[0];
        if (element.classList.contains("group")) {
            var childrenElement = element.nextSibling;
            var removedSelectedNodes = [];
            for (var _i = 0, _a = this.selectedNodes; _i < _a.length; _i++) {
                var selectedNode = _a[_i];
                if (childrenElement.contains(selectedNode)) {
                    removedSelectedNodes.push(selectedNode);
                }
            }
            for (var _b = 0; _b < removedSelectedNodes.length; _b++) {
                var removedSelectedNode = removedSelectedNodes[_b];
                this.selectedNodes.splice(this.selectedNodes.indexOf(removedSelectedNode), 1);
                if (this._firstSelectedNode === removedSelectedNode)
                    this._firstSelectedNode = this.selectedNodes[0];
            }
            element.parentElement.removeChild(childrenElement);
        }
        element.parentElement.removeChild(element);
    };
    // Returns whether the selection changed
    TreeView.prototype._updateSelection = function (event) {
        var selectionChanged = false;
        if ((!this.multipleSelection || (!event.shiftKey && !event.ctrlKey)) && this.selectedNodes.length > 0) {
            this.clearSelection();
            selectionChanged = true;
        }
        var ancestorElement = event.target;
        while (ancestorElement.tagName !== "LI" || (!ancestorElement.classList.contains("item") && !ancestorElement.classList.contains("group"))) {
            if (ancestorElement === this.treeRoot)
                return selectionChanged;
            ancestorElement = ancestorElement.parentElement;
        }
        var element = ancestorElement;
        if (this.selectedNodes.length > 0 && this.selectedNodes[0].parentElement !== element.parentElement) {
            return selectionChanged;
        }
        if (this.multipleSelection && event.shiftKey && this.selectedNodes.length > 0) {
            var startElement = this._firstSelectedNode;
            var elements = [];
            var inside = false;
            for (var i = 0; i < element.parentElement.children.length; i++) {
                var child = element.parentElement.children[i];
                if (child === startElement || child === element) {
                    if (inside || startElement === element) {
                        elements.push(child);
                        break;
                    }
                    inside = true;
                }
                if (inside && child.tagName === "LI")
                    elements.push(child);
            }
            this.clearSelection();
            this.selectedNodes = elements;
            this._firstSelectedNode = startElement;
            for (var _i = 0, _a = this.selectedNodes; _i < _a.length; _i++) {
                var selectedNode = _a[_i];
                selectedNode.classList.add("selected");
            }
            return true;
        }
        var index;
        if (event.ctrlKey && (index = this.selectedNodes.indexOf(element)) !== -1) {
            this.selectedNodes.splice(index, 1);
            element.classList.remove("selected");
            if (this._firstSelectedNode === element) {
                this._firstSelectedNode = this.selectedNodes[0];
            }
            return true;
        }
        this.addToSelection(element);
        return true;
    };
    TreeView.prototype._moveVertically = function (offset) {
        // TODO: this._focusedNode;
        var node = this._firstSelectedNode;
        if (offset === -1) {
            if (node.previousElementSibling != null) {
                var target = node.previousElementSibling;
                while (target.classList.contains("children")) {
                    if (!target.previousElementSibling.classList.contains("collapsed") && target.childElementCount > 0)
                        target = target.lastElementChild;
                    else
                        target = target.previousElementSibling;
                }
                node = target;
            }
            else if (node.parentElement.classList.contains("children"))
                node = node.parentElement.previousElementSibling;
            else
                return;
        }
        else {
            var walkUp = false;
            if (node.classList.contains("group")) {
                if (!node.classList.contains("collapsed") && node.nextElementSibling.childElementCount > 0)
                    node = node.nextElementSibling.firstElementChild;
                else if (node.nextElementSibling.nextElementSibling != null)
                    node = node.nextElementSibling.nextElementSibling;
                else
                    walkUp = true;
            }
            else {
                if (node.nextElementSibling != null)
                    node = node.nextElementSibling;
                else
                    walkUp = true;
            }
            if (walkUp) {
                if (node.parentElement.classList.contains("children")) {
                    var target = node.parentElement;
                    while (target.nextElementSibling == null) {
                        target = target.parentElement;
                        if (!target.classList.contains("children"))
                            return;
                    }
                    node = target.nextElementSibling;
                }
                else
                    return;
            }
        }
        if (node == null)
            return;
        this.clearSelection();
        this.addToSelection(node);
        this.scrollIntoView(node);
        this.emit("selectionChange");
    };
    ;
    TreeView.prototype._getDropInfo = function (event) {
        var element = event.target;
        if (element.tagName === "OL" && element.classList.contains("children")) {
            element = element.parentElement;
        }
        if (element === this.treeRoot) {
            element = element.lastChild;
            if (element.tagName === "OL")
                element = element.previousSibling;
            return { target: element, where: "below" };
        }
        while (element.tagName !== "LI" || (!element.classList.contains("item") && !element.classList.contains("group"))) {
            if (element === this.treeRoot)
                return null;
            element = element.parentElement;
        }
        var where = this._getInsertionPoint(element, event.pageY);
        if (where === "below") {
            if (element.classList.contains("item") && element.nextSibling != null && element.nextSibling.tagName === "LI") {
                element = element.nextSibling;
                where = "above";
            }
            else if (element.classList.contains("group") && element.nextSibling.nextSibling != null && element.nextSibling.nextSibling.tagName === "LI") {
                element = element.nextSibling.nextSibling;
                where = "above";
            }
        }
        return { target: element, where: where };
    };
    TreeView.prototype._getInsertionPoint = function (element, y) {
        var rect = element.getBoundingClientRect();
        var offset = y - rect.top;
        if (offset < rect.height / 4)
            return "above";
        if (offset > rect.height * 3 / 4)
            return (element.classList.contains("group") && element.nextSibling.childElementCount > 0) ? "inside" : "below";
        return element.classList.contains("item") ? "below" : "inside";
    };
    TreeView.prototype._clearDropClasses = function () {
        var dropAbove = this.treeRoot.querySelector(".drop-above");
        if (dropAbove != null)
            dropAbove.classList.remove("drop-above");
        var dropInside = this.treeRoot.querySelector(".drop-inside");
        if (dropInside != null)
            dropInside.classList.remove("drop-inside");
        var dropBelow = this.treeRoot.querySelector(".drop-below");
        if (dropBelow != null)
            dropBelow.classList.remove("drop-below");
    };
    return TreeView;
})(events_1.EventEmitter);
module.exports = TreeView;

},{"events":1}]},{},[2])(2)
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"events":7}],7:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],8:[function(require,module,exports){
/*
 * Fuzzy
 * https://github.com/myork/fuzzy
 *
 * Copyright (c) 2012 Matt York
 * Licensed under the MIT license.
 */

(function() {

var root = this;

var fuzzy = {};

// Use in node or in browser
if (typeof exports !== 'undefined') {
  module.exports = fuzzy;
} else {
  root.fuzzy = fuzzy;
}

// Return all elements of `array` that have a fuzzy
// match against `pattern`.
fuzzy.simpleFilter = function(pattern, array) {
  return array.filter(function(string) {
    return fuzzy.test(pattern, string);
  });
};

// Does `pattern` fuzzy match `string`?
fuzzy.test = function(pattern, string) {
  return fuzzy.match(pattern, string) !== null;
};

// If `pattern` matches `string`, wrap each matching character
// in `opts.pre` and `opts.post`. If no match, return null
fuzzy.match = function(pattern, string, opts) {
  opts = opts || {};
  var patternIdx = 0
    , result = []
    , len = string.length
    , totalScore = 0
    , currScore = 0
    // prefix
    , pre = opts.pre || ''
    // suffix
    , post = opts.post || ''
    // String to compare against. This might be a lowercase version of the
    // raw string
    , compareString =  opts.caseSensitive && string || string.toLowerCase()
    , ch, compareChar;

  pattern = opts.caseSensitive && pattern || pattern.toLowerCase();

  // For each character in the string, either add it to the result
  // or wrap in template if it's the next string in the pattern
  for(var idx = 0; idx < len; idx++) {
    ch = string[idx];
    if(compareString[idx] === pattern[patternIdx]) {
      ch = pre + ch + post;
      patternIdx += 1;

      // consecutive characters should increase the score more than linearly
      currScore += 1 + currScore;
    } else {
      currScore = 0;
    }
    totalScore += currScore;
    result[result.length] = ch;
  }

  // return rendered string if we have a match for every char
  if(patternIdx === pattern.length) {
    return {rendered: result.join(''), score: totalScore};
  }

  return null;
};

// The normal entry point. Filters `arr` for matches against `pattern`.
// It returns an array with matching values of the type:
//
//     [{
//         string:   '<b>lah' // The rendered string
//       , index:    2        // The index of the element in `arr`
//       , original: 'blah'   // The original element in `arr`
//     }]
//
// `opts` is an optional argument bag. Details:
//
//    opts = {
//        // string to put before a matching character
//        pre:     '<b>'
//
//        // string to put after matching character
//      , post:    '</b>'
//
//        // Optional function. Input is an entry in the given arr`,
//        // output should be the string to test `pattern` against.
//        // In this example, if `arr = [{crying: 'koala'}]` we would return
//        // 'koala'.
//      , extract: function(arg) { return arg.crying; }
//    }
fuzzy.filter = function(pattern, arr, opts) {
  opts = opts || {};
  return arr
    .reduce(function(prev, element, idx, arr) {
      var str = element;
      if(opts.extract) {
        str = opts.extract(element);
      }
      var rendered = fuzzy.match(pattern, str, opts);
      if(rendered != null) {
        prev[prev.length] = {
            string: rendered.rendered
          , score: rendered.score
          , index: idx
          , original: element
        };
      }
      return prev;
    }, [])

    // Sort by score. Browsers are inconsistent wrt stable/unstable
    // sorting, so force stable by using the index in the case of tie.
    // See http://ofb.net/~sethml/is-sort-stable.html
    .sort(function(a,b) {
      var compare = b.score - a.score;
      if(compare) return compare;
      return a.index - b.index;
    });
};


}());


},{}],9:[function(require,module,exports){
(function (global){
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.PerfectResize = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
/// <reference path="../typings/tsd.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var events = require("events");
var ResizeHandle = (function (_super) {
    __extends(ResizeHandle, _super);
    function ResizeHandle(targetElt, direction, options) {
        var _this = this;
        _super.call(this);
        this.savedSize = null;
        this.onDoubleClick = function (event) {
            if (event.button !== 0 || !_this.handleElt.classList.contains("collapsable"))
                return;
            var size = _this.targetElt.getBoundingClientRect()[_this.horizontal ? "width" : "height"];
            var newSize;
            if (size > 0) {
                _this.savedSize = size;
                newSize = 0;
                _this.targetElt.style.display = "none";
            }
            else {
                newSize = _this.savedSize;
                _this.savedSize = null;
                _this.targetElt.style.display = "";
            }
            if (_this.horizontal)
                _this.targetElt.style.width = newSize + "px";
            else
                _this.targetElt.style.height = newSize + "px";
        };
        this.onMouseDown = function (event) {
            if (event.button !== 0)
                return;
            if (_this.targetElt.style.display === "none")
                return;
            if (_this.handleElt.classList.contains("disabled"))
                return;
            event.preventDefault();
            _this.emit("dragStart");
            var initialSize;
            var startDrag;
            var directionClass;
            if (_this.horizontal) {
                initialSize = _this.targetElt.getBoundingClientRect().width;
                startDrag = event.clientX;
                directionClass = "vertical";
            }
            else {
                initialSize = _this.targetElt.getBoundingClientRect().height;
                startDrag = event.clientY;
                directionClass = "horizontal";
            }
            var dragTarget;
            if (_this.handleElt.setCapture != null) {
                dragTarget = _this.handleElt;
                dragTarget.setCapture();
            }
            else {
                dragTarget = window;
            }
            document.documentElement.classList.add("handle-dragging", directionClass);
            var onMouseMove = function (event) {
                var size = initialSize + (_this.start ? -startDrag : startDrag);
                _this.emit("drag");
                if (_this.horizontal) {
                    size += _this.start ? event.clientX : -event.clientX;
                    _this.targetElt.style.width = size + "px";
                }
                else {
                    size += _this.start ? event.clientY : -event.clientY;
                    _this.targetElt.style.height = size + "px";
                }
            };
            var onMouseUp = function (event) {
                if (dragTarget.releaseCapture != null)
                    dragTarget.releaseCapture();
                document.documentElement.classList.remove("handle-dragging", directionClass);
                dragTarget.removeEventListener("mousemove", onMouseMove);
                dragTarget.removeEventListener("mouseup", onMouseUp);
                _this.emit("dragEnd");
            };
            dragTarget.addEventListener("mousemove", onMouseMove);
            dragTarget.addEventListener("mouseup", onMouseUp);
        };
        if (["left", "right", "top", "bottom"].indexOf(direction) === -1)
            throw new Error("Invalid direction");
        this.horizontal = ["left", "right"].indexOf(direction) !== -1;
        this.start = ["left", "top"].indexOf(direction) !== -1;
        if (options == null)
            options = {};
        this.targetElt = targetElt;
        this.direction = direction;
        this.handleElt = document.createElement("div");
        this.handleElt.classList.add("resize-handle");
        this.handleElt.classList.add(direction);
        if (options.collapsable)
            this.handleElt.classList.add("collapsable");
        if (this.start)
            targetElt.parentNode.insertBefore(this.handleElt, targetElt.nextSibling);
        else
            targetElt.parentNode.insertBefore(this.handleElt, targetElt);
        this.handleElt.addEventListener("dblclick", this.onDoubleClick);
        this.handleElt.addEventListener("mousedown", this.onMouseDown);
    }
    return ResizeHandle;
})(events.EventEmitter);
module.exports = ResizeHandle;

},{"events":1}]},{},[2])(2)
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"events":7}],10:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],11:[function(require,module,exports){
(function (global){
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.TabStrip = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/// <reference path="../typings/tsd.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var events_1 = require("events");
var TabStrip = (function (_super) {
    __extends(TabStrip, _super);
    function TabStrip(container) {
        var _this = this;
        _super.call(this);
        this._onTabMouseUp = function (event) {
            var tabElement = event.target;
            // Only handle middle-click and ignore clicks outside any tab
            if (event.button !== 1 || tabElement.parentElement !== _this.tabsRoot)
                return;
            _this.emit("closeTab", tabElement);
        };
        this._onTabMouseDown = function (event) {
            var tabElement = event.target;
            // Only handle left-click
            if (event.button !== 0 || tabElement.parentElement !== _this.tabsRoot)
                return;
            _this.emit("activateTab", tabElement);
            // Tab reordering
            var tabRect = tabElement.getBoundingClientRect();
            var leftOffsetFromMouse = tabRect.left - event.clientX;
            var hasDragged = false;
            tabElement.classList.add("dragged");
            // FIXME: Hard-coded border?
            tabElement.style.width = (tabRect.width + 1) + "px";
            // NOTE: set/releaseCapture aren"t supported in Chrome yet
            // hence the conditional call
            if (tabElement.setCapture != null)
                tabElement.setCapture();
            var tabPlaceholderElement = document.createElement("li");
            tabPlaceholderElement.style.width = tabRect.width + "px";
            tabPlaceholderElement.className = "drop-placeholder";
            tabElement.parentElement.insertBefore(tabPlaceholderElement, tabElement.nextSibling);
            var updateDraggedTab = function (clientX) {
                var tabsRootRect = _this.tabsRoot.getBoundingClientRect();
                var tabLeft = Math.max(Math.min(clientX + leftOffsetFromMouse, tabsRootRect.right - tabRect.width), tabsRootRect.left);
                if (hasDragged || Math.abs(tabLeft - tabRect.left) >= 10) {
                    hasDragged = true;
                }
                else {
                    tabLeft = tabRect.left;
                }
                tabElement.style.left = tabLeft + "px";
                if (tabLeft < tabPlaceholderElement.getBoundingClientRect().left) {
                    var otherTabElement = tabPlaceholderElement;
                    while (true) {
                        otherTabElement = tabPlaceholderElement.previousSibling;
                        if (otherTabElement === tabElement)
                            otherTabElement = otherTabElement.previousSibling;
                        if (otherTabElement == null)
                            break;
                        var otherTabCenter = otherTabElement.getBoundingClientRect().left + otherTabElement.getBoundingClientRect().width / 2;
                        if (otherTabCenter < tabLeft)
                            break;
                        otherTabElement.parentElement.insertBefore(tabPlaceholderElement, otherTabElement);
                    }
                }
                else {
                    var otherTabElement = tabPlaceholderElement;
                    while (true) {
                        otherTabElement = tabPlaceholderElement.nextSibling;
                        if (otherTabElement === tabElement)
                            otherTabElement = otherTabElement.nextSibling;
                        if (otherTabElement == null)
                            break;
                        var otherTabCenter = otherTabElement.getBoundingClientRect().left + otherTabElement.getBoundingClientRect().width / 2;
                        if (tabLeft + tabRect.width < otherTabCenter)
                            break;
                        otherTabElement.parentElement.insertBefore(tabPlaceholderElement, otherTabElement.nextSibling);
                    }
                }
                if (tabPlaceholderElement.nextSibling === tabElement) {
                    tabElement.parentElement.insertBefore(tabPlaceholderElement, tabElement.nextSibling);
                }
            };
            var onDragTab = function (event) { updateDraggedTab(event.clientX); };
            var onDropTab = function (event) {
                // NOTE: set/releaseCapture aren't supported in Chrome yet
                // hence the conditional call
                if (tabElement.releaseCapture != null)
                    tabElement.releaseCapture();
                if (tabPlaceholderElement.parentElement != null) {
                    _this.tabsRoot.replaceChild(tabElement, tabPlaceholderElement);
                }
                else {
                    _this.tabsRoot.appendChild(tabElement);
                }
                tabElement.classList.remove("dragged");
                tabElement.style.left = "";
                tabElement.style.width = "";
                document.removeEventListener("mousemove", onDragTab);
                document.removeEventListener("mouseup", onDropTab);
            };
            updateDraggedTab(event.clientX);
            document.addEventListener("mousemove", onDragTab);
            document.addEventListener("mouseup", onDropTab);
        };
        this.tabsRoot = document.createElement("ol");
        this.tabsRoot.classList.add("tab-strip");
        container.appendChild(this.tabsRoot);
        this.tabsRoot.addEventListener("mousedown", this._onTabMouseDown);
        this.tabsRoot.addEventListener("mouseup", this._onTabMouseUp);
    }
    return TabStrip;
})(events_1.EventEmitter);
module.exports = TabStrip;

},{"events":2}],2:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}]},{},[1])(1)
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"events":7}]},{},[1]);
