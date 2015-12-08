(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var CameraEditor_1 = require("./CameraEditor");
var a = SupClient.registerPlugin("componentEditors", "Camera", CameraEditor_1.default);

},{"./CameraEditor":2}],2:[function(require,module,exports){
var CameraEditor = (function () {
    function CameraEditor(tbody, config, projectClient, editConfig) {
        var _this = this;
        this.viewportFields = {};
        this._onChangeMode = function (event) { _this.editConfig("setProperty", "mode", event.target.value); };
        this._onChangeFOV = function (event) { _this.editConfig("setProperty", "fov", parseFloat(event.target.value)); };
        this._onChangeOrthographicScale = function (event) { _this.editConfig("setProperty", "orthographicScale", parseFloat(event.target.value)); };
        this._onChangeDepth = function (event) { _this.editConfig("setProperty", "depth", parseFloat(event.target.value)); };
        this._onChangeNearClippingPlane = function (event) { _this.editConfig("setProperty", "nearClippingPlane", parseFloat(event.target.value)); };
        this._onChangeFarClippingPlane = function (event) { _this.editConfig("setProperty", "farClippingPlane", parseFloat(event.target.value)); };
        this._onChangeViewportX = function (event) { _this.editConfig("setProperty", "viewport.x", parseFloat(event.target.value)); };
        this._onChangeViewportY = function (event) { _this.editConfig("setProperty", "viewport.y", parseFloat(event.target.value)); };
        this._onChangeViewportWidth = function (event) { _this.editConfig("setProperty", "viewport.width", parseFloat(event.target.value)); };
        this._onChangeViewportHeight = function (event) { _this.editConfig("setProperty", "viewport.height", parseFloat(event.target.value)); };
        this.projectClient = projectClient;
        this.editConfig = editConfig;
        var modeRow = SupClient.table.appendRow(tbody, "Mode");
        this.modeSelectBox = SupClient.table.appendSelectBox(modeRow.valueCell, { perspective: "Perspective", orthographic: "Orthographic" }, config.mode);
        this.fovRowParts = SupClient.table.appendRow(tbody, "Field of view");
        this.fovField = SupClient.table.appendNumberField(this.fovRowParts.valueCell, config.fov, 0.1, 179.9, 0.1);
        this.orthographicScaleRowParts = SupClient.table.appendRow(tbody, "Orthographic scale");
        this.orthographicScaleField = SupClient.table.appendNumberField(this.orthographicScaleRowParts.valueCell, config.orthographicScale, 0.1, null, 0.1);
        if (config.mode === "perspective")
            this.orthographicScaleRowParts.row.style.display = "none";
        else
            this.fovRowParts.row.style.display = "none";
        var depthRow = SupClient.table.appendRow(tbody, "Depth", { title: "Used to determine in which order to render multiple cameras" });
        this.depthField = SupClient.table.appendNumberField(depthRow.valueCell, config.depth);
        var layersRow = SupClient.table.appendRow(tbody, "Layers", { title: "Which layers to be render and in which order" });
        var layersField = SupClient.table.appendTextField(layersRow.valueCell, "");
        layersField.disabled = true;
        layersField.placeholder = "(not yet customizable)";
        var nearClippingPlaneRow = SupClient.table.appendRow(tbody, "Near plane");
        this.nearClippingPlaneField = SupClient.table.appendNumberField(nearClippingPlaneRow.valueCell, config.nearClippingPlane, 0.1);
        var farClippingPlaneRow = SupClient.table.appendRow(tbody, "Far plane");
        this.farClippingPlaneField = SupClient.table.appendNumberField(farClippingPlaneRow.valueCell, config.farClippingPlane, 0.1);
        SupClient.table.appendHeader(tbody, "Viewport");
        var viewportXRow = SupClient.table.appendRow(tbody, "Top / Left");
        _a = SupClient.table.appendNumberFields(viewportXRow.valueCell, [config.viewport.x, config.viewport.y], 0, 1, 0.1), this.viewportFields.x = _a[0], this.viewportFields.y = _a[1];
        var widthRow = SupClient.table.appendRow(tbody, "Width / Height");
        _b = SupClient.table.appendNumberFields(widthRow.valueCell, [config.viewport.width, config.viewport.height], 0, 1, 0.1), this.viewportFields.width = _b[0], this.viewportFields.height = _b[1];
        this.modeSelectBox.addEventListener("change", this._onChangeMode);
        this.fovField.addEventListener("input", this._onChangeFOV);
        this.orthographicScaleField.addEventListener("input", this._onChangeOrthographicScale);
        this.depthField.addEventListener("change", this._onChangeDepth);
        this.nearClippingPlaneField.addEventListener("change", this._onChangeNearClippingPlane);
        this.farClippingPlaneField.addEventListener("change", this._onChangeFarClippingPlane);
        this.viewportFields.x.addEventListener("change", this._onChangeViewportX);
        this.viewportFields.y.addEventListener("change", this._onChangeViewportY);
        this.viewportFields.width.addEventListener("change", this._onChangeViewportWidth);
        this.viewportFields.height.addEventListener("change", this._onChangeViewportHeight);
        var _a, _b;
    }
    CameraEditor.prototype.destroy = function () { };
    CameraEditor.prototype.config_setProperty = function (path, value) {
        switch (path) {
            case "mode": {
                this.modeSelectBox.value = value;
                this.orthographicScaleRowParts.row.style.display = (value === "perspective") ? "none" : "";
                this.fovRowParts.row.style.display = (value === "perspective") ? "" : "none";
                break;
            }
            case "fov": {
                this.fovField.value = value;
                break;
            }
            case "orthographicScale": {
                this.orthographicScaleField.value = value;
                break;
            }
            case "depth": {
                this.depthField.value = value;
                break;
            }
            case "nearClippingPlane": {
                this.nearClippingPlaneField.value = value;
                break;
            }
            case "farClippingPlane": {
                this.farClippingPlaneField.value = value;
                break;
            }
            case "viewport.x": {
                this.viewportFields.x.value = value;
                break;
            }
            case "viewport.y": {
                this.viewportFields.y.value = value;
                break;
            }
            case "viewport.width": {
                this.viewportFields.width.value = value;
                break;
            }
            case "viewport.height": {
                this.viewportFields.height.value = value;
                break;
            }
        }
    };
    return CameraEditor;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CameraEditor;

},{}]},{},[1]);
