/* tslint:disable:no-unused-variable */
var Hash_1 = require("./Hash");
exports.Hash = Hash_1.default;
var ListById_1 = require("./ListById");
exports.ListById = ListById_1.default;
var TreeById_1 = require("./TreeById");
exports.TreeById = TreeById_1.default;
var Dictionary_1 = require("./Dictionary");
exports.Dictionary = Dictionary_1.default;
var Asset_1 = require("./Asset");
exports.Asset = Asset_1.default;
var Resource_1 = require("./Resource");
exports.Resource = Resource_1.default;
var ComponentConfig_1 = require("./ComponentConfig");
exports.ComponentConfig = ComponentConfig_1.default;
/* tslint:enable:no-unused-variable */
function getRuleViolation(value, rule, create) {
    if (create === void 0) { create = false; }
    if (!create && !rule.mutable)
        return { message: "Immutable" };
    var optional = rule.type[rule.type.length - 1] === "?";
    if (optional && value == null)
        return null;
    var ruleType;
    if (optional)
        ruleType = rule.type.slice(0, rule.type.length - 1);
    else
        ruleType = rule.type;
    switch (ruleType) {
        case "boolean":
            {
                if (typeof value !== "boolean")
                    return { message: "Expected boolean" };
            }
            break;
        case "number":
        case "integer":
            {
                if (typeof value !== "number")
                    return { message: "Expected " + ruleType };
                if (ruleType === "integer" && (value % 1) !== 0)
                    return { message: "Expected integer" };
                if (rule.min != null && value < rule.min)
                    return { message: "Value (" + value + ") is less than minimum value (" + rule.min + ")" };
                if (rule.minExcluded != null && value <= rule.minExcluded)
                    return { message: "Value (" + value + ") is less than minimum value (" + rule.min + ")" };
                if (rule.max != null && value > rule.max)
                    return { message: "Value (" + value + ") is greater than maximum value (" + rule.max + ")" };
                if (rule.maxExcluded != null && value >= rule.maxExcluded)
                    return { message: "Value (" + value + ") is greater than maximum value (" + rule.max + ")" };
            }
            break;
        case "string":
            {
                if (typeof value !== "string")
                    return { message: "Expected string" };
                if (rule.length != null && value.length !== rule.length)
                    return { message: "String should have length of " + rule.length + ", got " + value.length };
                if (rule.minLength != null && value.length < rule.minLength)
                    return { message: "String length (" + value.length + ") is less than minimum length (" + rule.minLength + ")" };
                if (rule.maxLength != null && value.length > rule.maxLength)
                    return { message: "String length (" + value.length + ") is greater than maximum length (" + rule.maxLength + ")" };
            }
            break;
        case "enum":
            {
                if (typeof value !== "string")
                    return { message: "Expected string for enum" };
                var items = rule.items;
                if (items.indexOf(value) === -1)
                    return { message: "Invalid enum value: " + value };
            }
            break;
        case "hash":
            {
                if (value == null || typeof value !== "object")
                    return { message: "Expected hash" };
                var ruleProperties = (rule.properties != null) ? rule.properties : {};
                var missingKeys = Object.keys(ruleProperties);
                for (var key in value) {
                    var propertyValue = value[key];
                    var propertyRule = ruleProperties[key];
                    if (propertyRule == null) {
                        if (rule.values == null)
                            return { message: "Unexpected hash key: " + key, path: key };
                        if (rule.keys != null) {
                            if (rule.keys.length != null && key.length !== rule.keys.length)
                                return { message: "Key should have length of " + rule.keys.length + ", got " + key.length, path: key };
                            if (rule.keys.minLength != null && key.length < rule.keys.minLength)
                                return { message: "Key length (" + key.length + ") is less than minimum length (" + rule.keys.minLength + ")", path: key };
                            if (rule.keys.maxLength != null && key.length > rule.keys.maxLength)
                                return { message: "Key length (" + key.length + ") is greater than maximum length (" + rule.keys.maxLength + ")", path: key };
                        }
                        var violation = getRuleViolation(propertyValue, rule.values, true);
                        if (violation != null) {
                            var violationPath = (violation.path != null) ? key + "." + violation.path : key;
                            return { message: violation.message, path: violationPath };
                        }
                    }
                    else {
                        var violation = getRuleViolation(propertyValue, propertyRule, true);
                        if (violation != null) {
                            var violationPath = (violation.path != null) ? key + "." + violation.path : key;
                            return { message: violation.message, path: violationPath };
                        }
                        missingKeys.splice(missingKeys.indexOf(key), 1);
                    }
                }
                // Ignore optional keys
                var actualMissingKeys = [];
                for (var _i = 0; _i < missingKeys.length; _i++) {
                    var missingKey = missingKeys[_i];
                    var missingKeyRuleType = ruleProperties[missingKey].type;
                    if (missingKeyRuleType[missingKeyRuleType.length - 1] !== "?")
                        actualMissingKeys.push(missingKey);
                }
                if (actualMissingKeys.length > 0)
                    return { message: "Missing hash keys: " + actualMissingKeys.join(", ") };
            }
            break;
        case "array":
            {
                if (!Array.isArray(value))
                    return { message: "Expected array" };
                if (rule.length != null && value.length !== rule.length)
                    return { message: "Array should have length of " + rule.length + ", got " + value.length };
                if (rule.minLength != null && value.length < rule.minLength)
                    return { message: "Array length (" + value.length + ") is less than minimum length (" + rule.minLength + ")" };
                if (rule.maxLength != null && value.length > rule.maxLength)
                    return { message: "Array length (" + value.length + ") is greater than maximum length (" + rule.maxLength + ")" };
                if (rule.items != null) {
                    for (var index = 0; index < value.length; index++) {
                        var item = value[index];
                        var violation = getRuleViolation(item, rule.items, true);
                        if (violation != null) {
                            var violationPath = (violation.path != null) ? "[" + index + "]." + violation.path : "[" + index + "]";
                            return { message: violation.message, path: violationPath };
                        }
                    }
                }
            }
            break;
        case "any":
            {
            }
            break;
        default: {
            console.warn("getRuleViolation - Unhandled rule type: " + ruleType);
        }
    }
    return null;
}
exports.getRuleViolation = getRuleViolation;
function formatRuleViolation(violation) {
    if (violation == null)
        return "No error";
    var text = violation.message;
    if (violation.path != null)
        text += " at " + violation.path;
    return text;
}
exports.formatRuleViolation = formatRuleViolation;
