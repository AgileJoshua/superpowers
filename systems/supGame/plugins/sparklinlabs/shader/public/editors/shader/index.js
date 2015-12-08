(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require("./ui");
require("./engine");
require("./network");

},{"./engine":7,"./network":8,"./ui":9}],2:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],3:[function(require,module,exports){
(function (global){
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.PerfectResize = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
/// <reference path="../typings/tsd.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var events = require("events");
var ResizeHandle = (function (_super) {
    __extends(ResizeHandle, _super);
    function ResizeHandle(targetElt, direction, options) {
        var _this = this;
        _super.call(this);
        this.savedSize = null;
        this.onDoubleClick = function (event) {
            if (event.button !== 0 || !_this.handleElt.classList.contains("collapsable"))
                return;
            var size = _this.targetElt.getBoundingClientRect()[_this.horizontal ? "width" : "height"];
            var newSize;
            if (size > 0) {
                _this.savedSize = size;
                newSize = 0;
                _this.targetElt.style.display = "none";
            }
            else {
                newSize = _this.savedSize;
                _this.savedSize = null;
                _this.targetElt.style.display = "";
            }
            if (_this.horizontal)
                _this.targetElt.style.width = newSize + "px";
            else
                _this.targetElt.style.height = newSize + "px";
        };
        this.onMouseDown = function (event) {
            if (event.button !== 0)
                return;
            if (_this.targetElt.style.display === "none")
                return;
            if (_this.handleElt.classList.contains("disabled"))
                return;
            event.preventDefault();
            _this.emit("dragStart");
            var initialSize;
            var startDrag;
            var directionClass;
            if (_this.horizontal) {
                initialSize = _this.targetElt.getBoundingClientRect().width;
                startDrag = event.clientX;
                directionClass = "vertical";
            }
            else {
                initialSize = _this.targetElt.getBoundingClientRect().height;
                startDrag = event.clientY;
                directionClass = "horizontal";
            }
            var dragTarget;
            if (_this.handleElt.setCapture != null) {
                dragTarget = _this.handleElt;
                dragTarget.setCapture();
            }
            else {
                dragTarget = window;
            }
            document.documentElement.classList.add("handle-dragging", directionClass);
            var onMouseMove = function (event) {
                var size = initialSize + (_this.start ? -startDrag : startDrag);
                _this.emit("drag");
                if (_this.horizontal) {
                    size += _this.start ? event.clientX : -event.clientX;
                    _this.targetElt.style.width = size + "px";
                }
                else {
                    size += _this.start ? event.clientY : -event.clientY;
                    _this.targetElt.style.height = size + "px";
                }
            };
            var onMouseUp = function (event) {
                if (dragTarget.releaseCapture != null)
                    dragTarget.releaseCapture();
                document.documentElement.classList.remove("handle-dragging", directionClass);
                dragTarget.removeEventListener("mousemove", onMouseMove);
                dragTarget.removeEventListener("mouseup", onMouseUp);
                _this.emit("dragEnd");
            };
            dragTarget.addEventListener("mousemove", onMouseMove);
            dragTarget.addEventListener("mouseup", onMouseUp);
        };
        if (["left", "right", "top", "bottom"].indexOf(direction) === -1)
            throw new Error("Invalid direction");
        this.horizontal = ["left", "right"].indexOf(direction) !== -1;
        this.start = ["left", "top"].indexOf(direction) !== -1;
        if (options == null)
            options = {};
        this.targetElt = targetElt;
        this.direction = direction;
        this.handleElt = document.createElement("div");
        this.handleElt.classList.add("resize-handle");
        this.handleElt.classList.add(direction);
        if (options.collapsable)
            this.handleElt.classList.add("collapsable");
        if (this.start)
            targetElt.parentNode.insertBefore(this.handleElt, targetElt.nextSibling);
        else
            targetElt.parentNode.insertBefore(this.handleElt, targetElt);
        this.handleElt.addEventListener("dblclick", this.onDoubleClick);
        this.handleElt.addEventListener("mousedown", this.onMouseDown);
    }
    return ResizeHandle;
})(events.EventEmitter);
module.exports = ResizeHandle;

},{"events":1}]},{},[2])(2)
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"events":2}],4:[function(require,module,exports){
var THREE = SupEngine.THREE;
function createShaderMaterial(asset, textures, geometry, options) {
    if (options === void 0) { options = { useDraft: false }; }
    if (asset == null)
        return null;
    function replaceShaderChunk(shader) {
        var keyword = "THREE_ShaderChunk(";
        var index = shader.indexOf(keyword);
        while (index !== -1) {
            var end = shader.indexOf(")", index + 1);
            var shaderChunk = shader.slice(index + keyword.length, end);
            shaderChunk.trim();
            shader = shader.slice(0, index) + THREE.ShaderChunk[shaderChunk] + shader.slice(end + 1);
            index = shader.indexOf(keyword, index + 1);
        }
        return shader;
    }
    var uniforms = {};
    if (asset.useLightUniforms) {
        uniforms = THREE.UniformsUtils.merge([uniforms, THREE.UniformsUtils.clone(THREE.UniformsLib["lights"])]);
        uniforms = THREE.UniformsUtils.merge([uniforms, THREE.UniformsUtils.clone(THREE.UniformsLib["shadowmap"])]);
    }
    uniforms["time"] = { type: "f", value: 0.0 };
    for (var _i = 0, _a = asset.uniforms; _i < _a.length; _i++) {
        var uniform = _a[_i];
        var value = void 0;
        switch (uniform.type) {
            case "f":
                value = uniform.value;
                break;
            case "c":
                value = new THREE.Color(uniform.value[0], uniform.value[1], uniform.value[2]);
                break;
            case "v2":
                value = new THREE.Vector2(uniform.value[0], uniform.value[1]);
                break;
            case "v3":
                value = new THREE.Vector3(uniform.value[0], uniform.value[1], uniform.value[2]);
                break;
            case "v4":
                value = new THREE.Vector4(uniform.value[0], uniform.value[1], uniform.value[2], uniform.value[3]);
                break;
            case "t":
                value = textures[uniform.value];
                if (value == null) {
                    console.warn("Texture \"" + uniform.name + "\" is null");
                    continue;
                }
                break;
        }
        uniforms[uniform.name] = { type: uniform.type, value: value };
    }
    for (var _b = 0, _c = asset.attributes; _b < _c.length; _b++) {
        var attribute = _c[_b];
        var values = [];
        var itemSize = void 0;
        switch (attribute.type) {
            case "f":
                itemSize = 1;
                break;
            case "c":
                itemSize = 3;
                break;
            case "v2":
                itemSize = 2;
                break;
            case "v3":
                itemSize = 3;
                break;
            case "v4":
                itemSize = 4;
                break;
        }
        var triangleCount = geometry.getAttribute("position").length / 3;
        for (var v = 0; v < triangleCount; v++) {
            for (var i = 0; i < itemSize; i++)
                values.push(Math.random());
        }
        geometry.addAttribute(attribute.name, new THREE.BufferAttribute(new Float32Array(values), itemSize));
    }
    var vertexShader = replaceShaderChunk(options.useDraft ? asset.vertexShader.draft : asset.vertexShader.text);
    var fragmentShader = replaceShaderChunk(options.useDraft ? asset.fragmentShader.draft : asset.fragmentShader.text);
    return new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader, fragmentShader: fragmentShader,
        transparent: true,
        lights: asset.useLightUniforms
    });
}
exports.createShaderMaterial = createShaderMaterial;

},{}],5:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Attributes = (function (_super) {
    __extends(Attributes, _super);
    function Attributes(pub) {
        _super.call(this, pub, Attributes.schema);
    }
    Attributes.schema = {
        name: { type: "string", minLength: 1, maxLength: 80, mutable: true },
        type: { type: "enum", items: ["f", "c", "v2", "v3", "v4"], mutable: true }
    };
    return Attributes;
})(SupCore.Data.Base.ListById);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Attributes;

},{}],6:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Uniforms = (function (_super) {
    __extends(Uniforms, _super);
    function Uniforms(pub) {
        _super.call(this, pub, Uniforms.schema);
    }
    Uniforms.prototype.setProperty = function (id, key, value, callback) {
        var _this = this;
        if (key === "value") {
            function checkArray(value, size) {
                if (!Array.isArray(value))
                    return false;
                if (value.length !== size)
                    return false;
                for (var _i = 0; _i < value.length; _i++) {
                    var item_1 = value[_i];
                    if (typeof item_1 !== "number")
                        return false;
                }
                return true;
            }
            var item = this.byId[id];
            switch (item.type) {
                case "f":
                    if (typeof value !== "number") {
                        callback("Invalid value", null);
                        return;
                    }
                    break;
                case "c":
                case "v3":
                    if (!checkArray(value, 3)) {
                        callback("Invalid value", null);
                        return;
                    }
                    break;
                case "v2":
                    if (!checkArray(value, 2)) {
                        callback("Invalid value", null);
                        return;
                    }
                    break;
                case "v4":
                    if (!checkArray(value, 4)) {
                        callback("Invalid value", null);
                        return;
                    }
                    break;
                case "t":
                    if (typeof value !== "string") {
                        callback("Invalid value", null);
                        return;
                    }
                    break;
            }
        }
        _super.prototype.setProperty.call(this, id, key, value, function (err, value) {
            if (err != null) {
                callback(err, null);
                return;
            }
            callback(null, value);
            if (key === "type")
                _this.updateItemValue(id, value);
        });
    };
    Uniforms.prototype.client_setProperty = function (id, key, value) {
        _super.prototype.client_setProperty.call(this, id, key, value);
        if (key === "type")
            this.updateItemValue(id, value);
    };
    Uniforms.prototype.updateItemValue = function (id, value) {
        var item = this.byId[id];
        switch (value) {
            case "f":
                item.value = 0;
                break;
            case "c":
                item.value = [1, 1, 1];
                break;
            case "v2":
                item.value = [0, 0];
                break;
            case "v3":
                item.value = [0, 0, 0];
                break;
            case "v4":
                item.value = [0, 0, 0, 0];
                break;
            case "t":
                item.value = "map";
                break;
        }
    };
    Uniforms.schema = {
        name: { type: "string", minLength: 1, maxLength: 80, mutable: true },
        type: { type: "enum", items: ["f", "c", "v2", "v3", "v4", "t"], mutable: true },
        value: { type: "any", mutable: true }
    };
    return Uniforms;
})(SupCore.Data.Base.ListById);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Uniforms;

},{}],7:[function(require,module,exports){
var ui_1 = require("./ui");
var network_1 = require("./network");
var Shader_1 = require("../../components/Shader");
var THREE = SupEngine.THREE;
var canvasElt = document.querySelector("canvas");
var gameInstance = new SupEngine.GameInstance(canvasElt);
var cameraActor = new SupEngine.Actor(gameInstance, "Camera");
cameraActor.setLocalPosition(new THREE.Vector3(0, 0, 10));
var cameraComponent = new SupEngine.componentClasses["Camera"](cameraActor);
/* tslint:disable:no-unused-expression */
new SupEngine.editorComponentClasses["Camera3DControls"](cameraActor, cameraComponent);
/* tslint:enable:no-unused-expression */
var loader = new THREE.TextureLoader();
var leonardTexture = loader.load("leonard.png", undefined);
leonardTexture.magFilter = THREE.NearestFilter;
leonardTexture.minFilter = THREE.NearestFilter;
var previewActor;
var material;
function setupPreview(options) {
    if (options === void 0) { options = { useDraft: false }; }
    if (previewActor != null) {
        gameInstance.destroyActor(previewActor);
        previewActor = null;
    }
    if (network_1.data.previewComponentUpdater != null) {
        network_1.data.previewComponentUpdater.destroy();
        network_1.data.previewComponentUpdater = null;
    }
    if (material != null) {
        material.dispose();
        material = null;
    }
    if (ui_1.default.previewTypeSelect.value === "Asset" && ui_1.default.previewEntry == null)
        return;
    previewActor = new SupEngine.Actor(gameInstance, "Preview");
    var previewGeometry;
    switch (ui_1.default.previewTypeSelect.value) {
        case "Plane":
            previewGeometry = new THREE.PlaneBufferGeometry(2, 2);
            break;
        case "Box":
            previewGeometry = new THREE.BufferGeometry().fromGeometry(new THREE.BoxGeometry(2, 2, 2));
            break;
        case "Sphere":
            previewGeometry = new THREE.BufferGeometry().fromGeometry(new THREE.SphereGeometry(2, 12, 12));
            break;
        case "Asset":
            var componentClassName;
            var config = { materialType: "shader", shaderAssetId: SupClient.query.asset, spriteAssetId: null, modelAssetId: null };
            if (ui_1.default.previewEntry.type === "sprite") {
                componentClassName = "SpriteRenderer";
                config.spriteAssetId = ui_1.default.previewEntry.id;
            }
            else {
                componentClassName = "ModelRenderer";
                config.modelAssetId = ui_1.default.previewEntry.id;
            }
            var componentClass = SupEngine.componentClasses[componentClassName];
            var component = new componentClass(previewActor);
            network_1.data.previewComponentUpdater = new componentClass.Updater(network_1.data.projectClient, component, config);
            return;
    }
    material = Shader_1.createShaderMaterial(network_1.data.shaderAsset.pub, { map: leonardTexture }, previewGeometry, options);
    previewActor.threeObject.add(new THREE.Mesh(previewGeometry, material));
    gameInstance.update();
    gameInstance.draw();
}
exports.setupPreview = setupPreview;
var lastTimestamp = 0;
var accumulatedTime = 0;
function tick(timestamp) {
    if (timestamp === void 0) { timestamp = 0; }
    requestAnimationFrame(tick);
    accumulatedTime += timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    var _a = gameInstance.tick(accumulatedTime), updates = _a.updates, timeLeft = _a.timeLeft;
    accumulatedTime = timeLeft;
    if (updates !== 0 && material != null)
        for (var i = 0; i < updates; i++)
            material.uniforms.time.value += 1 / gameInstance.framesPerSecond;
    gameInstance.draw();
}
requestAnimationFrame(tick);

},{"../../components/Shader":4,"./network":8,"./ui":9}],8:[function(require,module,exports){
var ui_1 = require("./ui");
var engine_1 = require("./engine");
exports.socket = SupClient.connect(SupClient.query.project);
exports.socket.on("welcome", onWelcome);
exports.socket.on("disconnect", SupClient.onDisconnected);
function onWelcome(clientId) {
    exports.data = { projectClient: new SupClient.ProjectClient(exports.socket, { subEntries: true }) };
    ui_1.setupEditors(clientId);
    exports.data.projectClient.subAsset(SupClient.query.asset, "shader", { onAssetReceived: onAssetReceived, onAssetEdited: onAssetEdited, onAssetTrashed: onAssetTrashed });
}
function onAssetReceived(assetId, asset) {
    exports.data.shaderAsset = asset;
    for (var _i = 0, _a = asset.pub.uniforms; _i < _a.length; _i++) {
        var uniform = _a[_i];
        ui_1.setupUniform(uniform);
    }
    ui_1.default.useLightUniformsCheckbox.checked = asset.pub.useLightUniforms;
    for (var _b = 0, _c = asset.pub.attributes; _b < _c.length; _b++) {
        var attribute = _c[_b];
        ui_1.setupAttribute(attribute);
    }
    ui_1.default.vertexEditor.setText(asset.pub.vertexShader.draft);
    var hasVertexDraft = asset.pub.vertexShader.draft !== asset.pub.vertexShader.text;
    ui_1.default.vertexHeader.classList.toggle("has-draft", hasVertexDraft);
    ui_1.default.vertexSaveElt.hidden = !hasVertexDraft;
    ui_1.default.fragmentEditor.setText(asset.pub.fragmentShader.draft);
    var hasFragmentDraft = asset.pub.fragmentShader.draft !== asset.pub.fragmentShader.text;
    ui_1.default.fragmentHeader.classList.toggle("has-draft", hasFragmentDraft);
    ui_1.default.fragmentSaveElt.hidden = !hasFragmentDraft;
    engine_1.setupPreview();
}
function editAsset() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    var callback;
    if (typeof args[args.length - 1] === "function")
        callback = args.pop();
    args.push(function (err, id) {
        if (err != null) {
            alert(err);
            return;
        }
        if (callback != null)
            callback(id);
    });
    exports.socket.emit.apply(exports.socket, ["edit:assets", SupClient.query.asset].concat(args));
}
exports.editAsset = editAsset;
var onEditCommands = {};
function onAssetEdited(id, command) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    var commandFunction = onEditCommands[("" + command)];
    if (commandFunction != null)
        commandFunction.apply(this, args);
    if (ui_1.default.previewTypeSelect.value !== "Asset" && command !== "editVertexShader" && command !== "editFragmentShader")
        engine_1.setupPreview();
}
onEditCommands.setProperty = function (path, value) {
    switch (path) {
        case "useLightUniforms":
            ui_1.default.useLightUniformsCheckbox.checked = value;
            break;
    }
};
onEditCommands.newUniform = function (uniform) { ui_1.setupUniform(uniform); };
onEditCommands.deleteUniform = function (id) {
    var rowElt = ui_1.default.uniformsList.querySelector("[data-id='" + id + "']");
    rowElt.parentElement.removeChild(rowElt);
};
onEditCommands.setUniformProperty = function (id, key, value) {
    var rowElt = ui_1.default.uniformsList.querySelector("[data-id='" + id + "']");
    if (key === "value") {
        var type = exports.data.shaderAsset.uniforms.byId[id].type;
        switch (type) {
            case "f":
                var floatInputElt = rowElt.querySelector(".float");
                floatInputElt.value = value;
                break;
            case "c":
            case "v2":
            case "v3":
            case "v4":
                setUniformValues(rowElt, type, value);
                break;
            case "t":
                var textInputElt = rowElt.querySelector(".text");
                textInputElt.value = value;
                break;
        }
    }
    else {
        var fieldElt = rowElt.querySelector("." + key);
        fieldElt.value = value;
    }
    if (key === "type")
        ui_1.setUniformValueInputs(id);
};
function setUniformValues(parentElt, name, values) {
    for (var i = 0; i < values.length; i++)
        parentElt.querySelector("." + name + "_" + i).value = values[i].toString();
}
onEditCommands.newAttribute = function (attribute) { ui_1.setupAttribute(attribute); };
onEditCommands.deleteAttribute = function (id) {
    var rowElt = ui_1.default.attributesList.querySelector("[data-id='" + id + "']");
    rowElt.parentElement.removeChild(rowElt);
};
onEditCommands.setAttributeProperty = function (id, key, value) {
    var rowElt = ui_1.default.attributesList.querySelector("[data-id='" + id + "']");
    var fieldElt = rowElt.querySelector("." + key);
    fieldElt.value = value;
};
onEditCommands.editVertexShader = function (operationData) {
    ui_1.default.vertexEditor.receiveEditText(operationData);
    ui_1.default.vertexHeader.classList.toggle("has-draft", true);
    ui_1.default.vertexSaveElt.hidden = false;
};
onEditCommands.saveVertexShader = function () {
    ui_1.default.vertexHeader.classList.toggle("has-draft", false);
    ui_1.default.vertexHeader.classList.toggle("has-errors", false);
    ui_1.default.vertexSaveElt.hidden = true;
};
onEditCommands.editFragmentShader = function (operationData) {
    ui_1.default.fragmentEditor.receiveEditText(operationData);
    ui_1.default.fragmentHeader.classList.toggle("has-draft", true);
    ui_1.default.fragmentSaveElt.hidden = false;
};
onEditCommands.saveFragmentShader = function () {
    ui_1.default.fragmentHeader.classList.toggle("has-draft", false);
    ui_1.default.fragmentHeader.classList.toggle("has-errors", false);
    ui_1.default.fragmentSaveElt.hidden = true;
};
function onAssetTrashed() {
    SupClient.onAssetTrashed();
}

},{"./engine":7,"./ui":9}],9:[function(require,module,exports){
var network_1 = require("./network");
var engine_1 = require("./engine");
var Uniforms_1 = require("../../data/Uniforms");
var Attributes_1 = require("../../data/Attributes");
/* tslint:disable */
var PerfectResize = require("perfect-resize");
/* tslint:enable */
var ui = {};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ui;
SupClient.setupHotkeys();
ui.uniformsList = document.querySelector(".uniforms tbody");
function setupUniform(uniform) {
    var rowElt = document.createElement("tr");
    rowElt.dataset["id"] = uniform.id;
    ui.uniformsList.insertBefore(rowElt, ui.uniformsList.lastChild);
    var nameElt = document.createElement("td");
    var nameInputElt = document.createElement("input");
    nameInputElt.classList.add("name");
    nameInputElt.addEventListener("change", function (event) {
        if (event.target.value === "")
            network_1.editAsset("deleteUniform", rowElt.dataset["id"]);
        else
            network_1.editAsset("setUniformProperty", rowElt.dataset["id"], "name", event.target.value);
    });
    nameInputElt.value = uniform.name;
    nameElt.appendChild(nameInputElt);
    rowElt.appendChild(nameElt);
    var typeElt = document.createElement("td");
    var selectTypeElt = document.createElement("select");
    for (var _i = 0, _a = Uniforms_1.default.schema.type.items; _i < _a.length; _i++) {
        var type = _a[_i];
        var optionElt = document.createElement("option");
        optionElt.textContent = type;
        selectTypeElt.appendChild(optionElt);
    }
    selectTypeElt.classList.add("type");
    selectTypeElt.addEventListener("change", function (event) {
        network_1.editAsset("setUniformProperty", rowElt.dataset["id"], "type", event.target.value);
    });
    selectTypeElt.value = uniform.type;
    typeElt.appendChild(selectTypeElt);
    rowElt.appendChild(typeElt);
    var valueElt = document.createElement("td");
    rowElt.appendChild(valueElt);
    var valueDivElt = document.createElement("div");
    valueDivElt.classList.add("value");
    valueElt.appendChild(valueDivElt);
    setUniformValueInputs(uniform.id);
}
exports.setupUniform = setupUniform;
function setUniformValueInputs(id) {
    var uniform = network_1.data.shaderAsset.uniforms.byId[id];
    var valueRowElt = ui.uniformsList.querySelector("[data-id='" + id + "'] .value");
    while (valueRowElt.children.length > 0)
        valueRowElt.removeChild(valueRowElt.children[0]);
    switch (uniform.type) {
        case "f":
            var floatInputElt = document.createElement("input");
            floatInputElt.type = "number";
            floatInputElt.classList.add("float");
            floatInputElt.addEventListener("change", function (event) { network_1.editAsset("setUniformProperty", id, "value", parseFloat(event.target.value)); });
            floatInputElt.value = uniform.value;
            valueRowElt.appendChild(floatInputElt);
            break;
        case "c":
        case "v2":
        case "v3":
        case "v4":
            setArrayUniformInputs(id, valueRowElt, uniform.type);
            break;
        case "t":
            var textInputElt = document.createElement("input");
            textInputElt.classList.add("text");
            textInputElt.addEventListener("change", function (event) { network_1.editAsset("setUniformProperty", id, "value", event.target.value); });
            textInputElt.value = uniform.value;
            valueRowElt.appendChild(textInputElt);
            break;
    }
}
exports.setUniformValueInputs = setUniformValueInputs;
function setArrayUniformInputs(id, parentElt, name) {
    var uniform = network_1.data.shaderAsset.uniforms.byId[id];
    for (var i = 0; i < uniform.value.length; i++) {
        var inputElt = document.createElement("input");
        inputElt.type = "number";
        inputElt.classList.add(name + "_" + i);
        inputElt.addEventListener("change", function (event) {
            var values = [];
            for (var j = 0; j < uniform.value.length; j++) {
                var elt = parentElt.querySelector("." + name + "_" + j);
                values.push(parseFloat(elt.value));
            }
            network_1.editAsset("setUniformProperty", id, "value", values);
        });
        inputElt.value = uniform.value[i];
        parentElt.appendChild(inputElt);
    }
}
var newUniformInput = document.querySelector(".uniforms .new input");
newUniformInput.addEventListener("keyup", function (event) {
    if (event.keyCode === 13) {
        network_1.editAsset("newUniform", event.target.value);
        event.target.value = "";
    }
});
ui.useLightUniformsCheckbox = document.getElementById("use-light-uniforms");
ui.useLightUniformsCheckbox.addEventListener("change", function (event) {
    network_1.editAsset("setProperty", "useLightUniforms", event.target.checked);
});
ui.attributesList = document.querySelector(".attributes tbody");
function setupAttribute(attribute) {
    var rowElt = document.createElement("tr");
    rowElt.dataset["id"] = attribute.id;
    ui.attributesList.insertBefore(rowElt, ui.attributesList.lastChild);
    var nameElt = document.createElement("td");
    var nameInputElt = document.createElement("input");
    nameInputElt.classList.add("name");
    nameInputElt.addEventListener("change", function (event) {
        if (event.target.value === "")
            network_1.editAsset("deleteAttribute", rowElt.dataset["id"]);
        else
            network_1.editAsset("setAttributeProperty", rowElt.dataset["id"], "name", event.target.value);
    });
    nameInputElt.value = attribute.name;
    nameElt.appendChild(nameInputElt);
    rowElt.appendChild(nameElt);
    var typeElt = document.createElement("td");
    var selectTypeElt = document.createElement("select");
    for (var _i = 0, _a = Attributes_1.default.schema.type.items; _i < _a.length; _i++) {
        var type = _a[_i];
        var optionElt = document.createElement("option");
        optionElt.textContent = type;
        selectTypeElt.appendChild(optionElt);
    }
    selectTypeElt.classList.add("type");
    selectTypeElt.addEventListener("change", function (event) { network_1.editAsset("setAttributeProperty", rowElt.dataset["id"], "type", event.target.value); });
    selectTypeElt.value = attribute.type;
    typeElt.appendChild(selectTypeElt);
    rowElt.appendChild(typeElt);
    var valueElt = document.createElement("td");
    valueElt.textContent = "Random";
    rowElt.appendChild(valueElt);
}
exports.setupAttribute = setupAttribute;
var newAttributeInput = document.querySelector(".attributes .new input");
newAttributeInput.addEventListener("keyup", function (event) {
    if (event.keyCode === 13) {
        network_1.editAsset("newAttribute", event.target.value);
        event.target.value = "";
    }
});
var shadersPane = document.querySelector(".shaders");
var shaderPaneResizeHandle = new PerfectResize(shadersPane, "bottom");
shaderPaneResizeHandle.on("drag", function () {
    ui.vertexEditor.codeMirrorInstance.refresh();
    ui.fragmentEditor.codeMirrorInstance.refresh();
});
function onSaveVertex() {
    try {
        engine_1.setupPreview({ useDraft: true });
    }
    catch (e) {
        ui.vertexHeader.classList.toggle("has-errors", true);
        engine_1.setupPreview();
        return;
    }
    network_1.editAsset("saveVertexShader");
}
function onSaveFragment() {
    try {
        engine_1.setupPreview({ useDraft: true });
    }
    catch (e) {
        ui.fragmentHeader.classList.toggle("has-errors", true);
        engine_1.setupPreview();
        return;
    }
    network_1.editAsset("saveFragmentShader");
}
var fragmentShadersPane = shadersPane.querySelector(".fragment");
var fragmentShaderPaneResizeHandle = new PerfectResize(fragmentShadersPane, "right");
fragmentShaderPaneResizeHandle.on("drag", function () {
    ui.vertexEditor.codeMirrorInstance.refresh();
    ui.fragmentEditor.codeMirrorInstance.refresh();
});
ui.vertexSaveElt = document.querySelector(".vertex button");
ui.vertexHeader = document.querySelector(".vertex .header");
ui.vertexSaveElt.addEventListener("click", onSaveVertex);
ui.fragmentSaveElt = document.querySelector(".fragment button");
ui.fragmentHeader = document.querySelector(".fragment .header");
ui.fragmentSaveElt.addEventListener("click", onSaveFragment);
function setupEditors(clientId) {
    var vertexTextArea = document.querySelector(".vertex textarea");
    ui.vertexEditor = new TextEditorWidget(network_1.data.projectClient, clientId, vertexTextArea, {
        mode: "x-shader/x-vertex",
        sendOperationCallback: function (operation) {
            network_1.editAsset("editVertexShader", operation, network_1.data.shaderAsset.vertexDocument.getRevisionId());
        },
        saveCallback: onSaveVertex
    });
    var fragmentTextArea = document.querySelector(".fragment textarea");
    ui.fragmentEditor = new TextEditorWidget(network_1.data.projectClient, clientId, fragmentTextArea, {
        mode: "x-shader/x-fragment",
        sendOperationCallback: function (operation) {
            network_1.editAsset("editFragmentShader", operation, network_1.data.shaderAsset.fragmentDocument.getRevisionId());
        },
        saveCallback: onSaveFragment
    });
}
exports.setupEditors = setupEditors;
var previewPane = document.querySelector(".preview");
/* tslint:disable:no-unused-expression */
new PerfectResize(previewPane, "right");
/* tslint:enable:no-unused-expression */
ui.previewTypeSelect = previewPane.querySelector("select");
ui.previewTypeSelect.addEventListener("change", function () {
    ui.previewAssetInput.hidden = ui.previewTypeSelect.value !== "Asset";
    engine_1.setupPreview();
});
ui.previewAssetInput = previewPane.querySelector("input");
ui.previewAssetInput.addEventListener("input", function (event) {
    if (event.target.value === "") {
        ui.previewEntry = null;
        engine_1.setupPreview();
        return;
    }
    var entry = SupClient.findEntryByPath(network_1.data.projectClient.entries.pub, event.target.value);
    if (entry == null || (entry.type !== "sprite" && entry.type !== "model"))
        return;
    ui.previewEntry = entry;
    engine_1.setupPreview();
});

},{"../../data/Attributes":5,"../../data/Uniforms":6,"./engine":7,"./network":8,"perfect-resize":3}]},{},[1]);
