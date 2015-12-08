var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var base = require("./index");
var events_1 = require("events");
var TreeById = (function (_super) {
    __extends(TreeById, _super);
    function TreeById(pub, schema, nextId) {
        var _this = this;
        _super.call(this);
        this.pub = pub;
        this.schema = schema;
        this.nextId = nextId;
        this.byId = {};
        this.parentNodesById = {};
        var maxNodeId = -1;
        this.walk(function (node, parentNode) {
            // NOTE: Legacy stuff from Superpowers 0.4
            if (typeof node.id === "number")
                node.id = node.id.toString();
            maxNodeId = Math.max(maxNodeId, parseInt(node.id, 10));
            _this.byId[node.id] = node;
            _this.parentNodesById[node.id] = parentNode;
        });
        if (this.nextId == null)
            this.nextId = maxNodeId + 1;
    }
    TreeById.prototype.walk = function (callback) {
        for (var _i = 0, _a = this.pub; _i < _a.length; _i++) {
            var node = _a[_i];
            this.walkNode(node, null, callback);
        }
    };
    TreeById.prototype.walkNode = function (node, parentNode, callback) {
        callback(node, parentNode);
        if (node.children != null) {
            for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                var child = _a[_i];
                this.walkNode(child, node, callback);
            }
        }
    };
    TreeById.prototype.getPathFromId = function (id) {
        var name = this.byId[id].name;
        var parent = this.parentNodesById[id];
        while (true) {
            if (parent == null)
                break;
            name = parent.name + "/" + name;
            parent = this.parentNodesById[parent.id];
        }
        return name;
    };
    TreeById.prototype.add = function (node, parentId, index, callback) {
        if (node.id != null && this.schema.id == null) {
            callback("Found unexpected id key");
            return;
        }
        var siblings = this.pub;
        if (parentId != null)
            siblings = (this.byId[parentId] != null) ? this.byId[parentId].children : null;
        if (siblings == null) {
            callback("Invalid parent id: " + parentId);
            return;
        }
        var missingKeys = Object.keys(this.schema);
        for (var key in node) {
            var value = node[key];
            var rule = this.schema[key];
            if (rule == null) {
                if (key === "id" && value == null)
                    continue;
                callback("Invalid key: " + key);
                return;
            }
            var violation = base.getRuleViolation(value, rule, true);
            if (violation != null) {
                callback("Invalid value for " + key + ": " + base.formatRuleViolation(violation));
                return;
            }
            missingKeys.splice(missingKeys.indexOf(key), 1);
        }
        if (missingKeys.length > 0) {
            callback("Missing key: " + missingKeys[0]);
            return;
        }
        if (node.id == null) {
            node.id = this.nextId.toString();
            this.nextId++;
        }
        this.byId[node.id] = node;
        this.parentNodesById[node.id] = this.byId[parentId];
        // Fix index if it's out of bounds
        if (index == null || index < 0 || index > siblings.length)
            index = siblings.length;
        siblings.splice(index, 0, node);
        callback(null, index);
        this.emit("change");
    };
    TreeById.prototype.client_add = function (node, parentId, index) {
        var siblings = this.pub;
        if (parentId != null)
            siblings = (this.byId[parentId] != null) ? this.byId[parentId].children : null;
        siblings.splice(index, 0, node);
        this.byId[node.id] = node;
        this.parentNodesById[node.id] = this.byId[parentId];
    };
    TreeById.prototype.move = function (id, parentId, index, callback) {
        var node = this.byId[id];
        if (node == null) {
            callback("Invalid node id: " + id);
            return;
        }
        var parentNode = null;
        if (parentId != null) {
            parentNode = this.byId[parentId];
            if (parentNode == null || parentNode.children == null) {
                callback("Invalid parent node id: " + parentId);
                return;
            }
        }
        // Adjust insertion index if needed
        var siblings = (parentNode != null) ? parentNode.children : this.pub;
        if (index == null || index < 0 || index > siblings.length)
            index = siblings.length;
        var oldSiblings = (this.parentNodesById[id] != null) ? this.parentNodesById[id].children : this.pub;
        var oldIndex = oldSiblings.indexOf(node);
        oldSiblings.splice(oldIndex, 1);
        var actualIndex = index;
        if (siblings === oldSiblings && oldIndex < actualIndex)
            actualIndex--;
        siblings.splice(actualIndex, 0, node);
        this.parentNodesById[id] = parentNode;
        callback(null, index);
        this.emit("change");
    };
    TreeById.prototype.client_move = function (id, parentId, index) {
        var node = this.byId[id];
        var parentNode = (parentId != null) ? this.byId[parentId] : null;
        var siblings = (parentNode != null) ? this.byId[parentId].children : this.pub;
        var oldSiblings = (this.parentNodesById[id] != null) ? this.parentNodesById[id].children : this.pub;
        var oldIndex = oldSiblings.indexOf(node);
        oldSiblings.splice(oldIndex, 1);
        var actualIndex = index;
        if (siblings === oldSiblings && oldIndex < actualIndex)
            actualIndex--;
        siblings.splice(actualIndex, 0, node);
        this.parentNodesById[id] = parentNode;
    };
    TreeById.prototype.remove = function (id, callback) {
        var _this = this;
        var node = this.byId[id];
        if (node == null) {
            callback("Invalid node id: " + id);
            return;
        }
        var siblings = (this.parentNodesById[id] != null) ? this.parentNodesById[id].children : this.pub;
        siblings.splice(siblings.indexOf(node), 1);
        this.walkNode(node, null, function (node, parentNode) {
            delete _this.parentNodesById[node.id];
            delete _this.byId[node.id];
        });
        callback(null);
        this.emit("change");
    };
    TreeById.prototype.client_remove = function (id) {
        var _this = this;
        var node = this.byId[id];
        var siblings = (this.parentNodesById[id] != null) ? this.parentNodesById[id].children : this.pub;
        siblings.splice(siblings.indexOf(node), 1);
        this.walkNode(node, null, function (node, parentNode) {
            delete _this.parentNodesById[node.id];
            delete _this.byId[node.id];
        });
    };
    // clear() {}
    TreeById.prototype.setProperty = function (id, path, value, callback) {
        var node = this.byId[id];
        if (node == null) {
            callback("Invalid node id: " + id);
            return;
        }
        var parts = path.split(".");
        var rule = this.schema[parts[0]];
        for (var _i = 0, _a = parts.slice(1); _i < _a.length; _i++) {
            var part = _a[_i];
            rule = rule.properties[part];
            if (rule.type === "any")
                break;
        }
        if (rule == null) {
            callback("Invalid key: " + path);
            return;
        }
        if (rule.type !== "any") {
            var violation = base.getRuleViolation(value, rule);
            if (violation != null) {
                callback("Invalid value for " + path + ": " + base.formatRuleViolation(violation));
                return;
            }
        }
        for (var _b = 0, _c = parts.slice(0, parts.length - 1); _b < _c.length; _b++) {
            var part = _c[_b];
            node = node[part];
        }
        node[parts[parts.length - 1]] = value;
        callback(null, value);
        this.emit("change");
    };
    TreeById.prototype.client_setProperty = function (id, path, value) {
        var parts = path.split(".");
        var node = this.byId[id];
        for (var _i = 0, _a = parts.slice(0, parts.length - 1); _i < _a.length; _i++) {
            var part = _a[_i];
            node = node[part];
        }
        node[parts[parts.length - 1]] = value;
    };
    return TreeById;
})(events_1.EventEmitter);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TreeById;
