function default_1() {
    var isBackspaceDown = false;
    document.addEventListener("keydown", function (event) {
        if (document.querySelector(".dialog") != null)
            return;
        // window.location.origin isn't listed in lib.d.ts as of TypeScript 1.5
        var origin = window.location.origin;
        function sendMessage(action) {
            if (window.parent != null)
                window.parent.postMessage({ type: "hotkey", content: action }, origin);
            else
                window.postMessage({ type: "hotkey", content: action }, origin);
        }
        if (localStorage.getItem("superpowers-dev-mode") != null && window.parent != null) {
            window.onerror = function () { window.parent.postMessage({ type: "error" }, origin); };
        }
        if (event.keyCode === 8 /* Backspace */)
            isBackspaceDown = true;
        if (event.keyCode === 78 && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            if (event.shiftKey)
                sendMessage("newFolder");
            else
                sendMessage("newAsset");
        }
        if ((event.keyCode === 79 || event.keyCode === 80) && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            sendMessage("searchEntry");
        }
        if (event.keyCode === 87 && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            sendMessage("closeTab");
        }
        if (event.keyCode === 9 && event.ctrlKey) {
            event.preventDefault();
            if (event.shiftKey)
                sendMessage("previousTab");
            else
                sendMessage("nextTab");
        }
        if (event.keyCode === 116 || (event.keyCode === 80 && event.metaKey)) {
            event.preventDefault();
            sendMessage("run");
        }
        if (event.keyCode === 117 || (event.keyCode === 80 && event.metaKey && event.shiftKey)) {
            event.preventDefault();
            sendMessage("debug");
        }
        if (event.keyCode === 123) {
            sendMessage("devtools");
        }
    });
    document.addEventListener("keyup", function (event) {
        if (event.keyCode === 8 /* Backspace */)
            isBackspaceDown = false;
    });
    window.addEventListener("beforeunload", function (event) {
        if (isBackspaceDown) {
            isBackspaceDown = false;
            event.returnValue = "You pressed backspace.";
            return "You pressed backspace.";
        }
        return null;
    });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
