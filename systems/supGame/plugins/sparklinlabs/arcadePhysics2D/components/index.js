var epsilon = 0.0001;
var THREE = SupEngine.THREE;
var ArcadeBody2D_1 = require("./ArcadeBody2D");
var ArcadeBody2DMarker_1 = require("./ArcadeBody2DMarker");
var ArcadePhysics2D;
(function (ArcadePhysics2D) {
    ArcadePhysics2D.allBodies = [];
    ArcadePhysics2D.gravity = new THREE.Vector3(0, 0, 0);
    function intersects(body1, body2) {
        if (body2.type === "tileMap")
            return checkTileMap(body1, body2, { moveBody: false });
        if (body1.right() < body2.left())
            return false;
        if (body1.left() > body2.right())
            return false;
        if (body1.bottom() > body2.top())
            return false;
        if (body1.top() < body2.bottom())
            return false;
        return true;
    }
    ArcadePhysics2D.intersects = intersects;
    function detachFromBox(body1, body2) {
        var insideX = body1.position.x - body2.position.x;
        if (insideX >= 0)
            insideX -= (body1.width + body2.width) / 2;
        else
            insideX += (body1.width + body2.width) / 2;
        var insideY = body1.position.y - body2.position.y;
        if (insideY >= 0)
            insideY -= (body1.height + body2.height) / 2;
        else
            insideY += (body1.height + body2.height) / 2;
        if (Math.abs(insideY) <= Math.abs(insideX)) {
            if (body1.deltaY() / insideY > 0) {
                body1.velocity.y = -body1.velocity.y * body1.bounceY;
                body1.position.y -= insideY;
                if (body1.position.y > body2.position.y)
                    body1.touches.bottom = true;
                else
                    body1.touches.top = true;
            }
        }
        else {
            if (body1.deltaX() / insideX > 0) {
                body1.velocity.x = -body1.velocity.x * body1.bounceX;
                body1.position.x -= insideX;
                if (body1.position.x > body2.position.x)
                    body1.touches.left = true;
                else
                    body1.touches.right = true;
            }
        }
    }
    function checkTileMap(body1, body2, options) {
        function checkX() {
            var x = (body1.deltaX() < 0) ?
                Math.floor((body1.position.x - body2.position.x - body1.width / 2) / body2.mapToSceneFactor.x) :
                Math.floor((body1.position.x - body2.position.x + body1.width / 2 - epsilon) / body2.mapToSceneFactor.x);
            var y = body1.position.y - body2.position.y - body1.height / 2 + epsilon;
            var testedHeight = body1.height - 3 * epsilon;
            var totalPoints = Math.ceil(testedHeight / body2.mapToSceneFactor.y);
            for (var point = 0; point <= totalPoints; point++) {
                for (var _i = 0, _a = body2.layersIndex; _i < _a.length; _i++) {
                    var layer = _a[_i];
                    var tile = body2.tileMapAsset.getTileAt(layer, x, Math.floor((y + point * testedHeight / totalPoints) / body2.mapToSceneFactor.y));
                    var collide = false;
                    if (body2.tileSetPropertyName != null)
                        collide = body2.tileSetAsset.getTileProperties(tile)[body2.tileSetPropertyName] != null;
                    else if (tile !== -1)
                        collide = true;
                    if (!collide)
                        continue;
                    body1.velocity.x = -body1.velocity.x * body1.bounceX;
                    if (body1.deltaX() < 0) {
                        if (options.moveBody)
                            body1.position.x = (x + 1) * body2.mapToSceneFactor.x + body2.position.x + body1.width / 2;
                        body1.touches.left = true;
                    }
                    else {
                        if (options.moveBody)
                            body1.position.x = (x) * body2.mapToSceneFactor.x + body2.position.x - body1.width / 2 + epsilon;
                        body1.touches.right = true;
                    }
                    return true;
                }
            }
            return false;
        }
        function checkY() {
            var x = body1.position.x - body2.position.x - body1.width / 2 + epsilon;
            var y = (body1.deltaY() < 0) ?
                Math.floor((body1.position.y - body2.position.y - body1.height / 2) / body2.mapToSceneFactor.y) :
                Math.floor((body1.position.y - body2.position.y + body1.height / 2 - epsilon) / body2.mapToSceneFactor.y);
            var testedWidth = body1.width - 3 * epsilon;
            var totalPoints = Math.ceil(testedWidth / body2.mapToSceneFactor.x);
            for (var point = 0; point <= totalPoints; point++) {
                for (var _i = 0, _a = body2.layersIndex; _i < _a.length; _i++) {
                    var layer = _a[_i];
                    var tile = body2.tileMapAsset.getTileAt(layer, Math.floor((x + point * testedWidth / totalPoints) / body2.mapToSceneFactor.x), y);
                    var collide = false;
                    if (body2.tileSetPropertyName != null)
                        collide = body2.tileSetAsset.getTileProperties(tile)[body2.tileSetPropertyName] != null;
                    else if (tile !== -1)
                        collide = true;
                    if (!collide)
                        continue;
                    body1.velocity.y = -body1.velocity.y * body1.bounceY;
                    if (body1.deltaY() < 0) {
                        if (options.moveBody)
                            body1.position.y = (y + 1) * body2.mapToSceneFactor.y + body2.position.y + body1.height / 2;
                        body1.touches.bottom = true;
                    }
                    else {
                        if (options.moveBody)
                            body1.position.y = (y) * body2.mapToSceneFactor.y + body2.position.y - body1.height / 2 + epsilon;
                        body1.touches.top = true;
                    }
                    return true;
                }
            }
            return false;
        }
        var x = body1.position.x;
        body1.position.x = body1.previousPosition.x;
        var gotCollision = false;
        if (checkY())
            gotCollision = true;
        body1.position.x = x;
        if (checkX())
            gotCollision = true;
        return gotCollision;
    }
    function collides(body1, bodies) {
        if (body1.type === "tileMap" || !body1.movable)
            throw new Error("The first body must be a movable box in ArcadePhysics2D.collides");
        body1.touches.top = false;
        body1.touches.bottom = false;
        body1.touches.right = false;
        body1.touches.left = false;
        var gotCollision = false;
        for (var _i = 0; _i < bodies.length; _i++) {
            var body2 = bodies[_i];
            if (body2 === body1 || !body2.enabled)
                continue;
            if (body2.type === "box") {
                if (intersects(body1, body2)) {
                    gotCollision = true;
                    detachFromBox(body1, body2);
                }
            }
            else if (body2.type === "tileMap") {
                if (checkTileMap(body1, body2, { moveBody: true }))
                    gotCollision = true;
            }
        }
        if (gotCollision)
            body1.refreshActorPosition();
        return gotCollision;
    }
    ArcadePhysics2D.collides = collides;
})(ArcadePhysics2D || (ArcadePhysics2D = {}));
SupEngine.ArcadePhysics2D = ArcadePhysics2D;
SupEngine.registerEarlyUpdateFunction("ArcadePhysics2D", function () {
    for (var _i = 0, _a = ArcadePhysics2D.allBodies; _i < _a.length; _i++) {
        var body = _a[_i];
        body.earlyUpdate();
    }
});
SupEngine.registerComponentClass("ArcadeBody2D", ArcadeBody2D_1.default);
SupEngine.registerEditorComponentClass("ArcadeBody2DMarker", ArcadeBody2DMarker_1.default);
