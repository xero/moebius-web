function toolbarWidget(editor) {
    "use strict";
    var selected, tools, shortcuts;

    shortcuts = [];
    tools = {};

    function addTool(tool, elementId, keyCode) {
        var div, divCanvasContainer, paragraph;

        function shortcutName(code) {
            switch (code) {
            case 44:
                return "comma";
            case 32:
                return "space";
            default:
                return String.fromCharCode(keyCode);
            }
        }

        function updateStatus() {
            var title;
            title = tool.toString();
            if (keyCode) {
                title += " - \u2018" + shortcutName(keyCode) + "\u2019";
            }
            paragraph.textContent = title;
            if (tool.isEnabled) {
                if (tool.isEnabled()) {
                    div.className = "tool enabled";
                } else {
                    div.className = "tool";
                }
            }
        }

        function select() {
            if (selected && (selected.tool.uid === tool.uid)) {
                if (tool.modeChange) {
                    tool.modeChange();
                    updateStatus();
                }
            } else {
                if (tool.init && tool.init(updateStatus)) {
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

        div = ElementHelper.create("div", {"className": "tool"});
        div.addEventListener("mousedown", select, false);
        tools[tool.uid] = {"select": select, "onload": tool.onload};
        if (keyCode) {
            shortcuts[keyCode] = {"select": select};
            paragraph = ElementHelper.create("p", {"textContent": tool.toString() + " - \u2018" + shortcutName(keyCode) + "\u2019"});
        } else {
            paragraph = ElementHelper.create("p", {"textContent": tool.toString()});
        }
        div.appendChild(paragraph);
        if (tool.canvas) {
            tool.canvas.style.width = (editor.retina ? tool.canvas.width / 2 : tool.canvas.width) + "px";
            tool.canvas.style.height = (editor.retina ? tool.canvas.height / 2 : tool.canvas.height) + "px";
            tool.canvas.style.verticalAlign = "bottom";
            divCanvasContainer = ElementHelper.create("div", {"style": {"width": tool.canvas.style.width, "height": tool.canvas.style.height, "margin": "0 auto", "padding": "1px 0px"}});
            divCanvasContainer.appendChild(tool.canvas);
            div.appendChild(divCanvasContainer);
        }

        document.getElementById(elementId).appendChild(div);

        if (tool.autoselect) {
            select();
        }

        return {
            "select": select
        };
    }

    function keypress(evt) {
        var keyCode;
        keyCode = evt.keyCode || evt.which;
        if (keyCode >= 65 && keyCode <= 90) {
            keyCode += 32;
        }
        if (shortcuts[keyCode]) {
            evt.preventDefault();
            shortcuts[keyCode].select();
        }
    }

    function startListening() {
        document.addEventListener("keypress", keypress, false);
    }

    function stopListening() {
        document.removeEventListener("keypress", keypress);
    }

    function giveFocus(uid) {
        if (tools[uid]) {
            tools[uid].select();
        }
    }

    function init() {
        startListening();
    }

    function onload() {
        Object.keys(tools).forEach(function (key) {
            if (tools[key].onload !== undefined) {
                tools[key].onload();
            }
        });
    }

    return {
        "init": init,
        "editor" : editor,
        "addTool": addTool,
        "startListening": startListening,
        "stopListening": stopListening,
        "giveFocus": giveFocus,
        "onload": onload
    };
}