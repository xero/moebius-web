function undoTool(editor, toolbar) {
    "use strict";

    function init() {
        if (editor.undo()) {
            toolbar.flashGreen("undo");
        } else {
            toolbar.flashRed("undo");
        }
        return false;
    }

    function shiftKey() {
        if (editor.redo()) {
            toolbar.flashGreen("undo");
        } else {
            toolbar.flashRed("undo");
        }
        return false;
    }

    function toString() {
        return "Undo / Redo";
    }

    return {
        "init": init,
        "shiftKey": shiftKey,
        "toString": toString,
        "uid": "undo"
    };
}

AnsiEditController.addTool(undoTool, "tools-right", 122);