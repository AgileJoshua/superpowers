(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require("./links");
var data;
var socket;
var ui = {
    chatHistoryContainer: document.querySelector(".chat"),
    chatHistory: document.querySelector(".chat ol"),
    roomUsers: document.querySelector(".members ul")
};
function start() {
    socket = SupClient.connect(SupClient.query.project);
    socket.on("connect", onConnected);
    socket.on("disconnect", SupClient.onDisconnected);
    SupClient.setupHotkeys();
    // Chat
    document.querySelector(".chat-input textarea").addEventListener("keydown", onChatInputKeyDown);
}
;
function onConnected() {
    data = {};
    // FIXME Add support in ProjectClient?
    socket.emit("sub", "rooms", "home", onRoomReceived);
    socket.on("edit:rooms", onRoomEdited);
}
;
function onRoomReceived(err, room) {
    data.room = new SupCore.Data.Room(room);
    for (var _i = 0, _a = data.room.pub.users; _i < _a.length; _i++) {
        var roomUser = _a[_i];
        appendRoomUser(roomUser);
    }
    for (var _b = 0, _c = data.room.pub.history; _b < _c.length; _b++) {
        var entry = _c[_b];
        appendHistoryEntry(entry);
    }
    scrollToBottom();
}
;
var onRoomCommands = {};
function onRoomEdited(id, command) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    Object.getPrototypeOf(data.room)[("client_" + command)].apply(data.room, args);
    if (onRoomCommands[command] != null)
        onRoomCommands[command].apply(data.room, args);
}
;
function scrollToBottom() {
    setTimeout(function () { ui.chatHistoryContainer.scrollTop = ui.chatHistoryContainer.scrollHeight; }, 0);
}
;
// Firefox 41 loses the scroll position when going back to the tab
// so we'll manually restore it when the tab is activated
var savedScrollTop = 0;
ui.chatHistoryContainer.addEventListener("scroll", function (event) {
    savedScrollTop = ui.chatHistoryContainer.scrollTop;
});
window.addEventListener("message", function (event) {
    if (event.data.type === "activate") {
        setTimeout(function () { ui.chatHistoryContainer.scrollTop = savedScrollTop; }, 0);
    }
});
var appendDaySeparator = function (date) {
    var separatorElt = document.createElement("li");
    separatorElt.className = "day-separator";
    separatorElt.appendChild(document.createElement("hr"));
    var dateDiv = document.createElement("div");
    separatorElt.appendChild(dateDiv);
    var dateInnerDiv = document.createElement("div");
    dateInnerDiv.textContent = date.toDateString();
    dateDiv.appendChild(dateInnerDiv);
    ui.chatHistory.appendChild(separatorElt);
};
var previousDay;
function appendHistoryEntry(entry) {
    var date = new Date(entry.timestamp);
    var day = date.toDateString();
    if (previousDay !== day) {
        appendDaySeparator(date);
        previousDay = day;
    }
    var entryElt = document.createElement("li");
    var timestampSpan = document.createElement("span");
    timestampSpan.className = "timestamp";
    var time = ("00" + date.getHours()).slice(-2) + ":" + ("00" + date.getMinutes()).slice(-2);
    timestampSpan.textContent = time;
    entryElt.appendChild(timestampSpan);
    var authorSpan = document.createElement("span");
    authorSpan.className = "author";
    authorSpan.textContent = entry.author;
    entryElt.appendChild(authorSpan);
    var textSpan = document.createElement("span");
    textSpan.className = "text";
    textSpan.textContent = ": " + entry.text;
    entryElt.appendChild(textSpan);
    ui.chatHistory.appendChild(entryElt);
}
;
onRoomCommands.appendMessage = function (entry) {
    if (window.parent != null)
        window.parent.postMessage({ type: "chat", content: entry.author + ": " + entry.text }, window.location.origin);
    appendHistoryEntry(entry);
    scrollToBottom();
};
function appendRoomUser(roomUser) {
    var roomUserElt = document.createElement("li");
    roomUserElt.dataset["userId"] = roomUser.id;
    roomUserElt.textContent = roomUser.id;
    ui.roomUsers.appendChild(roomUserElt);
}
;
onRoomCommands.join = function (roomUser) {
    if (roomUser.connectionCount === 1)
        appendRoomUser(roomUser);
};
onRoomCommands.leave = function (roomUserId) {
    if (data.room.users.byId[roomUserId] == null) {
        var roomUserElt = ui.roomUsers.querySelector("li[data-user-id=" + roomUserId + "]");
        roomUserElt.parentElement.removeChild(roomUserElt);
    }
};
function onChatInputKeyDown(event) {
    if (event.keyCode !== 13 || event.shiftKey)
        return;
    event.preventDefault();
    if (!socket.connected)
        return;
    socket.emit("edit:rooms", "home", "appendMessage", this.value, function (err) {
        if (err != null) {
            alert(err);
            return;
        }
    });
    this.value = "";
}
;
start();

},{"./links":2}],2:[function(require,module,exports){
if (SupClient.isApp) {
    var shell = top.global.require("remote").require("shell");
    document.querySelector(".sidebar .links").addEventListener("click", function (event) {
        if (event.target.tagName !== "A")
            return;
        event.preventDefault();
        shell.openExternal(event.target.href);
    });
}

},{}]},{},[1]);
