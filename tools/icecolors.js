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
        var modal, paragraphs;

        function dismiss() {
            modal.remove();
            editor.startListening();
            toolbar.startListening();
        }

        if (!noblink) {
            changeMode(true);
        } else {
            modal = modalBox();

            paragraphs = [
                ElementHelper.create("p", {"textContent": "Warning: Turning iCE Colors off can be a destructive operation if you have already drawn on the canvas."}),
                ElementHelper.create("p", {"textContent": "Your undo and redo buffer will also be destroyed."})
            ];

            paragraphs.forEach(function (paragraph) {
                modal.addPanel(paragraph);
            });

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

            editor.stopListening();
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