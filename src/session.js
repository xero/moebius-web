module.exports = function (db) {
    var uuidV4 = require("uuid/v4");
    var sessions = db.collection("sessions");
    var binaryText = require("./binary_text");

    function createSession(title, columns, rows, iceColours, letterSpacing, callback) {
        var uuid = uuidV4();
        sessions.insert({"title": title, "columns": columns, "rows": rows, "iceColours": iceColours, "letterSpacing": letterSpacing, "chat": [], "_id": uuid}, {"safe": true}, (err) => {
            if (err) {
                callback(undefined);
            } else {
                binaryText.save(uuid + ".bin", columns, rows, iceColours, letterSpacing, new Uint16Array(columns * rows), (success) => {
                    if (success) {
                        callback(uuid);
                    } else {
                        callback(undefined);
                    }
                });
            }
        });
    }

    function getSession(uuid, callback) {
        sessions.findOne({"_id": uuid}, (err, session) => {
            if (err) {
                callback(undefined);
            } else {
                callback(session);
            }
        });
    }

    function updateSession(uuid, joint, callback) {
        sessions.update({"_id": uuid}, joint, callback);
    }

    return {
        "createSession": createSession,
        "getSession": getSession,
        "updateSession": updateSession
    };
}
