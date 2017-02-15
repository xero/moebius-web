module.exports = function (db) {
    var fs = require("fs");
    var binaryText = require("./binary_text");
    var session = require("./session")(db);

    var joints = {};
    var userLists = {};
    var imageDatas = {};
    var websockets = {};

    function sendToAll(sessionID, msg) {
        Object.keys(websockets[sessionID]).forEach((userSessionID) => {
            try {
                websockets[sessionID][userSessionID].send(JSON.stringify(msg));
            } catch (err) {
                // ignore errors
            }
        });
    }

    function getStart(sessionID, user, userSessionID, ws, callback) {
        if (joints[sessionID]) {
            websockets[sessionID][userSessionID] = ws;
            callback(JSON.stringify(["start", {
                "user": user,
                "columns": joints[sessionID].columns,
                "rows": joints[sessionID].rows,
                "letterSpacing": joints[sessionID].letterSpacing,
                "iceColours": joints[sessionID].iceColours,
                "chat": joints[sessionID].chat
            }, userSessionID, userLists[sessionID]]));
        } else {
            session.getSession(sessionID, (joint) => {
                if (joint) {
                    binaryText.load(sessionID + ".bin", (imageData) => {
                        joints[sessionID] = joint
                        userLists[sessionID] = {};
                        imageDatas[sessionID] = imageData;
                        websockets[sessionID] = {};
                        websockets[sessionID][userSessionID] = ws;
                        callback(JSON.stringify(["start", {
                            "user": user,
                            "columns": joint.columns,
                            "rows": joint.rows,
                            "letterSpacing": joint.letterSpacing,
                            "iceColours": joint.iceColours,
                            "chat": joint.chat
                        }, userSessionID, userLists[sessionID]]));
                    });
                } else {
                    callback(undefined);
                }
            });
        }
    }

    function getImageData(sessionID) {
        return imageDatas[sessionID];
    }

    function message(sessionID, msg, userSessionID, clients) {
        switch(msg[0]) {
        case "join":
            console.log(msg[1] + " has joined.");
            if (userLists[sessionID]) {
                userLists[sessionID][userSessionID] = msg[1];
            }
            msg.push(userSessionID);
            break;
        case "nick":
            if (userLists[sessionID]) {
                userLists[sessionID][userSessionID] = msg[1];
            }
            msg.push(userSessionID);
            break;
        case "chat":
            if (userSessionID[sessionID] && userLists[sessionID][userSessionID]) {
                msg.splice(1, 0, userLists[sessionID][userSessionID]);
            }
            if (joints[sessionID]) {
                joints[sessionID].chat.push([msg[1], msg[2]]);
                if (joints[sessionID].chat.length > 128) {
                    joints[sessionID].chat.shift();
                }
                session.updateSession(sessionID, joints[sessionID], (err) => {
                    //
                });
            }
            break;
        case "draw":
            if (imageDatas[sessionID]) {
                msg[1].forEach((block) => {
                    imageDatas[sessionID].data[block >> 16] = block & 0xffff;
                });
            }
            break;
        default:
            break;
        }
        sendToAll(sessionID, msg);
    }

    function closeSession(sessionID, userSessionID) {
        if (userLists[sessionID] && userLists[sessionID][userSessionID] !== undefined) {
            console.log(userLists[sessionID][userSessionID] + " is gone.");
            delete userLists[sessionID][userSessionID];
        }
        if (websockets[sessionID] && websockets[sessionID][userSessionID] !== undefined) {
            delete websockets[sessionID][userSessionID];
        }
        sendToAll(sessionID, ["part", userSessionID]);
    }

    function saveSessions(callback) {
        var count = Object.keys(imageDatas).length;
        if (count === 0) {
            callback();
        } else {
            var i = 0;
            Object.keys(imageDatas).forEach((uuid) => {
                binaryText.save(uuid + ".bin", imageDatas[uuid].columns, imageDatas[uuid].rows, imageDatas[uuid].iceColours, imageDatas[uuid].letterSpacing, imageDatas[uuid].data, () => {
                   console.log(uuid + ".bin saved");
                   i += 1;
                   if (i === count) {
                       callback();
                   }
               });
            });
        }
    }

    return {
        "getStart": getStart,
        "getImageData": getImageData,
        "message": message,
        "closeSession": closeSession,
        "saveSessions": saveSessions,
    };
}
