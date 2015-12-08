var config_1 = require("./config");
var usernameRegex = /^[A-Za-z0-9_]{3,20}$/;
function default_1(socket, next) {
    var auth;
    if (socket.handshake.query != null) {
        var authJSON = socket.handshake.query.supServerAuth;
        try {
            auth = JSON.parse(authJSON);
        }
        catch (e) { }
    }
    if (auth != null && auth.serverPassword === config_1.default.password && typeof auth.username === "string" && usernameRegex.test(auth.username)) {
        socket.username = auth.username;
    }
    if (socket.username == null) {
        if (config_1.default.password.length > 0) {
            next(new Error("invalidCredentials"));
            return;
        }
        else {
            next(new Error("invalidUsername"));
            return;
        }
    }
    next();
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
