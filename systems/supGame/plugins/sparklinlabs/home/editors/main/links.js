if (SupClient.isApp) {
    var shell = top.global.require("remote").require("shell");
    document.querySelector(".sidebar .links").addEventListener("click", function (event) {
        if (event.target.tagName !== "A")
            return;
        event.preventDefault();
        shell.openExternal(event.target.href);
    });
}
