function createSelectionTool(divElement) {
    "use strict";
    function canvasDown(evt) {
        selectionCursor.setStart(evt.detail.x, evt.detail.y);
        selectionCursor.setEnd(evt.detail.x, evt.detail.y);
    }

    function canvasDrag(evt) {
        selectionCursor.setEnd(evt.detail.x, evt.detail.y);
    }

    function enable() {
        document.addEventListener("onTextCanvasDown", canvasDown);
        document.addEventListener("onTextCanvasDrag", canvasDrag);
    }

    function disable() {
        selectionCursor.hide();
        document.removeEventListener("onTextCanvasDown", canvasDown);
        document.removeEventListener("onTextCanvasDrag", canvasDrag);
        pasteTool.disable();
    }

    return {
        "enable": enable,
        "disable": disable
    };
}
