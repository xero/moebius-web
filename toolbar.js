function toolbarWidget() {
    "use strict";
    var selected, shortcuts;

    shortcuts = [];

    function createElement(elementName, args) {
        var element;
        args = args || {};
        element = document.createElement(elementName);
        Object.getOwnPropertyNames(args).forEach(function (name) {
            if (typeof args[name] === "object") {
                Object.getOwnPropertyNames(args[name]).forEach(function (subName) {
                    element[name][subName] = args[name][subName];
                });
            } else {
                element[name] = args[name];
            }
        });
        return element;
    }

    function addTool(tool, shortcut) {
        var div, paragraph;

        function updateStatus() {
            if (shortcut) {
                paragraph.textContent = tool.toString() + " (" + shortcut.symbol + ")";
            } else {
                paragraph.textContent = tool.toString();
            }
            if (tool.isEnabled) {
                if (tool.isEnabled()) {
                    div.className = "tool enabled";
                } else {
                    div.className = "tool";
                }
            } else if (selected.tool.uid !== tool.uid) {
                div.className = "tool blink";
                setTimeout(function () {
                    div.className = "tool";
                }, 50);
            }
        }

        function select() {
            if (selected && (selected.tool.uid === tool.uid)) {
                if (tool.modeChange) {
                    tool.modeChange();
                    updateStatus();
                }
            } else {
                if (tool.init()) {
                    if (selected) {
                        selected.div.className = "tool";
                        selected.tool.remove();
                    }
                    selected = {"div": div, "tool": tool};
                    div.className = "tool selected";
                }
                updateStatus();
            }
        }

        div = createElement("div", {"className": "tool"});
        div.onclick = select;
        if (shortcut) {
            shortcuts[shortcut.keyCode] = select;
            paragraph = createElement("p", {"textContent": tool.toString() + " (" + shortcut.symbol + ")"});
        } else {
            paragraph = createElement("p", {"textContent": tool.toString()});
        }
        div.appendChild(paragraph);
        document.getElementById("tools").appendChild(div);

        return {
            "select": select
        };
    }

    function keypress(evt) {
        var keyCode;
        keyCode = evt.keyCode || evt.which;
        if (shortcuts[keyCode] && selected) {
            evt.preventDefault();
            shortcuts[keyCode](evt.keyCode);
        }
    }

    function startListening() {
        document.addEventListener("keypress", keypress, false);
    }

    function stopListening() {
        document.removeEventListener("keypress", keypress);
    }

    function init() {
        startListening();
    }

    return {
        "init": init,
        "addTool": addTool,
        "startListening": startListening,
        "stopListening": stopListening
    };
}