var fs = require("fs");
var path = require("path");

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const config = {
        ssl: false,
        sslDir: "/etc/ssl/private",
        saveInterval: 30 * 60 * 1000, // 30 minutes in milliseconds
        sessionName: "joint",
        port: 1337
    };
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const nextArg = args[i + 1];
        
        switch (arg) {
            case "--ssl":
                config.ssl = true;
                break;
            case "--ssl-dir":
                if (nextArg && !nextArg.startsWith("--")) {
                    config.sslDir = nextArg;
                    i++; // Skip next argument as we consumed it
                }
                break;
            case "--save-interval":
                if (nextArg && !nextArg.startsWith("--")) {
                    const minutes = parseInt(nextArg);
                    if (!isNaN(minutes) && minutes > 0) {
                        config.saveInterval = minutes * 60 * 1000;
                    }
                    i++; // Skip next argument as we consumed it
                }
                break;
            case "--session-name":
                if (nextArg && !nextArg.startsWith("--")) {
                    config.sessionName = nextArg;
                    i++; // Skip next argument as we consumed it
                }
                break;
            case "--help":
                console.log("Moebius Web Server");
                console.log("Usage: node server.js [port] [options]");
                console.log("");
                console.log("Options:");
                console.log("  --ssl                 Enable SSL (requires certificates in ssl-dir)");
                console.log("  --ssl-dir <path>      SSL certificate directory (default: /etc/ssl/private)");
                console.log("  --save-interval <min> Auto-save interval in minutes (default: 30)");
                console.log("  --session-name <name> Session file prefix (default: joint)");
                console.log("  --help                Show this help message");
                console.log("");
                console.log("Examples:");
                console.log("  node server.js 8080 --ssl --session-name myart");
                console.log("  node server.js --save-interval 60 --session-name collaborative");
                process.exit(0);
                break;
            default:
                // Check if it's a port number
                const port = parseInt(arg);
                if (!isNaN(port) && port > 0 && port <= 65535) {
                    config.port = port;
                }
                break;
        }
    }
    
    return config;
}

const config = parseArgs();
console.log("Server configuration:", config);

// Initialize ansiedit with configuration
var ansiedit = require("./src/ansiedit");
ansiedit.initialize(config);

var server;

// Check if SSL certificates exist and use HTTPS, otherwise fallback to HTTP
var useSSL = false;
if (config.ssl) {
    const certPath = path.join(config.sslDir, "letsencrypt-domain.pem");
    const keyPath = path.join(config.sslDir, "letsencrypt-domain.key");
    
    try {
        if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
            var HttpsServer = require('https').createServer;
            server = HttpsServer({
                cert: fs.readFileSync(certPath),
                key: fs.readFileSync(keyPath)
            });
            useSSL = true;
            console.log("Using HTTPS server with SSL certificates from:", config.sslDir);
        } else {
            throw new Error(`SSL certificates not found in ${config.sslDir}`);
        }
    } catch (err) {
        console.error("SSL Error:", err.message);
        console.log("Falling back to HTTP server");
        var HttpServer = require('http').createServer;
        server = HttpServer();
    }
} else {
    var HttpServer = require('http').createServer;
    server = HttpServer();
    console.log("Using HTTP server (SSL disabled)");
}

server.listen(config.port);
console.log("Server listening on port:", config.port);
var express = require("express");
var app = express();
var session = require("express-session");
var express_ws = require("express-ws")(app, server);
var wss = express_ws.getWss("/");

app.use(express.static("public"));

app.use(session({"resave": false, "saveUninitialized": true, "secret": "sauce"}));

app.ws("/", (ws, req) => {
    console.log("New WebSocket connection established:");
    console.log("  - Session ID:", req.sessionID);
    console.log("  - Remote address:", req.connection.remoteAddress);
    console.log("  - Headers:", req.headers);
    console.log("  - URL:", req.url);
    
    ws.send(ansiedit.getStart(req.sessionID));
    ws.send(ansiedit.getImageData().data, {"binary": true});
    
    ws.on("message", (msg) => {
        console.log("Received WebSocket message from", req.sessionID, ":", msg.toString());
        try {
            const parsedMsg = JSON.parse(msg);
            console.log("Parsed message:", parsedMsg);
            ansiedit.message(parsedMsg, req.sessionID, wss.clients);
        } catch (err) {
            console.error("Error parsing message:", err);
        }
    });
    
    ws.on("close", () => {
        console.log("WebSocket connection closed for session:", req.sessionID);
        ansiedit.closeSession(req.sessionID, wss.clients);
    });
    
    ws.on("error", (err) => {
        console.error("WebSocket error for session", req.sessionID, ":", err);
    });
});

setInterval(() => {
    ansiedit.saveSessionWithTimestamp(() => {});
    ansiedit.saveSession(() => {});
}, config.saveInterval);

console.log("Auto-save interval set to:", config.saveInterval / 60000, "minutes");

process.on("SIGINT", () => {
    console.log("\n");
    ansiedit.saveSession(process.exit);
});
