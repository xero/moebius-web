var fs = require("fs");
var binaryText = require("./binary_text");

var imageData;
var userList = {};
var chat = [];

function sendToAll(clients, msg) {
    clients.forEach((client) => {
        client.send(JSON.stringify(msg));
    });
}

function saveSession(callback) {
    fs.writeFile("joint.json", JSON.stringify({"chat": chat}), () => {
        console.log("joint.json saved");
        binaryText.save("joint.bin", imageData, () => {
           console.log("joint.bin saved");
           callback();
       });
    });
}

fs.readFile("joint.json", "utf8", (err, data) => {
    if (!err) {
        chat = JSON.parse(data).chat;
    }
    binaryText.load("joint.bin", (loadedImageData) => {
        if (loadedImageData !== undefined) {
            imageData = loadedImageData;
        }
    });
});

function getStart(sessionID) {
    return JSON.stringify(["start", {
        "columns": imageData.columns,
        "rows": imageData.rows,
        "letterSpacing": imageData.letterSpacing,
        "iceColours": imageData.iceColours,
        "chat": chat
    }, sessionID, userList]);
}

function getImageData() {
    return imageData;
}

function message(msg, sessionID, clients) {
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
    "saveSession": saveSession,
    "getStart": getStart,
    "getImageData": getImageData,
    "message": message,
    "closeSession": closeSession
};
