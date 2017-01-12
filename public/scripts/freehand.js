function line(x0, y0, x1, y1, callback) {
    "use strict";
    var dx = Math.abs(x1 - x0);
    var sx = (x0 < x1) ? 1 : -1;
    var dy = Math.abs(y1 - y0);
    var sy = (y0 < y1) ? 1 : -1;
    var err = ((dx > dy) ? dx : -dy) / 2;
    var e2;

    while (true) {
        callback(x0, y0);
        if (x0 === x1 && y0 === y1) {
            break;
        }
        e2 = err;
        if (e2 > -dx) {
            err -= dy;
            x0 += sx;
        }
        if (e2 < dy) {
            err += dx;
            y0 += sy;
        }
    }
}

function createFreehandController(panel) {
    "use strict";
    var prev = {};
    var drawMode;

    function draw(coords) {
        if (prev.x !== coords.x || prev.y !== coords.y || prev.halfBlockY !== coords.halfBlockY) {
            if (drawMode.halfBlockMode === true) {
                var colour = (coords.leftMouseButton === true) ? palette.getForegroundColour() : palette.getBackgroundColour();
                if (Math.abs(prev.x - coords.x) > 1 || Math.abs(prev.halfBlockY - coords.halfBlockY) > 1) {
                    textArtCanvas.drawHalfBlock((callback) => {
                        line(prev.x, prev.halfBlockY, coords.x, coords.halfBlockY, (x, y) => {
                            callback(colour, x, y);
                        });
                    });
                } else {
                    textArtCanvas.drawHalfBlock((callback) => {
                        callback(colour, coords.x, coords.halfBlockY);
                    });
                }
            } else {
                if (Math.abs(prev.x - coords.x) > 1 || Math.abs(prev.y - coords.y) > 1) {
                    textArtCanvas.draw((callback) => {
                        line(prev.x, prev.y, coords.x, coords.y, (x, y) => {
                            callback(drawMode.charCode, drawMode.foreground, drawMode.background, x, y);
                        });
                    });
                } else {
                    textArtCanvas.draw((callback) => {
                        callback(drawMode.charCode, drawMode.foreground, drawMode.background, coords.x, coords.y);
                    });
                }
            }
            positionInfo.update(coords.x, coords.y);
            prev = coords;
        }
    }

    function canvasUp() {
        prev = {};
    }

    function canvasDown(evt) {
        drawMode = panel.getMode();
        textArtCanvas.startUndo();
        draw(evt.detail);
    }

    function canvasDrag(evt) {
        draw(evt.detail);
    }

    function enable() {
        document.addEventListener("onTextCanvasDown", canvasDown);
        document.addEventListener("onTextCanvasUp", canvasUp);
        document.addEventListener("onTextCanvasDrag", canvasDrag);
        panel.enable();
    }

    function disable() {
        document.removeEventListener("onTextCanvasDown", canvasDown);
        document.removeEventListener("onTextCanvasUp", canvasUp);
        document.removeEventListener("onTextCanvasDrag", canvasDrag);
        panel.disable();
    }

    return {
        "enable": enable,
        "disable": disable,
        "select": panel.select,
        "ignore": panel.ignore,
        "unignore": panel.unignore
    };
}
