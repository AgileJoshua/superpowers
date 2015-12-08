(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var CannonBodyEditor_1 = require("./CannonBodyEditor");
SupClient.registerPlugin("componentEditors", "CannonBody", CannonBodyEditor_1.default);

},{"./CannonBodyEditor":2}],2:[function(require,module,exports){
var CannonBodyEditor = (function () {
    function CannonBodyEditor(tbody, config, projectClient, editConfig) {
        var _this = this;
        this.projectClient = projectClient;
        this.editConfig = editConfig;
        this.tbody = tbody;
        this.shapeRows = [];
        this.fields = {};
        var massRow = SupClient.table.appendRow(this.tbody, "Mass");
        this.fields["mass"] = SupClient.table.appendNumberField(massRow.valueCell, config.mass, 0);
        this.fields["mass"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "mass", parseFloat(event.target.value));
        });
        var fixedRotationRow = SupClient.table.appendRow(this.tbody, "Fixed rotation");
        this.fields["fixedRotation"] = SupClient.table.appendBooleanField(fixedRotationRow.valueCell, config.fixedRotation);
        this.fields["fixedRotation"].addEventListener("click", function (event) {
            _this.editConfig("setProperty", "fixedRotation", event.target.checked);
        });
        var offsetRow = SupClient.table.appendRow(this.tbody, "Offset");
        var offsetFields = SupClient.table.appendNumberFields(offsetRow.valueCell, [config.offset.x, config.offset.y, config.offset.z]);
        this.fields["offset.x"] = offsetFields[0];
        this.fields["offset.y"] = offsetFields[1];
        this.fields["offset.z"] = offsetFields[2];
        this.fields["offset.x"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "offset.x", parseFloat(event.target.value));
        });
        this.fields["offset.y"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "offset.y", parseFloat(event.target.value));
        });
        this.fields["offset.z"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "offset.z", parseFloat(event.target.value));
        });
        SupClient.table.appendHeader(this.tbody, "Shape");
        var shapeTypeRow = SupClient.table.appendRow(this.tbody, "Type");
        this.fields["shape"] = SupClient.table.appendSelectBox(shapeTypeRow.valueCell, {
            "box": "Box",
            "sphere": "Sphere",
            "cylinder": "Cylinder"
        });
        this.fields["shape"].value = config.shape;
        this.fields["shape"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "shape", event.target.value);
        });
        // Box
        this.halfSizeRow = SupClient.table.appendRow(this.tbody, "Half size");
        this.shapeRows.push(this.halfSizeRow.row);
        var halfSizeFields = SupClient.table.appendNumberFields(this.halfSizeRow.valueCell, [config.halfSize.x, config.halfSize.y, config.halfSize.z], 0);
        this.fields["halfSize.x"] = halfSizeFields[0];
        this.fields["halfSize.y"] = halfSizeFields[1];
        this.fields["halfSize.z"] = halfSizeFields[2];
        this.fields["halfSize.x"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "halfSize.x", parseFloat(event.target.value));
        });
        this.fields["halfSize.y"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "halfSize.y", parseFloat(event.target.value));
        });
        this.fields["halfSize.z"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "halfSize.z", parseFloat(event.target.value));
        });
        // Sphere / Cylinder
        this.radiusRow = SupClient.table.appendRow(this.tbody, "Radius");
        this.shapeRows.push(this.radiusRow.row);
        this.fields["radius"] = SupClient.table.appendNumberField(this.radiusRow.valueCell, config.radius, 0);
        this.fields["radius"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "radius", parseFloat(event.target.value));
        });
        this.heightRow = SupClient.table.appendRow(this.tbody, "Height");
        this.shapeRows.push(this.heightRow.row);
        this.fields["height"] = SupClient.table.appendNumberField(this.heightRow.valueCell, config.height, 0);
        this.fields["height"].addEventListener("change", function (event) {
            _this.editConfig("setProperty", "height", parseFloat(event.target.value));
        });
        this.updateShapeInput(config.shape);
    }
    CannonBodyEditor.prototype.updateShapeInput = function (shape) {
        for (var _i = 0, _a = this.shapeRows; _i < _a.length; _i++) {
            var row = _a[_i];
            this.tbody.removeChild(row);
        }
        this.shapeRows.length = 0;
        switch (shape) {
            case "box":
                this.tbody.appendChild(this.halfSizeRow.row);
                this.shapeRows.push(this.halfSizeRow.row);
                break;
            case "sphere":
                this.tbody.appendChild(this.radiusRow.row);
                this.shapeRows.push(this.radiusRow.row);
                break;
            case "cylinder":
                this.tbody.appendChild(this.radiusRow.row);
                this.shapeRows.push(this.radiusRow.row);
                this.tbody.appendChild(this.heightRow.row);
                this.shapeRows.push(this.heightRow.row);
                break;
        }
    };
    CannonBodyEditor.prototype.destroy = function () { };
    CannonBodyEditor.prototype.config_setProperty = function (path, value) {
        if (path === "fixedRotation")
            this.fields["fixedRotation"].checked = value;
        else
            this.fields[path].value = value;
        if (path === "shape")
            this.updateShapeInput(value);
    };
    return CannonBodyEditor;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CannonBodyEditor;

},{}]},{},[1]);
