function toolbarWidget(retina) {
    "use strict";
    var selected, shortcuts;

    shortcuts = [];

    function addTool(tool, shortcut) {
        var div, divCanvasContainer, paragraph;

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

        div = ElementHelper.create("div", {"className": "tool"});
        div.addEventListener("mousedown", select, false);
        if (shortcut) {
            shortcuts[shortcut.keyCode] = select;
            paragraph = ElementHelper.create("p", {"textContent": tool.toString() + " (" + shortcut.symbol + ")"});
        } else {
            paragraph = ElementHelper.create("p", {"textContent": tool.toString()});
        }
        div.appendChild(paragraph);
        if (tool.canvas) {
            tool.canvas.style.width = (retina ? tool.canvas.width / 2 : tool.canvas.width) + "px";
            tool.canvas.style.height = (retina ? tool.canvas.height / 2 : tool.canvas.height) + "px"
            tool.canvas.style.verticalAlign = "bottom";
            divCanvasContainer = ElementHelper.create("div", {"style": {"width": tool.canvas.style.width, "height": tool.canvas.style.height, "margin": "0 auto", "padding": "1px 0px"}});
            divCanvasContainer.appendChild(tool.canvas);
            div.appendChild(divCanvasContainer);
        }
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