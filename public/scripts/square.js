function createSquareController() {
    "use strict";
    var panel = createFloatingPanel(50, 30);
    var palettePanel = createFloatingPanelPalette(160, 40);
    var startXY;
    var endXY;
    var outlineMode = true;
    var outlineToggle = createToggleButton("Outline", "Filled", () => {
        outlineMode = true;
    }, () => {
        outlineMode = false;
    });

    function canvasDown(evt) {
        startXY = evt.detail;
    }

    function processCoords() {
        var x0, y0, x1, y1;
        if (startXY.x < endXY.x) {
            x0 = startXY.x;
            x1 = endXY.x;
        } else {
            x0 = endXY.x;
            x1 = startXY.x;
        }
        if (startXY.halfBlockY < endXY.halfBlockY) {
            y0 = startXY.halfBlockY;
            y1 = endXY.halfBlockY;
        } else {
            y0 = endXY.halfBlockY;
            y1 = startXY.halfBlockY;
        }
        return {"x0": x0, "y0": y0, "x1": x1, "y1": y1};
    }

    function canvasUp() {
        toolPreview.clear();
        var coords = processCoords();
        var foreground = palette.getForegroundColour();
        textArtCanvas.startUndo();
        textArtCanvas.drawHalfBlock((draw) => {
            if (outlineMode === true) {
                for (var px = coords.x0; px <= coords.x1; px++) {
                    draw(foreground, px, coords.y0);
                    draw(foreground, px, coords.y1);
                }
                for (var py = coords.y0 + 1; py < coords.y1; py++) {
                    draw(foreground, coords.x0, py);
                    draw(foreground, coords.x1, py);
                }
            } else {
                for (var py = coords.y0; py <= coords.y1; py++) {
                    for (var px = coords.x0; px <= coords.x1; px++) {
                        draw(foreground, px, py);
                    }
                }
            }
        });
        startXY = undefined;
        endXY = undefined;
    }

    function canvasDrag(evt) {
        if (startXY !== undefined) {
            if (evt.detail.x !== startXY.x || evt.detail.y !== startXY.y || evt.detail.halfBlockY !== startXY.halfBlockY) {
                if (endXY !== undefined) {
                    toolPreview.clear();
                }
                endXY = evt.detail;
                var coords = processCoords();
                var foreground = palette.getForegroundColour();
                if (outlineMode === true) {
                    for (var px = coords.x0; px <= coords.x1; px++) {
                        toolPreview.drawHalfBlock(foreground, px, coords.y0);
                        toolPreview.drawHalfBlock(foreground, px, coords.y1);
                    }
                    for (var py = coords.y0 + 1; py < coords.y1; py++) {
                        toolPreview.drawHalfBlock(foreground, coords.x0, py);
                        toolPreview.drawHalfBlock(foreground, coords.x1, py);
                    }
                } else {
                    for (var py = coords.y0; py <= coords.y1; py++) {
                        for (var px = coords.x0; px <= coords.x1; px++) {
                            toolPreview.drawHalfBlock(foreground, px, py);
                        }
                    }
                }
            }
        }
    }

    function enable() {
        panel.enable();
        document.addEventListener("onTextCanvasDown", canvasDown);
        document.addEventListener("onTextCanvasUp", canvasUp);
        document.addEventListener("onTextCanvasDrag", canvasDrag);
    }

    function disable() {
        panel.disable();
        document.removeEventListener("onTextCanvasDown", canvasDown);
        document.removeEventListener("onTextCanvasUp", canvasUp);
        document.removeEventListener("onTextCanvasDrag", canvasDrag);
    }

    panel.append(palettePanel.getElement());
    palettePanel.showCursor();
    panel.append(outlineToggle.getElement());
    if (outlineMode === true) {
        outlineToggle.setStateOne();
    } else {
        outlineToggle.setStateTwo();
    }

    return {
        "enable": enable,
        "disable": disable
    };
}
