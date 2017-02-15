var express = require("express");
var app = express();
var path = require("path");
var express_ws = require("express-ws")(app);
var wss = express_ws.getWss("/");
var MongoDB = require("mongodb").Db;
var Server = require("mongodb").Server;
var db = new MongoDB("ansiedit", new Server("localhost", 27017, {"auto_reconnect": true}), {"w": 1});
var ansiedit = require("./src/ansiedit")(db);
var account = require("./src/account")(db);
var session = require("./src/session")(db);
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var uuidV4 = require("uuid/v4");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({"extended": false}));
app.use(cookieParser());

db.open((err) => {
    if (err) {
        console.log(err);
    }
});

app.get("/", (req, res) => {
    if (req.cookies.user && req.cookies.uuid) {
        account.checkUserUUID(req.cookies.user, req.cookies.uuid, (trust) => {
            if (trust) {
                res.sendFile(path.join(__dirname + "/html/menu.html"));
            } else {
                res.sendFile(path.join(__dirname + "/html/failed.html"));
            }
        });
    } else {
        res.sendFile(path.join(__dirname + "/html/login.html"));
    }
});

app.post("/", (req, res) => {
    if (req.body.newUser) {
        account.getUser(req.body.newUser, (user) => {
            if (user) {
                res.sendFile(path.join(__dirname + "/html/failed.html"));
            } else {
                account.putUser(req.body.newUser, req.body.newPass1, (uuid) => {
                    if (uuid) {
                        res.cookie("user", req.body.newUser);
                        res.cookie("uuid", uuid);
                        res.sendFile(path.join(__dirname + "/html/menu.html"));
                    } else {
                        res.sendFile(path.join(__dirname + "/html/failed.html"));
                    }
                });
            }
        });
    } else {
        account.loginUser(req.body.user, req.body.pass, (uuid) => {
            if (uuid) {
                res.cookie("user", req.body.user);
                res.cookie("uuid", uuid);
                res.sendFile(path.join(__dirname + "/html/menu.html"));
            } else {
                res.sendFile(path.join(__dirname + "/html/failed.html"));
            }
        });
    }
});

app.post("/create", (req, res) => {
    var title = req.body.title;
    if (title === "") {
        title = "Untitled";
    }
    var columns = parseInt(req.body.columns, 10);
    if (isNaN(columns)) {
        columns = 80;
    }
    var rows = parseInt(req.body.rows, 10);
    if (isNaN(rows)) {
        rows = 80;
    }
    session.createSession(title, columns, rows, req.body.ice_colors === true, req.body.letter_spacing === true, (uuid) => {
        if (uuid) {
            res.redirect("/" + uuid + "/");
        } else {
            res.status(404).end();
        }
    });
});

app.get("/:id/", (req, res) => {
    if (req.cookies.user && req.cookies.uuid) {
        account.checkUserUUID(req.cookies.user, req.cookies.uuid, (trust) => {
            if (trust) {
                res.sendFile(path.join(__dirname + "/html/editor.html"));
            } else {
                res.sendFile(path.join(__dirname + "/html/failed.html"));
            }
        });
    } else {
        res.sendFile(path.join(__dirname + "/html/login.html"));
    }
});

app.post("/:id/", (req, res) => {
    if (req.body.newUser) {
        account.getUser(req.body.newUser, (user) => {
            if (user) {
                res.sendFile(path.join(__dirname + "/html/failed.html"));
            } else {
                account.putUser(req.body.newUser, req.body.newPass1, (uuid) => {
                    if (uuid) {
                        res.cookie("user", req.body.newUser);
                        res.cookie("uuid", uuid);
                        res.sendFile(path.join(__dirname + "/html/editor.html"));
                    } else {
                        res.sendFile(path.join(__dirname + "/html/failed.html"));
                    }
                });
            }
        });
    } else {
        account.loginUser(req.body.user, req.body.pass, (uuid) => {
            if (uuid) {
                res.cookie("user", req.body.user);
                res.cookie("uuid", uuid);
                res.sendFile(path.join(__dirname + "/html/editor.html"));
            } else {
                res.sendFile(path.join(__dirname + "/html/failed.html"));
            }
        });
    }
});

app.ws("/:id/", (ws, req) => {
    var uuid = uuidV4();
    ansiedit.getStart(req.params.id, req.cookies.user, uuid, ws, (joint) => {
        if (joint) {
            ws.send(joint);
            ws.send(ansiedit.getImageData(req.params.id).data, {"binary": true});
        }
    });
    ws.on("message", (msg) => {
        ansiedit.message(req.params.id, JSON.parse(msg), uuid);
    });
    ws.on("close", () => {
        ansiedit.closeSession(req.params.id, uuid);
    });
});

app.listen(process.argv[2] || 3000);

process.on("SIGINT", () => {
    console.log("\n");
    ansiedit.saveSessions(process.exit);
});
