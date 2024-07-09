var ansiedit = require("./src/ansiedit");
var HttpsServer = require('https').createServer;
var fs = require("fs");
server = HttpsServer({
    cert: fs.readFileSync("/etc/ssl/private/letsencrypt-domain.pem"),
    key: fs.readFileSync("/etc/ssl/private/letsencrypt-domain.key")
})
server.listen(process.argv[2] || 1337);
var express = require("express");
var app = express();
var session = require("express-session");
var express_ws = require("express-ws")(app, server);
var wss = express_ws.getWss("/");

app.use(express.static("public"));

app.use(session({"resave": false, "saveUninitialized": true, "secret": "sauce"}));

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

//app.listen(process.argv[2] || 1337);

setInterval(() => {
    ansiedit.saveSessionWithTimestamp(() => {});
    ansiedit.saveSession(() => {});
}, 14400000);

process.on("SIGINT", () => {
    console.log("\n");
    ansiedit.saveSession(process.exit);
});
