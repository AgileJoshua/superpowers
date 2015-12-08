var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BaseDialog_1 = require("./BaseDialog");
var SelectDialog = (function (_super) {
    __extends(SelectDialog, _super);
    function SelectDialog(label, choices, validationLabel, options, callback) {
        var _this = this;
        _super.call(this);
        this.callback = callback;
        if (options == null)
            options = {};
        // Label
        var labelElt = document.createElement("label");
        labelElt.textContent = label;
        this.formElt.appendChild(labelElt);
        // Select
        this.selectElt = document.createElement("select");
        for (var choiceName in choices) {
            var optionElt = document.createElement("option");
            optionElt.textContent = choiceName;
            optionElt.value = choices[choiceName];
            this.selectElt.appendChild(optionElt);
        }
        if (options.size != null)
            this.selectElt.size = options.size;
        this.formElt.appendChild(this.selectElt);
        this.selectElt.addEventListener("keydown", function (event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                _this.submit();
            }
        });
        this.selectElt.addEventListener("dblclick", function () { _this.submit(); });
        // Buttons
        var buttonsElt = document.createElement("div");
        buttonsElt.className = "buttons";
        this.formElt.appendChild(buttonsElt);
        var cancelButtonElt = document.createElement("button");
        cancelButtonElt.type = "button";
        cancelButtonElt.textContent = "Cancel";
        cancelButtonElt.className = "cancel-button";
        cancelButtonElt.addEventListener("click", function (event) { event.preventDefault(); _this.cancel(); });
        this.validateButtonElt = document.createElement("button");
        this.validateButtonElt.textContent = validationLabel;
        this.validateButtonElt.className = "validate-button";
        if (navigator.platform === "Win32") {
            buttonsElt.appendChild(this.validateButtonElt);
            buttonsElt.appendChild(cancelButtonElt);
        }
        else {
            buttonsElt.appendChild(cancelButtonElt);
            buttonsElt.appendChild(this.validateButtonElt);
        }
        this.selectElt.focus();
    }
    SelectDialog.prototype.submit = function () {
        if (!_super.prototype.submit.call(this))
            return false;
        if (this.callback != null)
            this.callback((this.selectElt.value !== "") ? this.selectElt.value : null);
        return true;
    };
    SelectDialog.prototype.cancel = function () {
        _super.prototype.cancel.call(this);
        if (this.callback != null)
            this.callback(null);
    };
    return SelectDialog;
})(BaseDialog_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SelectDialog;
