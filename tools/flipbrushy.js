function flipBrushYTool(editor) {
    "use strict";

    function init() {
        editor.canvas.dispatchEvent(new CustomEvent("flipbrushy"));
        return false;
    }

    function toString() {
        return "Custom Brush FlipY";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "flipbrushy"
    };
}

AnsiEditController.addTool(flipBrushYTool, "tools-right", 93);