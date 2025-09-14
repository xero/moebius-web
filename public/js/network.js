// ES6 module imports
import { showOverlay, hideOverlay } from './ui.js';
import { State } from './state.js';

// Function to initialize dependencies using state management
function setChatDependency(chatInstance) {
	// Dependencies are now managed through the global state system
	// This function is kept for backward compatibility
	console.log('✅ Chat dependency set via state management system');
}

function createWorkerHandler(inputHandle) {
	"use strict";
	const worker = new Worker("js/worker.js");
	let handle = localStorage.getItem("handle");
	if (handle === null) {
		handle = "Anonymous";
		localStorage.setItem("handle", handle);
	}
	inputHandle.value = handle;
	let connected = false;
	let silentCheck = false;
	let collaborationMode = false;
	let pendingImageData = null;
	let pendingCanvasSettings = null; // Store settings during silent check
	let silentCheckTimer = null;
	let applyReceivedSettings = false; // Flag to prevent broadcasting when applying settings from server
	let initializing = false; // Flag to prevent broadcasting during initial collaboration setup
	worker.postMessage({ "cmd": "handle", "handle": handle });

	function onConnected() {
		const excludedElements = document.getElementsByClassName("excluded-for-websocket");
		for (var i = 0; i < excludedElements.length; i++) {
			excludedElements[i].style.display = "none";
		}
		const includedElement = document.getElementsByClassName("included-for-websocket");
		for (var i = 0; i < includedElement.length; i++) {
			includedElement[i].style.display = "block";
		}
		$('artwork-title').value=window.location.hostname;
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

	function onImageData(columns, rows, data, iceColors, letterSpacing) {
		if (silentCheck) {
			// Clear the timeout since we received image data
			if (silentCheckTimer) {
				clearTimeout(silentCheckTimer);
				silentCheckTimer = null;
			}
			// Store image data for later use if user chooses collaboration
			pendingImageData = { columns, rows, data, iceColors, letterSpacing };
			// Now show the collaboration choice dialog
			showCollaborationChoice();
		} else if (collaborationMode) {
			// Apply image data immediately only in collaboration mode
			textArtCanvas.setImageData(columns, rows, data, iceColors, letterSpacing);
			hideOverlay($("websocket-overlay"));
		}
	}

	function onChat(handle, text, showNotification) {
		State.chat.addConversation(handle, text, showNotification);
	}

	function onJoin(handle, sessionID, showNotification) {
		State.chat.join(handle, sessionID, showNotification);
	}

	function onPart(sessionID) {
		State.chat.part(sessionID);
	}

	function onNick(handle, sessionID, showNotification) {
		State.chat.nick(handle, sessionID, showNotification);
	}

	function onDraw(blocks) {
		textArtCanvas.quickDraw(blocks);
	}

	function onCanvasSettings(settings) {
		if (silentCheck) {
			// Store settings during silent check instead of applying them
			pendingCanvasSettings = settings;
			return;
		}

		// Only apply settings if we're in collaboration mode
		if (!collaborationMode) {
			return;
		}

		applyReceivedSettings = true; // Flag to prevent re-broadcasting
		if (settings.columns !== undefined && settings.rows !== undefined) {
			textArtCanvas.resize(settings.columns, settings.rows);
			// Update the resize input fields if the dialog is open
			if (document.getElementById("columns-input")) {
				document.getElementById("columns-input").value = settings.columns;
			}
			if (document.getElementById("rows-input")) {
				document.getElementById("rows-input").value = settings.rows;
			}
		}
		if (settings.fontName !== undefined) {
			textArtCanvas.setFont(settings.fontName, () => {
			});
		}
		if (settings.iceColors !== undefined) {
			textArtCanvas.setIceColors(settings.iceColors);
			// Update the ice colors toggle UI
			if (document.getElementById("ice-colors-toggle")) {
				const iceColorsToggle = document.getElementById("ice-colors-toggle");
				if (settings.iceColors) {
					iceColorsToggle.classList.add("enabled");
				} else {
					iceColorsToggle.classList.remove("enabled");
				}
			}
		}
		if (settings.letterSpacing !== undefined) {
			font.setLetterSpacing(settings.letterSpacing);
			// Update the letter spacing toggle UI
			if (document.getElementById("letter-spacing-toggle")) {
				const letterSpacingToggle = document.getElementById("letter-spacing-toggle");
				if (settings.letterSpacing) {
					letterSpacingToggle.classList.add("enabled");
				} else {
					letterSpacingToggle.classList.remove("enabled");
				}
			}
		}
		applyReceivedSettings = false;

		// If this was during initialization, we're now ready to send changes
		if (initializing) {
			initializing = false;
		}
	}

	function onResize(columns, rows) {
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
		applyReceivedSettings = true; // Flag to prevent re-broadcasting
		textArtCanvas.setFont(fontName, () => {
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
		applyReceivedSettings = true; // Flag to prevent re-broadcasting
		textArtCanvas.setIceColors(iceColors);
		// Update the ice colors toggle UI
		if (document.getElementById("ice-colors-toggle")) {
			const iceColorsToggle = document.getElementById("ice-colors-toggle");
			if (iceColors) {
				iceColorsToggle.classList.add("enabled");
			} else {
				iceColorsToggle.classList.remove("enabled");
			}
		}
		applyReceivedSettings = false;
	}

	function onLetterSpacingChange(letterSpacing) {
		applyReceivedSettings = true; // Flag to prevent re-broadcasting
		font.setLetterSpacing(letterSpacing);
		// Update the letter spacing toggle UI
		if (document.getElementById("letter-spacing-toggle")) {
			const letterSpacingToggle = document.getElementById("letter-spacing-toggle");
			if (letterSpacing) {
				letterSpacingToggle.classList.add("enabled");
			} else {
				letterSpacingToggle.classList.remove("enabled");
			}
		}
		applyReceivedSettings = false;
	}

	function onMessage(msg) {
		const data = msg.data;
		switch (data.cmd) {
			case "connected":
				if (silentCheck) {
					// Silent check succeeded - send join to get full session data
					worker.postMessage({ "cmd": "join", "handle": handle });
					// Use async timeout to show dialog if no image data comes within 2 seconds
					silentCheckTimer = setTimeout(function() {
						if (silentCheck) {
							showCollaborationChoice();
						}
					}, 2000);
				} else {
					// Direct connection - proceed with collaboration
					onConnected();
				}
				break;
			case "disconnected":
				onDisconnected();
				break;
			case "error":
				if (silentCheck) {
				} else {
					alert("Failed to connect to server: " + data.error);
				}
				// If silent check failed, just stay in local mode silently
				break;
			case "imageData":
				onImageData(data.columns, data.rows, new Uint16Array(data.data), data.iceColors, data.letterSpacing);
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
			worker.postMessage({ "cmd": "canvasSettings", "settings": settings });
		}
	}

	function sendResize(columns, rows) {
		if (collaborationMode && connected && !applyReceivedSettings && !initializing) {
			worker.postMessage({ "cmd": "resize", "columns": columns, "rows": rows });
		}
	}

	function sendFontChange(fontName) {
		if (collaborationMode && connected && !applyReceivedSettings && !initializing) {
			worker.postMessage({ "cmd": "fontChange", "fontName": fontName });
		}
	}

	function sendIceColorsChange(iceColors) {
		if (collaborationMode && connected && !applyReceivedSettings && !initializing) {
			worker.postMessage({ "cmd": "iceColorsChange", "iceColors": iceColors });
		}
	}

	function sendLetterSpacingChange(letterSpacing) {
		if (collaborationMode && connected && !applyReceivedSettings && !initializing) {
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
		collaborationMode = true;
		initializing = true; // Set flag to prevent broadcasting during initial setup

		// Apply pending image data if available
		if (pendingImageData) {
			textArtCanvas.setImageData(
				pendingImageData.columns,
				pendingImageData.rows,
				pendingImageData.data,
				pendingImageData.iceColors,
				pendingImageData.letterSpacing
			);
			pendingImageData = null;
		}

		// Apply pending canvas settings if available
		if (pendingCanvasSettings) {
			onCanvasSettings(pendingCanvasSettings);
			pendingCanvasSettings = null;
		}

		// The connection is already established and we already sent join during silent check
		// Just need to apply the UI changes for collaboration mode
		const excludedElements = document.getElementsByClassName("excluded-for-websocket");
		for (var i = 0; i < excludedElements.length; i++) {
			excludedElements[i].style.display = "none";
		}
		const includedElement = document.getElementsByClassName("included-for-websocket");
		for (var i = 0; i < includedElement.length; i++) {
			includedElement[i].style.display = "block";
		}
		$('artwork-title').value=window.location.hostname;
		connected = true;

		// Settings will be received automatically from the start message
		// through the canvasSettings mechanism we implemented in the worker

		// Hide the overlay since we're ready
		hideOverlay($("websocket-overlay"));
	}

	function stayLocal() {
		hideOverlay($("collaboration-choice-overlay"));
		collaborationMode = false;
		pendingImageData = null; // Clear any pending server data
		pendingCanvasSettings = null; // Clear any pending server settings
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
	const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";

	// Check if we're running through a proxy (like nginx) by checking the port
	// If we're on standard HTTP/HTTPS ports, use /server path, otherwise connect directly
	const isProxied = (window.location.port === "" || window.location.port === "80" || window.location.port === "443");
	let wsUrl;

	if (isProxied) {
		// Running through proxy (nginx) - use /server path
		wsUrl = protocol + window.location.host + "/server";
		console.info("Network: Detected proxy setup, checking server at:", wsUrl);
	} else {
		// Direct connection - use port 1337
		wsUrl = protocol + window.location.hostname + ":1337" + window.location.pathname;
		console.info("Network: Direct connection mode, checking server at:", wsUrl);
	}

	// Start with a silent connection check
	silentCheck = true;
	worker.postMessage({ "cmd": "connect", "url": wsUrl, "silentCheck": true });

	worker.addEventListener("message", (msg) => {
		const data = msg.data;
		switch (data.cmd) {
			case "connected":
				onConnected();
				break;
			case "silentCheckFailed":
				silentCheck = false;
				collaborationMode = false;
				hideOverlay($("websocket-overlay"));
				break;
			case "disconnected":
				onDisconnected();
				break;
			case "error":
				break;
			case "imageData":
				onImageData(data.columns, data.rows, new Uint16Array(data.data), data.iceColors, data.letterSpacing);
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
	});

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
	let enabled = false;
	const userList = {};
	let notifications = localStorage.getItem("notifications");
	if (notifications === null) {
		notifications = false;
		localStorage.setItem("notifications", notifications);
	} else {
		notifications = JSON.parse(notifications);
	}
	inputNotificationCheckbox.checked = notifications;

	function scrollToBottom() {
		const rect = divMessageWindow.getBoundingClientRect();
		divMessageWindow.scrollTop = divMessageWindow.scrollHeight - rect.height;
	}

	function newNotification(text) {
		const notification = new Notification($('artwork-title').value+ " - text.0w.nz", {
			"body": text,
			"icon": "img/face.png"
		});
		// Auto-close notification after 7 seconds
		const notificationTimer = setTimeout(() => {
			notification.close();
		}, 7000);
		
		// Clean up timer if notification is manually closed
		notification.addEventListener('close', () => {
			clearTimeout(notificationTimer);
		});
	}

	function addConversation(handle, text, showNotification) {
		const div = document.createElement("DIV");
		const spanHandle = document.createElement("SPAN");
		const spanSeperator = document.createElement("SPAN");
		const spanText = document.createElement("SPAN");
		spanHandle.textContent = handle;
		spanHandle.classList.add("handle");
		spanSeperator.textContent = " ";
		spanText.textContent = text;
		div.appendChild(spanHandle);
		div.appendChild(spanSeperator);
		div.appendChild(spanText);
		const rect = divMessageWindow.getBoundingClientRect();
		const doScroll = (rect.height > divMessageWindow.scrollHeight) || (divMessageWindow.scrollTop === divMessageWindow.scrollHeight - rect.height);
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
		const keyCode = (evt.keyCode || evt.which);
		if (keyCode === 13) {
			inputMessage.focus();
		}
	}

	function keypressMessage(evt) {
		const keyCode = (evt.keyCode || evt.which);
		if (keyCode === 13) {
			if (inputMessage.value !== "") {
				const text = inputMessage.value;
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
		const keyCode = (evt.keyCode || evt.which);
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

// ES6 module exports
export {
	setChatDependency,
	createWorkerHandler,
	createChatController
};
