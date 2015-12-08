var readFile_1 = require("./readFile");
var async = require("async");
var index_1 = require("./index");
var THREE = SupEngine.THREE;
var GLTFConst;
(function (GLTFConst) {
    GLTFConst[GLTFConst["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
    GLTFConst[GLTFConst["FLOAT"] = 5126] = "FLOAT";
})(GLTFConst || (GLTFConst = {}));
;
var GLTFPrimitiveMode;
(function (GLTFPrimitiveMode) {
    GLTFPrimitiveMode[GLTFPrimitiveMode["POINTS"] = 0] = "POINTS";
    GLTFPrimitiveMode[GLTFPrimitiveMode["LINES"] = 1] = "LINES";
    GLTFPrimitiveMode[GLTFPrimitiveMode["LINE_LOOP"] = 2] = "LINE_LOOP";
    GLTFPrimitiveMode[GLTFPrimitiveMode["LINE_STRIP"] = 3] = "LINE_STRIP";
    GLTFPrimitiveMode[GLTFPrimitiveMode["TRIANGLES"] = 4] = "TRIANGLES";
    GLTFPrimitiveMode[GLTFPrimitiveMode["TRIANGLE_STRIP"] = 5] = "TRIANGLE_STRIP";
    GLTFPrimitiveMode[GLTFPrimitiveMode["TRIANGLE_FAN"] = 6] = "TRIANGLE_FAN";
})(GLTFPrimitiveMode || (GLTFPrimitiveMode = {}));
function convertAxisAngleToQuaternionArray(rotations, count) {
    var q = new THREE.Quaternion;
    var axis = new THREE.Vector3;
    for (var i = 0; i < count; i++) {
        axis.set(rotations[i * 4], rotations[i * 4 + 1], rotations[i * 4 + 2]).normalize();
        var angle = rotations[i * 4 + 3];
        q.setFromAxisAngle(axis, angle);
        rotations[i * 4] = q.x;
        rotations[i * 4 + 1] = q.y;
        rotations[i * 4 + 2] = q.z;
        rotations[i * 4 + 3] = q.w;
    }
}
function convertAxisAngleToQuaternion(rotation) {
    var q = new THREE.Quaternion;
    var axis = new THREE.Vector3;
    axis.set(rotation[0], rotation[1], rotation[2]).normalize();
    q.setFromAxisAngle(axis, rotation[3]);
    return q;
}
function getNodeMatrix(node, version) {
    var matrix = new THREE.Matrix4;
    if (node.matrix != null)
        return matrix.fromArray(node.matrix);
    return matrix.compose(new THREE.Vector3(node.translation[0], node.translation[1], node.translation[2]), (version !== "0.8") ? new THREE.Quaternion().fromArray(node.rotation) : convertAxisAngleToQuaternion(node.rotation), new THREE.Vector3(node.scale[0], node.scale[1], node.scale[2]));
}
function importModel(files, callback) {
    var gltfFile = null;
    var bufferFiles = {};
    var imageFiles = {};
    var buffers = {};
    for (var _i = 0; _i < files.length; _i++) {
        var file = files[_i];
        var filename = file.name;
        var extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        switch (extension) {
            case "gltf":
                if (gltfFile != null) {
                    callback([index_1.createLogError("Cannot import multiple GLTF files at once, already found " + gltfFile.name, filename)]);
                    return;
                }
                gltfFile = file;
                break;
            case "bin":
                bufferFiles[filename] = file;
                break;
            case "png":
            case "jpg":
                imageFiles[filename] = file;
                break;
            default:
                callback([index_1.createLogError("Unsupported file type", filename)]);
                return;
        }
    }
    var onGLTFRead = function (err, gltf) {
        if (err != null) {
            callback([index_1.createLogError("Could not parse as JSON", gltfFile.name)]);
            return;
        }
        if (Object.keys(gltf.meshes).length > 1) {
            callback([index_1.createLogError("Only a single mesh is supported")], gltfFile.name);
            return;
        }
        // Used to be a number before 1.0, now it's a string, so let's normalize it
        gltf.asset.version = gltf.asset.version.toString();
        if (gltf.asset.version === "1")
            gltf.asset.version = "1.0";
        var supportedVersions = ["0.8", "1.0"];
        if (supportedVersions.indexOf(gltf.asset.version) === -1) {
            callback([index_1.createLogError("Unsupported glTF format version: " + gltf.asset.version + ". Supported versions are: " + supportedVersions.join(", ") + ".")], gltfFile.name);
            return;
        }
        var rootNode = gltf.nodes[gltf.scenes[gltf.scene].nodes[0]];
        // Check if the model has its up-axis pointing in the wrong direction
        var upAxisMatrix = null;
        if (rootNode.name === "Y_UP_Transform") {
            upAxisMatrix = new THREE.Matrix4().fromArray(rootNode.matrix);
            if (gltf.asset.generator === "collada2gltf@abb81d52ce290268fdb67b96f5bc5c620dee5bb5") {
                // The Y_UP_Transform matrix needed to be reversed
                // prior to this pull request: https://github.com/KhronosGroup/glTF/pull/332
                upAxisMatrix.getInverse(upAxisMatrix);
            }
        }
        var meshName = null;
        // let rootBoneNames: string[] = null;
        var skin = null;
        var nodesByJointName = {};
        var walkNode = function (rootNode) {
            if (rootNode.jointName != null)
                nodesByJointName[rootNode.jointName] = rootNode;
            if (meshName == null) {
                // glTF < 1.0 used to have an instanceSkin property on nodes
                var instanceSkin = (gltf.asset.version !== "0.8") ? rootNode : rootNode.instanceSkin;
                if (instanceSkin != null && instanceSkin.meshes != null && instanceSkin.meshes.length > 0) {
                    meshName = instanceSkin.meshes[0];
                    // rootBoneNames = instanceSkin.skeletons;
                    skin = gltf.skins[instanceSkin.skin];
                }
                else if (rootNode.meshes != null && rootNode.meshes.length > 0) {
                    meshName = rootNode.meshes[0];
                }
            }
            for (var _i = 0, _a = rootNode.children; _i < _a.length; _i++) {
                var childName = _a[_i];
                walkNode(gltf.nodes[childName]);
            }
        };
        for (var _i = 0, _a = gltf.scenes[gltf.scene].nodes; _i < _a.length; _i++) {
            var rootNodeName = _a[_i];
            walkNode(gltf.nodes[rootNodeName]);
        }
        if (meshName == null) {
            callback([index_1.createLogError("No mesh found", gltfFile.name)]);
            return;
        }
        var meshInfo = gltf.meshes[meshName];
        if (meshInfo.primitives.length !== 1) {
            callback([index_1.createLogError("Only a single primitive is supported", gltfFile.name)]);
            return;
        }
        var mode = (gltf.asset.version !== "0.8") ? meshInfo.primitives[0].mode : meshInfo.primitives[0].primitive;
        if (mode !== GLTFPrimitiveMode.TRIANGLES) {
            callback([index_1.createLogError("Only triangles are supported", gltfFile.name)]);
            return;
        }
        async.each(Object.keys(gltf.buffers), function (name, cb) {
            var bufferInfo = gltf.buffers[name];
            // Remove path info from the URI
            var filename = decodeURI(bufferInfo.uri);
            if (filename.indexOf("/") !== -1)
                filename = filename.substring(filename.lastIndexOf("/") + 1);
            else if (filename.indexOf("\\") !== -1)
                filename = filename.substring(filename.lastIndexOf("\\") + 1);
            var bufferFile = bufferFiles[filename];
            if (bufferFile == null) {
                cb(new Error("Missing buffer file: " + filename + " (" + bufferInfo.uri + ")"));
                return;
            }
            readFile_1.default(bufferFile, "arraybuffer", function (err, buffer) {
                if (err != null) {
                    cb(new Error("Could not read buffer file: " + filename + " (" + bufferInfo.uri + ")"));
                    return;
                }
                buffers[name] = buffer;
                cb(null);
            });
        }, function (err) {
            if (err != null) {
                callback([index_1.createLogError(err.message)]);
                return;
            }
            var primitive = meshInfo.primitives[0];
            var attributes = {};
            // Indices
            var indexAccessor = gltf.accessors[primitive.indices];
            if (indexAccessor != null) {
                if (indexAccessor.componentType !== GLTFConst.UNSIGNED_SHORT) {
                    callback([index_1.createLogError("Unsupported component type for index accessor: " + indexAccessor.componentType)]);
                    return;
                }
                var indexBufferView = gltf.bufferViews[indexAccessor.bufferView];
                var start = indexBufferView.byteOffset + indexAccessor.byteOffset;
                attributes["index"] = buffers[indexBufferView.buffer].slice(start, start + indexAccessor.count * 2);
            }
            // Position
            var positionAccessor = gltf.accessors[primitive.attributes["POSITION"]];
            if (positionAccessor.componentType !== GLTFConst.FLOAT) {
                callback([index_1.createLogError("Unsupported component type for position accessor: " + positionAccessor.componentType)]);
                return;
            }
            {
                var positionBufferView = gltf.bufferViews[positionAccessor.bufferView];
                var start = positionBufferView.byteOffset + positionAccessor.byteOffset;
                if (skin != null) {
                    var bindShapeMatrix = new THREE.Matrix4().fromArray(skin.bindShapeMatrix);
                    var positionArray = new Float32Array(buffers[positionBufferView.buffer], start, positionAccessor.count * 3);
                    for (var i = 0; i < positionAccessor.count; i++) {
                        var pos = new THREE.Vector3(positionArray[i * 3 + 0], positionArray[i * 3 + 1], positionArray[i * 3 + 2]);
                        pos.applyMatrix4(bindShapeMatrix);
                        positionArray[i * 3 + 0] = pos.x;
                        positionArray[i * 3 + 1] = pos.y;
                        positionArray[i * 3 + 2] = pos.z;
                    }
                }
                attributes["position"] = buffers[positionBufferView.buffer].slice(start, start + positionAccessor.count * positionAccessor.byteStride);
            }
            // Normal
            var normalAccessor = gltf.accessors[primitive.attributes["NORMAL"]];
            if (normalAccessor != null) {
                if (normalAccessor.componentType !== GLTFConst.FLOAT) {
                    callback([index_1.createLogError("Unsupported component type for normal accessor: " + normalAccessor.componentType)]);
                    return;
                }
                var normalBufferView = gltf.bufferViews[normalAccessor.bufferView];
                var start = normalBufferView.byteOffset + normalAccessor.byteOffset;
                attributes["normal"] = buffers[normalBufferView.buffer].slice(start, start + normalAccessor.count * normalAccessor.byteStride);
            }
            // UV
            var uvAccessor = gltf.accessors[primitive.attributes["TEXCOORD_0"]];
            if (uvAccessor != null) {
                if (uvAccessor.componentType !== GLTFConst.FLOAT) {
                    callback([index_1.createLogError("Unsupported component type for UV accessor: " + uvAccessor.componentType)]);
                    return;
                }
                var uvBufferView = gltf.bufferViews[uvAccessor.bufferView];
                var start = uvBufferView.byteOffset + uvAccessor.byteOffset;
                var uvArray = new Float32Array(buffers[uvBufferView.buffer], start, uvAccessor.count * 2);
                for (var i = 0; i < uvAccessor.count; i++) {
                    uvArray[i * 2 + 1] = 1 - uvArray[i * 2 + 1];
                }
                attributes["uv"] = buffers[uvBufferView.buffer].slice(start, start + uvAccessor.count * uvAccessor.byteStride);
            }
            // TODO: support more attributes
            // Skin indices
            var skinIndexAccessor = gltf.accessors[primitive.attributes["JOINT"]];
            if (skinIndexAccessor != null) {
                if (skinIndexAccessor.componentType !== GLTFConst.FLOAT) {
                    callback([index_1.createLogError("Unsupported component type for skin index accessor: " + skinIndexAccessor.componentType)]);
                    return;
                }
                var skinIndexBufferView = gltf.bufferViews[skinIndexAccessor.bufferView];
                var start = skinIndexBufferView.byteOffset + skinIndexAccessor.byteOffset;
                attributes["skinIndex"] = buffers[skinIndexBufferView.buffer].slice(start, start + skinIndexAccessor.count * skinIndexAccessor.byteStride);
            }
            // Skin weights
            var skinWeightAccessor = gltf.accessors[primitive.attributes["WEIGHT"]];
            if (skinWeightAccessor != null) {
                if (skinWeightAccessor.componentType !== GLTFConst.FLOAT) {
                    callback([index_1.createLogError("Unsupported component type for skin weight accessor: " + skinWeightAccessor.componentType)]);
                    return;
                }
                var skinWeightBufferView = gltf.bufferViews[skinWeightAccessor.bufferView];
                var start = skinWeightBufferView.byteOffset + skinWeightAccessor.byteOffset;
                attributes["skinWeight"] = buffers[skinWeightBufferView.buffer].slice(start, start + skinWeightAccessor.count * skinWeightAccessor.byteStride);
            }
            // Bones
            var bones = null;
            if (skin != null) {
                bones = [];
                for (var i = 0; i < skin.jointNames.length; i++) {
                    var jointName = skin.jointNames[i];
                    var boneNode = nodesByJointName[jointName];
                    var bone = { name: boneNode.jointName, matrix: getNodeMatrix(boneNode, gltf.asset.version).toArray(), parentIndex: null };
                    bones.push(bone);
                }
                for (var i = 0; i < skin.jointNames.length; i++) {
                    var jointName = skin.jointNames[i];
                    for (var _i = 0, _a = nodesByJointName[jointName].children; _i < _a.length; _i++) {
                        var childJointName = _a[_i];
                        var boneIndex = skin.jointNames.indexOf(childJointName);
                        if (boneIndex !== -1)
                            bones[boneIndex].parentIndex = i;
                    }
                }
            }
            // Animation
            var animation = null;
            if (Object.keys(gltf.animations).length > 0) {
                animation = { duration: 0, keyFrames: {} };
                for (var gltfAnimName in gltf.animations) {
                    var gltfAnim = gltf.animations[gltfAnimName];
                    // gltfAnim.count = keyframe count
                    // gltfAnim.channels gives bone name + path (scale, rotation, position)
                    for (var gltfChannelName in gltfAnim.channels) {
                        var gltfChannel = gltfAnim.channels[gltfChannelName];
                        var jointName = gltfChannel.target.id;
                        // TODO: get skin.jointNames.indexOf(jointName) and work with IDs instead of jointName?
                        var boneAnim = animation.keyFrames[jointName];
                        if (boneAnim == null)
                            boneAnim = animation.keyFrames[jointName] = {};
                        if (boneAnim[gltfChannel.target.path] != null) {
                            callback([index_1.createLogError("Found multiple animations for " + gltfChannel.target.path + " of " + jointName + " bone")]);
                            return;
                        }
                        var boneTransformAnim = boneAnim[gltfChannel.target.path];
                        if (boneTransformAnim == null)
                            boneTransformAnim = boneAnim[gltfChannel.target.path] = [];
                        var inputParameterName = gltfAnim.samplers[gltfChannel.sampler].input;
                        var timeAccessor = gltf.accessors[gltfAnim.parameters[inputParameterName]];
                        if (timeAccessor.componentType !== GLTFConst.FLOAT) {
                            callback([index_1.createLogError("Unsupported component type for animation time accessor: " + timeAccessor.componentType)]);
                            return;
                        }
                        var timeBufferView = gltf.bufferViews[timeAccessor.bufferView];
                        var timeArray = new Float32Array(buffers[timeBufferView.buffer], timeBufferView.byteOffset + timeAccessor.byteOffset, timeAccessor.count);
                        var outputParameterName = gltfAnim.samplers[gltfChannel.sampler].output;
                        var outputAccessor = gltf.accessors[gltfAnim.parameters[outputParameterName]];
                        if (outputAccessor.componentType !== GLTFConst.FLOAT) {
                            callback([index_1.createLogError("Unsupported component type for animation output accessor: " + outputAccessor.componentType)]);
                            return;
                        }
                        var componentsCount = (outputAccessor.type === "VEC3") ? 3 : 4;
                        var outputBufferView = gltf.bufferViews[outputAccessor.bufferView];
                        var outputArray = new Float32Array(buffers[outputBufferView.buffer], outputBufferView.byteOffset + outputAccessor.byteOffset, outputAccessor.count * componentsCount);
                        if (outputParameterName == "rotation" && gltf.asset.version === "0.8")
                            convertAxisAngleToQuaternionArray(outputArray, outputAccessor.count);
                        for (var i = 0; i < timeArray.length; i++) {
                            var time = timeArray[i];
                            var value = [];
                            for (var j = 0; j < componentsCount; j++)
                                value.push(outputArray[i * componentsCount + j]);
                            boneTransformAnim.push({ time: time, value: value });
                            animation.duration = Math.max(animation.duration, time);
                        }
                    }
                }
            }
            var log = [index_1.createLogInfo("Imported glTF model v" + gltf.asset.version + ", " + attributes["position"].byteLength / 4 / 3 + " vertices.", gltfFile.name)];
            // Maps
            var maps = {};
            if (Object.keys(imageFiles).length === 0) {
                callback(log, { attributes: attributes, bones: bones, maps: maps, animation: animation, upAxisMatrix: (upAxisMatrix != null) ? upAxisMatrix.toArray() : null });
                return;
            }
            readFile_1.default(imageFiles[Object.keys(imageFiles)[0]], "arraybuffer", function (err, data) {
                maps["map"] = data;
                callback(log, { attributes: attributes, bones: bones, maps: maps, animation: animation, upAxisMatrix: (upAxisMatrix != null) ? upAxisMatrix.toArray() : null });
            });
        });
    };
    readFile_1.default(gltfFile, "json", onGLTFRead);
}
exports.importModel = importModel;
