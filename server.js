var ansiedit = require("./src/ansiedit");
var express = require("express");
var app = express();
var session = require("express-session");
var express_ws = require("express-ws")(app);
var wss = express_ws.getWss("/");

app.use(express.static("public"));

app.use(session({"resave": false, "saveUninitialized": true, "secret": "shh"}));

app.ws("/", (ws, req) => {
    ws.send(ansiedit.getStart(req.sessionID));
    ws.send(ansiedit.getImageData().data, {"binary": true});
    ws.on("message", (msg) => {
        ansiedit.message(JSON.parse(msg), req.sessionID, wss.clients);
    });
    ws.on("close", () => {
        ansiedit.closeSession(req.sessionID, wss.clients);
    });
});

app.listen(process.argv[2] || 3001);

setInterval(() => {
    ansiedit.saveSession(() => {});
}, 1800000);

process.on("SIGINT", () => {
    console.log("\n");
    ansiedit.saveSession(process.exit);
});
