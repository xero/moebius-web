var socket;
var sessionID;
var joint;
var connected = false;

function send(cmd, msg) {
	socket.send(JSON.stringify([cmd, msg]));
}

function onOpen() {
	postMessage({ "cmd": "connected" });
}

function onClose(evt) {
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
			socket = new WebSocket(data.url);
			socket.addEventListener("open", onOpen);
			socket.addEventListener("message", onMessage);
			socket.addEventListener("close", onClose);
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
		default:
			break;
	}
};
