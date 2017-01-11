var fs = require("fs");

var joint = {
    "columns": 80,
    "rows": 100,
    "data": new Array(80 * 100),
    "letterSpacing": false,
    "iceColours": false,
    "chat": new Array()
};

var userList = {};

for (var i = 0; i < joint.data.length; i++) {
    joint.data[i] = 0;
}

function toJson(obj) {
    return JSON.stringify(obj);
}

function sendToAll(clients, msg) {
    clients.forEach((client) => {
        client.send(toJson(msg));
    });
}

function saveSession(callback) {
    fs.writeFile("joint.json", toJson(joint), callback);
}

fs.readFile("joint.json", "utf8", (err, data) => {
    if (err) {
        saveSession(() => {
            console.log("joint.json created");
        });
    } else {
        joint = JSON.parse(data);
    }
});

function getCanvas(sessionID) {
    return toJson(["start", joint, sessionID, userList]);
}

function message(msg, sessionID, clients) {
    switch(msg[0]) {
    case "join":
        userList[sessionID] = msg[1];
        msg.push(sessionID);
        break;
    case "nick":
        userList[sessionID] = msg[1];
        msg.push(sessionID);
        break;
    case "chat":
        msg.push(userList[sessionID]);
        joint.chat.push([msg[2], msg[1]]);
        if (joint.chat.length > 128) {
            joint.chat.shift();
        }
        break;
    case "draw":
        msg[1].forEach((block) => {
            joint.data[block >> 16] = block & 0xffff;
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
    "getCanvas": getCanvas, 
    "message": message,
    "closeSession": closeSession
};
