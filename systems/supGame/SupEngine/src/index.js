var THREE = require("three");
exports.THREE = THREE;
THREE.Euler.DefaultOrder = "YXZ";
var GameInstance_1 = require("./GameInstance");
exports.GameInstance = GameInstance_1.default;
var ActorTree_1 = require("./ActorTree");
exports.ActorTree = ActorTree_1.default;
var Actor_1 = require("./Actor");
exports.Actor = Actor_1.default;
var ActorComponent_1 = require("./ActorComponent");
exports.ActorComponent = ActorComponent_1.default;
var Input_1 = require("./Input");
exports.Input = Input_1.default;
var Audio_1 = require("./Audio");
exports.Audio = Audio_1.default;
var SoundPlayer_1 = require("./SoundPlayer");
exports.SoundPlayer = SoundPlayer_1.default;
var Camera2DControls_1 = require("./components/Camera2DControls");
var Camera3DControls_1 = require("./components/Camera3DControls");
var FlatColorRenderer_1 = require("./components/FlatColorRenderer");
var GridRenderer_1 = require("./components/GridRenderer");
var SelectionRenderer_1 = require("./components/SelectionRenderer");
exports.editorComponentClasses = {
    Camera2DControls: Camera2DControls_1.default, Camera3DControls: Camera3DControls_1.default, FlatColorRenderer: FlatColorRenderer_1.default, GridRenderer: GridRenderer_1.default, SelectionRenderer: SelectionRenderer_1.default
};
function registerEditorComponentClass(name, componentClass) {
    if (exports.editorComponentClasses[name] != null) {
        console.error("SupEngine.registerEditorComponent: Tried to register two or more classes named \"" + name + "\"");
        return;
    }
    exports.editorComponentClasses[name] = componentClass;
}
exports.registerEditorComponentClass = registerEditorComponentClass;
;
var Camera_1 = require("./components/Camera");
exports.componentClasses = {
    /* Built-ins */ Camera: Camera_1.default
};
function registerComponentClass(name, plugin) {
    if (exports.componentClasses[name] != null) {
        console.error("SupEngine.registerComponentClass: Tried to register two or more classes named \"" + name + "\"");
        return;
    }
    exports.componentClasses[name] = plugin;
}
exports.registerComponentClass = registerComponentClass;
;
exports.earlyUpdateFunctions = {};
function registerEarlyUpdateFunction(name, callback) {
    if (exports.earlyUpdateFunctions[name] != null) {
        console.error("SupEngine.registerEarlyUpdateFunction: Tried to register two or more functions named \"" + name + "\"");
        return;
    }
    exports.earlyUpdateFunctions[name] = callback;
}
exports.registerEarlyUpdateFunction = registerEarlyUpdateFunction;
;
