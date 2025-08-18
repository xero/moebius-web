var ansiedit = require("./src/ansiedit");
var fs = require("fs");
var server;

// Check if SSL certificates exist and use HTTPS, otherwise fallback to HTTP
var useSSL = false;
try {
    if (fs.existsSync("/etc/ssl/private/letsencrypt-domain.pem") && 
        fs.existsSync("/etc/ssl/private/letsencrypt-domain.key")) {
        var HttpsServer = require('https').createServer;
        server = HttpsServer({
            cert: fs.readFileSync("/etc/ssl/private/letsencrypt-domain.pem"),
            key: fs.readFileSync("/etc/ssl/private/letsencrypt-domain.key")
        });
        useSSL = true;
        console.log("Using HTTPS server with SSL certificates");
    } else {
        throw new Error("SSL certificates not found, using HTTP");
    }
} catch (err) {
    var HttpServer = require('http').createServer;
    server = HttpServer();
    console.log("Using HTTP server (development mode)");
}

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

setInterval(() => {
    ansiedit.saveSessionWithTimestamp(() => {});
    ansiedit.saveSession(() => {});
}, 14400000);

process.on("SIGINT", () => {
    console.log("\n");
    ansiedit.saveSession(process.exit);
});
