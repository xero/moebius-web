function createWorkerHandler(inputHandle) {
	"use strict";
	var worker = new Worker("js/worker.js");
	var handle = localStorage.getItem("handle");
	if (handle === null) {
		handle = "Anonymous";
		localStorage.setItem("handle", handle);
	}
	inputHandle.value = handle;
	var connected = false;
	var silentCheck = false;
	var collaborationMode = false;
	var pendingImageData = null;
	var silentCheckTimer = null;
	var applyReceivedSettings = false; // Flag to prevent broadcasting when applying settings from server
	var initializing = false; // Flag to prevent broadcasting during initial collaboration setup
	worker.postMessage({ "cmd": "handle", "handle": handle });

	function onConnected() {
		var excludedElements = document.getElementsByClassName("excluded-for-websocket");
		for (var i = 0; i < excludedElements.length; i++) {
			excludedElements[i].style.display = "none";
		}
		var includedElement = document.getElementsByClassName("included-for-websocket");
		for (var i = 0; i < includedElement.length; i++) {
			includedElement[i].style.display = "block";
		}
		title.setName(window.location.hostname);
		worker.postMessage({ "cmd": "join", "handle": handle });
		connected = true;
	}

	function onDisconnected() {
		if (connected === true) {
			alert("You were disconnected from the server, try refreshing the page to try again.");
		} else if (!silentCheck) {
			hideOverlay($("websocket-overlay"));
		}
		// If this was a silent check and it failed, just stay in local mode
		connected = false;
	}

	function onImageData(columns, rows, data, iceColours, letterSpacing) {
		if (silentCheck) {
			// Clear the timeout since we received image data
			if (silentCheckTimer) {
				clearTimeout(silentCheckTimer);
				silentCheckTimer = null;
			}
			// Store image data for later use if user chooses collaboration
			pendingImageData = { columns, rows, data, iceColours, letterSpacing };
			console.log("Network: Server image data stored for user choice");
			// Now show the collaboration choice dialog
			showCollaborationChoice();
		} else if (collaborationMode) {
			// Apply image data immediately only in collaboration mode
			textArtCanvas.setImageData(columns, rows, data, iceColours, letterSpacing);
			hideOverlay($("websocket-overlay"));
		}
	}

	function onChat(handle, text, showNotification) {
		chat.addConversation(handle, text, showNotification);
	}

	function onJoin(handle, sessionID, showNotification) {
		chat.join(handle, sessionID, showNotification);
	}

	function onPart(sessionID) {
		chat.part(sessionID);
	}

	function onNick(handle, sessionID, showNotification) {
		chat.nick(handle, sessionID, showNotification);
	}

	function onDraw(blocks) {
		textArtCanvas.quickDraw(blocks);
	}

	function onCanvasSettings(settings) {
		console.log("Network: Received canvas settings from server:", settings);
		applyReceivedSettings = true; // Flag to prevent re-broadcasting
		if (settings.columns !== undefined && settings.rows !== undefined) {
			textArtCanvas.resize(settings.columns, settings.rows);
		}
		if (settings.fontName !== undefined) {
			textArtCanvas.setFont(settings.fontName, () => {
				console.log("Network: Font applied from server settings");
			});
		}
		if (settings.iceColors !== undefined) {
			textArtCanvas.setIceColours(settings.iceColors);
		}
		if (settings.letterSpacing !== undefined) {
			font.setLetterSpacing(settings.letterSpacing);
		}
		applyReceivedSettings = false;
		
		// If this was during initialization, we're now ready to send changes
		if (initializing) {
			console.log("Network: Initial settings applied, enabling settings broadcast");
			initializing = false;
		}
	}

	function onResize(columns, rows) {
		console.log("Network: Received resize from server:", columns, "x", rows);
		applyReceivedSettings = true; // Flag to prevent re-broadcasting
		textArtCanvas.resize(columns, rows);
		// Update the resize input fields if the dialog is open
		if (document.getElementById("columns-input")) {
			document.getElementById("columns-input").value = columns;
		}
		if (document.getElementById("rows-input")) {
			document.getElementById("rows-input").value = rows;
		}
		applyReceivedSettings = false;
	}

	function onFontChange(fontName) {
		console.log("Network: Received font change from server:", fontName);
		applyReceivedSettings = true; // Flag to prevent re-broadcasting
		textArtCanvas.setFont(fontName, () => {
			console.log("Network: Font change applied from server");
			// Update the font display UI
			if (document.getElementById("current-font-display")) {
				document.getElementById("current-font-display").textContent = fontName;
			}
			if (document.getElementById("font-select")) {
				document.getElementById("font-select").value = fontName;
			}
		});
		applyReceivedSettings = false;
	}

	function onIceColorsChange(iceColors) {
		console.log("Network: Received ice colors change from server:", iceColors);
		applyReceivedSettings = true; // Flag to prevent re-broadcasting
		textArtCanvas.setIceColours(iceColors);
		// Update the ice colors toggle UI
		if (document.getElementById("ice-colors-toggle")) {
			var iceColorsToggle = document.getElementById("ice-colors-toggle");
			if (iceColors) {
				iceColorsToggle.classList.add("enabled");
			} else {
				iceColorsToggle.classList.remove("enabled");
			}
		}
		applyReceivedSettings = false;
	}

	function onLetterSpacingChange(letterSpacing) {
		console.log("Network: Received letter spacing change from server:", letterSpacing);
		applyReceivedSettings = true; // Flag to prevent re-broadcasting
		font.setLetterSpacing(letterSpacing);
		// Update the letter spacing toggle UI
		if (document.getElementById("letter-spacing-toggle")) {
			var letterSpacingToggle = document.getElementById("letter-spacing-toggle");
			if (letterSpacing) {
				letterSpacingToggle.classList.add("enabled");
			} else {
				letterSpacingToggle.classList.remove("enabled");
			}
		}
		applyReceivedSettings = false;
	}

	function onMessage(msg) {
		var data = msg.data;
		switch (data.cmd) {
			case "connected":
				console.log("Network: Successfully connected to server");
				if (silentCheck) {
					// Silent check succeeded - send join to get full session data
					console.log("Network: Server available, requesting session data");
					worker.postMessage({ "cmd": "join", "handle": handle });
					// Set a timer to show dialog even if no image data comes
					silentCheckTimer = setTimeout(function() {
						if (silentCheck) {
							console.log("Network: No image data received, showing collaboration choice");
							showCollaborationChoice();
						}
					}, 2000); // Wait 2 seconds for image data
				} else {
					// Direct connection - proceed with collaboration
					onConnected();
				}
				break;
			case "disconnected":
				console.log("Network: Disconnected from server");
				onDisconnected();
				break;
			case "error":
				if (silentCheck) {
					console.log("Network: Server not available, staying in local mode");
				} else {
					console.error("Network: Connection error:", data.error);
					alert("Failed to connect to server: " + data.error);
				}
				// If silent check failed, just stay in local mode silently
				break;
			case "imageData":
				if (silentCheck) {
					console.log("Network: Server image data received during silent check");
				} else {
					console.log("Network: Received image data");
				}
				onImageData(data.columns, data.rows, new Uint16Array(data.data), data.iceColours, data.letterSpacing);
				break;
			case "chat":
				onChat(data.handle, data.text, data.showNotification);
				break;
			case "join":
				onJoin(data.handle, data.sessionID, data.showNotification);
				break;
			case "part":
				onPart(data.sessionID);
				break;
			case "nick":
				onNick(data.handle, data.sessionID, data.showNotification);
				break;
			case "draw":
				onDraw(data.blocks);
				break;
			case "canvasSettings":
				onCanvasSettings(data.settings);
				break;
			case "resize":
				onResize(data.columns, data.rows);
				break;
			case "fontChange":
				onFontChange(data.fontName);
				break;
			case "iceColorsChange":
				onIceColorsChange(data.iceColors);
				break;
			case "letterSpacingChange":
				onLetterSpacingChange(data.letterSpacing);
				break;
		}
	}

	function draw(blocks) {
		if (collaborationMode && connected) {
			worker.postMessage({ "cmd": "draw", "blocks": blocks });
		}
	}

	function sendCanvasSettings(settings) {
		if (collaborationMode && connected && !applyReceivedSettings && !initializing) {
			console.log("Network: Sending canvas settings to server:", settings);
			worker.postMessage({ "cmd": "canvasSettings", "settings": settings });
		}
	}

	function sendResize(columns, rows) {
		if (collaborationMode && connected && !applyReceivedSettings && !initializing) {
			console.log("Network: Sending resize to server:", columns, "x", rows);
			worker.postMessage({ "cmd": "resize", "columns": columns, "rows": rows });
		}
	}

	function sendFontChange(fontName) {
		if (collaborationMode && connected && !applyReceivedSettings && !initializing) {
			console.log("Network: Sending font change to server:", fontName);
			worker.postMessage({ "cmd": "fontChange", "fontName": fontName });
		}
	}

	function sendIceColorsChange(iceColors) {
		if (collaborationMode && connected && !applyReceivedSettings && !initializing) {
			console.log("Network: Sending ice colors change to server:", iceColors);
			worker.postMessage({ "cmd": "iceColorsChange", "iceColors": iceColors });
		}
	}

	function sendLetterSpacingChange(letterSpacing) {
		if (collaborationMode && connected && !applyReceivedSettings && !initializing) {
			console.log("Network: Sending letter spacing change to server:", letterSpacing);
			worker.postMessage({ "cmd": "letterSpacingChange", "letterSpacing": letterSpacing });
		}
	}

	function showCollaborationChoice() {
		showOverlay($("collaboration-choice-overlay"));
		// Reset silent check flag since we're now in interactive mode
		silentCheck = false;
		// Clear any remaining timer
		if (silentCheckTimer) {
			clearTimeout(silentCheckTimer);
			silentCheckTimer = null;
		}
	}

	function joinCollaboration() {
		hideOverlay($("collaboration-choice-overlay"));
		showOverlay($("websocket-overlay"));
		console.log("Network: User chose collaboration mode");
		collaborationMode = true;
		initializing = true; // Set flag to prevent broadcasting during initial setup
		
		// Apply pending image data if available
		if (pendingImageData) {
			console.log("Network: Applying pending image data to canvas");
			textArtCanvas.setImageData(
				pendingImageData.columns, 
				pendingImageData.rows, 
				pendingImageData.data, 
				pendingImageData.iceColours, 
				pendingImageData.letterSpacing
			);
			pendingImageData = null;
		} else {
			console.log("Network: No pending image data to apply");
		}
		
		// The connection is already established and we already sent join during silent check
		// Just need to apply the UI changes for collaboration mode
		var excludedElements = document.getElementsByClassName("excluded-for-websocket");
		for (var i = 0; i < excludedElements.length; i++) {
			excludedElements[i].style.display = "none";
		}
		var includedElement = document.getElementsByClassName("included-for-websocket");
		for (var i = 0; i < includedElement.length; i++) {
			includedElement[i].style.display = "block";
		}
		title.setName(window.location.hostname);
		connected = true;
		
		// Request current canvas settings from server instead of sending our local settings
		console.log("Network: Requesting current canvas settings from server");
		worker.postMessage({ "cmd": "requestSettings" });
		
		// Set a timeout to disable initializing flag even if no settings are received
		// This prevents the user from being stuck unable to make changes
		setTimeout(() => {
			if (initializing) {
				console.log("Network: No initial settings received, enabling settings broadcast anyway");
				initializing = false;
			}
		}, 3000); // Wait 3 seconds for initial settings
		
		// Hide the overlay since we're ready
		hideOverlay($("websocket-overlay"));
	}

	function stayLocal() {
		hideOverlay($("collaboration-choice-overlay"));
		console.log("Network: User chose local mode");
		collaborationMode = false;
		pendingImageData = null; // Clear any pending server data
		// Disconnect the websocket since user wants local mode
		worker.postMessage({ "cmd": "disconnect" });
	}

	function setHandle(newHandle) {
		if (handle !== newHandle) {
			handle = newHandle;
			localStorage.setItem("handle", handle);
			worker.postMessage({ "cmd": "nick", "handle": handle });
		}
	}

	function sendChat(text) {
		worker.postMessage({ "cmd": "chat", "text": text });
	}

	function isConnected() {
		return connected;
	}

	worker.addEventListener("message", onMessage);
	
	// Set up collaboration choice dialog handlers
	$("join-collaboration").addEventListener("click", joinCollaboration);
	$("stay-local").addEventListener("click", stayLocal);
	
	// Use ws:// for HTTP server, wss:// for HTTPS server
	var protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
	
	// Check if we're running through a proxy (like nginx) by checking the port
	// If we're on standard HTTP/HTTPS ports, use /server path, otherwise connect directly
	var isProxied = (window.location.port === "" || window.location.port === "80" || window.location.port === "443");
	var wsUrl;
	
	if (isProxied) {
		// Running through proxy (nginx) - use /server path
		wsUrl = protocol + window.location.host + "/server";
		console.log("Network: Detected proxy setup, checking server at:", wsUrl);
	} else {
		// Direct connection - use port 1337
		wsUrl = protocol + window.location.hostname + ":1337" + window.location.pathname;
		console.log("Network: Direct connection mode, checking server at:", wsUrl);
	}
	
	// Start with a silent connection check
	silentCheck = true;
	console.log("Network: Starting silent server check");
	worker.postMessage({ "cmd": "connect", "url": wsUrl });

	return {
		"draw": draw,
		"setHandle": setHandle,
		"sendChat": sendChat,
		"isConnected": isConnected,
		"joinCollaboration": joinCollaboration,
		"stayLocal": stayLocal,
		"sendCanvasSettings": sendCanvasSettings,
		"sendResize": sendResize,
		"sendFontChange": sendFontChange,
		"sendIceColorsChange": sendIceColorsChange,
		"sendLetterSpacingChange": sendLetterSpacingChange
	};
}

