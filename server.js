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
    port: 1337,
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
        console.log(
          "  --ssl                 Enable SSL (requires certificates in ssl-dir)",
        );
        console.log(
          "  --ssl-dir <path>      SSL certificate directory (default: /etc/ssl/private)",
        );
        console.log(
          "  --save-interval <min> Auto-save interval in minutes (default: 30)",
        );
        console.log(
          "  --session-name <name> Session file prefix (default: joint)",
        );
        console.log("  --help                Show this help message");
        console.log("");
        console.log("Examples:");
        console.log("  node server.js 8080 --ssl --session-name myart");
        console.log(
          "  node server.js --save-interval 60 --session-name collaborative",
        );
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
      var HttpsServer = require("https").createServer;
      server = HttpsServer({
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath),
      });
      useSSL = true;
      console.log(
        "Using HTTPS server with SSL certificates from:",
        config.sslDir,
      );
    } else {
      throw new Error(`SSL certificates not found in ${config.sslDir}`);
    }
  } catch (err) {
    console.error("SSL Error:", err.message);
    console.log("Falling back to HTTP server");
    var HttpServer = require("http").createServer;
    server = HttpServer();
  }
} else {
  var HttpServer = require("http").createServer;
  server = HttpServer();
  console.log("Using HTTP server (SSL disabled)");
}

var express = require("express");
var app = express();
var session = require("express-session");

// Important: Set up session middleware before WebSocket handling
app.use(session({ resave: false, saveUninitialized: true, secret: "sauce" }));
app.use(express.static("public"));

// Initialize express-ws with the server AFTER session middleware
var express_ws = require("express-ws")(app, server);

// Track all WebSocket clients across all endpoints
var allClients = new Set();

// Add debugging middleware for WebSocket upgrade requests
app.use("/server", (req, res, next) => {
  console.log("Request to /server endpoint:");
  console.log("  - Method:", req.method);
  console.log("  - Headers:", req.headers);
  console.log("  - Connection header:", req.headers.connection);
  console.log("  - Upgrade header:", req.headers.upgrade);
  next();
});

// WebSocket handler function
function handleWebSocketConnection(ws, req) {
  console.log("=== NEW WEBSOCKET CONNECTION ===");
  console.log("  - Timestamp:", new Date().toISOString());
  console.log("  - Session ID:", req.sessionID);
  console.log("  - Remote address:", req.connection.remoteAddress || req.ip);
  console.log("  - User Agent:", req.headers["user-agent"]);
  console.log("  - URL:", req.url);
  console.log("  - Origin:", req.headers.origin);
  console.log("  - Host:", req.headers.host);
  console.log("  - X-Forwarded-For:", req.headers["x-forwarded-for"]);
  console.log("  - X-Real-IP:", req.headers["x-real-ip"]);
  console.log("  - Connection state:", ws.readyState);
  console.log("=====================================");

  // Add client to our tracking set
  allClients.add(ws);
  console.log("Total connected clients:", allClients.size);

  // Ensure WebSocket is in the correct state before sending data
  if (ws.readyState !== 1) {
    // Not OPEN
    console.error("WebSocket not in OPEN state:", ws.readyState);
    return;
  }

  // Send initial data with error handling
  try {
    const startData = ansiedit.getStart(req.sessionID);
    console.log("Sending start data to client (length:", startData.length, ")");
    ws.send(startData);

    const imageData = ansiedit.getImageData();
    if (imageData && imageData.data) {
      console.log("Sending image data to client, size:", imageData.data.length);
      ws.send(imageData.data, { binary: true });
    } else {
      console.error("No image data available to send");
    }
  } catch (err) {
    console.error("Error sending initial data:", err);
    try {
      ws.close(1011, "Server error during initialization");
    } catch (closeErr) {
      console.error("Error closing WebSocket:", closeErr);
    }
    return;
  }

  ws.on("message", (msg) => {
    console.log(
      "Received WebSocket message from",
      req.sessionID,
      "length:",
      msg.length,
    );
    try {
      const parsedMsg = JSON.parse(msg);
      console.log("Parsed message type:", parsedMsg[0], "from:", req.sessionID);
      ansiedit.message(parsedMsg, req.sessionID, allClients);
    } catch (err) {
      console.error(
        "Error parsing message:",
        err,
        "Raw message:",
        msg.toString(),
      );
    }
  });

  ws.on("close", (code, reason) => {
    console.log("=== WEBSOCKET CONNECTION CLOSED ===");
    console.log("  - Session:", req.sessionID);
    console.log("  - Code:", code);
    console.log("  - Reason:", reason);
    console.log("  - Timestamp:", new Date().toISOString());
    console.log("===================================");
    allClients.delete(ws);
    console.log("Remaining connected clients:", allClients.size);
    ansiedit.closeSession(req.sessionID, allClients);
  });

  ws.on("error", (err) => {
    console.error("=== WEBSOCKET ERROR ===");
    console.error("  - Session:", req.sessionID);
    console.error("  - Error:", err);
    console.error("  - Timestamp:", new Date().toISOString());
    console.error("=======================");
    allClients.delete(ws);
  });

  // Send a ping to verify connection works
  setTimeout(() => {
    if (ws.readyState === 1) {
      console.log("Sending ping to client", req.sessionID);
      try {
        ws.ping("server-ping");
      } catch (err) {
        console.error("Error sending ping:", err);
      }
    }
  }, 1000);
}

// WebSocket routes for both direct and proxy connections
console.log("Setting up WebSocket routes...");
app.ws("/", handleWebSocketConnection);
app.ws("/server", handleWebSocketConnection);
console.log("WebSocket routes configured for / and /server");

server.listen(config.port);
console.log("Server listening on port:", config.port);

setInterval(() => {
  ansiedit.saveSessionWithTimestamp(() => {});
  ansiedit.saveSession(() => {});
}, config.saveInterval);

console.log(
  "Auto-save interval set to:",
  config.saveInterval / 60000,
  "minutes",
);

process.on("SIGINT", () => {
  console.log("\n");
  ansiedit.saveSession(process.exit);
});
