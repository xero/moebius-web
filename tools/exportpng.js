function exportPNG(editor, toolbar) {
    "use strict";

    function init() {
        Savers.saveCanvas(editor.renderImageData(editor.getImageData(0, 0, editor.columns, editor.getHighestRow(), false)), "ansiedit.png");

        return false;
    }

    function toString() {
        return "Export as PNG";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "exportPNG"
    };
}

AnsiEditController.addTool(exportPNG, "tools-left");