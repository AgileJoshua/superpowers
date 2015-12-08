/// <reference path="../SupEngine.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var events_1 = require("events");
var THREE = require("three");
var ActorTree_1 = require("./ActorTree");
var Input_1 = require("./Input");
var Audio_1 = require("./Audio");
var GameInstance = (function (_super) {
    __extends(GameInstance, _super);
    function GameInstance(canvas, options) {
        if (options === void 0) { options = {}; }
        _super.call(this);
        this.framesPerSecond = 60;
        this.layers = ["Default"];
        this.tree = new ActorTree_1.default();
        this.cachedActors = [];
        this.renderComponents = [];
        this.componentsToBeStarted = [];
        this.componentsToBeDestroyed = [];
        this.actorsToBeDestroyed = [];
        this.audio = new Audio_1.default();
        this.threeScene = new THREE.Scene();
        this.skipRendering = false;
        // Used to know whether or not we have to close the window at exit when using the app
        this.debug = options.debug === true;
        // Exit callback is only enabled when playing the actual game, not in most editors
        this.input = new Input_1.default(canvas, { enableOnExit: options.enableOnExit });
        // Setup layers
        if (options.layers != null)
            this.layers = options.layers;
        // NOTE: We ask for a stencil buffer because of a Firefox bug
        // If we don't, Firefox will often return a 16-bit depth buffer
        // (rather than a more useful 24-bit depth buffer).
        // See https://bugzilla.mozilla.org/show_bug.cgi?id=1202387
        try {
            this.threeRenderer = new THREE.WebGLRenderer({ canvas: canvas, precision: "mediump", alpha: false, antialias: false, stencil: true });
        }
        catch (e) {
            return;
        }
        this.threeRenderer.setSize(0, 0, false);
        this.threeRenderer.autoClearColor = false;
        this.threeScene.autoUpdate = false;
    }
    GameInstance.prototype.tick = function (accumulatedTime, callback) {
        var updateInterval = 1 / this.framesPerSecond * 1000;
        // Limit how many update()s to try and catch up,
        // to avoid falling into the "black pit of despair" aka "doom spiral".
        // where every tick takes longer than the previous one.
        // See http://blogs.msdn.com/b/shawnhar/archive/2011/03/25/technical-term-that-should-exist-quot-black-pit-of-despair-quot.aspx
        var maxAccumulatedUpdates = 5;
        var maxAccumulatedTime = maxAccumulatedUpdates * updateInterval;
        if (accumulatedTime > maxAccumulatedTime)
            accumulatedTime = maxAccumulatedTime;
        // Update
        var updates = 0;
        while (accumulatedTime >= updateInterval) {
            this.update();
            if (callback != null)
                callback();
            if (this.input.exited)
                break;
            accumulatedTime -= updateInterval;
            updates++;
        }
        return { updates: updates, timeLeft: accumulatedTime };
    };
    GameInstance.prototype.update = function () {
        var _this = this;
        this.input.update();
        // Build cached actors list
        this.cachedActors.length = 0;
        this.tree.walkTopDown(function (actor) { _this.cachedActors.push(actor); return true; });
        // Start newly-added components
        var index = 0;
        while (index < this.componentsToBeStarted.length) {
            var component = this.componentsToBeStarted[index];
            // If the component to be started is part of an actor
            // which will not be updated, skip it until next loop
            if (this.cachedActors.indexOf(component.actor) === -1) {
                index++;
                continue;
            }
            component.start();
            this.componentsToBeStarted.splice(index, 1);
        }
        for (var pluginName in SupEngine.earlyUpdateFunctions)
            SupEngine.earlyUpdateFunctions[pluginName]();
        // Update all actors
        this.cachedActors.forEach(function (actor) { actor.update(); });
        // Apply pending component / actor destructions
        this.componentsToBeDestroyed.forEach(function (component) { _this._doComponentDestruction(component); });
        this.componentsToBeDestroyed.length = 0;
        this.actorsToBeDestroyed.forEach(function (actor) { _this._doActorDestruction(actor); });
        this.actorsToBeDestroyed.length = 0;
        if (this.input.exited) {
            this.threeRenderer.clear();
            return;
        }
        if (this.skipRendering) {
            this.skipRendering = false;
            this.update();
            return;
        }
    };
    GameInstance.prototype.setRatio = function (ratio) {
        this.ratio = ratio;
        if (this.ratio != null) {
            this.threeRenderer.domElement.style.margin = "auto";
            this.threeRenderer.domElement.style.flex = "none";
        }
        else {
            this.threeRenderer.domElement.style.margin = "0";
            this.threeRenderer.domElement.style.flex = "1";
        }
        this.resizeRenderer();
    };
    GameInstance.prototype.resizeRenderer = function () {
        var width;
        var height;
        if (this.ratio != null) {
            if (document.body.clientWidth / document.body.clientHeight > this.ratio) {
                height = document.body.clientHeight;
                width = Math.min(document.body.clientWidth, height * this.ratio);
            }
            else {
                width = document.body.clientWidth;
                height = Math.min(document.body.clientHeight, width / this.ratio);
            }
        }
        else {
            width = this.threeRenderer.domElement.clientWidth;
            height = this.threeRenderer.domElement.clientHeight;
        }
        if (this.threeRenderer.domElement.width !== width || this.threeRenderer.domElement.height !== height) {
            this.threeRenderer.setSize(width, height, false);
            this.emit("resize", { width: width, height: height });
        }
    };
    GameInstance.prototype.setActiveLayer = function (layer) {
        for (var _i = 0, _a = this.cachedActors; _i < _a.length; _i++) {
            var cachedActor = _a[_i];
            cachedActor.setActiveLayer(layer);
        }
    };
    GameInstance.prototype.draw = function () {
        var _this = this;
        this.resizeRenderer();
        this.threeRenderer.clear();
        this.renderComponents.sort(function (a, b) {
            var order = (a.depth - b.depth);
            if (order === 0)
                order = _this.cachedActors.indexOf(a.actor) - _this.cachedActors.indexOf(b.actor);
            return order;
        });
        for (var _i = 0, _a = this.renderComponents; _i < _a.length; _i++) {
            var renderComponent = _a[_i];
            renderComponent.render();
        }
    };
    GameInstance.prototype.clear = function () { this.threeRenderer.clear(); };
    GameInstance.prototype.destroyComponent = function (component) {
        if (this.componentsToBeDestroyed.indexOf(component) !== -1)
            return;
        this.componentsToBeDestroyed.push(component);
        var index = this.componentsToBeStarted.indexOf(component);
        if (index !== -1)
            this.componentsToBeStarted.splice(index, 1);
    };
    GameInstance.prototype.destroyActor = function (actor) {
        if (actor.pendingForDestruction)
            return;
        this.actorsToBeDestroyed.push(actor);
        actor._markDestructionPending();
    };
    GameInstance.prototype.destroyAllActors = function () {
        var _this = this;
        this.tree.walkTopDown(function (actor) { _this.destroyActor(actor); return true; });
        this.skipRendering = true;
    };
    GameInstance.prototype._doComponentDestruction = function (component) { component._destroy(); };
    GameInstance.prototype._doActorDestruction = function (actor) {
        while (actor.children.length > 0)
            this._doActorDestruction(actor.children[0]);
        var cachedIndex = this.cachedActors.indexOf(actor);
        if (cachedIndex !== -1)
            this.cachedActors.splice(cachedIndex, 1);
        actor._destroy();
    };
    return GameInstance;
})(events_1.EventEmitter);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GameInstance;
