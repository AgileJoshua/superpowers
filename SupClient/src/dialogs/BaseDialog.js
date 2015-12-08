var BaseDialog = (function () {
    function BaseDialog() {
        var _this = this;
        this.onDocumentKeyDown = function (event) {
            if (event.keyCode === 27) {
                event.preventDefault();
                _this.cancel();
            }
        };
        if (BaseDialog.activeDialog != null)
            throw new Error("Cannot open two dialogs at the same time.");
        BaseDialog.activeDialog = this;
        this.dialogElt = document.createElement("div");
        this.dialogElt.className = "dialog";
        this.formElt = document.createElement("form");
        this.dialogElt.appendChild(this.formElt);
        this.formElt.addEventListener("submit", function (event) {
            if (!_this.formElt.checkValidity())
                return;
            event.preventDefault();
            _this.submit();
        });
        document.addEventListener("keydown", this.onDocumentKeyDown);
        document.body.appendChild(this.dialogElt);
    }
    // OVERRIDE and check super.submit()'s return value
    BaseDialog.prototype.submit = function () {
        if (!this.formElt.checkValidity()) {
            // Trigger form validation
            this.validateButtonElt.click();
            return false;
        }
        this.dismiss();
        return true;
    };
    // OVERRIDE
    BaseDialog.prototype.cancel = function () {
        this.dismiss();
    };
    BaseDialog.prototype.dismiss = function () {
        BaseDialog.activeDialog = null;
        document.body.removeChild(this.dialogElt);
        document.removeEventListener("keydown", this.onDocumentKeyDown);
    };
    return BaseDialog;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BaseDialog;
