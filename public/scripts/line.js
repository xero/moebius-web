function createLineController() {
    "use strict";
    var startXY;
    var endXY;

    function canvasDown(evt) {
        startXY = evt.detail;
    }

    function canvasUp() {
        toolPreview.clear();
        var foreground = palette.getForegroundColour();
        textArtCanvas.startUndo();
        textArtCanvas.drawHalfBlock((draw) => {
            line(startXY.x, startXY.halfBlockY, endXY.x, endXY.halfBlockY, function (lineX, lineY) {
                draw(foreground, lineX, lineY);
            });
        });
        startXY = undefined;
        endXY = undefined;
    }

    function canvasDrag(evt) {
        if (startXY !== undefined) {
            if (endXY === undefined || (evt.detail.x !== endXY.x || evt.detail.y !== endXY.y || evt.detail.halfBlockY !== endXY.halfBlockY)) {
                if (endXY !== undefined) {
                    toolPreview.clear();
                }
                endXY = evt.detail;
                var foreground = palette.getForegroundColour();
                line(startXY.x, startXY.halfBlockY, endXY.x, endXY.halfBlockY, function (lineX, lineY) {
                    toolPreview.drawHalfBlock(foreground, lineX, lineY);
                });
            }
        }
    }

    function enable() {
        document.addEventListener("onTextCanvasDown", canvasDown);
        document.addEventListener("onTextCanvasUp", canvasUp);
        document.addEventListener("onTextCanvasDrag", canvasDrag);
    }

    function disable() {
        document.removeEventListener("onTextCanvasDown", canvasDown);
        document.removeEventListener("onTextCanvasUp", canvasUp);
        document.removeEventListener("onTextCanvasDrag", canvasDrag);
    }

    return {
        "enable": enable,
        "disable": disable
    };
}
