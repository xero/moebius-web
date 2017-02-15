module.exports = function (db) {
    var uuidV4 = require("uuid/v4");
    var accounts = db.collection("accounts");

    function getUser(user_name, callback) {
        accounts.findOne({"user": user_name}, (err, user) => {
            if (err) {
                callback(undefined);
            } else {
                callback(user);
            }
        });
    }

    function loginUser(user_name, pass, callback) {
        getUser(user_name, (user) => {
            if (user && (user.pass === pass)) {
                callback(user.uuid);
            } else {
                callback(undefined);
            }
        });
    }

    function putUser(user_name, pass, callback) {
        var uuid = uuidV4();
        accounts.insert({"user": user_name, "pass": pass, "uuid": uuid}, {"safe": true}, (err) => {
            if (err) {
                callback(undefined);
            } else {
                callback(uuid);
            }
        });
    }

    function checkUserUUID(user_name, uuid, callback) {
        getUser(user_name, (user) => {
            if (user) {
                callback(user.uuid === uuid);
            } else {
                callback(false);
            }
        });
    }

    return {
        "getUser": getUser,
        "loginUser": loginUser,
        "putUser": putUser,
        "checkUserUUID": checkUserUUID
    };
}
