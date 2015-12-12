(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var TileSetRenderer_1 = require("../../components/TileSetRenderer");
/* tslint:disable */
var TreeView = require("dnd-tree-view");
var PerfectResize = require("perfect-resize");
/* tslint:enable */
var data;
var ui = {};
var socket;
function start() {
    socket = SupClient.connect(SupClient.query.project);
    socket.on("connect", onConnected);
    socket.on("disconnect", SupClient.onDisconnected);
    SupClient.setupHotkeys();
    // Drawing
    ui.gameInstance = new SupEngine.GameInstance(document.querySelector("canvas"));
    ui.gameInstance.threeRenderer.setClearColor(0xbbbbbb);
    var cameraActor = new SupEngine.Actor(ui.gameInstance, "Camera");
    cameraActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, 10));
    ui.cameraComponent = new SupEngine.componentClasses["Camera"](cameraActor);
    ui.cameraComponent.setOrthographicMode(true);
    ui.cameraControls = new SupEngine.editorComponentClasses["Camera2DControls"](cameraActor, ui.cameraComponent, { zoomSpeed: 1.5, zoomMin: 1, zoomMax: 200 }, function () { data.tileSetUpdater.tileSetRenderer.gridRenderer.setOrthgraphicScale(ui.cameraComponent.orthographicScale); });
    // Sidebar
    new PerfectResize(document.querySelector(".sidebar"), "right");
    var fileSelect = document.querySelector("input.file-select");
    fileSelect.addEventListener("change", onFileSelectChange);
    document.querySelector("button.upload").addEventListener("click", function () { fileSelect.click(); });
    document.querySelector("button.download").addEventListener("click", onDownloadTileset);
    ui.gridWidthInput = document.querySelector("input.grid-width");
    ui.gridWidthInput.addEventListener("change", function () {
        socket.emit("edit:assets", SupClient.query.asset, "setProperty", "grid.width", parseInt(ui.gridWidthInput.value, 10), function (err) {
            if (err != null) {
                alert(err);
                return;
            }
        });
    });
    ui.gridHeightInput = document.querySelector("input.grid-height");
    ui.gridHeightInput.addEventListener("change", function () {
        socket.emit("edit:assets", SupClient.query.asset, "setProperty", "grid.height", parseInt(ui.gridHeightInput.value, 10), function (err) {
            if (err != null) {
                alert(err);
                return;
            }
        });
    });
    ui.selectedTileInput = document.querySelector("input.selected-tile-number");
    // Tile properties
    ui.propertiesTreeView = new TreeView(document.querySelector(".properties-tree-view"), { multipleSelection: false });
    ui.propertiesTreeView.on("selectionChange", onPropertySelect);
    document.querySelector("button.new-property").addEventListener("click", onNewPropertyClick);
    document.querySelector("button.rename-property").addEventListener("click", onRenamePropertyClick);
    document.querySelector("button.delete-property").addEventListener("click", onDeletePropertyClick);
    requestAnimationFrame(tick);
}
// Network callbacks
var onEditCommands = {};
function onConnected() {
    data = {};
    data.projectClient = new SupClient.ProjectClient(socket, { subEntries: false });
    var tileSetActor = new SupEngine.Actor(ui.gameInstance, "Tile Set");
    var tileSetRenderer = new TileSetRenderer_1.default(tileSetActor);
    var config = { tileSetAssetId: SupClient.query.asset };
    var receiveCallbacks = { tileSet: onAssetReceived };
    var editCallbacks = { tileSet: onEditCommands };
    data.tileSetUpdater = new TileSetRenderer_1.default.Updater(data.projectClient, tileSetRenderer, config, receiveCallbacks, editCallbacks);
}
function onAssetReceived(err, asset) {
    setupProperty("grid-width", data.tileSetUpdater.tileSetAsset.pub.grid.width);
    setupProperty("grid-height", data.tileSetUpdater.tileSetAsset.pub.grid.height);
    selectTile({ x: 0, y: 0 });
}
onEditCommands.upload = function () {
    selectTile({ x: 0, y: 0 });
};
onEditCommands.setProperty = function (key, value) {
    setupProperty(key, value);
    selectTile({ x: 0, y: 0 });
};
onEditCommands.addTileProperty = function (tile, name) {
    if (tile.x !== data.selectedTile.x && tile.y !== data.selectedTile.y)
        return;
    addTileProperty(name);
};
onEditCommands.renameTileProperty = function (tile, name, newName) {
    if (tile.x !== data.selectedTile.x && tile.y !== data.selectedTile.y)
        return;
    var liElt = ui.propertiesTreeView.treeRoot.querySelector("li[data-name=\"" + name + "\"]");
    liElt.querySelector(".name").textContent = newName;
    liElt.dataset.name = newName;
    var properties = Object.keys(data.tileSetUpdater.tileSetAsset.pub.tileProperties[(tile.x + "_" + tile.y)]);
    properties.sort();
    ui.propertiesTreeView.remove(liElt);
    ui.propertiesTreeView.insertAt(liElt, "item", properties.indexOf(newName));
    if (ui.selectedProperty === name) {
        ui.selectedProperty = newName;
        ui.propertiesTreeView.addToSelection(liElt);
    }
};
onEditCommands.deleteTileProperty = function (tile, name) {
    if (tile.x !== data.selectedTile.x && tile.y !== data.selectedTile.y)
        return;
    ui.propertiesTreeView.remove(ui.propertiesTreeView.treeRoot.querySelector("li[data-name=\"" + name + "\"]"));
};
onEditCommands.editTileProperty = function (tile, name, value) {
    if (tile.x !== data.selectedTile.x && tile.y !== data.selectedTile.y)
        return;
    var liElt = ui.propertiesTreeView.treeRoot.querySelector("li[data-name=\"" + name + "\"]");
    liElt.querySelector(".value").value = value;
};
function setupProperty(key, value) {
    switch (key) {
        case "grid-width":
            ui.gridWidthInput.value = value;
            break;
        case "grid-height":
            ui.gridHeightInput.value = value;
            break;
    }
}
function selectTile(tile) {
    data.selectedTile = tile;
    var pub = data.tileSetUpdater.tileSetAsset.pub;
    var tilePerRow = (pub.texture != null) ? Math.floor(pub.texture.image.width / pub.grid.width) : 1;
    var tilePerColumn = (pub.texture != null) ? Math.floor(pub.texture.image.height / pub.grid.height) : 1;
    var tileIndex = (tile.x === tilePerRow - 1 && tile.y === tilePerColumn - 1) ? -1 : tile.x + tile.y * tilePerRow;
    ui.selectedTileInput.value = tileIndex;
    while (ui.propertiesTreeView.treeRoot.children.length !== 0) {
        ui.propertiesTreeView.remove(ui.propertiesTreeView.treeRoot.children[0]);
    }
    if (pub.tileProperties[(tile.x + "_" + tile.y)] == null)
        return;
    var properties = Object.keys(pub.tileProperties[(tile.x + "_" + tile.y)]);
    properties.sort();
    for (var _i = 0; _i < properties.length; _i++) {
        var propertyName = properties[_i];
        addTileProperty(propertyName, pub.tileProperties[(tile.x + "_" + tile.y)][propertyName]);
    }
}
function addTileProperty(name, value) {
    if (value === void 0) { value = ""; }
    var liElt = document.createElement("li");
    liElt.dataset["name"] = name;
    var nameSpan = document.createElement("span");
    nameSpan.className = "name";
    nameSpan.textContent = name;
    liElt.appendChild(nameSpan);
    var valueInput = document.createElement("input");
    valueInput.type = "string";
    valueInput.className = "value";
    valueInput.value = value;
    valueInput.addEventListener("input", function () {
        socket.emit("edit:assets", SupClient.query.asset, "editTileProperty", data.selectedTile, ui.selectedProperty, valueInput.value, function (err) {
            if (err != null) {
                alert(err);
                return;
            }
        });
    });
    liElt.appendChild(valueInput);
    ui.propertiesTreeView.insertAt(liElt, "item");
}
// User interface
function onFileSelectChange(event) {
    if (event.target.files.length === 0)
        return;
    var reader = new FileReader;
    reader.onload = function (event) {
        socket.emit("edit:assets", SupClient.query.asset, "upload", reader.result, function (err) {
            if (err != null) {
                alert(err);
                return;
            }
        });
    };
    reader.readAsArrayBuffer(event.target.files[0]);
    event.target.parentElement.reset();
}
function onDownloadTileset(event) {
    var options = {
        initialValue: "Tile set",
        validationLabel: "Download"
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter a name for the image.", options, function (name) {
        /* tslint:enable:no-unused-expression */
        if (name == null)
            return;
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style.display = "none";
        a.href = data.tileSetUpdater.tileSetAsset.url;
        // Not yet supported in IE and Safari (http://caniuse.com/#feat=download)
        a.download = name + ".png";
        a.click();
        document.body.removeChild(a);
    });
}
function onPropertySelect() {
    if (ui.propertiesTreeView.selectedNodes.length === 1) {
        ui.selectedProperty = ui.propertiesTreeView.selectedNodes[0].dataset.name;
        document.querySelector("button.rename-property").disabled = false;
        document.querySelector("button.delete-property").disabled = false;
    }
    else {
        ui.selectedProperty = null;
        document.querySelector("button.rename-property").disabled = true;
        document.querySelector("button.delete-property").disabled = true;
    }
}
function onNewPropertyClick() {
    var options = {
        initialValue: "property",
        validationLabel: "Create"
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter a name for the property.", options, function (name) {
        /* tslint:enable:no-unused-expression */
        if (name == null)
            return;
        socket.emit("edit:assets", SupClient.query.asset, "addTileProperty", data.selectedTile, name, function (err, id) {
            if (err != null) {
                alert(err);
                return;
            }
            ui.selectedProperty = name;
            ui.propertiesTreeView.clearSelection();
            var liElt = ui.propertiesTreeView.treeRoot.querySelector("li[data-name=\"" + ui.selectedProperty + "\"]");
            ui.propertiesTreeView.addToSelection(liElt);
            liElt.querySelector("input").focus();
            document.querySelector("button.rename-property").disabled = false;
            document.querySelector("button.delete-property").disabled = false;
        });
    });
}
function onRenamePropertyClick() {
    if (ui.propertiesTreeView.selectedNodes.length !== 1)
        return;
    var options = {
        initialValue: ui.selectedProperty,
        validationLabel: "Rename"
    };
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.PromptDialog("Enter a new name for the property.", options, function (newName) {
        /* tslint:enable:no-unused-expression */
        if (newName == null)
            return;
        socket.emit("edit:assets", SupClient.query.asset, "renameTileProperty", data.selectedTile, ui.selectedProperty, newName, function (err) { if (err != null) {
            alert(err);
            return;
        } });
    });
}
function onDeletePropertyClick() {
    if (ui.selectedProperty == null)
        return;
    /* tslint:disable:no-unused-expression */
    new SupClient.dialogs.ConfirmDialog("Are you sure you want to delete the selected property?", "Delete", function (confirm) {
        /* tslint:enable:no-unused-expression */
        if (!confirm)
            return;
        socket.emit("edit:assets", SupClient.query.asset, "deleteTileProperty", data.selectedTile, ui.selectedProperty, function (err) { if (err != null) {
            alert(err);
            return;
        } });
    });
}
// Drawing
var lastTimestamp = 0;
var accumulatedTime = 0;
function tick(timestamp) {
    if (timestamp === void 0) { timestamp = 0; }
    requestAnimationFrame(tick);
    accumulatedTime += timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    var _a = ui.gameInstance.tick(accumulatedTime, handleTilesetArea), updates = _a.updates, timeLeft = _a.timeLeft;
    accumulatedTime = timeLeft;
    if (updates > 0)
        ui.gameInstance.draw();
}
function handleTilesetArea() {
    if (data == null || data.tileSetUpdater.tileSetAsset == null)
        return;
    var pub = data.tileSetUpdater.tileSetAsset.pub;
    if (pub.texture == null)
        return;
    if (ui.gameInstance.input.mouseButtons[0].wasJustReleased) {
        var mousePosition = ui.gameInstance.input.mousePosition;
        var _a = ui.cameraControls.getScenePosition(mousePosition.x, mousePosition.y), mouseX = _a[0], mouseY = _a[1];
        var x = Math.floor(mouseX);
        var ratio = data.tileSetUpdater.tileSetAsset.pub.grid.width / data.tileSetUpdater.tileSetAsset.pub.grid.height;
        var y = Math.floor(mouseY * ratio);
        if (x >= 0 && x < pub.texture.image.width / pub.grid.width &&
            y >= 0 && y < pub.texture.image.height / pub.grid.height &&
            (x !== data.selectedTile.x || y !== data.selectedTile.y)) {
            data.tileSetUpdater.tileSetRenderer.select(x, y);
            selectTile({ x: x, y: y });
        }
    }
}
// Start
start();

},{"../../components/TileSetRenderer":6,"dnd-tree-view":2,"perfect-resize":4}],2:[function(require,module,exports){
(function (global){
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.TreeView = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
/// <reference path="../lib/TreeView.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var events_1 = require("events");
var TreeView = (function (_super) {
    __extends(TreeView, _super);
    function TreeView(container, options) {
        var _this = this;
        _super.call(this);
        this._onClick = function (event) {
            // Toggle groups
            var element = event.target;
            if (element.className === "toggle") {
                if (element.parentElement.tagName === "LI" && element.parentElement.classList.contains("group")) {
                    element.parentElement.classList.toggle("collapsed");
                    return;
                }
            }
            // Update selection
            if (_this._updateSelection(event))
                _this.emit("selectionChange");
        };
        this._onDoubleClick = function (event) {
            if (_this.selectedNodes.length !== 1)
                return;
            var element = event.target;
            if (element.className === "toggle")
                return;
            _this.emit("activate");
        };
        this._onKeyDown = function (event) {
            if (document.activeElement !== _this.treeRoot)
                return;
            if (_this._firstSelectedNode == null) {
                // TODO: Remove once we have this._focusedNode
                if (event.keyCode === 40) {
                    _this.addToSelection(_this.treeRoot.firstElementChild);
                    event.preventDefault();
                }
                return;
            }
            switch (event.keyCode) {
                case 38: // up
                case 40:
                    _this._moveVertically(event.keyCode === 40 ? 1 : -1);
                    event.preventDefault();
                    break;
                case 37: // left
                case 39:
                    _this._moveHorizontally(event.keyCode == 39 ? 1 : -1);
                    event.preventDefault();
                    break;
                case 13:
                    if (_this.selectedNodes.length !== 1)
                        return;
                    _this.emit("activate");
                    event.preventDefault();
                    break;
            }
        };
        this._moveHorizontally = function (offset) {
            // TODO: this._focusedNode;
            var node = _this._firstSelectedNode;
            if (offset === -1) {
                if (!node.classList.contains("group") || node.classList.contains("collapsed")) {
                    if (!node.parentElement.classList.contains("children"))
                        return;
                    node = node.parentElement.previousElementSibling;
                }
                else if (node.classList.contains("group")) {
                    node.classList.add("collapsed");
                }
            }
            else {
                if (node.classList.contains("group")) {
                    if (node.classList.contains("collapsed"))
                        node.classList.remove("collapsed");
                    else
                        node = node.nextSibling.firstChild;
                }
            }
            if (node == null)
                return;
            _this.clearSelection();
            _this.addToSelection(node);
            _this.scrollIntoView(node);
            _this.emit("selectionChange");
        };
        this._onDragStart = function (event) {
            var element = event.target;
            if (element.tagName !== "LI")
                return false;
            if (!element.classList.contains("item") && !element.classList.contains("group"))
                return false;
            // NOTE: Required for Firefox to start the actual dragging
            // "try" is required for IE11 to not raise an exception
            try {
                event.dataTransfer.setData("text/plain", element.dataset.dndText ? element.dataset.dndText : null);
            }
            catch (e) { }
            if (_this.selectedNodes.indexOf(element) === -1) {
                _this.clearSelection();
                _this.addToSelection(element);
                _this.emit("selectionChange");
            }
            return true;
        };
        this._onDragOver = function (event) {
            if (_this.selectedNodes.length === 0)
                return false;
            var dropInfo = _this._getDropInfo(event);
            // Prevent dropping onto null or descendant
            if (dropInfo == null)
                return false;
            if (dropInfo.where === "inside" && _this.selectedNodes.indexOf(dropInfo.target) !== -1)
                return false;
            for (var _i = 0, _a = _this.selectedNodes; _i < _a.length; _i++) {
                var selectedNode = _a[_i];
                if (selectedNode.classList.contains("group") && selectedNode.nextSibling.contains(dropInfo.target))
                    return false;
            }
            _this._hasDraggedOverAfterLeaving = true;
            _this._clearDropClasses();
            dropInfo.target.classList.add("drop-" + dropInfo.where);
            event.preventDefault();
        };
        this._onDragLeave = function (event) {
            _this._hasDraggedOverAfterLeaving = false;
            setTimeout(function () { if (!_this._hasDraggedOverAfterLeaving)
                _this._clearDropClasses(); }, 300);
        };
        this._onDrop = function (event) {
            event.preventDefault();
            if (_this.selectedNodes.length === 0)
                return;
            var dropInfo = _this._getDropInfo(event);
            if (dropInfo == null)
                return;
            _this._clearDropClasses();
            var children = _this.selectedNodes[0].parentElement.children;
            var orderedNodes = [];
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                if (_this.selectedNodes.indexOf(child) !== -1)
                    orderedNodes.push(child);
            }
            var reparent = (_this.dropCallback != null) ? _this.dropCallback(dropInfo, orderedNodes) : true;
            if (!reparent)
                return;
            var newParent;
            var referenceElt;
            switch (dropInfo.where) {
                case "inside":
                    if (!dropInfo.target.classList.contains("group"))
                        return;
                    newParent = dropInfo.target.nextSibling;
                    referenceElt = newParent.firstChild;
                    break;
                case "below":
                    newParent = dropInfo.target.parentElement;
                    referenceElt = dropInfo.target.nextSibling;
                    if (referenceElt != null && referenceElt.tagName === "OL")
                        referenceElt = referenceElt.nextSibling;
                    break;
                case "above":
                    newParent = dropInfo.target.parentElement;
                    referenceElt = dropInfo.target;
                    break;
            }
            var draggedChildren;
            for (var _i = 0; _i < orderedNodes.length; _i++) {
                var selectedNode = orderedNodes[_i];
                if (selectedNode.classList.contains("group")) {
                    draggedChildren = selectedNode.nextSibling;
                    draggedChildren.parentElement.removeChild(draggedChildren);
                }
                if (referenceElt === selectedNode) {
                    referenceElt = selectedNode.nextSibling;
                }
                selectedNode.parentElement.removeChild(selectedNode);
                newParent.insertBefore(selectedNode, referenceElt);
                referenceElt = selectedNode.nextSibling;
                if (draggedChildren != null) {
                    newParent.insertBefore(draggedChildren, referenceElt);
                    referenceElt = draggedChildren.nextSibling;
                }
            }
        };
        if (options == null)
            options = {};
        this.multipleSelection = (options.multipleSelection != null) ? options.multipleSelection : true;
        this.dropCallback = options.dropCallback;
        this.treeRoot = document.createElement("ol");
        this.treeRoot.tabIndex = 0;
        this.treeRoot.classList.add("tree");
        container.appendChild(this.treeRoot);
        this.selectedNodes = [];
        this._firstSelectedNode = null;
        this.treeRoot.addEventListener("click", this._onClick);
        this.treeRoot.addEventListener("dblclick", this._onDoubleClick);
        this.treeRoot.addEventListener("keydown", this._onKeyDown);
        container.addEventListener("keydown", function (event) {
            if (event.keyCode === 37 || event.keyCode === 39)
                event.preventDefault();
        });
        if (this.dropCallback != null) {
            this.treeRoot.addEventListener("dragstart", this._onDragStart);
            this.treeRoot.addEventListener("dragover", this._onDragOver);
            this.treeRoot.addEventListener("dragleave", this._onDragLeave);
            this.treeRoot.addEventListener("drop", this._onDrop);
        }
    }
    TreeView.prototype.clearSelection = function () {
        for (var _i = 0, _a = this.selectedNodes; _i < _a.length; _i++) {
            var selectedNode = _a[_i];
            selectedNode.classList.remove("selected");
        }
        this.selectedNodes.length = 0;
        this._firstSelectedNode = null;
    };
    TreeView.prototype.addToSelection = function (element) {
        if (this.selectedNodes.indexOf(element) !== -1)
            return;
        this.selectedNodes.push(element);
        element.classList.add("selected");
        if (this.selectedNodes.length === 1)
            this._firstSelectedNode = element;
    };
    TreeView.prototype.scrollIntoView = function (element) {
        var elementRect = element.getBoundingClientRect();
        var containerRect = this.treeRoot.parentElement.getBoundingClientRect();
        if (elementRect.top < containerRect.top)
            element.scrollIntoView(true);
        else if (elementRect.bottom > containerRect.bottom)
            element.scrollIntoView(false);
    };
    TreeView.prototype.append = function (element, type, parentGroupElement) {
        if (type !== "item" && type !== "group")
            throw new Error("Invalid type");
        var childrenElt;
        var siblingsElt;
        if (parentGroupElement != null) {
            if (parentGroupElement.tagName !== "LI" || !parentGroupElement.classList.contains("group"))
                throw new Error("Invalid parent group");
            siblingsElt = parentGroupElement.nextSibling;
        }
        else {
            siblingsElt = this.treeRoot;
        }
        if (!element.classList.contains(type)) {
            element.classList.add(type);
            if (this.dropCallback != null)
                element.draggable = true;
            if (type === "group") {
                var toggleElt = document.createElement("div");
                toggleElt.classList.add("toggle");
                element.insertBefore(toggleElt, element.firstChild);
                childrenElt = document.createElement("ol");
                childrenElt.classList.add("children");
            }
        }
        else if (type === "group") {
            childrenElt = element.nextSibling;
        }
        siblingsElt.appendChild(element);
        if (childrenElt != null)
            siblingsElt.appendChild(childrenElt);
        return element;
    };
    TreeView.prototype.insertBefore = function (element, type, referenceElement) {
        if (type !== "item" && type !== "group")
            throw new Error("Invalid type");
        if (referenceElement == null)
            throw new Error("A reference element is required");
        if (referenceElement.tagName !== "LI")
            throw new Error("Invalid reference element");
        var childrenElt;
        if (!element.classList.contains(type)) {
            element.classList.add(type);
            if (this.dropCallback != null)
                element.draggable = true;
            if (type === "group") {
                var toggleElt = document.createElement("div");
                toggleElt.classList.add("toggle");
                element.insertBefore(toggleElt, element.firstChild);
                childrenElt = document.createElement("ol");
                childrenElt.classList.add("children");
            }
        }
        else if (type === "group") {
            childrenElt = element.nextSibling;
        }
        referenceElement.parentElement.insertBefore(element, referenceElement);
        if (childrenElt != null)
            referenceElement.parentElement.insertBefore(childrenElt, element.nextSibling);
        return element;
    };
    TreeView.prototype.insertAt = function (element, type, index, parentElement) {
        var referenceElt;
        if (index != null) {
            referenceElt =
                (parentElement != null)
                    ? parentElement.nextSibling.querySelector(":scope > li:nth-of-type(" + (index + 1) + ")")
                    : this.treeRoot.querySelector(":scope > li:nth-of-type(" + (index + 1) + ")");
        }
        if (referenceElt != null)
            this.insertBefore(element, type, referenceElt);
        else
            this.append(element, type, parentElement);
    };
    TreeView.prototype.remove = function (element) {
        var selectedIndex = this.selectedNodes.indexOf(element);
        if (selectedIndex !== -1)
            this.selectedNodes.splice(selectedIndex, 1);
        if (this._firstSelectedNode === element)
            this._firstSelectedNode = this.selectedNodes[0];
        if (element.classList.contains("group")) {
            var childrenElement = element.nextSibling;
            var removedSelectedNodes = [];
            for (var _i = 0, _a = this.selectedNodes; _i < _a.length; _i++) {
                var selectedNode = _a[_i];
                if (childrenElement.contains(selectedNode)) {
                    removedSelectedNodes.push(selectedNode);
                }
            }
            for (var _b = 0; _b < removedSelectedNodes.length; _b++) {
                var removedSelectedNode = removedSelectedNodes[_b];
                this.selectedNodes.splice(this.selectedNodes.indexOf(removedSelectedNode), 1);
                if (this._firstSelectedNode === removedSelectedNode)
                    this._firstSelectedNode = this.selectedNodes[0];
            }
            element.parentElement.removeChild(childrenElement);
        }
        element.parentElement.removeChild(element);
    };
    // Returns whether the selection changed
    TreeView.prototype._updateSelection = function (event) {
        var selectionChanged = false;
        if ((!this.multipleSelection || (!event.shiftKey && !event.ctrlKey)) && this.selectedNodes.length > 0) {
            this.clearSelection();
            selectionChanged = true;
        }
        var ancestorElement = event.target;
        while (ancestorElement.tagName !== "LI" || (!ancestorElement.classList.contains("item") && !ancestorElement.classList.contains("group"))) {
            if (ancestorElement === this.treeRoot)
                return selectionChanged;
            ancestorElement = ancestorElement.parentElement;
        }
        var element = ancestorElement;
        if (this.selectedNodes.length > 0 && this.selectedNodes[0].parentElement !== element.parentElement) {
            return selectionChanged;
        }
        if (this.multipleSelection && event.shiftKey && this.selectedNodes.length > 0) {
            var startElement = this._firstSelectedNode;
            var elements = [];
            var inside = false;
            for (var i = 0; i < element.parentElement.children.length; i++) {
                var child = element.parentElement.children[i];
                if (child === startElement || child === element) {
                    if (inside || startElement === element) {
                        elements.push(child);
                        break;
                    }
                    inside = true;
                }
                if (inside && child.tagName === "LI")
                    elements.push(child);
            }
            this.clearSelection();
            this.selectedNodes = elements;
            this._firstSelectedNode = startElement;
            for (var _i = 0, _a = this.selectedNodes; _i < _a.length; _i++) {
                var selectedNode = _a[_i];
                selectedNode.classList.add("selected");
            }
            return true;
        }
        var index;
        if (event.ctrlKey && (index = this.selectedNodes.indexOf(element)) !== -1) {
            this.selectedNodes.splice(index, 1);
            element.classList.remove("selected");
            if (this._firstSelectedNode === element) {
                this._firstSelectedNode = this.selectedNodes[0];
            }
            return true;
        }
        this.addToSelection(element);
        return true;
    };
    TreeView.prototype._moveVertically = function (offset) {
        // TODO: this._focusedNode;
        var node = this._firstSelectedNode;
        if (offset === -1) {
            if (node.previousElementSibling != null) {
                var target = node.previousElementSibling;
                while (target.classList.contains("children")) {
                    if (!target.previousElementSibling.classList.contains("collapsed") && target.childElementCount > 0)
                        target = target.lastElementChild;
                    else
                        target = target.previousElementSibling;
                }
                node = target;
            }
            else if (node.parentElement.classList.contains("children"))
                node = node.parentElement.previousElementSibling;
            else
                return;
        }
        else {
            var walkUp = false;
            if (node.classList.contains("group")) {
                if (!node.classList.contains("collapsed") && node.nextElementSibling.childElementCount > 0)
                    node = node.nextElementSibling.firstElementChild;
                else if (node.nextElementSibling.nextElementSibling != null)
                    node = node.nextElementSibling.nextElementSibling;
                else
                    walkUp = true;
            }
            else {
                if (node.nextElementSibling != null)
                    node = node.nextElementSibling;
                else
                    walkUp = true;
            }
            if (walkUp) {
                if (node.parentElement.classList.contains("children")) {
                    var target = node.parentElement;
                    while (target.nextElementSibling == null) {
                        target = target.parentElement;
                        if (!target.classList.contains("children"))
                            return;
                    }
                    node = target.nextElementSibling;
                }
                else
                    return;
            }
        }
        if (node == null)
            return;
        this.clearSelection();
        this.addToSelection(node);
        this.scrollIntoView(node);
        this.emit("selectionChange");
    };
    ;
    TreeView.prototype._getDropInfo = function (event) {
        var element = event.target;
        if (element.tagName === "OL" && element.classList.contains("children")) {
            element = element.parentElement;
        }
        if (element === this.treeRoot) {
            element = element.lastChild;
            if (element.tagName === "OL")
                element = element.previousSibling;
            return { target: element, where: "below" };
        }
        while (element.tagName !== "LI" || (!element.classList.contains("item") && !element.classList.contains("group"))) {
            if (element === this.treeRoot)
                return null;
            element = element.parentElement;
        }
        var where = this._getInsertionPoint(element, event.pageY);
        if (where === "below") {
            if (element.classList.contains("item") && element.nextSibling != null && element.nextSibling.tagName === "LI") {
                element = element.nextSibling;
                where = "above";
            }
            else if (element.classList.contains("group") && element.nextSibling.nextSibling != null && element.nextSibling.nextSibling.tagName === "LI") {
                element = element.nextSibling.nextSibling;
                where = "above";
            }
        }
        return { target: element, where: where };
    };
    TreeView.prototype._getInsertionPoint = function (element, y) {
        var rect = element.getBoundingClientRect();
        var offset = y - rect.top;
        if (offset < rect.height / 4)
            return "above";
        if (offset > rect.height * 3 / 4)
            return (element.classList.contains("group") && element.nextSibling.childElementCount > 0) ? "inside" : "below";
        return element.classList.contains("item") ? "below" : "inside";
    };
    TreeView.prototype._clearDropClasses = function () {
        var dropAbove = this.treeRoot.querySelector(".drop-above");
        if (dropAbove != null)
            dropAbove.classList.remove("drop-above");
        var dropInside = this.treeRoot.querySelector(".drop-inside");
        if (dropInside != null)
            dropInside.classList.remove("drop-inside");
        var dropBelow = this.treeRoot.querySelector(".drop-below");
        if (dropBelow != null)
            dropBelow.classList.remove("drop-below");
    };
    return TreeView;
})(events_1.EventEmitter);
module.exports = TreeView;

},{"events":1}]},{},[2])(2)
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"events":3}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
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
},{"events":3}],5:[function(require,module,exports){
var TileSet = (function () {
    function TileSet(data) {
        this.data = data;
    }
    return TileSet;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TileSet;

},{}],6:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var THREE = SupEngine.THREE;
var TileSetRendererUpdater_1 = require("./TileSetRendererUpdater");
var TileSetRenderer = (function (_super) {
    __extends(TileSetRenderer, _super);
    function TileSetRenderer(actor, asset) {
        _super.call(this, actor, "TileSetRenderer");
        var gridActor = new SupEngine.Actor(this.actor.gameInstance, "Grid");
        gridActor.setLocalPosition(new THREE.Vector3(0, 0, 1));
        this.gridRenderer = new SupEngine.editorComponentClasses["GridRenderer"](gridActor, {
            width: 1, height: 1,
            direction: -1, orthographicScale: 10,
            ratio: { x: 1, y: 1 }
        });
        this.selectedTileActor = new SupEngine.Actor(this.actor.gameInstance, "Selection", null, { visible: false });
        new SupEngine.editorComponentClasses["FlatColorRenderer"](this.selectedTileActor, 0x900090, 1, 1);
        this.setTileSet(asset);
    }
    TileSetRenderer.prototype.setTileSet = function (asset) {
        this._clearMesh();
        this.asset = asset;
        if (this.asset == null)
            return;
        var geometry = new THREE.PlaneBufferGeometry(asset.data.texture.image.width, asset.data.texture.image.height);
        var material = new THREE.MeshBasicMaterial({ map: asset.data.texture, alphaTest: 0.1, side: THREE.DoubleSide });
        this.mesh = new THREE.Mesh(geometry, material);
        this.actor.threeObject.add(this.mesh);
        this.refreshScaleRatio();
        this.selectedTileActor.threeObject.visible = true;
    };
    TileSetRenderer.prototype.select = function (x, y, width, height) {
        if (width === void 0) { width = 1; }
        if (height === void 0) { height = 1; }
        var ratio = this.asset.data.grid.width / this.asset.data.grid.height;
        this.selectedTileActor.setLocalPosition(new THREE.Vector3(x, -y / ratio, 2));
        this.selectedTileActor.setLocalScale(new THREE.Vector3(width, -height / ratio, 1));
    };
    TileSetRenderer.prototype.refreshScaleRatio = function () {
        var scaleX = 1 / this.asset.data.grid.width;
        var scaleY = 1 / this.asset.data.grid.height;
        this.mesh.scale.set(scaleX, scaleX, 1);
        var material = this.mesh.material;
        this.mesh.position.setX(material.map.image.width / 2 * scaleX);
        this.mesh.position.setY(-material.map.image.height / 2 * scaleX);
        this.mesh.updateMatrixWorld(false);
        this.select(0, 0);
    };
    TileSetRenderer.prototype._clearMesh = function () {
        if (this.mesh == null)
            return;
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        this.actor.threeObject.remove(this.mesh);
        this.mesh = null;
        this.selectedTileActor.threeObject.visible = false;
    };
    TileSetRenderer.prototype._destroy = function () {
        this._clearMesh();
        this.actor.gameInstance.destroyActor(this.gridRenderer.actor);
        this.actor.gameInstance.destroyActor(this.selectedTileActor);
        this.asset = null;
        _super.prototype._destroy.call(this);
    };
    TileSetRenderer.prototype.setIsLayerActive = function (active) { if (this.mesh != null)
        this.mesh.visible = active; };
    TileSetRenderer.Updater = TileSetRendererUpdater_1.default;
    return TileSetRenderer;
})(SupEngine.ActorComponent);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TileSetRenderer;

},{"./TileSetRendererUpdater":7}],7:[function(require,module,exports){
var THREE = SupEngine.THREE;
var TileSet_1 = require("./TileSet");
var TileSetRendererUpdater = (function () {
    function TileSetRendererUpdater(client, tileSetRenderer, config, receiveAssetCallbacks, editAssetCallbacks) {
        var _this = this;
        this._onTileSetAssetReceived = function (assetId, asset) {
            _this._prepareTexture(asset.pub.texture, function () {
                _this.tileSetAsset = asset;
                if (asset.pub.texture != null) {
                    _this.tileSetRenderer.setTileSet(new TileSet_1.default(asset.pub));
                    _this.tileSetRenderer.gridRenderer.setGrid({
                        width: asset.pub.texture.image.width / asset.pub.grid.width,
                        height: asset.pub.texture.image.height / asset.pub.grid.height,
                        direction: -1,
                        orthographicScale: 10,
                        ratio: { x: 1, y: asset.pub.grid.width / asset.pub.grid.height }
                    });
                }
                if (_this.receiveAssetCallbacks != null && _this.receiveAssetCallbacks.tileSet != null)
                    _this.receiveAssetCallbacks.tileSet();
            });
        };
        this._onTileSetAssetEdited = function (id, command) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            var callEditCallback = true;
            var commandFunction = _this[("_onEditCommand_" + command)];
            if (commandFunction != null) {
                if (commandFunction.apply(_this, args) === false)
                    callEditCallback = false;
            }
            if (callEditCallback && _this.editAssetCallbacks != null) {
                var editCallback = _this.editAssetCallbacks.tileSet[command];
                if (editCallback != null)
                    editCallback.apply(null, args);
            }
        };
        this._onTileSetAssetTrashed = function (assetId) {
            _this.tileSetRenderer.setTileSet(null);
            if (_this.editAssetCallbacks != null) {
                // FIXME: We should probably have a this.trashAssetCallback instead
                // and let editors handle things how they want
                SupClient.onAssetTrashed();
            }
        };
        this.client = client;
        this.tileSetRenderer = tileSetRenderer;
        this.receiveAssetCallbacks = receiveAssetCallbacks;
        this.editAssetCallbacks = editAssetCallbacks;
        this.tileSetAssetId = config.tileSetAssetId;
        this.tileSetSubscriber = {
            onAssetReceived: this._onTileSetAssetReceived,
            onAssetEdited: this._onTileSetAssetEdited,
            onAssetTrashed: this._onTileSetAssetTrashed
        };
        if (this.tileSetAssetId != null)
            this.client.subAsset(this.tileSetAssetId, "tileSet", this.tileSetSubscriber);
    }
    TileSetRendererUpdater.prototype.destroy = function () {
        if (this.tileSetAssetId != null) {
            this.client.unsubAsset(this.tileSetAssetId, this.tileSetSubscriber);
        }
    };
    TileSetRendererUpdater.prototype.changeTileSetId = function (tileSetId) {
        if (this.tileSetAssetId != null)
            this.client.unsubAsset(this.tileSetAssetId, this.tileSetSubscriber);
        this.tileSetAssetId = tileSetId;
        this.tileSetAsset = null;
        this.tileSetRenderer.setTileSet(null);
        this.tileSetRenderer.gridRenderer.resize(1, 1);
        if (this.tileSetAssetId != null)
            this.client.subAsset(this.tileSetAssetId, "tileSet", this.tileSetSubscriber);
    };
    TileSetRendererUpdater.prototype._prepareTexture = function (texture, callback) {
        if (texture == null) {
            callback();
            return;
        }
        if (texture.image.complete)
            callback();
        else
            texture.image.addEventListener("load", callback);
    };
    TileSetRendererUpdater.prototype._onEditCommand_upload = function () {
        var _this = this;
        var texture = this.tileSetAsset.pub.texture;
        this._prepareTexture(texture, function () {
            _this.tileSetRenderer.setTileSet(new TileSet_1.default(_this.tileSetAsset.pub));
            var width = texture.image.width / _this.tileSetAsset.pub.grid.width;
            var height = texture.image.height / _this.tileSetAsset.pub.grid.height;
            _this.tileSetRenderer.gridRenderer.resize(width, height);
            _this.tileSetRenderer.gridRenderer.setRatio({ x: 1, y: _this.tileSetAsset.pub.grid.width / _this.tileSetAsset.pub.grid.height });
            var editCallback = (_this.editAssetCallbacks != null) ? _this.editAssetCallbacks.tileSet["upload"] : null;
            if (editCallback != null)
                editCallback();
        });
    };
    TileSetRendererUpdater.prototype._onEditCommand_setProperty = function (key, value) {
        switch (key) {
            case "grid.width":
            case "grid.height":
                this.tileSetRenderer.refreshScaleRatio();
                var width = this.tileSetAsset.pub.texture.image.width / this.tileSetAsset.pub.grid.width;
                var height = this.tileSetAsset.pub.texture.image.height / this.tileSetAsset.pub.grid.height;
                this.tileSetRenderer.gridRenderer.resize(width, height);
                this.tileSetRenderer.gridRenderer.setRatio({ x: 1, y: this.tileSetAsset.pub.grid.width / this.tileSetAsset.pub.grid.height });
                break;
        }
    };
    return TileSetRendererUpdater;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TileSetRendererUpdater;

},{"./TileSet":5}]},{},[1]);