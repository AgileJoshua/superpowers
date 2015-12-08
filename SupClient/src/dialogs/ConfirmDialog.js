var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BaseDialog_1 = require("./BaseDialog");
var ConfirmDialog = (function (_super) {
    __extends(ConfirmDialog, _super);
    function ConfirmDialog(label, validationLabel, callback) {
        var _this = this;
        _super.call(this);
        this.callback = callback;
        var labelElt = document.createElement("label");
        labelElt.textContent = label;
        this.formElt.appendChild(labelElt);
        // Buttons
        var buttonsElt = document.createElement("div");
        buttonsElt.className = "buttons";
        this.formElt.appendChild(buttonsElt);
        var cancelButtonElt = document.createElement("button");
        cancelButtonElt.type = "button";
        cancelButtonElt.textContent = "Cancel";
        cancelButtonElt.className = "cancel-button";
        cancelButtonElt.addEventListener("click", function (event) { event.preventDefault(); _this.cancel(); });
        var validateButtonElt = document.createElement("button");
        validateButtonElt.textContent = validationLabel;
        validateButtonElt.className = "validate-button";
        if (navigator.platform === "Win32") {
            buttonsElt.appendChild(validateButtonElt);
            buttonsElt.appendChild(cancelButtonElt);
        }
        else {
            buttonsElt.appendChild(cancelButtonElt);
            buttonsElt.appendChild(validateButtonElt);
        }
        validateButtonElt.focus();
    }
    ConfirmDialog.prototype.submit = function () {
        if (!_super.prototype.submit.call(this))
            return false;
        this.callback(true);
        return true;
    };
    ConfirmDialog.prototype.cancel = function () {
        _super.prototype.cancel.call(this);
        this.callback(false);
    };
    return ConfirmDialog;
})(BaseDialog_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ConfirmDialog;
