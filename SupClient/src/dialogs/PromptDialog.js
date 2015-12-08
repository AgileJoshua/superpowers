var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BaseDialog_1 = require("./BaseDialog");
var PromptDialog = (function (_super) {
    __extends(PromptDialog, _super);
    function PromptDialog(label, options, callback) {
        var _this = this;
        _super.call(this);
        this.callback = callback;
        if (options == null)
            options = {};
        var labelElt = document.createElement("label");
        labelElt.textContent = label;
        this.formElt.appendChild(labelElt);
        this.inputElt = document.createElement("input");
        if (options.type != null)
            this.inputElt.type = options.type;
        if (options.initialValue != null)
            this.inputElt.value = options.initialValue;
        if (options.placeholder != null)
            this.inputElt.placeholder = options.placeholder;
        if (options.pattern != null)
            this.inputElt.pattern = options.pattern;
        if (options.title != null)
            this.inputElt.title = options.title;
        this.inputElt.required = (options.required != null) ? options.required : true;
        this.formElt.appendChild(this.inputElt);
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
        this.validateButtonElt.textContent = options.validationLabel;
        this.validateButtonElt.className = "validate-button";
        if (navigator.platform === "Win32") {
            buttonsElt.appendChild(this.validateButtonElt);
            buttonsElt.appendChild(cancelButtonElt);
        }
        else {
            buttonsElt.appendChild(cancelButtonElt);
            buttonsElt.appendChild(this.validateButtonElt);
        }
        this.inputElt.select();
    }
    PromptDialog.prototype.submit = function () {
        if (!_super.prototype.submit.call(this))
            return false;
        if (this.callback != null)
            this.callback(this.inputElt.value);
        return true;
    };
    PromptDialog.prototype.cancel = function () {
        _super.prototype.cancel.call(this);
        if (this.callback != null)
            this.callback(null);
    };
    return PromptDialog;
})(BaseDialog_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PromptDialog;
