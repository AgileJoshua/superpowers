var fs = require("fs");
SupCore.system.api.registerPlugin("typescript", "Sup.Shader", {
    code: fs.readFileSync(__dirname + "/Sup.Shader.ts.txt", { encoding: "utf8" }),
    defs: fs.readFileSync(__dirname + "/Sup.Shader.d.ts.txt", { encoding: "utf8" }),
});
