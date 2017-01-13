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
        socket.setHandle(inputHandle.value);
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
                socket.sendChat(text);
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
            userList[sessionID] = {"handle": handle, "div": document.createElement("DIV")};
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