function createChatController(divChatButton, divChatWindow, divMessageWindow, divUserList, inputHandle, inputMessage, inputNotificationCheckbox, onFocusCallback, onBlurCallback) {
	"use strict";
	var enabled = false;
	var userList = {};
	var notifications = localStorage.getItem("notifications");
	if (notifications === null) {
		notifications = false;
		localStorage.setItem("notifications", notifications);
	} else {
		notifications = JSON.parse(notifications);
	}
	inputNotificationCheckbox.checked = notifications;

	function scrollToBottom() {
		var rect = divMessageWindow.getBoundingClientRect();
		divMessageWindow.scrollTop = divMessageWindow.scrollHeight - rect.height;
	}

	function newNotification(text) {
		var notification = new Notification(title.getName() + " - ANSiEdit", {
			"body": text,
			"icon": "../images/face.png"
		});
		setTimeout(() => {
			notification.close();
		}, 7000);
	}

	function addConversation(handle, text, showNotification) {
		var div = document.createElement("DIV");
		var spanHandle = document.createElement("SPAN");
		var spanSeperator = document.createElement("SPAN");
		var spanText = document.createElement("SPAN");
		spanHandle.textContent = handle;
		spanHandle.classList.add("handle");
		spanSeperator.textContent = " ";
		spanText.textContent = text;
		div.appendChild(spanHandle);
		div.appendChild(spanSeperator);
		div.appendChild(spanText);
		var rect = divMessageWindow.getBoundingClientRect();
		var doScroll = (rect.height > divMessageWindow.scrollHeight) || (divMessageWindow.scrollTop === divMessageWindow.scrollHeight - rect.height);
		divMessageWindow.appendChild(div);
		if (doScroll) {
			scrollToBottom();
		}
		if (showNotification === true && enabled === false && divChatButton.classList.contains("notification") === false) {
			divChatButton.classList.add("notification");
		}
	}

	function onFocus() {
		onFocusCallback();
	}

	function onBlur() {
		onBlurCallback();
	}

	function blurHandle(evt) {
		if (inputHandle.value === "") {
			inputHandle.value = "Anonymous";
		}
		worker.setHandle(inputHandle.value);
	}

	function keypressHandle(evt) {
		var keyCode = (evt.keyCode || evt.which);
		if (keyCode === 13) {
			inputMessage.focus();
		}
	}

	function keypressMessage(evt) {
		var keyCode = (evt.keyCode || evt.which);
		if (keyCode === 13) {
			if (inputMessage.value !== "") {
				var text = inputMessage.value;
				inputMessage.value = "";
				worker.sendChat(text);
			}
		}
	}

	inputHandle.addEventListener("focus", onFocus);
	inputHandle.addEventListener("blur", onBlur);
	inputMessage.addEventListener("focus", onFocus);
	inputMessage.addEventListener("blur", onBlur);
	inputHandle.addEventListener("blur", blurHandle);
	inputHandle.addEventListener("keypress", keypressHandle);
	inputMessage.addEventListener("keypress", keypressMessage);

	function toggle() {
		if (enabled === true) {
			divChatWindow.style.display = "none";
			enabled = false;
			onBlurCallback();
			divChatButton.classList.remove("active");
		} else {
			divChatWindow.style.display = "block";
			enabled = true;
			scrollToBottom();
			onFocusCallback();
			inputMessage.focus();
			divChatButton.classList.remove("notification");
			divChatButton.classList.add("active");
		}
	}

	function isEnabled() {
		return enabled;
	}

	function join(handle, sessionID, showNotification) {
		if (userList[sessionID] === undefined) {
			if (notifications === true && showNotification === true) {
				newNotification(handle + " has joined");
			}
			userList[sessionID] = { "handle": handle, "div": document.createElement("DIV") };
			userList[sessionID].div.classList.add("user-name");
			userList[sessionID].div.textContent = handle;
			divUserList.appendChild(userList[sessionID].div);
		}
	}

	function nick(handle, sessionID, showNotification) {
		if (userList[sessionID] !== undefined) {
			if (showNotification === true && notifications === true) {
				newNotification(userList[sessionID].handle + " has changed their name to " + handle);
			}
			userList[sessionID].handle = handle;
			userList[sessionID].div.textContent = handle;
		}
	}

	function part(sessionID) {
		if (userList[sessionID] !== undefined) {
			if (notifications === true) {
				newNotification(userList[sessionID].handle + " has left");
			}
			divUserList.removeChild(userList[sessionID].div);
			delete userList[sessionID];
		}
	}

	function globalToggleKeydown(evt) {
		var keyCode = (evt.keyCode || evt.which);
		if (keyCode === 27) {
			toggle();
		}
	}

	function notificationCheckboxClicked(evt) {
		if (inputNotificationCheckbox.checked) {
			if (Notification.permission !== "granted") {
				Notification.requestPermission((permission) => {
					notifications = true;
					localStorage.setItem("notifications", notifications);
				});
			} else {
				notifications = true;
				localStorage.setItem("notifications", notifications);
			}
		} else {
			notifications = false;
			localStorage.setItem("notifications", notifications);
		}
	}

	document.addEventListener("keydown", globalToggleKeydown);
	inputNotificationCheckbox.addEventListener("click", notificationCheckboxClicked);

	return {
		"addConversation": addConversation,
		"toggle": toggle,
		"isEnabled": isEnabled,
		"join": join,
		"nick": nick,
		"part": part
	};
}
