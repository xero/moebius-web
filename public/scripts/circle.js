function createCircleController() {
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
        var sx, sy, width, height;
        sx = startXY.x;
        sy = startXY.halfBlockY;
        width = Math.abs(endXY.x - startXY.x);
        height = Math.abs(endXY.halfBlockY - startXY.halfBlockY);
        return {
            "sx": sx,
            "sy": sy,
            "width": width,
            "height": height
        };
    }

    function ellipseOutline(sx, sy, width, height, callback) {
        var a2 = width * width;
        var b2 = height * height;
        var fa2 = 4 * a2;
        var fb2 = 4 * b2;
        for (var px = 0, py = height, sigma = 2 * b2 + a2 * (1 - 2 * height); b2 * px <= a2 * py; px += 1) {
            callback(sx + px, sy + py);
            callback(sx - px, sy + py);
            callback(sx + px, sy - py);
            callback(sx - px, sy - py);
            if (sigma >= 0) {
                sigma += fa2 * (1 - py);
                py -= 1;
            }
            sigma += b2 * ((4 * px) + 6);
        }
        for (var px = width, py = 0, sigma = 2 * a2 + b2 * (1 - 2 * width); a2 * py <= b2 * px; py += 1) {
            callback(sx + px, sy + py);
            callback(sx - px, sy + py);
            callback(sx + px, sy - py);
            callback(sx - px, sy - py);
            if (sigma >= 0) {
                sigma += fb2 * (1 - px);
                px -= 1;
            }
            sigma += a2 * ((4 * py) + 6);
        }
    }

    function ellipseFilled(sx, sy, width, height, callback) {
        var a2 = width * width;
        var b2 = height * height;
        var fa2 = 4 * a2;
        var fb2 = 4 * b2;
        for (var px = 0, py = height, sigma = 2 * b2 + a2 * (1 - 2 * height); b2 * px <= a2 * py; px += 1) {
            var amount = px * 2;
            var start = sx - px;
            var y0 = sy + py;
            var y1 = sy - py;
            for (var i = 0; i < amount; i++) {
                callback(start + i, y0);
                callback(start + i, y1);
            }
            if (sigma >= 0) {
                sigma += fa2 * (1 - py);
                py -= 1;
            }
            sigma += b2 * ((4 * px) + 6);
        }
        for (var px = width, py = 0, sigma = 2 * a2 + b2 * (1 - 2 * width); a2 * py <= b2 * px; py += 1) {
            var amount = px * 2;
            var start = sx - px;
            var y0 = sy + py;
            var y1 = sy - py;
            for (var i = 0; i < amount; i++) {
                callback(start + i, y0);
                callback(start + i, y1);
            }
            if (sigma >= 0) {
                sigma += fb2 * (1 - px);
                px -= 1;
            }
            sigma += a2 * ((4 * py) + 6);
        }
    }

    function canvasUp() {
        toolPreview.clear();
        var coords = processCoords();
        var foreground = palette.getForegroundColour();
        textArtCanvas.startUndo();
        var columns = textArtCanvas.getColumns();
        var rows = textArtCanvas.getRows();
        var doubleRows = rows * 2;
        textArtCanvas.drawHalfBlock((draw) => {
            if (outlineMode === true) {
                ellipseOutline(coords.sx, coords.sy, coords.width, coords.height, (px, py) => {
                    if (px >= 0 && px < columns && py >= 0 && py < doubleRows) {
                        draw(foreground, px, py);
                    }
                });
            } else {
                ellipseFilled(coords.sx, coords.sy, coords.width, coords.height, (px, py) => {
                    if (px >= 0 && px < columns && py >= 0 && py < doubleRows) {
                        draw(foreground, px, py);
                    }
                });
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
                var columns = textArtCanvas.getColumns();
                var rows = textArtCanvas.getRows();
                var doubleRows = rows * 2;
                if (outlineMode === true) {
                    ellipseOutline(coords.sx, coords.sy, coords.width, coords.height, (px, py) => {
                        if (px >= 0 && px < columns && py >= 0 && py < doubleRows) {
                            toolPreview.drawHalfBlock(foreground, px, py);
                        }
                    });
                } else {
                    ellipseFilled(coords.sx, coords.sy, coords.width, coords.height, (px, py) => {
                        if (px >= 0 && px < columns && py >= 0 && py < doubleRows) {
                            toolPreview.drawHalfBlock(foreground, px, py);
                        }
                    });
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
