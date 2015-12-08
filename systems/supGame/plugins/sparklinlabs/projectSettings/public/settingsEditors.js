(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var ProjectSettingsEditor_1 = require("./ProjectSettingsEditor");
SupClient.registerPlugin("settingsEditors", "Project", { namespace: "General", editor: ProjectSettingsEditor_1.default });

},{"./ProjectSettingsEditor":2}],2:[function(require,module,exports){
var ProjectSettingsEditor = (function () {
    function ProjectSettingsEditor(container, projectClient) {
        var _this = this;
        this.fields = {};
        this.projectClient = projectClient;
        // Vacuum
        {
            var vacuumContainer = document.createElement("div");
            container.appendChild(vacuumContainer);
            var button = document.createElement("button");
            button.style.marginRight = "0.5em";
            button.textContent = "Delete trashed assets from disk";
            vacuumContainer.appendChild(button);
            var span = document.createElement("span");
            vacuumContainer.appendChild(span);
            button.addEventListener("click", function (event) {
                button.disabled = true;
                _this.projectClient.socket.emit("vacuum:project", function (err, deletedCount) {
                    button.disabled = false;
                    if (err != null) {
                        alert(err);
                        return;
                    }
                    if (deletedCount > 0) {
                        if (deletedCount > 1)
                            span.textContent = deletedCount + " folders were removed.";
                        else
                            span.textContent = "1 folder was removed.";
                    }
                    else
                        span.textContent = "No folder were removed.";
                });
            });
        }
    }
    return ProjectSettingsEditor;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ProjectSettingsEditor;

},{}]},{},[1]);
