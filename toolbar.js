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

        function select() {
            if (selected && (selected.tool.uid === tool.uid)) {
                if (tool.modeChange) {
                    tool.modeChange();
                    if (shortcut) {
                        paragraph.textContent = tool.toString() + " (" + shortcut.symbol + ")";
                    } else {
                        paragraph.textContent = tool.toString();
                    }
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

    document.addEventListener("keypress", function (evt) {
        var keyCode;
        keyCode = evt.keyCode || evt.which;
        if (shortcuts[keyCode] && selected) {
            evt.preventDefault();
            shortcuts[keyCode](evt.keyCode);
        }
    }, false);

    return {
        "addTool": addTool
    };
}