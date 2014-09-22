function exportPNG(editor, toolbar) {
    "use strict";

    function init() {
        Savers.saveCanvas(editor.renderImageData(editor.getImageData(0, 0, editor.getColumns(), editor.getRows(), false)), toolbar.getTitleText() + ".png");
        return false;
    }

    function toString() {
        return "Export as PNG";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "export-png"
    };
}

AnsiEditController.addTool(exportPNG, "tools-left");