function createWebSocketHandler(inputHandle) {
    "use strict";
    showOverlay($("websocket-overlay"));
    var socket = new WebSocket("ws://" + window.location.hostname + ":" + window.location.port + window.location.pathname);
    var sessionID;
    var userList = {};
    var connected = false;
    var handle = localStorage.getItem("handle");
    if (handle === null) {
        handle = "Anonymous";
        localStorage.setItem("handle", handle);
    }
    inputHandle.value = handle;

    function onOpen(evt) {
        var excludedElements = document.getElementsByClassName("excluded-for-websocket");
        for (var i = 0; i < excludedElements.length; i++) {
            excludedElements[i].style.display = "none";
        }
        var includedElement = document.getElementsByClassName("included-for-websocket");
        for (var i = 0; i < includedElement.length; i++) {
            includedElement[i].style.display = "block";
        }
        connected = true;
    }

    function send(cmd, msg) {
        socket.send(JSON.stringify([cmd, msg]));
    }

    function onStart(msg, newSessionID) {
        textArtCanvas.setCanvas(msg.columns, msg.rows, new Uint16Array(msg.data), msg.iceColours);
        hideOverlay($("websocket-overlay"));
        send("join", handle);
        msg.chat.forEach((msg) => {
            chat.addConversation(msg[0], msg[1]);
        });
    }

    function onJoin(handle, sessionID) {
        userList[sessionID] = handle;
        chat.join(sessionID, handle);
    }

    function onNick(handle, sessionID) {
        userList[sessionID] = handle;
        chat.nick(sessionID, handle);
    }

    function onPart(sessionID) {
        if (userList[sessionID] !== undefined) {
            delete userList[sessionID];
            chat.part(sessionID);
        }
    }

    function onDraw(blocks) {
        blocks.forEach((block) => {
            textArtCanvas.networkDraw(block >> 16, block & 0xffff);
        });
    }

    function onMessage(evt) {
        var data = JSON.parse(evt.data);
        switch(data[0]) {
        case "start":
            sessionID = data[2];
            userList = data[3];
            for (var sessionID in userList) {
                chat.join(sessionID, userList[sessionID]);
            }
            onStart(data[1]);
            break;
        case "join":
            onJoin(data[1], data[2]);
            break;
        case "nick":
            onNick(data[1], data[2]);
            break;
        case "draw":
            onDraw(data[1]);
            break;
        case "part":
            onPart(data[1]);
            break;
        case "chat":
            chat.addConversation(data[2], data[1]);
            break;
        default:
            break;
        }
    }

    function onClose(evt) {
        if (connected === true) {
            alert("You were disconnected from the server, try refreshing the page to try again.");
        } else {
            hideOverlay($("websocket-overlay"));
        }
    }

    function draw(blocks) {
        if (connected === true) {
            send("draw", blocks);
        }
    }

    socket.addEventListener("open", onOpen);
    socket.addEventListener("message", onMessage);
    socket.addEventListener("close", onClose);

    function getHandle() {
        return handle;
    }

    function setHandle(newHandle) {
        handle = newHandle;
        localStorage.setItem("handle", handle);
        send("nick", handle);
    }

    function sendChat(text) {
        send("chat", text);
    }

    function isConnected() {
        return connected;
    }

    return {
        "draw": draw,
        "getHandle": getHandle,
        "setHandle": setHandle,
        "sendChat": sendChat,
        "isConnected": isConnected
    };
}
