var fs = require("fs");
var binaryText = require("./binary_text");

var imageData;
var userList = {};
var chat = [];

function sendToAll(clients, msg) {
    clients.forEach((client) => {
        try {
            client.send(JSON.stringify(msg));
        } catch (err) {
            // ignore errors
        }
    });
}

function saveSessionWithTimestamp(callback) {
    binaryText.save("joint " + new Date().toUTCString() + ".bin", imageData, callback);
}

function saveSession(callback) {
    fs.writeFile("joint.json", JSON.stringify({"chat": chat}), () => {
        binaryText.save("joint.bin", imageData, callback);
    });
}

fs.readFile("joint.json", "utf8", (err, data) => {
    if (!err) {
        chat = JSON.parse(data).chat;
    }
    binaryText.load("joint.bin", (loadedImageData) => {
        if (loadedImageData !== undefined) {
            imageData = loadedImageData;
        } else {
            // Initialize default canvas if no file exists
            imageData = {
                "columns": 160,
                "rows": 50,
                "data": new Uint16Array(160 * 50),
                "iceColours": false,
                "letterSpacing": false
            };
            console.log("Created default canvas: 160x50");
        }
    });
});

function getStart(sessionID) {
    if (!imageData) {
        console.error("ImageData not initialized");
        return JSON.stringify(["error", "Server not ready"]);
    }
    return JSON.stringify(["start", {
        "columns": imageData.columns,
        "rows": imageData.rows,
        "letterSpacing": imageData.letterSpacing,
        "iceColours": imageData.iceColours,
        "chat": chat
    }, sessionID, userList]);
}

function getImageData() {
    if (!imageData) {
        console.error("ImageData not initialized");
        return { data: new Uint16Array(0) };
    }
    return imageData;
}

function message(msg, sessionID, clients) {
    if (!imageData) {
        console.error("ImageData not initialized, ignoring message");
        return;
    }
    
    switch(msg[0]) {
    case "join":
        console.log(msg[1] + " has joined.");
        userList[sessionID] = msg[1];
        msg.push(sessionID);
        break;
    case "nick":
        userList[sessionID] = msg[1];
        msg.push(sessionID);
        break;
    case "chat":
        msg.splice(1, 0, userList[sessionID]);
        chat.push([msg[1], msg[2]]);
        if (chat.length > 128) {
            chat.shift();
        }
        break;
    case "draw":
        msg[1].forEach((block) => {
            imageData.data[block >> 16] = block & 0xffff;
        });
        break;
    default:
        break;
    }
    sendToAll(clients, msg);
}

function closeSession(sessionID, clients) {
    if (userList[sessionID] !== undefined) {
        console.log(userList[sessionID] + " is gone.");
        delete userList[sessionID];
    }
    sendToAll(clients, ["part", sessionID]);
}

module.exports = {
    "saveSessionWithTimestamp": saveSessionWithTimestamp,
    "saveSession": saveSession,
    "getStart": getStart,
    "getImageData": getImageData,
    "message": message,
    "closeSession": closeSession
};
