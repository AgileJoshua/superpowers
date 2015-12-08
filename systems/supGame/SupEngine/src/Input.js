var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var events_1 = require("events");
var Input = (function (_super) {
    __extends(Input, _super);
    function Input(canvas, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        _super.call(this);
        this.mouseButtons = [];
        this.mouseButtonsDown = [];
        this.mousePosition = { x: 0, y: 0 };
        this.mouseDelta = { x: 0, y: 0 };
        this.newMouseDelta = { x: 0, y: 0 };
        this.touches = [];
        this.touchesDown = [];
        this.keyboardButtons = [];
        this.keyboardButtonsDown = [];
        this.autoRepeatedKey = null;
        this.textEntered = "";
        this.newTextEntered = "";
        this.gamepadsButtons = [];
        this.gamepadsAxes = [];
        this.exited = false;
        this.wantsPointerLock = false;
        this.wantsFullscreen = false;
        this.wasPointerLocked = false;
        this.wasFullscreen = false;
        this._onPointerLockChange = function () {
            var isPointerLocked = _this._isPointerLocked();
            if (_this.wasPointerLocked != isPointerLocked) {
                _this.emit("mouseLockStateChange", isPointerLocked ? "active" : "suspended");
                _this.wasPointerLocked = isPointerLocked;
            }
        };
        this._onPointerLockError = function () {
            if (_this.wasPointerLocked) {
                _this.emit("mouseLockStateChange", "suspended");
                _this.wasPointerLocked = false;
            }
        };
        this._onFullscreenChange = function () {
            var isFullscreen = _this._isFullscreen();
            if (_this.wasFullscreen != isFullscreen) {
                _this.emit("fullscreenStateChange", isFullscreen ? "active" : "suspended");
                _this.wasFullscreen = isFullscreen;
            }
        };
        this._onFullscreenError = function () {
            if (_this.wasFullscreen) {
                _this.emit("fullscreenStateChange", "suspended");
                _this.wasFullscreen = false;
            }
        };
        this._onBlur = function () { _this.reset(); };
        this._onMouseMove = function (event) {
            event.preventDefault();
            if (_this.wantsPointerLock) {
                if (_this.wasPointerLocked) {
                    var delta = { x: 0, y: 0 };
                    if (event.movementX != null) {
                        delta.x = event.movementX;
                        delta.y = event.movementY;
                    }
                    else if (event.webkitMovementX != null) {
                        delta.x = event.webkitMovementX;
                        delta.y = event.webkitMovementY;
                    }
                    else if (event.mozMovementX == null) {
                        delta.x = event.mozMovementX;
                        delta.y = event.mozMovementY;
                    }
                    _this.newMouseDelta.x += delta.x;
                    _this.newMouseDelta.y += delta.y;
                }
            }
            else {
                var rect = event.target.getBoundingClientRect();
                _this.newMousePosition = { x: event.clientX - rect.left, y: event.clientY - rect.top };
            }
        };
        this._onMouseDown = function (event) {
            event.preventDefault();
            _this.canvas.focus();
            _this.mouseButtonsDown[event.button] = true;
            if (_this.wantsFullscreen && !_this.wasFullscreen)
                _this._doGoFullscreen();
            if (_this.wantsPointerLock && !_this.wasPointerLocked)
                _this._doPointerLock();
        };
        this._onMouseUp = function (event) {
            if (_this.mouseButtonsDown[event.button])
                event.preventDefault();
            _this.mouseButtonsDown[event.button] = false;
            if (_this.wantsFullscreen && !_this.wasFullscreen)
                _this._doGoFullscreen();
            if (_this.wantsPointerLock && !_this.wasPointerLocked)
                _this._doPointerLock();
        };
        this._onContextMenu = function (event) {
            event.preventDefault();
        };
        this._onMouseWheel = function (event) {
            event.preventDefault();
            _this.newScrollDelta = (event.wheelDelta > 0 || event.detail < 0) ? 1 : -1;
            return false;
        };
        this._onTouchStart = function (event) {
            event.preventDefault();
            var rect = event.target.getBoundingClientRect();
            for (var i = 0; i < event.changedTouches.length; i++) {
                var touch = event.changedTouches[i];
                _this.touches[touch.identifier].position.x = touch.clientX - rect.left;
                _this.touches[touch.identifier].position.y = touch.clientY - rect.top;
                _this.touchesDown[touch.identifier] = true;
                if (touch.identifier === 0) {
                    _this.newMousePosition = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
                    _this.mouseButtonsDown[0] = true;
                }
            }
        };
        this._onTouchEnd = function (event) {
            event.preventDefault();
            for (var i = 0; i < event.changedTouches.length; i++) {
                var touch = event.changedTouches[i];
                _this.touchesDown[touch.identifier] = false;
                if (touch.identifier === 0)
                    _this.mouseButtonsDown[0] = false;
            }
        };
        this._onTouchMove = function (event) {
            event.preventDefault();
            var rect = event.target.getBoundingClientRect();
            for (var i = 0; i < event.changedTouches.length; i++) {
                var touch = event.changedTouches[i];
                _this.touches[touch.identifier].position.x = touch.clientX - rect.left;
                _this.touches[touch.identifier].position.y = touch.clientY - rect.top;
                if (touch.identifier === 0)
                    _this.newMousePosition = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
            }
        };
        // TODO: stop using keyCode when KeyboardEvent.code is supported more widely
        // See https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent.code
        this._onKeyDown = function (event) {
            // NOTE: Key codes in range 33-47 are Page Up/Down, Home/End, arrow keys, Insert/Delete, etc.
            var isControlKey = event.keyCode < 48 && event.keyCode !== 32;
            if (isControlKey)
                event.preventDefault();
            if (!_this.keyboardButtonsDown[event.keyCode])
                _this.keyboardButtonsDown[event.keyCode] = true;
            else
                _this.autoRepeatedKey = event.keyCode;
            return !isControlKey;
        };
        this._onKeyPress = function (event) {
            if (event.keyCode > 0 && event.keyCode < 32)
                return;
            if (event.char != null)
                _this.newTextEntered += event.char;
            else if (event.charCode !== 0)
                _this.newTextEntered += String.fromCharCode(event.charCode);
            else
                _this.newTextEntered += String.fromCharCode(event.keyCode);
        };
        this._onKeyUp = function (event) {
            _this.keyboardButtonsDown[event.keyCode] = false;
        };
        this._doExitCallback = function () {
            // NOTE: It seems window.onbeforeunload might be called twice
            // in some circumstances so we check if the callback was cleared already
            // http://stackoverflow.com/questions/8711393/onbeforeunload-fires-twice
            if (!_this.exited)
                _this.emit("exit");
            _this.exited = true;
        };
        if (options == null)
            options = {};
        this.canvas = canvas;
        // Mouse
        this.canvas.addEventListener("mousemove", this._onMouseMove);
        this.canvas.addEventListener("mousedown", this._onMouseDown);
        document.addEventListener("mouseup", this._onMouseUp);
        this.canvas.addEventListener("contextmenu", this._onContextMenu);
        this.canvas.addEventListener("DOMMouseScroll", this._onMouseWheel);
        this.canvas.addEventListener("mousewheel", this._onMouseWheel);
        if ("onpointerlockchange" in document)
            document.addEventListener("pointerlockchange", this._onPointerLockChange, false);
        else if ("onmozpointerlockchange" in document)
            document.addEventListener("mozpointerlockchange", this._onPointerLockChange, false);
        else if ("onwebkitpointerlockchange" in document)
            document.addEventListener("webkitpointerlockchange", this._onPointerLockChange, false);
        if ("onpointerlockerror" in document)
            document.addEventListener("pointerlockerror", this._onPointerLockError, false);
        else if ("onmozpointerlockerror" in document)
            document.addEventListener("mozpointerlockerror", this._onPointerLockError, false);
        else if ("onwebkitpointerlockerror" in document)
            document.addEventListener("webkitpointerlockerror", this._onPointerLockError, false);
        if ("onfullscreenchange" in document)
            document.addEventListener("fullscreenchange", this._onFullscreenChange, false);
        else if ("onmozfullscreenchange" in document)
            document.addEventListener("mozfullscreenchange", this._onFullscreenChange, false);
        else if ("onwebkitfullscreenchange" in document)
            document.addEventListener("webkitfullscreenchange", this._onFullscreenChange, false);
        if ("onfullscreenerror" in document)
            document.addEventListener("fullscreenerror", this._onFullscreenError, false);
        else if ("onmozfullscreenerror" in document)
            document.addEventListener("mozfullscreenerror", this._onFullscreenError, false);
        else if ("onwebkitfullscreenerror" in document)
            document.addEventListener("webkitfullscreenerror", this._onFullscreenError, false);
        // Touch
        this.canvas.addEventListener("touchstart", this._onTouchStart);
        this.canvas.addEventListener("touchend", this._onTouchEnd);
        this.canvas.addEventListener("touchmove", this._onTouchMove);
        // Keyboard
        this.canvas.addEventListener("keydown", this._onKeyDown);
        this.canvas.addEventListener("keypress", this._onKeyPress);
        document.addEventListener("keyup", this._onKeyUp);
        // Gamepad
        for (var i = 0; i < 4; i++) {
            this.gamepadsButtons[i] = [];
            this.gamepadsAxes[i] = [];
        }
        // On exit
        if (options.enableOnExit) {
            window.onbeforeunload = this._doExitCallback;
        }
        window.addEventListener("blur", this._onBlur);
        this.reset();
    }
    Input.prototype.destroy = function () {
        this.removeAllListeners();
        this.canvas.removeEventListener("mousemove", this._onMouseMove);
        this.canvas.removeEventListener("mousedown", this._onMouseDown);
        document.removeEventListener("mouseup", this._onMouseUp);
        this.canvas.removeEventListener("contextmenu", this._onContextMenu);
        this.canvas.removeEventListener("DOMMouseScroll", this._onMouseWheel);
        this.canvas.removeEventListener("mousewheel", this._onMouseWheel);
        if ("onpointerlockchange" in document)
            document.removeEventListener("pointerlockchange", this._onPointerLockChange, false);
        else if ("onmozpointerlockchange" in document)
            document.removeEventListener("mozpointerlockchange", this._onPointerLockChange, false);
        else if ("onwebkitpointerlockchange" in document)
            document.removeEventListener("webkitpointerlockchange", this._onPointerLockChange, false);
        if ("onpointerlockerror" in document)
            document.removeEventListener("pointerlockerror", this._onPointerLockError, false);
        else if ("onmozpointerlockerror" in document)
            document.removeEventListener("mozpointerlockerror", this._onPointerLockError, false);
        else if ("onwebkitpointerlockerror" in document)
            document.removeEventListener("webkitpointerlockerror", this._onPointerLockError, false);
        if ("onfullscreenchange" in document)
            document.removeEventListener("fullscreenchange", this._onFullscreenChange, false);
        else if ("onmozfullscreenchange" in document)
            document.removeEventListener("mozfullscreenchange", this._onFullscreenChange, false);
        else if ("onwebkitfullscreenchange" in document)
            document.removeEventListener("webkitfullscreenchange", this._onFullscreenChange, false);
        if ("onfullscreenerror" in document)
            document.removeEventListener("fullscreenerror", this._onFullscreenError, false);
        else if ("onmozfullscreenerror" in document)
            document.removeEventListener("mozfullscreenerror", this._onFullscreenError, false);
        else if ("onwebkitfullscreenerror" in document)
            document.removeEventListener("webkitfullscreenerror", this._onFullscreenError, false);
        this.canvas.removeEventListener("touchstart", this._onTouchStart);
        this.canvas.removeEventListener("touchend", this._onTouchEnd);
        this.canvas.removeEventListener("touchmove", this._onTouchMove);
        this.canvas.removeEventListener("keydown", this._onKeyDown);
        this.canvas.removeEventListener("keypress", this._onKeyPress);
        document.removeEventListener("keyup", this._onKeyUp);
        window.removeEventListener("blur", this._onBlur);
    };
    Input.prototype.reset = function () {
        // Mouse
        this.newScrollDelta = 0;
        for (var i = 0; i <= 6; i++) {
            this.mouseButtons[i] = { isDown: false, wasJustPressed: false, wasJustReleased: false };
            this.mouseButtonsDown[i] = false;
        }
        this.mousePosition.x = 0;
        this.mousePosition.y = 0;
        this.newMousePosition = null;
        this.mouseDelta.x = 0;
        this.mouseDelta.y = 0;
        this.newMouseDelta.x = 0;
        this.newMouseDelta.y = 0;
        // Touch
        for (var i = 0; i < Input.maxTouches; i++) {
            this.touches[i] = { isDown: false, wasStarted: false, wasEnded: false, position: { x: 0, y: 0 } };
            this.touchesDown[i] = false;
        }
        // Keyboard
        for (var i = 0; i <= 255; i++) {
            this.keyboardButtons[i] = { isDown: false, wasJustPressed: false, wasJustAutoRepeated: false, wasJustReleased: false };
            this.keyboardButtonsDown[i] = false;
        }
        this.textEntered = "";
        this.newTextEntered = "";
        // Gamepads
        for (var i = 0; i < 4; i++) {
            for (var button = 0; button < 16; button++)
                this.gamepadsButtons[i][button] = { isDown: false, wasJustPressed: false, wasJustReleased: false, value: 0 };
            for (var axes = 0; axes < 4; axes++)
                this.gamepadsAxes[i][axes] = 0;
        }
    };
    Input.prototype.lockMouse = function () {
        this.wantsPointerLock = true;
        this.newMouseDelta.x = 0;
        this.newMouseDelta.y = 0;
    };
    Input.prototype.unlockMouse = function () {
        this.wantsPointerLock = false;
        this.wasPointerLocked = false;
        if (!this._isPointerLocked())
            return;
        if (document.exitPointerLock)
            document.exitPointerLock();
        else if (document.webkitExitPointerLock)
            document.webkitExitPointerLock();
        else if (document.mozExitPointerLock)
            document.mozExitPointerLock();
    };
    Input.prototype._isPointerLocked = function () {
        return document.pointerLockElement === this.canvas ||
            document.webkitPointerLockElement === this.canvas ||
            document.mozPointerLockElement === this.canvas;
    };
    Input.prototype._doPointerLock = function () {
        if (this.canvas.requestPointerLock)
            this.canvas.requestPointerLock();
        else if (this.canvas.webkitRequestPointerLock)
            this.canvas.webkitRequestPointerLock();
        else if (this.canvas.mozRequestPointerLock)
            this.canvas.mozRequestPointerLock();
    };
    Input.prototype.goFullscreen = function () { this.wantsFullscreen = true; };
    Input.prototype.exitFullscreen = function () {
        this.wantsFullscreen = false;
        this.wasFullscreen = false;
        if (!this._isFullscreen())
            return;
        if (document.exitFullscreen)
            document.exitFullscreen();
        else if (document.webkitExitFullscreen)
            document.webkitExitFullscreen();
        else if (document.mozCancelFullScreen)
            document.mozCancelFullScreen();
    };
    Input.prototype._isFullscreen = function () {
        return document.fullscreenElement === this.canvas ||
            document.webkitFullscreenElement === this.canvas ||
            document.mozFullScreenElement === this.canvas;
    };
    Input.prototype._doGoFullscreen = function () {
        if (this.canvas.requestFullscreen)
            this.canvas.requestFullscreen();
        else if (this.canvas.webkitRequestFullscreen)
            this.canvas.webkitRequestFullscreen();
        else if (this.canvas.mozRequestFullScreen)
            this.canvas.mozRequestFullScreen();
    };
    Input.prototype.update = function () {
        this.mouseButtonsDown[5] = this.newScrollDelta > 0;
        this.mouseButtonsDown[6] = this.newScrollDelta < 0;
        if (this.newScrollDelta !== 0)
            this.newScrollDelta = 0;
        if (this.wantsPointerLock) {
            this.mouseDelta.x = this.newMouseDelta.x;
            this.mouseDelta.y = this.newMouseDelta.y;
            this.newMouseDelta.x = 0;
            this.newMouseDelta.y = 0;
        }
        else if (this.newMousePosition != null) {
            this.mouseDelta.x = this.newMousePosition.x - this.mousePosition.x;
            this.mouseDelta.y = this.newMousePosition.y - this.mousePosition.y;
            this.mousePosition.x = this.newMousePosition.x;
            this.mousePosition.y = this.newMousePosition.y;
            this.newMousePosition = null;
        }
        else {
            this.mouseDelta.x = 0;
            this.mouseDelta.y = 0;
        }
        for (var i = 0; i < this.mouseButtons.length; i++) {
            var mouseButton = this.mouseButtons[i];
            var wasDown = mouseButton.isDown;
            mouseButton.isDown = this.mouseButtonsDown[i];
            mouseButton.wasJustPressed = !wasDown && mouseButton.isDown;
            mouseButton.wasJustReleased = wasDown && !mouseButton.isDown;
        }
        for (var i = 0; i < this.touches.length; i++) {
            var touch = this.touches[i];
            var wasDown = touch.isDown;
            touch.isDown = this.touchesDown[i];
            touch.wasStarted = !wasDown && touch.isDown;
            touch.wasEnded = wasDown && !touch.isDown;
        }
        for (var i = 0; i < this.keyboardButtons.length; i++) {
            var keyboardButton = this.keyboardButtons[i];
            var wasDown = keyboardButton.isDown;
            keyboardButton.isDown = this.keyboardButtonsDown[i];
            keyboardButton.wasJustPressed = !wasDown && keyboardButton.isDown;
            keyboardButton.wasJustAutoRepeated = false;
            keyboardButton.wasJustReleased = wasDown && !keyboardButton.isDown;
        }
        if (this.autoRepeatedKey != null) {
            this.keyboardButtons[this.autoRepeatedKey].wasJustAutoRepeated = true;
            this.autoRepeatedKey = null;
        }
        this.textEntered = this.newTextEntered;
        this.newTextEntered = "";
        var gamepads = (navigator.getGamepads != null) ? navigator.getGamepads() : null;
        if (gamepads == null)
            return;
        for (var index = 0; index < 4; index++) {
            var gamepad = gamepads[index];
            if (gamepad == null)
                continue;
            for (var i = 0; i < this.gamepadsButtons[index].length; i++) {
                if (gamepad.buttons[i] == null)
                    continue;
                var button = this.gamepadsButtons[index][i];
                var wasDown = button.isDown;
                button.isDown = gamepad.buttons[i].pressed;
                button.value = gamepad.buttons[i].value;
                button.wasJustPressed = !wasDown && button.isDown;
                button.wasJustReleased = wasDown && !button.isDown;
            }
            for (var stick = 0; stick < 2; stick++) {
                if (gamepad.axes[2 * stick] == null || gamepad.axes[2 * stick + 1] == null)
                    continue;
                var axisLength = Math.sqrt(Math.pow(Math.abs(gamepad.axes[2 * stick]), 2) + Math.pow(Math.abs(gamepad.axes[2 * stick + 1]), 2));
                if (axisLength < 0.25) {
                    this.gamepadsAxes[index][2 * stick] = 0;
                    this.gamepadsAxes[index][2 * stick + 1] = 0;
                }
                else {
                    this.gamepadsAxes[index][2 * stick] = gamepad.axes[2 * stick];
                    this.gamepadsAxes[index][2 * stick + 1] = gamepad.axes[2 * stick + 1];
                }
            }
        }
    };
    Input.maxTouches = 10;
    return Input;
})(events_1.EventEmitter);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Input;
// FIXME: KeyEvent isn't in lib.d.ts yet
if (global.window != null && window.KeyEvent == null) {
    window.KeyEvent = {
        DOM_VK_CANCEL: 3,
        DOM_VK_HELP: 6,
        DOM_VK_BACK_SPACE: 8,
        DOM_VK_TAB: 9,
        DOM_VK_CLEAR: 12,
        DOM_VK_RETURN: 13,
        DOM_VK_ENTER: 14,
        DOM_VK_SHIFT: 16,
        DOM_VK_CONTROL: 17,
        DOM_VK_ALT: 18,
        DOM_VK_PAUSE: 19,
        DOM_VK_CAPS_LOCK: 20,
        DOM_VK_ESCAPE: 27,
        DOM_VK_SPACE: 32,
        DOM_VK_PAGE_UP: 33,
        DOM_VK_PAGE_DOWN: 34,
        DOM_VK_END: 35,
        DOM_VK_HOME: 36,
        DOM_VK_LEFT: 37,
        DOM_VK_UP: 38,
        DOM_VK_RIGHT: 39,
        DOM_VK_DOWN: 40,
        DOM_VK_PRINTSCREEN: 44,
        DOM_VK_INSERT: 45,
        DOM_VK_DELETE: 46,
        DOM_VK_0: 48,
        DOM_VK_1: 49,
        DOM_VK_2: 50,
        DOM_VK_3: 51,
        DOM_VK_4: 52,
        DOM_VK_5: 53,
        DOM_VK_6: 54,
        DOM_VK_7: 55,
        DOM_VK_8: 56,
        DOM_VK_9: 57,
        DOM_VK_SEMICOLON: 59,
        DOM_VK_EQUALS: 61,
        DOM_VK_A: 65,
        DOM_VK_B: 66,
        DOM_VK_C: 67,
        DOM_VK_D: 68,
        DOM_VK_E: 69,
        DOM_VK_F: 70,
        DOM_VK_G: 71,
        DOM_VK_H: 72,
        DOM_VK_I: 73,
        DOM_VK_J: 74,
        DOM_VK_K: 75,
        DOM_VK_L: 76,
        DOM_VK_M: 77,
        DOM_VK_N: 78,
        DOM_VK_O: 79,
        DOM_VK_P: 80,
        DOM_VK_Q: 81,
        DOM_VK_R: 82,
        DOM_VK_S: 83,
        DOM_VK_T: 84,
        DOM_VK_U: 85,
        DOM_VK_V: 86,
        DOM_VK_W: 87,
        DOM_VK_X: 88,
        DOM_VK_Y: 89,
        DOM_VK_Z: 90,
        DOM_VK_CONTEXT_MENU: 93,
        DOM_VK_NUMPAD0: 96,
        DOM_VK_NUMPAD1: 97,
        DOM_VK_NUMPAD2: 98,
        DOM_VK_NUMPAD3: 99,
        DOM_VK_NUMPAD4: 100,
        DOM_VK_NUMPAD5: 101,
        DOM_VK_NUMPAD6: 102,
        DOM_VK_NUMPAD7: 103,
        DOM_VK_NUMPAD8: 104,
        DOM_VK_NUMPAD9: 105,
        DOM_VK_MULTIPLY: 106,
        DOM_VK_ADD: 107,
        DOM_VK_SEPARATOR: 108,
        DOM_VK_SUBTRACT: 109,
        DOM_VK_DECIMAL: 110,
        DOM_VK_DIVIDE: 111,
        DOM_VK_F1: 112,
        DOM_VK_F2: 113,
        DOM_VK_F3: 114,
        DOM_VK_F4: 115,
        DOM_VK_F5: 116,
        DOM_VK_F6: 117,
        DOM_VK_F7: 118,
        DOM_VK_F8: 119,
        DOM_VK_F9: 120,
        DOM_VK_F10: 121,
        DOM_VK_F11: 122,
        DOM_VK_F12: 123,
        DOM_VK_F13: 124,
        DOM_VK_F14: 125,
        DOM_VK_F15: 126,
        DOM_VK_F16: 127,
        DOM_VK_F17: 128,
        DOM_VK_F18: 129,
        DOM_VK_F19: 130,
        DOM_VK_F20: 131,
        DOM_VK_F21: 132,
        DOM_VK_F22: 133,
        DOM_VK_F23: 134,
        DOM_VK_F24: 135,
        DOM_VK_NUM_LOCK: 144,
        DOM_VK_SCROLL_LOCK: 145,
        DOM_VK_COMMA: 188,
        DOM_VK_PERIOD: 190,
        DOM_VK_SLASH: 191,
        DOM_VK_BACK_QUOTE: 192,
        DOM_VK_OPEN_BRACKET: 219,
        DOM_VK_BACK_SLASH: 220,
        DOM_VK_CLOSE_BRACKET: 221,
        DOM_VK_QUOTE: 222,
        DOM_VK_META: 224
    };
}
