function createChatController(divChatButton, divChatWindow, divMessageWindow, divUserList, inputHandle, inputMessage, onFocusCallback, onBlurCallback) {
    "use strict";
    var enabled = false;
    var userList = {};

    function scrollToBottom() {
        var rect = divMessageWindow.getBoundingClientRect();
        divMessageWindow.scrollTop = divMessageWindow.scrollHeight - rect.height;
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

    function join(handle, sessionID) {
        if (userList[sessionID] === undefined) {
            userList[sessionID] = document.createElement("DIV");
            userList[sessionID].classList.add("user-name");
            userList[sessionID].textContent = handle;
            divUserList.appendChild(userList[sessionID]);
        }
    }

    function nick(handle, sessionID) {
        if (userList[sessionID] !== undefined) {
            userList[sessionID].textContent = handle;
        }
    }

    function part(sessionID) {
        if (userList[sessionID] !== undefined) {
            divUserList.removeChild(userList[sessionID]);
            delete userList[sessionID];
        }
    }

    function globalToggleKeydown(evt) {
        var keyCode = (evt.keyCode || evt.which);
        if (keyCode === 27) {
            toggle();
        }
    }

    document.addEventListener("keydown", globalToggleKeydown);

    return {
        "addConversation": addConversation,
        "toggle": toggle,
        "isEnabled": isEnabled,
        "join": join,
        "nick": nick,
        "part": part
    };
}
