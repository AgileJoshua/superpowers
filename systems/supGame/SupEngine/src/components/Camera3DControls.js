var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var THREE = require("three");
var ActorComponent_1 = require("../ActorComponent");
var tmpMovement = new THREE.Vector3();
var tmpQuaternion = new THREE.Quaternion();
var forwardVector = new THREE.Vector3(0, 1, 0);
var Camera3DControls = (function (_super) {
    __extends(Camera3DControls, _super);
    function Camera3DControls(actor, camera) {
        _super.call(this, actor, "Camera3DControls");
        this.movementSpeed = 0.2;
        this.camera = camera;
        this.rotation = actor.getLocalEulerAngles(new THREE.Euler());
    }
    Camera3DControls.prototype.setIsLayerActive = function (active) { };
    Camera3DControls.prototype.update = function () {
        var keyButtons = this.actor.gameInstance.input.keyboardButtons;
        var keyEvent = window.KeyEvent; // Workaround for unknown KeyEvent property on window object
        if (!keyButtons[keyEvent.DOM_VK_CONTROL].isDown) {
            tmpMovement.setX((keyButtons[keyEvent.DOM_VK_A].isDown || keyButtons[keyEvent.DOM_VK_Q].isDown) ? -this.movementSpeed :
                ((keyButtons[keyEvent.DOM_VK_D].isDown) ? this.movementSpeed :
                    0));
            tmpMovement.setZ((keyButtons[keyEvent.DOM_VK_W].isDown || keyButtons[keyEvent.DOM_VK_Z].isDown) ? -this.movementSpeed :
                ((keyButtons[keyEvent.DOM_VK_S].isDown) ? this.movementSpeed :
                    0));
            tmpMovement.setY((keyButtons[keyEvent.DOM_VK_SPACE].isDown) ? this.movementSpeed :
                ((keyButtons[keyEvent.DOM_VK_SHIFT].isDown) ? -this.movementSpeed :
                    0));
            tmpMovement.applyQuaternion(tmpQuaternion.setFromAxisAngle(forwardVector, this.rotation.y));
            this.actor.moveLocal(tmpMovement);
        }
        // Camera rotation
        if (this.actor.gameInstance.input.mouseButtons[1].isDown ||
            (this.actor.gameInstance.input.mouseButtons[0].isDown && keyButtons[keyEvent.DOM_VK_ALT].isDown)) {
            this.rotation.x = Math.min(Math.max(this.rotation.x - this.actor.gameInstance.input.mouseDelta.y / 250, -Math.PI / 2), Math.PI / 2);
            this.rotation.y -= this.actor.gameInstance.input.mouseDelta.x / 250;
            this.actor.setLocalEulerAngles(this.rotation);
        }
    };
    return Camera3DControls;
})(ActorComponent_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Camera3DControls;
