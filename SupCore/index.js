/// <reference path="../typings/tsd.d.ts" />
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
/* tslint:disable:no-unused-variable */
var Data = require("./Data");
exports.Data = Data;
/* tslint:enable:no-unused-variable */
__export(require("./systems"));
function log(message) {
    var date = new Date();
    var text = date.toLocaleDateString() + " " + date.toLocaleTimeString() + " - " + message;
    console.log(text);
    if (process != null && process.send != null)
        process.send(text);
    return;
}
exports.log = log;
