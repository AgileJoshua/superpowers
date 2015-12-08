var fs = require("fs");
var async = require("async");
var paths = require("./paths");
var authenticate_1 = require("./authenticate");
var ProjectServer_1 = require("./ProjectServer");
var RemoteHubClient_1 = require("./RemoteHubClient");
var ProjectHub = (function () {
    function ProjectHub(globalIO, callback) {
        var _this = this;
        this.data = {
            projects: null
        };
        this.serversById = {};
        this.onAddSocket = function (socket) {
            /* tslint:disable:no-unused-variable */
            var client = new RemoteHubClient_1.default(_this, socket);
            // this.clients.push(client);
            /* tslint:enable:no-unused-variable */
        };
        this.globalIO = globalIO;
        var serveProjects = function (callback) {
            async.each(fs.readdirSync(paths.projects), function (folderName, cb) {
                if (folderName.indexOf(".") !== -1) {
                    cb(null);
                    return;
                }
                _this.loadProject(folderName, cb);
            }, callback);
        };
        var setupProjectsList = function (callback) {
            var data = [];
            for (var id in _this.serversById)
                data.push(_this.serversById[id].data.manifest.pub);
            data.sort(SupCore.Data.Projects.sort);
            _this.data.projects = new SupCore.Data.Projects(data);
            callback();
        };
        var serve = function (callback) {
            _this.io = _this.globalIO.of("/hub");
            _this.io.use(authenticate_1.default);
            _this.io.on("connection", _this.onAddSocket);
            callback();
        };
        async.waterfall([serveProjects, setupProjectsList, serve], callback);
    }
    ProjectHub.prototype.saveAll = function (callback) {
        var _this = this;
        async.each(Object.keys(this.serversById), function (id, cb) {
            _this.serversById[id].save(cb);
        }, callback);
    };
    ProjectHub.prototype.loadProject = function (folderName, callback) {
        var _this = this;
        var server = new ProjectServer_1.default(this.globalIO, folderName, function (err) {
            if (err != null) {
                callback(err);
                return;
            }
            _this.serversById[server.data.manifest.pub.id] = server;
            callback(null);
        });
    };
    ProjectHub.prototype.removeRemoteClient = function (socketId) {
        // this.clients.splice ...
    };
    return ProjectHub;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ProjectHub;
