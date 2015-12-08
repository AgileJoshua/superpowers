/* tslint:disable:no-unused-variable */
var BaseDialog_1 = require("./BaseDialog");
exports.BaseDialog = BaseDialog_1.default;
var PromptDialog_1 = require("./PromptDialog");
exports.PromptDialog = PromptDialog_1.default;
var ConfirmDialog_1 = require("./ConfirmDialog");
exports.ConfirmDialog = ConfirmDialog_1.default;
var InfoDialog_1 = require("./InfoDialog");
exports.InfoDialog = InfoDialog_1.default;
var SelectDialog_1 = require("./SelectDialog");
exports.SelectDialog = SelectDialog_1.default;
/* tslint:enable:no-unused-variable */
function cancelDialogIfAny() {
    if (BaseDialog_1.default.activeDialog != null)
        BaseDialog_1.default.activeDialog.cancel();
}
exports.cancelDialogIfAny = cancelDialogIfAny;
