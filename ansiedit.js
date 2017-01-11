var fs = require("fs");

var joint = {
    "columns": 80,
    "rows": 100,
    "letterSpacing": false,
    "iceColours": false,
    "chat": new Array()
};

var imageData = new Uint16Array(joint.columns * joint.rows);

var userList = {};

function sendToAll(clients, msg) {
    clients.forEach((client) => {
        client.send(JSON.stringify(msg));
    });
}

function saveJoint(callback) {
    fs.writeFile("joint.json", JSON.stringify(joint), () => {
        console.log("joint.json saved");
        if (callback !== undefined) {
            callback();
        }
    });
}

function saveImageData(callback) {
    fs.writeFile("image_data.bin", Buffer.from(imageData.buffer), () => {
        console.log("image_data.bin saved");
        if (callback !== undefined) {
            callback();
        }
    });
}

function saveSession(callback) {
    saveJoint(() => {
        saveImageData(callback);
    });
}

fs.readFile("joint.json", "utf8", (err, data) => {
    if (err) {
        saveJoint();
    } else {
        joint = JSON.parse(data);
    }
    fs.readFile("image_data.bin", (err, data) => {
        if (err) {
            saveImageData();
        } else {
            imageData = new Uint16Array(data.buffer, 0, data.length / 2);
        }
    });
});

function getJoint(sessionID) {
    return JSON.stringify(["start", joint, sessionID, userList]);
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
        joint.chat.push([msg[1], msg[2]]);
        if (joint.chat.length > 128) {
            joint.chat.shift();
        }
        break;
    case "draw":
        msg[1].forEach((block) => {
            imageData[block >> 16] = block & 0xffff;
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
    "getJoint": getJoint,
    "getImageData": getImageData,
    "message": message,
    "closeSession": closeSession
};
