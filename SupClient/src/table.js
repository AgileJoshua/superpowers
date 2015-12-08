function createTable(parent) {
    var table = document.createElement("table");
    if (parent != null)
        parent.appendChild(table);
    var tbody = document.createElement("tbody");
    table.appendChild(tbody);
    return { table: table, tbody: tbody };
}
exports.createTable = createTable;
function createInput(type, parent) {
    var input = document.createElement("input");
    input.type = type;
    if (parent != null)
        parent.appendChild(input);
    return input;
}
function appendRow(parentTableBody, name, options) {
    var row = document.createElement("tr");
    parentTableBody.appendChild(row);
    var labelCell = document.createElement("th");
    row.appendChild(labelCell);
    var checkbox;
    if (options != null && options.checkbox) {
        var container = document.createElement("div");
        labelCell.appendChild(container);
        var nameElt = document.createElement("div");
        nameElt.textContent = name;
        nameElt.title = options.title;
        container.appendChild(nameElt);
        checkbox = createInput("checkbox", container);
    }
    else {
        labelCell.textContent = name;
        if (options != null && options.title != null)
            labelCell.title = options.title;
    }
    var valueCell = document.createElement("td");
    row.appendChild(valueCell);
    return { row: row, labelCell: labelCell, valueCell: valueCell, checkbox: checkbox };
}
exports.appendRow = appendRow;
function appendHeader(parentTableBody, text) {
    var headerRow = document.createElement("tr");
    parentTableBody.appendChild(headerRow);
    var headerTh = document.createElement("th");
    headerTh.textContent = text;
    headerTh.colSpan = 2;
    headerRow.appendChild(headerTh);
    return headerRow;
}
exports.appendHeader = appendHeader;
function appendTextField(parent, value) {
    var input = createInput("text", parent);
    input.value = value;
    return input;
}
exports.appendTextField = appendTextField;
function appendTextAreaField(parent, value) {
    var textarea = document.createElement("textarea");
    parent.appendChild(textarea);
    textarea.value = value;
    return textarea;
}
exports.appendTextAreaField = appendTextAreaField;
function appendNumberField(parent, value, min, max, step) {
    var input = createInput("number", parent);
    input.value = value;
    if (min != null)
        input.min = min;
    if (max != null)
        input.max = max;
    if (step != null)
        input.step = step;
    return input;
}
exports.appendNumberField = appendNumberField;
function appendNumberFields(parent, values, min, max, step) {
    var inputsParent = document.createElement("div");
    inputsParent.classList.add("inputs");
    parent.appendChild(inputsParent);
    var inputs = [];
    for (var _i = 0; _i < values.length; _i++) {
        var value = values[_i];
        inputs.push(appendNumberField(inputsParent, value, min, max));
    }
    return inputs;
}
exports.appendNumberFields = appendNumberFields;
function appendBooleanField(parent, value) {
    var input = createInput("checkbox", parent);
    input.checked = value;
    return input;
}
exports.appendBooleanField = appendBooleanField;
function appendSelectBox(parent, options, initialValue) {
    if (initialValue === void 0) { initialValue = ""; }
    var selectInput = document.createElement("select");
    parent.appendChild(selectInput);
    for (var value in options)
        appendSelectOption(selectInput, value, options[value]);
    selectInput.value = initialValue;
    return selectInput;
}
exports.appendSelectBox = appendSelectBox;
function appendSelectOption(parent, value, label) {
    var option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    parent.appendChild(option);
    return option;
}
exports.appendSelectOption = appendSelectOption;
function appendColorField(parent, value) {
    var colorParent = document.createElement("div");
    colorParent.classList.add("inputs");
    parent.appendChild(colorParent);
    var textField = appendTextField(colorParent, value);
    textField.classList.add("color");
    var pickerField = document.createElement("input");
    pickerField.type = "color";
    pickerField.value = "#" + value;
    colorParent.appendChild(pickerField);
    return { textField: textField, pickerField: pickerField };
}
exports.appendColorField = appendColorField;
function appendAssetField(parent, value) {
    var assetParent = document.createElement("div");
    assetParent.classList.add("inputs");
    parent.appendChild(assetParent);
    var textField = appendTextField(assetParent, value);
    var buttonElt = document.createElement("button");
    buttonElt.textContent = "Open";
    assetParent.appendChild(buttonElt);
    return { textField: textField, buttonElt: buttonElt };
}
exports.appendAssetField = appendAssetField;
