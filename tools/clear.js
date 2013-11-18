function clearTool(editor) {
    "use strict";

    function init() {
        editor.clearImage();
        editor.clearUndoHistory();
        return false;
    }

    function toString() {
        return "Clear";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "clear"
    };
}