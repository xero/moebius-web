var fs = require("fs");
var binaryText = require("./binary_text");

var imageData;
var userList = {};
var chat = [];
var sessionName = "joint"; // Default session name

// Initialize the module with configuration
function initialize(config) {
  sessionName = config.sessionName;
  console.log("Initializing ansiedit with session name:", sessionName);

  // Load or create session files
  loadSession();
}

function loadSession() {
  const chatFile = sessionName + ".json";
  const binFile = sessionName + ".bin";

  // Load chat history
  fs.readFile(chatFile, "utf8", (err, data) => {
    if (!err) {
      try {
        chat = JSON.parse(data).chat;
        console.log("Loaded chat history from:", chatFile);
      } catch (parseErr) {
        console.error("Error parsing chat file:", parseErr);
        chat = [];
      }
    } else {
      console.log("No existing chat file found, starting with empty chat");
      chat = [];
    }
  });

  // Load or create canvas data
  binaryText.load(binFile, (loadedImageData) => {
    if (loadedImageData !== undefined) {
      imageData = loadedImageData;
      console.log("Loaded canvas data from:", binFile);
    } else {
      // Check if joint.bin exists to use as template
      binaryText.load("joint.bin", (templateData) => {
        if (templateData !== undefined) {
          // Use joint.bin as template
          imageData = templateData;
          console.log("Created new session from joint.bin template");
          // Save the new session file
          binaryText.save(binFile, imageData, () => {
            console.log("Created new session file:", binFile);
          });
        } else {
          // Create default canvas if no template exists
          imageData = {
            columns: 160,
            rows: 50,
            data: new Uint16Array(160 * 50),
            iceColors: false,
            letterSpacing: false,
            fontName: "CP437 8x16", // Default font
          };
          console.log("Created default canvas: 160x50");
          // Save the new session file
          binaryText.save(binFile, imageData, () => {
            console.log("Created new session file:", binFile);
          });
        }
      });
    }
  });
}

function sendToAll(clients, msg) {
  const message = JSON.stringify(msg);
  console.log("Broadcasting message to", clients.size, "clients:", msg[0]);

  clients.forEach((client) => {
    try {
      if (client.readyState === 1) {
        // WebSocket.OPEN
        client.send(message);
      }
    } catch (err) {
      console.error("Error sending to client:", err);
    }
  });
}

function saveSessionWithTimestamp(callback) {
  binaryText.save(
    sessionName + " " + new Date().toUTCString() + ".bin",
    imageData,
    callback,
  );
}

function saveSession(callback) {
  fs.writeFile(sessionName + ".json", JSON.stringify({ chat: chat }), () => {
    binaryText.save(sessionName + ".bin", imageData, callback);
  });
}

function getStart(sessionID) {
  if (!imageData) {
    console.error("ImageData not initialized");
    return JSON.stringify(["error", "Server not ready"]);
  }
  return JSON.stringify([
    "start",
    {
      columns: imageData.columns,
      rows: imageData.rows,
      letterSpacing: imageData.letterSpacing,
      iceColors: imageData.iceColors,
      fontName: imageData.fontName || "CP437 8x16", // Include font with fallback
      chat: chat,
    },
    sessionID,
    userList,
  ]);
}

function getImageData() {
  if (!imageData) {
    console.error("ImageData not initialized");
    return { data: new Uint16Array(0) };
  }
  return imageData;
}

function message(msg, sessionID, clients) {
  if (!imageData) {
    console.error("ImageData not initialized, ignoring message");
    return;
  }

  switch (msg[0]) {
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
      chat.push([msg[1], msg[2]]);
      if (chat.length > 128) {
        chat.shift();
      }
      break;
    case "draw":
      msg[1].forEach((block) => {
        imageData.data[block >> 16] = block & 0xffff;
      });
      break;
    case "resize":
      if (msg[1] && msg[1].columns && msg[1].rows) {
        console.log("Server: Updating canvas size to", msg[1].columns, "x", msg[1].rows);
        imageData.columns = msg[1].columns;
        imageData.rows = msg[1].rows;
        // Resize the data array
        var newSize = msg[1].columns * msg[1].rows;
        var newData = new Uint16Array(newSize);
        var copyLength = Math.min(imageData.data.length, newSize);
        for (var i = 0; i < copyLength; i++) {
          newData[i] = imageData.data[i];
        }
        imageData.data = newData;
      }
      break;
    case "fontChange":
      if (msg[1] && msg[1].fontName) {
        console.log("Server: Updating font to", msg[1].fontName);
        imageData.fontName = msg[1].fontName;
      }
      break;
    case "iceColorsChange":
      if (msg[1] && msg[1].hasOwnProperty('iceColors')) {
        console.log("Server: Updating ice colors to", msg[1].iceColors);
        imageData.iceColors = msg[1].iceColors;
      }
      break;
    case "letterSpacingChange":
      if (msg[1] && msg[1].hasOwnProperty('letterSpacing')) {
        console.log("Server: Updating letter spacing to", msg[1].letterSpacing);
        imageData.letterSpacing = msg[1].letterSpacing;
      }
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
  initialize: initialize,
  saveSessionWithTimestamp: saveSessionWithTimestamp,
  saveSession: saveSession,
  getStart: getStart,
  getImageData: getImageData,
  message: message,
  closeSession: closeSession,
};
