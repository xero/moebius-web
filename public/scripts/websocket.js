function createWebSocketHandler(inputHandle) {
    "use strict";
    var worker = new Worker("scripts/worker.js");
    var handle = localStorage.getItem("handle");
    if (handle === null) {
        handle = "Anonymous";
        localStorage.setItem("handle", handle);
    }
    inputHandle.value = handle;
    var connected = false;
    worker.postMessage({"cmd": "handle", "handle": handle});
    showOverlay($("websocket-overlay"));

    function onConnected() {
        var excludedElements = document.getElementsByClassName("excluded-for-websocket");
        for (var i = 0; i < excludedElements.length; i++) {
            excludedElements[i].style.display = "none";
        }
        var includedElement = document.getElementsByClassName("included-for-websocket");
        for (var i = 0; i < includedElement.length; i++) {
            includedElement[i].style.display = "block";
        }
        worker.postMessage({"cmd": "join", "handle": handle});
        connected = true;
    }

    function onDisconnected() {
        if (connected === true) {
            alert("You were disconnected from the server, try refreshing the page to try again.");
        } else {
            hideOverlay($("websocket-overlay"));
        }
        connected = false;
    }

    function onImageData(columns, rows, data, iceColours, letterSpacing) {
        textArtCanvas.setImageData(columns, rows, data, iceColours, letterSpacing);
        hideOverlay($("websocket-overlay"));
    }

    function onChat(handle, text) {
        chat.addConversation(handle, text);
    }

    function onJoin(handle, sessionID) {
        chat.join(handle, sessionID);
    }

    function onPart(sessionID) {
        chat.part(sessionID);
    }

    function onNick(handle, sessionID) {
        chat.nick(handle, sessionID);
    }

    function onDraw(blocks) {
        blocks.forEach((block) => {
            textArtCanvas.quickDraw(block[0], block[1], block[2], block[3]);
        });
    }

    function onMessage(msg) {
        var data = msg.data;
        switch(data.cmd) {
        case "connected":
            onConnected();
            break;
        case "disconnected":
            onDisconnected();
            break;
        case "imageData":
            onImageData(data.columns, data.rows, new Uint16Array(data.data), data.iceColours, data.letterSpacing);
            break;
        case "chat":
            onChat(data.handle, data.text);
            break;
        case "join":
            onJoin(data.handle, data.sessionID);
            break;
        case "part":
            onPart(data.sessionID);
            break;
        case "nick":
            onNick(data.handle, data.sessionID);
            break;
        case "draw":
            onDraw(data.blocks);
            break;
        }
    }

    function draw(blocks) {
        worker.postMessage({"cmd": "draw", "blocks": blocks});
    }

    function setHandle(newHandle) {
        handle = newHandle;
        localStorage.setItem("handle", handle);
        worker.postMessage({"cmd": "nick", "handle": handle});
    }

    function sendChat(text) {
        worker.postMessage({"cmd": "chat", "text": text});
    }

    function isConnected() {
        return connected;
    }

    worker.addEventListener("message", onMessage);
    worker.postMessage({"cmd": "connect", "url": "ws://" + window.location.hostname + ":" + window.location.port + window.location.pathname});

    return {
        "draw": draw,
        "setHandle": setHandle,
        "sendChat": sendChat,
        "isConnected": isConnected
    };
}
