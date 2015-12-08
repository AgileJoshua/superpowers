var ActorTree = (function () {
    function ActorTree() {
        this.root = [];
    }
    ActorTree.prototype._walkRecurseTopDown = function (node, parentNode, callback) {
        if (callback(node, parentNode) === false)
            return false;
        for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
            var child = _a[_i];
            if (this._walkRecurseTopDown(child, node, callback) === false)
                return false;
        }
        return true;
    };
    ActorTree.prototype.walkTopDown = function (callback) {
        for (var _i = 0, _a = this.root; _i < _a.length; _i++) {
            var child = _a[_i];
            if (this._walkRecurseTopDown(child, null, callback) === false)
                return false;
        }
        return true;
    };
    ActorTree.prototype.walkDown = function (rootNode, callback) {
        for (var _i = 0, _a = rootNode.children; _i < _a.length; _i++) {
            var child = _a[_i];
            if (this._walkRecurseTopDown(child, rootNode, callback) === false)
                return false;
        }
        return true;
    };
    return ActorTree;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ActorTree;
