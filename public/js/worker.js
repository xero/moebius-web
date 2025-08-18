var socket;
var sessionID;
var joint;
var connected = false;

function send(cmd, msg) {
	if (socket && socket.readyState === WebSocket.OPEN) {
		socket.send(JSON.stringify([cmd, msg]));
	}
}

function onOpen() {
	console.log("Worker: WebSocket connection opened successfully");
	postMessage({ "cmd": "connected" });
}

function onClose(evt) {
	console.log("Worker: WebSocket connection closed. Code:", evt.code, "Reason:", evt.reason);
	postMessage({ "cmd": "disconnected" });
}

function onChat(handle, text, showNotification) {
	postMessage({ "cmd": "chat", "handle": handle, "text": text, "showNotification": showNotification });
}

function onStart(msg, newSessionID) {
	joint = msg;
	sessionID = newSessionID;
	msg.chat.forEach((msg) => {
		onChat(msg[0], msg[1], false);
	});
	
	// Forward canvas settings from start message to network layer
	postMessage({ 
		"cmd": "canvasSettings", 
		"settings": {
			columns: msg.columns,
			rows: msg.rows,
			iceColors: msg.iceColours,
			letterSpacing: msg.letterSpacing,
			fontName: msg.fontName
		}
	});
}

function onJoin(handle, joinSessionID, showNotification) {
	if (joinSessionID === sessionID) {
		showNotification = false;
	}
	postMessage({ "cmd": "join", "sessionID": joinSessionID, "handle": handle, "showNotification": showNotification });
}

function onNick(handle, nickSessionID) {
	postMessage({ "cmd": "nick", "sessionID": nickSessionID, "handle": handle, "showNotification": (nickSessionID !== sessionID) });
}

function onPart(sessionID) {
	postMessage({ "cmd": "part", "sessionID": sessionID });
}

function onDraw(blocks) {
	var outputBlocks = new Array();
	var index;
	blocks.forEach((block) => {
		index = block >> 16;
		outputBlocks.push([index, block & 0xffff, index % joint.columns, Math.floor(index / joint.columns)]);
	});
	postMessage({ "cmd": "draw", "blocks": outputBlocks });
}

function onMessage(evt) {
	var data = evt.data;
	if (typeof (data) === "object") {
		var fr = new FileReader();
		fr.addEventListener("load", (evt) => {
			postMessage({ "cmd": "imageData", "data": evt.target.result, "columns": joint.columns, "rows": joint.rows, "iceColours": joint.iceColours, "letterSpacing": joint.letterSpacing });
			connected = true;
		});
		fr.readAsArrayBuffer(data);
	} else {
		data = JSON.parse(data);
		switch (data[0]) {
			case "start":
				sessionID = data[2];
				var userList = data[3];
				Object.keys(userList).forEach((userSessionID) => {
					onJoin(userList[userSessionID], userSessionID, false);
				});
				onStart(data[1], data[2]);
				break;
			case "join":
				onJoin(data[1], data[2], true);
				break;
			case "nick":
				onNick(data[1], data[2]);
				break;
			case "draw":
				onDraw(data[1]);
				break;
			case "part":
				onPart(data[1]);
				break;
			case "chat":
				onChat(data[1], data[2], true);
				break;
			case "canvasSettings":
				postMessage({ "cmd": "canvasSettings", "settings": data[1] });
				break;
			case "resize":
				postMessage({ "cmd": "resize", "columns": data[1].columns, "rows": data[1].rows });
				break;
			case "fontChange":
				postMessage({ "cmd": "fontChange", "fontName": data[1].fontName });
				break;
			case "iceColorsChange":
				postMessage({ "cmd": "iceColorsChange", "iceColors": data[1].iceColors });
				break;
			case "letterSpacingChange":
				postMessage({ "cmd": "letterSpacingChange", "letterSpacing": data[1].letterSpacing });
				break;
			default:
				break;
		}
	}
}

function removeDuplicates(blocks) {
	var indexes = [];
	var index;
	blocks = blocks.reverse();
	blocks = blocks.filter((block) => {
		index = block >> 16;
		if (indexes.lastIndexOf(index) === -1) {
			indexes.push(index);
			return true;
		}
		return false;
	});
	return blocks.reverse();
}

self.onmessage = function(msg) {
	var data = msg.data;
	switch (data.cmd) {
		case "connect":
			console.log("Worker: Attempting to connect to WebSocket at:", data.url);
			socket = new WebSocket(data.url);
			socket.addEventListener("open", onOpen);
			socket.addEventListener("message", onMessage);
			socket.addEventListener("close", onClose);
			socket.addEventListener("error", function(evt) {
				console.log("Worker: Server not available");
				postMessage({ "cmd": "error", "error": "WebSocket connection failed" });
			});
			break;
		case "join":
			send("join", data.handle);
			break;
		case "nick":
			send("nick", data.handle);
			break;
		case "chat":
			send("chat", data.text);
			break;
		case "draw":
			send("draw", removeDuplicates(data.blocks));
			break;
		case "canvasSettings":
			send("canvasSettings", data.settings);
			break;
		case "resize":
			send("resize", { columns: data.columns, rows: data.rows });
			break;
		case "fontChange":
			send("fontChange", { fontName: data.fontName });
			break;
		case "iceColorsChange":
			send("iceColorsChange", { iceColors: data.iceColors });
			break;
		case "letterSpacingChange":
			send("letterSpacingChange", { letterSpacing: data.letterSpacing });
			break;
		case "disconnect":
			if (socket) {
				console.log("Worker: Disconnecting WebSocket");
				connected = false;
				socket.close();
			}
			break;
		default:
			break;
	}
};
