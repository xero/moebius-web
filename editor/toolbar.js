function toolbarWidget(editor) {
    "use strict";
    var selected, shortcuts;

    shortcuts = [];

    function addTool(tool, elementId, keyCode) {
        var div, divCanvasContainer, paragraph;

        function updateStatus(text) {
            var title;
            title = tool.toString();
            if (text) {
                title += " - " + text;
            }
            if (keyCode) {
                title += " (" + String.fromCharCode(keyCode) + ")";
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
        if (keyCode) {
            shortcuts[keyCode] = select;
            paragraph = ElementHelper.create("p", {"textContent": tool.toString() + " (" + String.fromCharCode(keyCode) + ")"});
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
        if (shortcuts[keyCode]) {
            evt.preventDefault();
            shortcuts[keyCode]();
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
        "editor" : editor,
        "addTool": addTool,
        "startListening": startListening,
        "stopListening": stopListening
    };
}