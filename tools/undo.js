function undoTool(editor) {
    "use strict";

    function init() {
        editor.undo();
        return false;
    }

    function shiftKey() {
        editor.redo();
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