var ui_1 = require("./ui");
var network_1 = require("./network");
var CubicModelNodes_1 = require("../../data/CubicModelNodes");
var THREE = SupEngine.THREE;
var tmpVector3 = new THREE.Vector3();
var textureArea = { shapeLineMeshesByNodeId: {} };
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = textureArea;
var canvas = document.querySelector(".texture-container canvas");
if (SupClient.isApp) {
    var remote = top.global.require("remote");
    var clipboard = remote.require("clipboard");
    var nativeImage = remote.require("native-image");
    document.addEventListener("copy", function (event) {
        if (document.activeElement !== canvas)
            return;
        var dataURL = network_1.data.cubicModelUpdater.cubicModelAsset.clientTextureDatas["map"].ctx.canvas.toDataURL();
        clipboard.writeImage(nativeImage.createFromDataUrl(dataURL));
    });
}
var pasteCtx = document.createElement("canvas").getContext("2d");
document.addEventListener("paste", function (event) {
    if (document.activeElement !== canvas)
        return;
    if (event.clipboardData.items[0] == null)
        return;
    if (event.clipboardData.items[0].type.indexOf("image") === -1)
        return;
    if (textureArea.mode !== "paint")
        return;
    if (textureArea.pasteMesh != null)
        clearPasteSelection();
    var imageBlob = event.clipboardData.items[0].getAsFile();
    var image = new Image();
    image.src = URL.createObjectURL(imageBlob);
    image.onload = function () {
        pasteCtx.canvas.width = image.width;
        pasteCtx.canvas.height = image.height;
        pasteCtx.drawImage(image, 0, 0);
        var texture = new THREE.Texture(pasteCtx.canvas);
        texture.needsUpdate = true;
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        var geom = new THREE.PlaneBufferGeometry(image.width, image.height, 1, 1);
        var mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, map: texture });
        textureArea.pasteMesh = new THREE.Mesh(geom, mat);
        textureArea.pasteActor.threeObject.add(textureArea.pasteMesh);
        textureArea.pasteActor.setLocalPosition(tmpVector3.set(image.width / 2, -image.height / 2, 1));
        textureArea.selectionRenderer.setSize(image.width, image.height);
        textureArea.selectionRenderer.actor.setParent(textureArea.pasteActor);
        textureArea.selectionRenderer.actor.setLocalPosition(tmpVector3.set(0, 0, 5));
        textureArea.selectionRenderer.actor.threeObject.visible = true;
    };
});
textureArea.gameInstance = new SupEngine.GameInstance(canvas);
textureArea.gameInstance.threeRenderer.setClearColor(0xbbbbbb);
var cameraActor = new SupEngine.Actor(textureArea.gameInstance, "Camera");
cameraActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, 10));
var cameraComponent = new SupEngine.componentClasses["Camera"](cameraActor);
cameraComponent.setOrthographicMode(true);
cameraComponent.setOrthographicScale(10);
textureArea.cameraControls = new SupEngine.editorComponentClasses["Camera2DControls"](cameraActor, cameraComponent, { zoomSpeed: 1.5, zoomMin: 1, zoomMax: 200 });
var selectionActor = new SupEngine.Actor(textureArea.gameInstance, "Selection");
textureArea.selectionRenderer = new SupEngine.editorComponentClasses["SelectionRenderer"](selectionActor);
textureArea.pasteActor = new SupEngine.Actor(textureArea.gameInstance, "Paste");
function clearPasteSelection() {
    textureArea.pasteActor.threeObject.remove(textureArea.pasteMesh);
    textureArea.selectionRenderer.actor.setParent(null);
    textureArea.selectionRenderer.actor.threeObject.visible = false;
    textureArea.pasteMesh = null;
}
function setup() {
    setupTexture();
    network_1.data.cubicModelUpdater.cubicModelAsset.nodes.walk(addNode);
}
exports.setup = setup;
function setupTexture() {
    if (textureArea.textureMesh != null)
        textureArea.gameInstance.threeScene.remove(textureArea.textureMesh);
    var asset = network_1.data.cubicModelUpdater.cubicModelAsset;
    var threeTexture = network_1.data.cubicModelUpdater.cubicModelAsset.pub.textures["map"];
    var geom = new THREE.PlaneBufferGeometry(asset.pub.textureWidth, asset.pub.textureHeight, 1, 1);
    var mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, map: threeTexture });
    textureArea.textureMesh = new THREE.Mesh(geom, mat);
    textureArea.textureMesh.position.set(asset.pub.textureWidth / 2, -asset.pub.textureHeight / 2, -1);
    textureArea.gameInstance.threeScene.add(textureArea.textureMesh);
    textureArea.textureMesh.updateMatrixWorld(false);
}
exports.setupTexture = setupTexture;
textureArea.mode = "layout";
updateMode();
document.querySelector(".texture-container .controls .mode-selection").addEventListener("click", function (event) {
    var target = event.target;
    if (target.tagName !== "INPUT")
        return;
    textureArea.mode = target.value;
    updateMode();
    clearPasteSelection();
});
textureArea.paintTool = "brush";
document.querySelector(".texture-container .controls .paint-mode-container .tool").addEventListener("click", function (event) {
    var target = event.target;
    if (target.tagName !== "INPUT")
        return;
    textureArea.paintTool = target.value;
});
function updateMode() {
    for (var _i = 0, _a = ["layout", "paint"]; _i < _a.length; _i++) {
        var mode = _a[_i];
        var container = document.querySelector("." + mode + "-mode-container");
        container.style.display = mode === textureArea.mode ? "" : "none";
    }
}
textureArea.colorInput = document.querySelector("input.color");
var lineMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff, opacity: 0.4, depthTest: false, depthWrite: false, transparent: true });
var selectedLineMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff, opacity: 1, depthTest: false, depthWrite: false, transparent: true });
var verticesByShapeType = {
    "none": 0,
    "box": 20
};
function addNode(node) {
    var geometry = new THREE.Geometry();
    var line = new THREE.LineSegments(geometry, lineMaterial);
    textureArea.shapeLineMeshesByNodeId[node.id] = line;
    textureArea.gameInstance.threeScene.add(line);
    line.updateMatrixWorld(false);
    updateNode(node);
}
exports.addNode = addNode;
function updateNode(node) {
    var line = textureArea.shapeLineMeshesByNodeId[node.id];
    var verticesCount = verticesByShapeType[node.shape.type];
    var vertices = line.geometry.vertices;
    if (vertices.length < verticesCount) {
        for (var i = vertices.length; i < verticesCount; i++)
            vertices.push(new THREE.Vector3(0, 0, 0));
    }
    else if (vertices.length > verticesCount) {
        vertices.length = verticesCount;
    }
    // let origin = { x: node.shape.textureOffset.x, y: -node.shape.textureOffset.y };
    // TEMPORARY
    var origin = { x: node.shape.textureLayout["left"].offset.x, y: -node.shape.textureLayout["top"].offset.y };
    switch (node.shape.type) {
        case "box":
            var size = node.shape.settings.size;
            // Top horizontal line
            vertices[0].set(origin.x + size.z, origin.y, 1);
            vertices[1].set(origin.x + size.z + size.x * 2, origin.y, 1);
            // Shared horizontal line
            vertices[2].set(origin.x, origin.y - size.z, 1);
            vertices[3].set(origin.x + size.x * 2 + size.z * 2, origin.y - size.z, 1);
            // Bottom horizontal line
            vertices[4].set(origin.x, origin.y - size.z - size.y, 1);
            vertices[5].set(origin.x + size.x * 2 + size.z * 2, origin.y - size.z - size.y, 1);
            // Shared vertical line
            vertices[6].set(origin.x + size.z, origin.y, 1);
            vertices[7].set(origin.x + size.z, origin.y - size.z - size.y, 1);
            // First row, second vertical line
            vertices[8].set(origin.x + size.z + size.x, origin.y, 1);
            vertices[9].set(origin.x + size.z + size.x, origin.y - size.z, 1);
            // First row, third vertical line
            vertices[10].set(origin.x + size.z + size.x * 2, origin.y, 1);
            vertices[11].set(origin.x + size.z + size.x * 2, origin.y - size.z, 1);
            // Second row, first vertical line
            vertices[12].set(origin.x, origin.y - size.z, 1);
            vertices[13].set(origin.x, origin.y - size.z - size.y, 1);
            // Second row, fifth vertical line
            vertices[14].set(origin.x + size.x * 2 + size.z * 2, origin.y - size.z, 1);
            vertices[15].set(origin.x + size.x * 2 + size.z * 2, origin.y - size.z - size.y, 1);
            // Second row, third vertical line
            vertices[16].set(origin.x + size.x + size.z, origin.y - size.z, 1);
            vertices[17].set(origin.x + size.x + size.z, origin.y - size.z - size.y, 1);
            // Second row, fourth vertical line
            vertices[18].set(origin.x + size.x + size.z * 2, origin.y - size.z, 1);
            vertices[19].set(origin.x + size.x + size.z * 2, origin.y - size.z - size.y, 1);
            break;
    }
    line.geometry.verticesNeedUpdate = true;
}
exports.updateNode = updateNode;
function updateRemovedNode() {
    for (var nodeId in textureArea.shapeLineMeshesByNodeId) {
        if (network_1.data.cubicModelUpdater.cubicModelAsset.nodes.byId[nodeId] != null)
            continue;
        var line = textureArea.shapeLineMeshesByNodeId[nodeId];
        line.parent.remove(line);
        line.geometry.dispose();
        delete textureArea.shapeLineMeshesByNodeId[nodeId];
    }
}
exports.updateRemovedNode = updateRemovedNode;
var selectedNodeLineMeshes = [];
function setSelectedNode(nodeIds) {
    for (var _i = 0; _i < selectedNodeLineMeshes.length; _i++) {
        var selectedNodeLineMesh = selectedNodeLineMeshes[_i];
        selectedNodeLineMesh.material = lineMaterial;
    }
    selectedNodeLineMeshes.length = 0;
    for (var _a = 0; _a < nodeIds.length; _a++) {
        var nodeId = nodeIds[_a];
        var selectedNodeLineMesh = textureArea.shapeLineMeshesByNodeId[nodeId];
        selectedNodeLineMesh.material = selectedLineMaterial;
        selectedNodeLineMeshes.push(selectedNodeLineMesh);
    }
}
exports.setSelectedNode = setSelectedNode;
var mousePosition = new THREE.Vector3();
var cameraPosition = new THREE.Vector3();
var isDrawing = false;
var isDragging = false;
var isMouseDown = false;
var hasMouseMoved = false;
var previousMousePosition = new THREE.Vector3();
function handleTextureArea() {
    var inputs = textureArea.gameInstance.input;
    var keys = window.KeyEvent;
    mousePosition.set(inputs.mousePosition.x, inputs.mousePosition.y, 0);
    cameraComponent.actor.getLocalPosition(cameraPosition);
    mousePosition.x /= textureArea.gameInstance.threeRenderer.domElement.width;
    mousePosition.x = mousePosition.x * 2 - 1;
    mousePosition.x *= cameraComponent.orthographicScale / 2 * cameraComponent.cachedRatio;
    mousePosition.x += cameraPosition.x;
    mousePosition.x = Math.floor(mousePosition.x);
    mousePosition.y /= textureArea.gameInstance.threeRenderer.domElement.height;
    mousePosition.y = mousePosition.y * 2 - 1;
    mousePosition.y *= cameraComponent.orthographicScale / 2;
    mousePosition.y -= cameraPosition.y;
    mousePosition.y = Math.floor(mousePosition.y);
    if (textureArea.mode === "layout") {
        if (isMouseDown && !inputs.mouseButtons[0].isDown) {
            isDragging = false;
            isMouseDown = false;
            if (!hasMouseMoved && !isDragging) {
                var hoveredNodeIds = getHoveredNodeIds();
                var isShiftDown = inputs.keyboardButtons[keys.DOM_VK_SHIFT].isDown;
                if (!isShiftDown)
                    ui_1.default.nodesTreeView.clearSelection();
                if (hoveredNodeIds.length > 0) {
                    if (!isShiftDown) {
                        var nodeElt = ui_1.default.nodesTreeView.treeRoot.querySelector("li[data-id='" + hoveredNodeIds[0] + "']");
                        ui_1.default.nodesTreeView.addToSelection(nodeElt);
                    }
                    else {
                        for (var _i = 0; _i < hoveredNodeIds.length; _i++) {
                            var nodeId = hoveredNodeIds[_i];
                            var isAlreadyAdded = false;
                            for (var _a = 0, _b = ui_1.default.nodesTreeView.selectedNodes; _a < _b.length; _a++) {
                                var nodeElt = _b[_a];
                                if (nodeId === nodeElt.dataset.id) {
                                    isAlreadyAdded = true;
                                    break;
                                }
                            }
                            if (!isAlreadyAdded) {
                                var nodeElt = ui_1.default.nodesTreeView.treeRoot.querySelector("li[data-id='" + nodeId + "']");
                                ui_1.default.nodesTreeView.addToSelection(nodeElt);
                                break;
                            }
                        }
                    }
                }
                ui_1.setupSelectedNode();
            }
            hasMouseMoved = false;
        }
        else if (isDragging) {
            var x = mousePosition.x - previousMousePosition.x;
            var y = mousePosition.y - previousMousePosition.y;
            if (x !== 0 || y !== 0) {
                hasMouseMoved = true;
                var nodeIds = [];
                for (var _c = 0, _d = ui_1.default.nodesTreeView.selectedNodes; _c < _d.length; _c++) {
                    var selectedNode = _d[_c];
                    nodeIds.push(selectedNode.dataset.id);
                }
                network_1.editAsset("moveNodeTextureOffset", nodeIds, { x: x, y: y });
            }
        }
        else if (inputs.mouseButtons[0].wasJustPressed) {
            isMouseDown = true;
            hasMouseMoved = false;
            var hoveredNodeIds = getHoveredNodeIds();
            for (var _e = 0, _f = ui_1.default.nodesTreeView.selectedNodes; _e < _f.length; _e++) {
                var selectedNode = _f[_e];
                if (hoveredNodeIds.indexOf(selectedNode.dataset.id) !== -1) {
                    isDragging = true;
                    break;
                }
            }
        }
        previousMousePosition.set(mousePosition.x, mousePosition.y, 0);
    }
    else if (textureArea.mode === "paint") {
        if (isMouseDown && !inputs.mouseButtons[0].isDown)
            isMouseDown = false;
        // Paste element
        if (textureArea.pasteMesh != null) {
            if (isMouseDown) {
                tmpVector3.set(mousePosition.x + previousMousePosition.x, -mousePosition.y + previousMousePosition.y, 0);
                textureArea.pasteActor.setLocalPosition(tmpVector3);
                return;
            }
            if (inputs.keyboardButtons[keys.DOM_VK_RIGHT].wasJustPressed) {
                textureArea.pasteMesh.position.x += 1;
                textureArea.pasteMesh.updateMatrixWorld(false);
            }
            if (inputs.keyboardButtons[keys.DOM_VK_LEFT].wasJustPressed) {
                textureArea.pasteMesh.position.x -= 1;
                textureArea.pasteMesh.updateMatrixWorld(false);
            }
            if (inputs.keyboardButtons[keys.DOM_VK_UP].wasJustPressed) {
                textureArea.pasteMesh.position.y += 1;
                textureArea.pasteMesh.updateMatrixWorld(false);
            }
            if (inputs.keyboardButtons[keys.DOM_VK_DOWN].wasJustPressed) {
                textureArea.pasteMesh.position.y -= 1;
                textureArea.pasteMesh.updateMatrixWorld(false);
            }
            if (inputs.mouseButtons[0].wasJustPressed) {
                var position = textureArea.pasteActor.getLocalPosition(tmpVector3);
                var width = pasteCtx.canvas.width;
                var height = pasteCtx.canvas.height;
                if (mousePosition.x > position.x - width / 2 && mousePosition.x < position.x + width / 2 &&
                    -mousePosition.y > position.y - height / 2 && -mousePosition.y < position.y + height / 2) {
                    isMouseDown = true;
                    previousMousePosition.set(position.x - mousePosition.x, position.y + mousePosition.y, 0);
                    return;
                }
                var imageData = pasteCtx.getImageData(0, 0, width, height).data;
                var edits = [];
                var startX = position.x - width / 2;
                var startY = -position.y - height / 2;
                for (var i = 0; i < width; i++) {
                    for (var j = 0; j < height; j++) {
                        var index = j * width + i;
                        index *= 4;
                        var x = startX + i;
                        if (x < 0 || x >= network_1.data.cubicModelUpdater.cubicModelAsset.pub.textureWidth)
                            continue;
                        var y = startY + j;
                        if (y < 0 || y >= network_1.data.cubicModelUpdater.cubicModelAsset.pub.textureHeight)
                            continue;
                        edits.push({ x: x, y: y, value: { r: imageData[index], g: imageData[index + 1], b: imageData[index + 2], a: imageData[index + 3] } });
                    }
                }
                network_1.editAsset("editTexture", "map", edits);
                clearPasteSelection();
            }
            return;
        }
        // Edit texture
        if (!isDrawing) {
            if (inputs.mouseButtons[0].wasJustPressed)
                isDrawing = true;
            else if (inputs.mouseButtons[2].wasJustPressed) {
                if (mousePosition.x < 0 || mousePosition.x >= network_1.data.cubicModelUpdater.cubicModelAsset.pub.textureWidth)
                    return;
                if (mousePosition.y < 0 || mousePosition.y >= network_1.data.cubicModelUpdater.cubicModelAsset.pub.textureHeight)
                    return;
                var textureData = network_1.data.cubicModelUpdater.cubicModelAsset.textureDatas["map"];
                var index = mousePosition.y * network_1.data.cubicModelUpdater.cubicModelAsset.pub.textureWidth + mousePosition.x;
                index *= 4;
                var r = textureData[index + 0];
                var g = textureData[index + 1];
                var b = textureData[index + 2];
                var a = textureData[index + 3];
                if (a === 0) {
                    document.getElementById("eraser-tool").checked = true;
                    textureArea.paintTool = "eraser";
                }
                else {
                    document.getElementById("brush-tool").checked = true;
                    textureArea.paintTool = "brush";
                    var hex = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                    textureArea.colorInput.value = "#" + hex;
                }
            }
        }
        else if (!inputs.mouseButtons[0].isDown)
            isDrawing = false;
        if (isDrawing) {
            if (mousePosition.x < 0 || mousePosition.x >= network_1.data.cubicModelUpdater.cubicModelAsset.pub.textureWidth)
                return;
            if (mousePosition.y < 0 || mousePosition.y >= network_1.data.cubicModelUpdater.cubicModelAsset.pub.textureHeight)
                return;
            var hex = parseInt(textureArea.colorInput.value.slice(1), 16);
            var brush = { r: 0, g: 0, b: 0, a: 0 };
            if (textureArea.paintTool === "brush") {
                brush.r = (hex >> 16 & 255);
                brush.g = (hex >> 8 & 255);
                brush.b = (hex & 255);
                brush.a = 255;
            }
            var mapName = "map";
            var textureData = network_1.data.cubicModelUpdater.cubicModelAsset.textureDatas[mapName];
            var index = mousePosition.y * network_1.data.cubicModelUpdater.cubicModelAsset.pub.textureWidth + mousePosition.x;
            index *= 4;
            if (textureData[index + 0] !== brush.r || textureData[index + 1] !== brush.g || textureData[index + 2] !== brush.b || textureData[index + 3] !== brush.a) {
                var edits = [];
                edits.push({ x: mousePosition.x, y: mousePosition.y, value: brush });
                network_1.editAsset("editTexture", mapName, edits);
            }
        }
    }
}
exports.handleTextureArea = handleTextureArea;
function getHoveredNodeIds() {
    var hoveredNodeIds = [];
    for (var nodeId in network_1.data.cubicModelUpdater.cubicModelAsset.nodes.byId) {
        var node = network_1.data.cubicModelUpdater.cubicModelAsset.nodes.byId[nodeId];
        for (var faceName in node.shape.textureLayout) {
            var face = node.shape.textureLayout[faceName];
            var size = CubicModelNodes_1.getShapeTextureFaceSize(node.shape, faceName);
            if (mousePosition.x >= face.offset.x && mousePosition.x < face.offset.x + size.width &&
                mousePosition.y >= face.offset.y && mousePosition.y < face.offset.y + size.height) {
                hoveredNodeIds.push(nodeId);
                break;
            }
        }
    }
    return hoveredNodeIds;
}
