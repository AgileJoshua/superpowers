var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var THREE = SupEngine.THREE;
var P2Body = (function (_super) {
    __extends(P2Body, _super);
    function P2Body(actor) {
        _super.call(this, actor, "P2Body");
        this.actorPosition = new THREE.Vector3();
        this.actorAngles = new THREE.Euler();
        this.body = new window.p2.Body();
        SupEngine.P2.World.addBody(this.body);
    }
    P2Body.prototype.setIsLayerActive = function (active) { };
    P2Body.prototype.setup = function (config) {
        this.mass = (config.mass != null) ? config.mass : 0;
        this.fixedRotation = (config.fixedRotation != null) ? config.fixedRotation : false;
        this.offsetX = (config.offsetX != null) ? config.offsetX : 0;
        this.offsetY = (config.offsetY != null) ? config.offsetY : 0;
        this.actor.getGlobalPosition(this.actorPosition);
        this.actor.getGlobalEulerAngles(this.actorAngles);
        this.body.mass = this.mass;
        this.body.type = (this.mass === 0) ? window.p2.Body.STATIC : window.p2.Body.DYNAMIC;
        this.body.material = SupEngine.P2.World.defaultMaterial;
        this.body.fixedRotation = this.fixedRotation;
        this.body.updateMassProperties();
        this.shape = config.shape;
        switch (this.shape) {
            case "box": {
                this.width = (config.width != null) ? config.width : 0.5;
                this.height = (config.height != null) ? config.height : 0.5;
                this.body.addShape(new window.p2.Box({ width: this.width, height: this.height }));
                break;
            }
            case "circle": {
                this.radius = (config.radius != null) ? config.radius : 1;
                this.body.addShape(new window.p2.Circle({ radius: this.radius }));
                break;
            }
        }
        this.body.position = [this.actorPosition.x, this.actorPosition.y];
        this.body.shapes[0].position = [this.offsetX, this.offsetY];
        this.body.angle = this.actorAngles.z;
    };
    P2Body.prototype.update = function () {
        this.actorPosition.x = this.body.position[0];
        this.actorPosition.y = this.body.position[1];
        this.actor.setGlobalPosition(this.actorPosition);
        this.actorAngles.z = this.body.angle;
        this.actor.setGlobalEulerAngles(this.actorAngles);
    };
    P2Body.prototype._destroy = function () {
        SupEngine.P2.World.removeBody(this.body);
        this.body = null;
        _super.prototype._destroy.call(this);
    };
    return P2Body;
})(SupEngine.ActorComponent);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = P2Body;
