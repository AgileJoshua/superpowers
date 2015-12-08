var ActorComponent = (function () {
    function ActorComponent(actor, typeName) {
        this.actor = actor;
        this.typeName = typeName;
        this.actor.components.push(this);
        this.actor.gameInstance.componentsToBeStarted.push(this);
    }
    ActorComponent.prototype._destroy = function () {
        var outer = this.__outer;
        if (outer != null)
            outer.__inner = null;
        var startIndex = this.actor.gameInstance.componentsToBeStarted.indexOf(this);
        if (startIndex !== -1)
            this.actor.gameInstance.componentsToBeStarted.splice(startIndex, 1);
        var index = this.actor.components.indexOf(this);
        if (index !== -1)
            this.actor.components.splice(index, 1);
        this.actor = null;
    };
    ActorComponent.prototype.awake = function () { };
    ActorComponent.prototype.start = function () { };
    ActorComponent.prototype.update = function () { };
    return ActorComponent;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ActorComponent;
