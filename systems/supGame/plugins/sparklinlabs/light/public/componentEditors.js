(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var LightEditor_1 = require("./LightEditor");
SupClient.registerPlugin("componentEditors", "Light", LightEditor_1.default);

},{"./LightEditor":2}],2:[function(require,module,exports){
var LightEditor = (function () {
    function LightEditor(tbody, config, projectClient, editConfig) {
        var _this = this;
        this.fields = {};
        this.shadowRows = [];
        this.tbody = tbody;
        this.editConfig = editConfig;
        this.castShadow = config.castShadow;
        var typeRow = SupClient.table.appendRow(tbody, "Type");
        this.fields["type"] = SupClient.table.appendSelectBox(typeRow.valueCell, { "ambient": "Ambient", "point": "Point", "spot": "Spot", "directional": "Directional" }, config.type);
        this.fields["type"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "type", event.target.value);
        });
        var colorRow = SupClient.table.appendRow(tbody, "Color");
        var colorInputs = SupClient.table.appendColorField(colorRow.valueCell, config.color);
        this.fields["color"] = colorInputs.textField;
        this.fields["color"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "color", event.target.value);
        });
        this.colorPicker = colorInputs.pickerField;
        this.colorPicker.addEventListener("change", function (event) {
            _this.editConfig("setProperty", "color", event.target.value.slice(1));
        });
        var intensityRow = SupClient.table.appendRow(tbody, "Intensity");
        this.fields["intensity"] = SupClient.table.appendNumberField(intensityRow.valueCell, config.intensity, 0);
        this.fields["intensity"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "intensity", parseFloat(event.target.value));
        });
        var distanceRow = SupClient.table.appendRow(tbody, "Distance");
        this.fields["distance"] = SupClient.table.appendNumberField(distanceRow.valueCell, config.distance, 0);
        this.fields["distance"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "distance", parseFloat(event.target.value));
        });
        var angleRow = SupClient.table.appendRow(tbody, "Angle");
        this.fields["angle"] = SupClient.table.appendNumberField(angleRow.valueCell, config.angle, 0, 90);
        this.fields["angle"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "angle", parseFloat(event.target.value));
        });
        var targetRow = SupClient.table.appendRow(tbody, "Target");
        var targetFields = SupClient.table.appendNumberFields(targetRow.valueCell, [config.target.x, config.target.y, config.target.z]);
        this.fields["target.x"] = targetFields[0];
        this.fields["target.x"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "target.x", parseFloat(event.target.value));
        });
        this.fields["target.y"] = targetFields[1];
        this.fields["target.y"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "target.y", parseFloat(event.target.value));
        });
        this.fields["target.z"] = targetFields[2];
        this.fields["target.z"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "target.z", parseFloat(event.target.value));
        });
        var castShadowRow = SupClient.table.appendRow(tbody, "Cast Shadow");
        this.fields["castShadow"] = SupClient.table.appendBooleanField(castShadowRow.valueCell, config.castShadow);
        this.fields["castShadow"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "castShadow", event.target.checked);
        });
        var shadowHeaderRow = SupClient.table.appendHeader(tbody, "Shadow Settings");
        this.shadowRows.push(shadowHeaderRow);
        var shadowMapSizeRow = SupClient.table.appendRow(tbody, "Map Size");
        var shadowMapFields = SupClient.table.appendNumberFields(shadowMapSizeRow.valueCell, [config.shadowMapSize.width, config.shadowMapSize.height], 1);
        this.fields["shadowMapSize.width"] = shadowMapFields[0];
        this.fields["shadowMapSize.width"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "shadowMapSize.width", parseFloat(event.target.value));
        });
        this.fields["shadowMapSize.height"] = shadowMapFields[1];
        this.fields["shadowMapSize.height"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "shadowMapSize.height", parseFloat(event.target.value));
        });
        this.shadowRows.push(shadowMapSizeRow.row);
        var shadowBiasRow = SupClient.table.appendRow(tbody, "Bias");
        this.fields["shadowBias"] = SupClient.table.appendNumberField(shadowBiasRow.valueCell, config.shadowBias);
        this.fields["shadowBias"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "shadowBias", parseFloat(event.target.value));
        });
        this.shadowRows.push(shadowBiasRow.row);
        var shadowDarknessRow = SupClient.table.appendRow(tbody, "Darkness");
        this.fields["shadowDarkness"] = SupClient.table.appendNumberField(shadowDarknessRow.valueCell, config.shadowDarkness, 0, 1);
        this.fields["shadowDarkness"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "shadowDarkness", parseFloat(event.target.value));
        });
        this.shadowRows.push(shadowDarknessRow.row);
        var shadowPlanesRow = SupClient.table.appendRow(tbody, "Near / Far");
        var shadowPlanesFields = SupClient.table.appendNumberFields(shadowPlanesRow.valueCell, [config.shadowCameraNearPlane, config.shadowCameraFarPlane], 0);
        this.fields["shadowCameraNearPlane"] = shadowPlanesFields[0];
        this.fields["shadowCameraNearPlane"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "shadowCameraNearPlane", parseFloat(event.target.value));
        });
        this.fields["shadowCameraFarPlane"] = shadowPlanesFields[1];
        this.fields["shadowCameraFarPlane"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "shadowCameraFarPlane", parseFloat(event.target.value));
        });
        this.shadowRows.push(shadowPlanesRow.row);
        var shadowCameraFovRow = SupClient.table.appendRow(tbody, "Fov");
        this.fields["shadowCameraFov"] = SupClient.table.appendNumberField(shadowCameraFovRow.valueCell, config.shadowCameraFov);
        this.fields["shadowCameraFov"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "shadowCameraFov", parseFloat(event.target.value));
        });
        this.shadowRows.push(shadowCameraFovRow.row);
        var shadowCameraTopBottomRow = SupClient.table.appendRow(tbody, "Top / Bottom");
        var shadowCameraTopBottomFields = SupClient.table.appendNumberFields(shadowCameraTopBottomRow.valueCell, [config.shadowCameraSize.top, config.shadowCameraSize.bottom]);
        this.fields["shadowCameraSize.top"] = shadowCameraTopBottomFields[0];
        this.fields["shadowCameraSize.top"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "shadowCameraSize.top", parseFloat(event.target.value));
        });
        this.fields["shadowCameraSize.bottom"] = shadowCameraTopBottomFields[1];
        this.fields["shadowCameraSize.bottom"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "shadowCameraSize.bottom", parseFloat(event.target.value));
        });
        this.shadowRows.push(shadowCameraTopBottomRow.row);
        var shadowCameraLeftRightRow = SupClient.table.appendRow(tbody, "Left / Right");
        var shadowCameraLeftRightFields = SupClient.table.appendNumberFields(shadowCameraLeftRightRow.valueCell, [config.shadowCameraSize.left, config.shadowCameraSize.right]);
        this.fields["shadowCameraSize.left"] = shadowCameraLeftRightFields[0];
        this.fields["shadowCameraSize.left"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "shadowCameraSize.left", parseFloat(event.target.value));
        });
        this.fields["shadowCameraSize.right"] = shadowCameraLeftRightFields[1];
        this.fields["shadowCameraSize.right"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "shadowCameraSize.right", parseFloat(event.target.value));
        });
        this.shadowRows.push(shadowCameraLeftRightRow.row);
        this.updateFields();
    }
    LightEditor.prototype.destroy = function () { };
    LightEditor.prototype.config_setProperty = function (path, value) {
        if (path === "castShadow") {
            this.fields[path].checked = value;
            this.castShadow = value;
            this.updateFields();
        }
        else
            this.fields[path].value = value;
        if (path === "type")
            this.updateFields();
        if (path === "color")
            this.colorPicker.value = "#" + value;
    };
    LightEditor.prototype.updateFields = function () {
        if (this.fields["type"].value === "ambient") {
            var intensityRow = this.fields["intensity"].parentElement.parentElement;
            if (intensityRow.parentElement != null)
                intensityRow.parentElement.removeChild(intensityRow);
            var distanceRow = this.fields["distance"].parentElement.parentElement;
            if (distanceRow.parentElement != null)
                distanceRow.parentElement.removeChild(distanceRow);
            var angleRow = this.fields["angle"].parentElement.parentElement;
            if (angleRow.parentElement != null)
                angleRow.parentElement.removeChild(angleRow);
            var targetRow = this.fields["target.x"].parentElement.parentElement.parentElement;
            if (targetRow.parentElement != null)
                targetRow.parentElement.removeChild(targetRow);
            var castShadowRow = this.fields["castShadow"].parentElement.parentElement;
            if (castShadowRow.parentElement != null)
                castShadowRow.parentElement.removeChild(castShadowRow);
            for (var _i = 0, _a = this.shadowRows; _i < _a.length; _i++) {
                var shadowRow = _a[_i];
                if (shadowRow.parentElement != null)
                    shadowRow.parentElement.removeChild(shadowRow);
            }
        }
        else {
            var intensityRow = this.fields["intensity"].parentElement.parentElement;
            if (intensityRow.parentElement == null)
                this.tbody.appendChild(intensityRow);
            var castShadowRow = this.fields["castShadow"].parentElement.parentElement;
            if (castShadowRow.parentElement != null)
                castShadowRow.parentElement.removeChild(castShadowRow);
            for (var _b = 0, _c = this.shadowRows; _b < _c.length; _b++) {
                var shadowRow = _c[_b];
                if (shadowRow.parentElement != null)
                    shadowRow.parentElement.removeChild(shadowRow);
            }
            var distanceRow = this.fields["distance"].parentElement.parentElement;
            if (this.fields["type"].value === "directional") {
                if (distanceRow.parentElement != null)
                    distanceRow.parentElement.removeChild(distanceRow);
            }
            else if (distanceRow.parentElement == null)
                this.tbody.appendChild(distanceRow);
            var angleRow = this.fields["angle"].parentElement.parentElement;
            if (this.fields["type"].value === "spot") {
                if (angleRow.parentElement == null)
                    this.tbody.appendChild(angleRow);
            }
            else if (angleRow.parentElement != null)
                angleRow.parentElement.removeChild(angleRow);
            var targetRow = this.fields["target.x"].parentElement.parentElement.parentElement;
            if (this.fields["type"].value === "spot" || this.fields["type"].value === "directional") {
                if (targetRow.parentElement == null)
                    this.tbody.appendChild(targetRow);
                if (castShadowRow.parentElement == null)
                    this.tbody.appendChild(castShadowRow);
                if (this.castShadow) {
                    for (var _d = 0, _e = this.shadowRows; _d < _e.length; _d++) {
                        var shadowRow = _e[_d];
                        if (shadowRow.parentElement == null)
                            this.tbody.appendChild(shadowRow);
                    }
                    if (this.fields["type"].value === "spot") {
                        var topBottomRow = this.fields["shadowCameraSize.top"].parentElement.parentElement.parentElement;
                        topBottomRow.parentElement.removeChild(topBottomRow);
                        var leftRightRow = this.fields["shadowCameraSize.left"].parentElement.parentElement.parentElement;
                        leftRightRow.parentElement.removeChild(leftRightRow);
                    }
                    else {
                        var fovRow = this.fields["shadowCameraFov"].parentElement.parentElement;
                        fovRow.parentElement.removeChild(fovRow);
                    }
                }
            }
            else {
                if (targetRow.parentElement != null)
                    targetRow.parentElement.removeChild(targetRow);
            }
        }
    };
    return LightEditor;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LightEditor;

},{}]},{},[1]);
