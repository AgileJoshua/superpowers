var GameSettingsResource_1 = require("../data/GameSettingsResource");
var GameSettingsEditor = (function () {
    function GameSettingsEditor(container, projectClient) {
        var _this = this;
        this.fields = {};
        this.onEntriesReceived = function (entries) {
            if (_this.resource == null)
                return;
            _this._setStartupScene(_this.resource.pub.startupSceneId);
        };
        this.onResourceReceived = function (resourceId, resource) {
            _this.resource = resource;
            _this._setupCustomLayers();
            for (var setting in resource.pub) {
                if (setting === "formatVersion" || setting === "customLayers")
                    continue;
                if (setting === "startupSceneId") {
                    if (_this.projectClient.entries != null)
                        _this._setStartupScene(resource.pub.startupSceneId);
                }
                else
                    _this.fields[setting].value = resource.pub[setting];
            }
        };
        this.onResourceEdited = function (resourceId, command, propertyName) {
            if (propertyName === "customLayers")
                _this._setupCustomLayers();
            else if (propertyName === "startupSceneId")
                _this._setStartupScene(_this.resource.pub.startupSceneId);
            else
                _this.fields[propertyName].value = _this.resource.pub[propertyName];
        };
        this.onCustomLayerFieldChange = function (event) {
            var index = parseInt(event.target.dataset.customLayerIndex);
            if (index > _this.customLayers.length)
                return;
            if (index === _this.customLayers.length) {
                if (event.target.value === "")
                    return;
                _this.customLayers.push(event.target.value);
            }
            else {
                if (event.target.value === "") {
                    if (index === _this.customLayers.length - 1) {
                        _this.customLayers.pop();
                    }
                    else {
                        alert("Layer name cannot be empty");
                        event.target.value = _this.customLayers[index];
                        return;
                    }
                }
                else {
                    _this.customLayers[index] = event.target.value;
                }
            }
            _this.projectClient.socket.emit("edit:resources", "gameSettings", "setProperty", "customLayers", _this.customLayers, function (err) { if (err != null)
                alert(err); });
        };
        this.projectClient = projectClient;
        var tbody = SupClient.table.createTable(container).tbody;
        this.startupSceneRow = SupClient.table.appendRow(tbody, "Startup scene");
        var startupSceneFields = SupClient.table.appendAssetField(this.startupSceneRow.valueCell, "");
        this.fields["startupSceneId"] = startupSceneFields.textField;
        this.startupSceneButton = startupSceneFields.buttonElt;
        this.startupSceneButton.disabled = true;
        this.fpsRow = SupClient.table.appendRow(tbody, "Frames per second");
        this.fields["framesPerSecond"] = SupClient.table.appendNumberField(this.fpsRow.valueCell, "");
        this.ratioRow = SupClient.table.appendRow(tbody, "Screen ratio");
        var ratioContainer = document.createElement("div");
        ratioContainer.className = "";
        this.ratioRow.valueCell.appendChild(ratioContainer);
        _a = SupClient.table.appendNumberFields(this.ratioRow.valueCell, ["", ""]), this.fields["ratioNumerator"] = _a[0], this.fields["ratioDenominator"] = _a[1];
        this.fields["ratioNumerator"].placeholder = "Width";
        this.fields["ratioDenominator"].placeholder = "Height";
        this.customLayersRow = SupClient.table.appendRow(tbody, "Layers");
        this.layerContainers = document.createElement("div");
        this.layerContainers.className = "list";
        this.customLayersRow.valueCell.appendChild(this.layerContainers);
        this.fields["defaultLayer"] = SupClient.table.appendTextField(this.layerContainers, "Default");
        this.fields["defaultLayer"].readOnly = true;
        for (var i = 0; i < GameSettingsResource_1.default.schema["customLayers"].maxLength; i++) {
            var field = this.fields[("customLayer" + i)] = SupClient.table.appendTextField(this.layerContainers, "");
            field.dataset["customLayerIndex"] = i.toString();
            field.addEventListener("change", this.onCustomLayerFieldChange);
        }
        this.fields["startupSceneId"].addEventListener("input", function (event) {
            if (event.target.value === "")
                _this.projectClient.socket.emit("edit:resources", "gameSettings", "setProperty", "startupSceneId", null, function (err) { if (err != null)
                    alert(err); });
            else {
                var entry = SupClient.findEntryByPath(_this.projectClient.entries.pub, event.target.value);
                if (entry != null && entry.type === "scene")
                    _this.projectClient.socket.emit("edit:resources", "gameSettings", "setProperty", "startupSceneId", entry.id, function (err) { if (err != null)
                        alert(err); });
            }
        });
        this.startupSceneButton.addEventListener("click", function (event) {
            window.parent.postMessage({ type: "openEntry", id: _this.sceneAssetId }, window.location.origin);
        });
        this.fields["framesPerSecond"].addEventListener("change", function (event) {
            _this.projectClient.socket.emit("edit:resources", "gameSettings", "setProperty", "framesPerSecond", parseInt(event.target.value), function (err) { if (err != null)
                alert(err); });
        });
        this.fields["ratioNumerator"].addEventListener("change", function (event) {
            _this.projectClient.socket.emit("edit:resources", "gameSettings", "setProperty", "ratioNumerator", parseInt(event.target.value), function (err) { if (err != null)
                alert(err); });
        });
        this.fields["ratioDenominator"].addEventListener("change", function (event) {
            _this.projectClient.socket.emit("edit:resources", "gameSettings", "setProperty", "ratioDenominator", parseInt(event.target.value), function (err) { if (err != null)
                alert(err); });
        });
        this.projectClient.subEntries(this);
        this.projectClient.subResource("gameSettings", this);
        var _a;
    }
    GameSettingsEditor.prototype._setStartupScene = function (id) {
        var entry = this.projectClient.entries.byId[id];
        if (entry != null && entry.type === "scene") {
            this.sceneAssetId = id;
            this.fields["startupSceneId"].value = this.projectClient.entries.getPathFromId(id);
            this.startupSceneButton.disabled = false;
        }
        else {
            this.sceneAssetId = null;
            this.fields["startupSceneId"].value = "";
            this.startupSceneButton.disabled = true;
        }
    };
    GameSettingsEditor.prototype.onEntryAdded = function () { };
    GameSettingsEditor.prototype.onEntryMoved = function (id, parentId, index) {
        if (id !== this.resource.pub.startupSceneId)
            return;
        this._setStartupScene(id);
    };
    GameSettingsEditor.prototype.onSetEntryProperty = function (id, key, value) {
        if (id !== this.resource.pub.startupSceneId)
            return;
        this._setStartupScene(id);
    };
    GameSettingsEditor.prototype.onEntryTrashed = function (id) {
        if (id !== this.resource.pub.startupSceneId)
            return;
        this._setStartupScene(id);
    };
    GameSettingsEditor.prototype._setupCustomLayers = function () {
        this.customLayers = this.resource.pub.customLayers.slice(0);
        for (var i = 0; i < GameSettingsResource_1.default.schema["customLayers"].maxLength; i++) {
            var field = this.fields[("customLayer" + i)];
            if (i === this.customLayers.length) {
                field.placeholder = "New layer...";
                field.value = "";
            }
            else {
                field.placeholder = "";
            }
            if (i > this.customLayers.length) {
                if (field.parentElement != null)
                    this.layerContainers.removeChild(field);
            }
            else {
                if (field.parentElement == null)
                    this.layerContainers.appendChild(field);
                if (i < this.customLayers.length)
                    field.value = this.customLayers[i];
            }
        }
    };
    return GameSettingsEditor;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GameSettingsEditor;
