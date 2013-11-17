function clearTool(editor) {
    "use strict";

    function init() {
        var i;
        for (i = 0; i < editor.image.length; ++i) {
            editor.image[i] = 0;
        }
        editor.redraw();
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