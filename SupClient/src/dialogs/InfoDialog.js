var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BaseDialog_1 = require("./BaseDialog");
var InfoDialog = (function (_super) {
    __extends(InfoDialog, _super);
    function InfoDialog(label, validationLabel, callback) {
        _super.call(this);
        this.callback = callback;
        var labelElt = document.createElement("label");
        labelElt.textContent = label;
        this.formElt.appendChild(labelElt);
        // Buttons
        var buttonsElt = document.createElement("div");
        buttonsElt.className = "buttons";
        this.formElt.appendChild(buttonsElt);
        this.validateButtonElt = document.createElement("button");
        this.validateButtonElt.textContent = validationLabel;
        this.validateButtonElt.className = "validate-button";
        buttonsElt.appendChild(this.validateButtonElt);
        this.validateButtonElt.focus();
    }
    InfoDialog.prototype.submit = function () {
        if (!_super.prototype.submit.call(this))
            return false;
        if (this.callback != null)
            this.callback();
        return true;
    };
    return InfoDialog;
})(BaseDialog_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = InfoDialog;
