function toolbarWidget(editor) {
    "use strict";
    var selected, tools, shortcuts, functionShortcuts;

    shortcuts = [];
    functionShortcuts = [];
    tools = {};

    function addTool(tool, elementId, keyCode, functionKeys) {
        var div, divCanvasContainer, paragraph;

        function shortcutName(code, shiftKey) {
            var keyName;
            switch (code) {
            case 44:
                return "comma";
            case 32:
                return "space";
            default:
                keyName = String.fromCharCode(keyCode);
                return shiftKey ? keyName + " / " + keyName.toUpperCase() : keyName;
            }
        }

        function updateStatus() {
            var title;
            title = tool.toString();
            if (keyCode) {
                title += " - " + shortcutName(keyCode, tool.shiftKey || tool.modeShiftKey);
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

        function select(parameter, shiftKey) {
            var initializer;
            if ((selected && (selected.tool.uid === tool.uid))) {
                if (tool.modeChange) {
                    tool.modeChange(shiftKey);
                    updateStatus();
                }
                if (parameter && tool[parameter]) {
                    tool[parameter]();
                }
            } else {
                if (tool.init) {
                    initializer = shiftKey ? (tool.shiftKey || tool.init) : tool.init;
                    if (initializer()) {
                        if (selected) {
                            selected.div.className = "tool";
                            selected.tool.remove();
                        }
                        selected = {"div": div, "tool": tool};
                        div.className = "tool selected";
                    }
                    if (parameter && tool[parameter]) {
                        tool[parameter]();
                    }
                }
                updateStatus();
            }
        }

        function animationEnd() {
            div.className = "tool";
        }

        div = ElementHelper.create("div", {"className": "tool"});
        div.addEventListener("mousedown", select, false);
        div.addEventListener("animationend", animationEnd, false);
        div.addEventListener("webkitAnimationEnd", animationEnd, false);

        tools[tool.uid] = {"select": select, "onload": tool.onload, "updateStatus": updateStatus, "div": div};
        if (keyCode) {
            shortcuts[keyCode] = {"select": select};
            paragraph = ElementHelper.create("p", {"textContent": tool.toString() + " - " + shortcutName(keyCode, tool.shiftKey || tool.modeShiftKey)});
        } else {
            paragraph = ElementHelper.create("p", {"textContent": tool.toString()});
        }
        if (functionKeys) {
            Object.keys(functionKeys).forEach(function (parameter) {
                functionShortcuts[functionKeys[parameter]] = {"select": select, "parameter": parameter};
            });
        }
        div.appendChild(paragraph);
        if (tool.canvas) {
            tool.canvas.style.width = (editor.getRetina() ? tool.canvas.width / 2 : tool.canvas.width) + "px";
            tool.canvas.style.height = (editor.getRetina() ? tool.canvas.height / 2 : tool.canvas.height) + "px";
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

    function keydown(evt) {
        var keyCode;
        keyCode = evt.keyCode || evt.which;
        if (keyCode >= 112 && keyCode <= 122) {
            evt.preventDefault();
            if (functionShortcuts[keyCode]) {
                functionShortcuts[keyCode].select(functionShortcuts[keyCode].parameter, evt.shiftKey);
            }
        }
    }

    function keypress(evt) {
        var keyCode;
        keyCode = evt.keyCode || evt.which;
        if (keyCode >= 65 && keyCode <= 90) {
            keyCode += 32;
        }
        if (shortcuts[keyCode]) {
            evt.preventDefault();
            shortcuts[keyCode].select(undefined, evt.shiftKey);
        }
    }

    function startListening() {
        document.addEventListener("keydown", keydown, false);
        document.addEventListener("keypress", keypress, false);
    }

    function stopListening() {
        document.removeEventListener("keydown", keydown, false);
        document.removeEventListener("keypress", keypress, false);
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

    function updateStatus(uid) {
        if (tools[uid] !== undefined) {
            tools[uid].updateStatus();
        }
    }

    function flash(uid) {
        if (tools[uid] !== undefined) {
            tools[uid].div.className = "tool flash";
        }
    }

    return {
        "init": init,
        "editor" : editor,
        "addTool": addTool,
        "startListening": startListening,
        "stopListening": stopListening,
        "giveFocus": giveFocus,
        "updateStatus": updateStatus,
        "flash": flash,
        "onload": onload
    };
}