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
