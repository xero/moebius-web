function undoTool(editor) {
    "use strict";

    function init() {
        editor.undo();
        return false;
    }

    function toString() {
        return "Undo";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "undo"
    };
}

AnsiEditController.addTool(undoTool, "tools-right", 122);