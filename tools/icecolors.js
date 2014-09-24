function iceColorsTool(editor, toolbar) {
    "use strict";
    var noblink;

    noblink = false;

    function changeMode(newMode) {
        noblink = newMode;
        editor.setBlinkStatus(noblink);
    }

    editor.addBlinkModeChangeListener(function (value) {
        if (value !== noblink) {
            noblink = value;
            toolbar.updateStatus("icecolors");
        }
    }, false);

    function init() {
        var modal;

        function dismiss() {
            modal.remove();
            toolbar.startListening();
        }

        if (!noblink) {
            changeMode(true);
        } else {
            modal = modalBox();

            modal.addPanel(ElementHelper.create("p", {"textContent": "Warning: Turning iCE Colors off can be a destructive operation if you have already drawn on the canvas, or have a custom brush with iCE colors turned on."}));

            modal.addButton("default", {"textContent": "Turn iCE Colors Off", "href": "#", "onclick": function (evt) {
                evt.preventDefault();
                changeMode(false);
                dismiss();
                toolbar.updateStatus("icecolors");
            }});

            modal.addButton("cancel", {"textContent": "Cancel", "href": "#", "onclick": function (evt) {
                evt.preventDefault();
                dismiss();
            }});

            toolbar.stopListening();
            modal.init();
        }
        return false;
    }

    function toString() {
        return "iCE Colors " + (noblink ? "On" : "Off");
    }

    function isEnabled() {
        return noblink;
    }

    function onload() {
        if (editor.getBlinkStatus() !== noblink) {
            noblink = !noblink;
            toolbar.updateStatus("icecolors");
        }
    }

    return {
        "init": init,
        "toString": toString,
        "isEnabled": isEnabled,
        "onload": onload,
        "uid": "icecolors"
    };
}

AnsiEditController.addTool(iceColorsTool, "tools-left");