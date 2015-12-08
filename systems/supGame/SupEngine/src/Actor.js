var THREE = require("three");
var tmpMatrix = new THREE.Matrix4();
var tmpVector3 = new THREE.Vector3();
var tmpQuaternion = new THREE.Quaternion();
var tmpEuler = new THREE.Euler();
var Actor = (function () {
    function Actor(gameInstance, name, parent, options) {
        this.children = [];
        this.components = [];
        this.layer = 0;
        this.pendingForDestruction = false;
        this.threeObject = new THREE.Object3D;
        this.gameInstance = gameInstance;
        this.name = name;
        if (parent != null && parent.pendingForDestruction)
            throw new Error("The parent passed to new SupEngine.Actor() has been destroyed and cannot be used as a parent.");
        this.parent = parent;
        this.threeObject.userData.isActor = true;
        if (this.parent != null) {
            this.parent.children.push(this);
            this.parent.threeObject.add(this.threeObject);
            this.threeObject.updateMatrixWorld(false);
        }
        else {
            this.gameInstance.tree.root.push(this);
            this.gameInstance.threeScene.add(this.threeObject);
        }
        if (options != null) {
            if (options.visible === false)
                this.threeObject.visible = false;
            if (options.layer != null)
                this.layer = options.layer;
        }
    }
    Actor.prototype.awake = function () { for (var _i = 0, _a = this.components.slice(); _i < _a.length; _i++) {
        var component = _a[_i];
        component.awake();
    } };
    Actor.prototype.setActiveLayer = function (layer) {
        var active = layer == null || this.layer === layer;
        for (var _i = 0, _a = this.components; _i < _a.length; _i++) {
            var component = _a[_i];
            component.setIsLayerActive(active);
        }
    };
    Actor.prototype.update = function () {
        if (this.pendingForDestruction)
            return;
        for (var _i = 0, _a = this.components.slice(); _i < _a.length; _i++) {
            var component = _a[_i];
            component.update();
        }
    };
    // Transform
    Actor.prototype.getGlobalMatrix = function (matrix) { return matrix.copy(this.threeObject.matrixWorld); };
    Actor.prototype.getGlobalPosition = function (position) { return position.setFromMatrixPosition(this.threeObject.matrixWorld); };
    Actor.prototype.getGlobalOrientation = function (orientation) { return orientation.set(0, 0, 0, 1).multiplyQuaternions(this.getParentGlobalOrientation(tmpQuaternion), this.threeObject.quaternion); };
    Actor.prototype.getGlobalEulerAngles = function (angles) { return angles.setFromQuaternion(this.getGlobalOrientation(tmpQuaternion)); };
    Actor.prototype.getLocalPosition = function (position) { return position.copy(this.threeObject.position); };
    Actor.prototype.getLocalOrientation = function (orientation) { return orientation.copy(this.threeObject.quaternion); };
    Actor.prototype.getLocalEulerAngles = function (angles) { return angles.setFromQuaternion(this.threeObject.quaternion); };
    Actor.prototype.getLocalScale = function (scale) { return scale.copy(this.threeObject.scale); };
    Actor.prototype.getParentGlobalOrientation = function (orientation) {
        var ancestorOrientation = new THREE.Quaternion();
        var ancestorActor = this.threeObject;
        while (ancestorActor.parent != null) {
            ancestorActor = ancestorActor.parent;
            ancestorOrientation.multiplyQuaternions(ancestorActor.quaternion, ancestorOrientation);
        }
        return ancestorOrientation;
    };
    Actor.prototype.setGlobalMatrix = function (matrix) {
        matrix.multiplyMatrices(new THREE.Matrix4().getInverse(this.threeObject.parent.matrixWorld), matrix);
        matrix.decompose(this.threeObject.position, this.threeObject.quaternion, this.threeObject.scale);
        this.threeObject.updateMatrixWorld(false);
    };
    Actor.prototype.setGlobalPosition = function (pos) {
        this.threeObject.parent.worldToLocal(pos);
        this.threeObject.position.set(pos.x, pos.y, pos.z);
        this.threeObject.updateMatrixWorld(false);
    };
    Actor.prototype.setLocalPosition = function (pos) {
        this.threeObject.position.copy(pos);
        this.threeObject.updateMatrixWorld(false);
    };
    Actor.prototype.lookAt = function (target, up) {
        if (up === void 0) { up = this.threeObject.up; }
        var m = new THREE.Matrix4();
        m.lookAt(this.getGlobalPosition(tmpVector3), target, up);
        this.setGlobalOrientation(tmpQuaternion.setFromRotationMatrix(m));
    };
    Actor.prototype.lookTowards = function (direction, up) {
        this.lookAt(this.getGlobalPosition(tmpVector3).sub(direction), up);
    };
    Actor.prototype.setLocalOrientation = function (quaternion) {
        this.threeObject.quaternion.copy(quaternion);
        this.threeObject.updateMatrixWorld(false);
    };
    Actor.prototype.setGlobalOrientation = function (quaternion) {
        var inverseParentQuaternion = new THREE.Quaternion().setFromRotationMatrix(tmpMatrix.extractRotation(this.threeObject.parent.matrixWorld)).inverse();
        quaternion.multiplyQuaternions(inverseParentQuaternion, quaternion);
        this.threeObject.quaternion.copy(quaternion);
        this.threeObject.updateMatrixWorld(false);
    };
    Actor.prototype.setLocalEulerAngles = function (eulerAngles) {
        this.threeObject.quaternion.setFromEuler(eulerAngles);
        this.threeObject.updateMatrixWorld(false);
    };
    Actor.prototype.setGlobalEulerAngles = function (eulerAngles) {
        var globalQuaternion = new THREE.Quaternion().setFromEuler(eulerAngles);
        var inverseParentQuaternion = new THREE.Quaternion().setFromRotationMatrix(tmpMatrix.extractRotation(this.threeObject.parent.matrixWorld)).inverse();
        globalQuaternion.multiplyQuaternions(inverseParentQuaternion, globalQuaternion);
        this.threeObject.quaternion.copy(globalQuaternion);
        this.threeObject.updateMatrixWorld(false);
    };
    Actor.prototype.setLocalScale = function (scale) {
        this.threeObject.scale.copy(scale);
        this.threeObject.updateMatrixWorld(false);
    };
    Actor.prototype.setParent = function (newParent, keepLocal) {
        if (keepLocal === void 0) { keepLocal = false; }
        if (this.pendingForDestruction)
            throw new Error("Cannot set parent of destroyed actor");
        if (newParent != null && newParent.pendingForDestruction)
            throw new Error("Cannot reparent actor to destroyed actor");
        if (!keepLocal)
            this.getGlobalMatrix(tmpMatrix);
        var oldSiblings = (this.parent != null) ? this.parent.children : this.gameInstance.tree.root;
        oldSiblings.splice(oldSiblings.indexOf(this), 1);
        this.threeObject.parent.remove(this.threeObject);
        this.parent = newParent;
        var siblings = (newParent != null) ? newParent.children : this.gameInstance.tree.root;
        siblings.push(this);
        var threeParent = (newParent != null) ? newParent.threeObject : this.gameInstance.threeScene;
        threeParent.add(this.threeObject);
        if (!keepLocal)
            this.setGlobalMatrix(tmpMatrix);
        else
            this.threeObject.updateMatrixWorld(false);
    };
    Actor.prototype.rotateGlobal = function (quaternion) {
        this.getGlobalOrientation(tmpQuaternion);
        tmpQuaternion.multiplyQuaternions(quaternion, tmpQuaternion);
        this.setGlobalOrientation(tmpQuaternion);
    };
    Actor.prototype.rotateLocal = function (quaternion) {
        this.threeObject.quaternion.multiplyQuaternions(quaternion, this.threeObject.quaternion);
        this.threeObject.updateMatrixWorld(false);
    };
    Actor.prototype.rotateGlobalEulerAngles = function (eulerAngles) {
        var quaternion = new THREE.Quaternion().setFromEuler(eulerAngles);
        this.rotateGlobal(quaternion);
    };
    Actor.prototype.rotateLocalEulerAngles = function (eulerAngles) {
        var quaternion = new THREE.Quaternion().setFromEuler(eulerAngles);
        this.threeObject.quaternion.multiplyQuaternions(quaternion, this.threeObject.quaternion);
        this.threeObject.updateMatrixWorld(false);
    };
    Actor.prototype.moveGlobal = function (offset) {
        this.getGlobalPosition(tmpVector3).add(offset);
        this.setGlobalPosition(tmpVector3);
    };
    Actor.prototype.moveLocal = function (offset) {
        this.threeObject.position.add(offset);
        this.threeObject.updateMatrixWorld(false);
    };
    Actor.prototype.moveOriented = function (offset) {
        offset.applyQuaternion(this.threeObject.quaternion);
        this.threeObject.position.add(offset);
        this.threeObject.updateMatrixWorld(false);
    };
    Actor.prototype._destroy = function () {
        while (this.components.length > 0)
            this.components[0]._destroy();
        this.components = null;
        if (this.parent != null) {
            this.parent.threeObject.remove(this.threeObject);
            this.parent.children.splice(this.parent.children.indexOf(this), 1);
            this.parent = null;
        }
        else {
            this.gameInstance.tree.root.splice(this.gameInstance.tree.root.indexOf(this), 1);
            this.gameInstance.threeScene.remove(this.threeObject);
        }
        this.threeObject = null;
        var outer = this.__outer;
        if (outer != null)
            outer.__inner = null;
        this.gameInstance = null;
    };
    Actor.prototype._markDestructionPending = function () {
        this.pendingForDestruction = true;
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            child._markDestructionPending();
        }
    };
    return Actor;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Actor;
