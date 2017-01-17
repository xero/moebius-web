function createPanelCursor(divElement) {
    "use strict";
    var cursor = createCanvas(0, 0);
    cursor.classList.add("cursor");
    divElement.appendChild(cursor);

    function show() {
        cursor.style.display = "block";
    }

    function hide() {
        cursor.style.display = "none";
    }

    function resize(width, height) {
        cursor.style.width = width + "px";
        cursor.style.height = height + "px";
    }

    function setPos(x, y) {
        cursor.style.left = x - 2 + "px";
        cursor.style.top = y - 2 + "px";
    }

    return {
        "show": show,
        "hide": hide,
        "resize": resize,
        "setPos": setPos
    };
}

function createFloatingPanelPalette(width, height) {
    "use strict";
    var canvasContainer = document.createElement("DIV");
    var cursor = createPanelCursor(canvasContainer);
    var canvas = createCanvas(width, height);
    canvasContainer.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var imageData = new Array(16);

    function generateSwatch(colour) {
        imageData[colour] = ctx.createImageData(width / 8, height / 2);
        var rgba = palette.getRGBAColour(colour);
        for (var y = 0, i = 0; y < imageData[colour].height; y++) {
            for (var x = 0; x < imageData[colour].width; x++, i += 4) {
                imageData[colour].data.set(rgba, i);
            }
        }
    }

    function generateSwatches() {
        for (var colour = 0; colour < 16; colour++) {
            generateSwatch(colour);
        }
    }

    function redrawSwatch(colour) {
        ctx.putImageData(imageData[colour], (colour % 8) * (width / 8), (colour > 7) ? 0 : (height / 2));
    }

    function redrawSwatches() {
        for (var colour = 0; colour < 16; colour++) {
            redrawSwatch(colour);
        }
    }

    function mouseDown(evt) {
        var rect = canvas.getBoundingClientRect();
        var mouseX = evt.clientX - rect.left;
        var mouseY = evt.clientY - rect.top;
        var colour = Math.floor(mouseX / (width / 8)) + ((mouseY < (height / 2)) ? 8 : 0);
        if (evt.ctrlKey === false && evt.which != 3) {
            palette.setForegroundColour(colour);
        } else {
            palette.setBackgroundColour(colour);
        }
    }

    function updateColour(colour) {
        generateSwatch(colour);
        redrawSwatch(colour);
    }

    function updatePalette() {
        for (var colour = 0; colour < 16; colour++) {
            updateColour(colour);
        }
    }

    function getElement() {
        return canvasContainer;
    }

    function updateCursor(colour) {
        cursor.resize(width / 8, height / 2);
        cursor.setPos((colour % 8) * (width / 8), (colour > 7) ? 0 : (height / 2));
    }

    function onForegroundChange(evt) {
        updateCursor(evt.detail);
    }

    function resize(newWidth, newHeight) {
        width = newWidth;
        height = newHeight;
        canvas.width = width;
        canvas.height = height;
        generateSwatches();
        redrawSwatches();
        updateCursor(palette.getForegroundColour());
    }

    generateSwatches();
    redrawSwatches();
    updateCursor(palette.getForegroundColour());
    canvas.addEventListener("mousedown", mouseDown);
    canvas.addEventListener("contextmenu", (evt) => {
        evt.preventDefault();
    });
    document.addEventListener("onForegroundChange", onForegroundChange);

    return {
        "updateColour": updateColour,
        "updatePalette": updatePalette,
        "getElement": getElement,
        "showCursor": cursor.show,
        "hideCursor": cursor.hide,
        "resize": resize
    };
}

function createFloatingPanel(x, y) {
    "use strict";
    var panel = document.createElement("DIV");
    panel.classList.add("floating-panel");
    $("body-container").appendChild(panel);
    var enabled = false;
    var prev;

    function setPos(newX, newY) {
        panel.style.left = newX + "px";
        x = newX;
        panel.style.top = newY + "px";
        y = newY;
    }

    function mousedown(evt) {
        prev = [evt.clientX, evt.clientY];
    }

    function mouseMove(evt) {
        if (evt.which === 1 && prev !== undefined) {
            evt.preventDefault();
            evt.stopPropagation();
            var rect = panel.getBoundingClientRect();
            setPos(rect.left + (evt.clientX - prev[0]), rect.top + (evt.clientY - prev[1]));
            prev = [evt.clientX, evt.clientY];
        }
    }

    function mouseUp() {
        prev = undefined;
    }

    function enable() {
        panel.classList.add("enabled");
        enabled = true;
        document.addEventListener("mousemove", mouseMove);
        document.addEventListener("mouseup", mouseUp);
    }

    function disable() {
        panel.classList.remove("enabled");
        enabled = false;
        document.removeEventListener("mousemove", mouseMove);
        document.removeEventListener("mouseup", mouseUp);
    }

    function append(element) {
        panel.appendChild(element);
    }

    setPos(x, y);
    panel.addEventListener("mousedown", mousedown);

    return {
        "setPos": setPos,
        "enable": enable,
        "disable": disable,
        "append": append
    };
}

function createFreehandController(panel) {
    "use strict";
    var prev = {};
    var drawMode;

    function line(x0, y0, x1, y1, callback) {
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

function createShadingPanel() {
    "use strict";
    var panelWidth = font.getWidth() * 20;
    var panel = createFloatingPanel(50, 30);
    var palettePanel = createFloatingPanelPalette(panelWidth, 40);
    var canvasContainer = document.createElement("div");
    var cursor = createPanelCursor(canvasContainer);
    var canvases = new Array(16);
    var halfBlockMode = true;
    var x = 0;
    var y = 0;
    var ignored = false;

    function updateCursor() {
        var width = canvases[0].width / 5;
        var height = canvases[0].height / 15;
        cursor.resize(width, height);
        cursor.setPos(x * width, y * height);
    }

    function mouseDownGenerator(colour) {
        return function (evt) {
            var rect = canvases[colour].getBoundingClientRect();
            var mouseX = evt.clientX - rect.left;
            var mouseY = evt.clientY - rect.top;
            halfBlockMode = false;
            x = Math.floor(mouseX / (canvases[colour].width / 5));
            y = Math.floor(mouseY / (canvases[colour].height / 15));
            palettePanel.hideCursor();
            updateCursor();
            cursor.show();
        };
    }

    function generateCanvases() {
        var fontHeight = font.getHeight();
        for (var foreground = 0; foreground < 16; foreground++) {
            var canvas = createCanvas(panelWidth, fontHeight * 15);
            var ctx = canvas.getContext("2d");
            var y = 0;
            for (var background = 0; background < 8; background++) {
                if (foreground !== background) {
                    for (var i = 0; i < 4; i++) {
                        font.draw(219, foreground, background, ctx, i, y);
                    }
                    for (var i = 4; i < 8; i++) {
                        font.draw(178, foreground, background, ctx, i, y);
                    }
                    for (var i = 8; i < 12; i++) {
                        font.draw(177, foreground, background, ctx, i, y);
                    }
                    for (var i = 12; i < 16; i++) {
                        font.draw(176, foreground, background, ctx, i, y);
                    }
                    for (var i = 16; i < 20; i++) {
                        font.draw(0, foreground, background, ctx, i, y);
                    }
                    y += 1;
                }
            }
            for (var background = 8; background < 16; background++) {
                if (foreground !== background) {
                    for (var i = 0; i < 4; i++) {
                        font.draw(219, foreground, background, ctx, i, y);
                    }
                    for (var i = 4; i < 8; i++) {
                        font.draw(178, foreground, background, ctx, i, y);
                    }
                    for (var i = 8; i < 12; i++) {
                        font.draw(177, foreground, background, ctx, i, y);
                    }
                    for (var i = 12; i < 16; i++) {
                        font.draw(176, foreground, background, ctx, i, y);
                    }
                    for (var i = 16; i < 20; i++) {
                        font.draw(0, foreground, background, ctx, i, y);
                    }
                    y += 1;
                }
            }
            canvas.addEventListener("mousedown", mouseDownGenerator(foreground));
            canvases[foreground] = canvas;
        }
    }

    function keyDown(evt) {
        if (ignored === false) {
            var keyCode = (evt.keyCode || evt.which);
            if (halfBlockMode === false) {
                switch(keyCode) {
                case 37:
                    evt.preventDefault();
                    x = Math.max(x - 1, 0);
                    updateCursor();
                    break;
                case 38:
                    evt.preventDefault();
                    y = Math.max(y - 1, 0);
                    updateCursor();
                    break;
                case 39:
                    evt.preventDefault();
                    x = Math.min(x + 1, 4);
                    updateCursor();
                    break;
                case 40:
                    evt.preventDefault();
                    y = Math.min(y + 1, 14);
                    updateCursor();
                    break;
                default:
                    break;
                }
            } else if (keyCode >= 37 && keyCode <= 40) {
                evt.preventDefault();
                halfBlockMode = false;
                palettePanel.hideCursor();
                cursor.show();
            }
        }
    }

    function enable() {
        document.addEventListener("keydown", keyDown);
        panel.enable();
    }

    function disable() {
        document.removeEventListener("keydown", keyDown);
        panel.disable();
    }

    function ignore() {
        ignored = true;
    }

    function unignore() {
        ignored = false;
    }

    function getMode() {
        var charCode = 0;
        switch(x) {
            case 0: charCode = 219; break;
            case 1: charCode = 178; break;
            case 2: charCode = 177; break;
            case 3: charCode = 176; break;
            case 4: charCode = 0; break;
            default: break;
        }
        var foreground = palette.getForegroundColour();
        var background = y;
        if (y >= foreground) {
            background += 1;
        }
        return {
            "halfBlockMode": halfBlockMode,
            "foreground": foreground,
            "background": background,
            "charCode": charCode
        };
    }

    function foregroundChange(evt) {
        canvasContainer.removeChild(canvasContainer.firstChild);
        canvasContainer.insertBefore(canvases[evt.detail], canvasContainer.firstChild);
        palettePanel.showCursor();
        cursor.hide();
        halfBlockMode = true;
    }

    function fontChange() {
        panelWidth = font.getWidth() * 20;
        palettePanel.resize(panelWidth, 40);
        generateCanvases();
        updateCursor();
        canvasContainer.removeChild(canvasContainer.firstChild);
        canvasContainer.insertBefore(canvases[palette.getForegroundColour()], canvasContainer.firstChild);
    }

    function select(charCode) {
        halfBlockMode = false;
        x = 3 - (charCode - 176);
        y = palette.getBackgroundColour();
        if (y > palette.getForegroundColour()) {
            y -= 1;
        }
        palettePanel.hideCursor();
        updateCursor();
        cursor.show();
    }

    document.addEventListener("onForegroundChange", foregroundChange);
    document.addEventListener("onLetterSpacingChange", fontChange);
    document.addEventListener("onFontChange", fontChange);

    palettePanel.showCursor();
    panel.append(palettePanel.getElement());
    generateCanvases();
    updateCursor();
    canvasContainer.insertBefore(canvases[palette.getForegroundColour()], canvasContainer.firstChild);
    panel.append(canvasContainer);
    cursor.hide();

    return {
        "enable": enable,
        "disable": disable,
        "getMode": getMode,
        "select": select,
        "ignore": ignore,
        "unignore": unignore
    };
}

function createCharacterBrushPanel() {
    "use strict";
    var panelWidth = font.getWidth() * 16;
    var panel = createFloatingPanel(50, 30);
    var palettePanel = createFloatingPanelPalette(panelWidth, 40);
    var canvasContainer = document.createElement("div");
    var cursor = createPanelCursor(canvasContainer);
    var canvas = createCanvas(panelWidth, font.getHeight() * 16);
    var ctx = canvas.getContext("2d");
    var x = 0;
    var y = 0;
    var ignored = false;

    function updateCursor() {
        var width = canvas.width / 16;
        var height = canvas.height / 16;
        cursor.resize(width, height);
        cursor.setPos(x * width, y * height);
    }

    function redrawCanvas() {
        var foreground = palette.getForegroundColour();
        var background = palette.getBackgroundColour();
        for (var y = 0, charCode = 0; y < 16; y++) {
            for (var x = 0; x < 16; x++, charCode++) {
                font.draw(charCode, foreground, background, ctx, x, y);
            }
        }
    }

    function keyDown(evt) {
        if (ignored === false) {
            var keyCode = (evt.keyCode || evt.which);
            switch(keyCode) {
            case 37:
                evt.preventDefault();
                x = Math.max(x - 1, 0);
                updateCursor();
                break;
            case 38:
                evt.preventDefault();
                y = Math.max(y - 1, 0);
                updateCursor();
                break;
            case 39:
                evt.preventDefault();
                x = Math.min(x + 1, 15);
                updateCursor();
                break;
            case 40:
                evt.preventDefault();
                y = Math.min(y + 1, 15);
                updateCursor();
                break;
            default:
                break;
            }
        }
    }

    function enable() {
        document.addEventListener("keydown", keyDown);
        panel.enable();
    }

    function disable() {
        document.removeEventListener("keydown", keyDown);
        panel.disable();
    }

    function getMode() {
        var charCode = y * 16 + x;
        return {
            "halfBlockMode": false,
            "foreground": palette.getForegroundColour(),
            "background": palette.getBackgroundColour(),
            "charCode": charCode
        };
    }

    function resizeCanvas() {
        panelWidth = font.getWidth() * 16;
        palettePanel.resize(panelWidth, 40);
        canvas.width = panelWidth;
        canvas.height = font.getHeight() * 16;
        redrawCanvas();
        updateCursor();
    }

    function mouseDown(evt) {
        var rect = canvas.getBoundingClientRect();
        var mouseX = evt.clientX - rect.left;
        var mouseY = evt.clientY - rect.top;
        x = Math.floor(mouseX / (canvas.width / 16));
        y = Math.floor(mouseY / (canvas.height / 16));
        updateCursor();
    }

    function select(charCode) {
        x = charCode % 16;
        y = Math.floor(charCode / 16);
        updateCursor();
    }

    function ignore() {
        ignored = true;
    }

    function unignore() {
        ignored = false;
    }

    document.addEventListener("onForegroundChange", redrawCanvas);
    document.addEventListener("onBackgroundChange", redrawCanvas);
    document.addEventListener("onLetterSpacingChange", resizeCanvas);
    document.addEventListener("onFontChange", resizeCanvas);
    canvas.addEventListener("mousedown", mouseDown);

    panel.append(palettePanel.getElement());
    updateCursor();
    cursor.show();
    canvasContainer.appendChild(canvas);
    panel.append(canvasContainer);
    redrawCanvas();

    return {
        "enable": enable,
        "disable": disable,
        "getMode": getMode,
        "select": select,
        "ignore": ignore,
        "unignore": unignore
    };
}

function createFillController() {
    "use strict";

    function fillPoint(evt) {
        var block = textArtCanvas.getHalfBlock(evt.detail.x, evt.detail.halfBlockY);
        if (block.isBlocky) {
            var targetColour = (block.halfBlockY === 0) ? block.upperBlockColour : block.lowerBlockColour;
            var fillColour = palette.getForegroundColour();
            if (targetColour !== fillColour) {
                var columns = textArtCanvas.getColumns();
                var rows = textArtCanvas.getRows();
                var coord = [evt.detail.x, evt.detail.halfBlockY];
                var queue = [coord];
                textArtCanvas.startUndo();
                textArtCanvas.drawHalfBlock((callback) => {
                    while (queue.length !== 0) {
                        coord = queue.pop();
                        block = textArtCanvas.getHalfBlock(coord[0], coord[1]);
                        if (block.isBlocky && (((block.halfBlockY === 0) && (block.upperBlockColour === targetColour)) || ((block.halfBlockY === 1) && (block.lowerBlockColour === targetColour)))) {
                            callback(fillColour, coord[0], coord[1]);
                            if (coord[0] > 0) {
                                queue.push([coord[0] - 1, coord[1], 0]);
                            }
                            if (coord[0] < columns - 1) {
                                queue.push([coord[0] + 1, coord[1], 1]);
                            }
                            if (coord[1] > 0) {
                                queue.push([coord[0], coord[1] - 1, 2]);
                            }
                            if (coord[1] < rows * 2 - 1) {
                                queue.push([coord[0], coord[1] + 1, 3]);
                            }
                        } else if (block.isVerticalBlocky) {
                            if (coord[2] !== 0 && block.leftBlockColour === targetColour) {
                                textArtCanvas.draw(function (callback) {
                                    callback(221, fillColour, block.rightBlockColour, coord[0], block.textY);
                                });
                                if (coord[0] > 0) {
                                    queue.push([coord[0] - 1, coord[1], 0]);
                                }
                                if (coord[1] > 2) {
                                    if (block.halfBlockY === 1) {
                                        queue.push([coord[0], coord[1] - 2, 2]);
                                    } else {
                                        queue.push([coord[0], coord[1] - 1, 2]);
                                    }
                                }
                                if (coord[1] < rows * 2 - 2) {
                                    if (block.halfBlockY === 1) {
                                        queue.push([coord[0], coord[1] + 1, 3]);
                                    } else {
                                        queue.push([coord[0], coord[1] + 2, 3]);
                                    }
                                }
                            }
                            if (coord[2] !== 1 && block.rightBlockColour === targetColour) {
                                textArtCanvas.draw(function (callback) {
                                    callback(222, fillColour, block.leftBlockColour, coord[0], block.textY);
                                });
                                if (coord[0] > 0) {
                                    queue.push([coord[0] - 1, coord[1], 0]);
                                }
                                if (coord[1] > 2) {
                                    if (block.halfBlockY === 1) {
                                        queue.push([coord[0], coord[1] - 2, 2]);
                                    } else {
                                        queue.push([coord[0], coord[1] - 1, 2]);
                                    }
                                }
                                if (coord[1] < rows * 2 - 2) {
                                    if (block.halfBlockY === 1) {
                                        queue.push([coord[0], coord[1] + 1, 3]);
                                    } else {
                                        queue.push([coord[0], coord[1] + 2, 3]);
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }
    }

    function enable() {
        document.addEventListener("onTextCanvasDown", fillPoint);
    }

    function disable() {
        document.removeEventListener("onTextCanvasDown", fillPoint);
    }

    return {
        "enable": enable,
        "disable": disable
    };
}

function createLineController() {
    "use strict";
    var startXY;
    var endXY;

    function canvasDown(evt) {
        startXY = evt.detail;
    }

    function line(x0, y0, x1, y1, callback) {
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

function createSampleTool(divElement, freestyle, divFreestyle, characterBrush, divCharacterBrush) {
    "use strict";

    function sample(x, halfBlockY) {
        var block = textArtCanvas.getHalfBlock(x, halfBlockY);
        if (block.isBlocky) {
            if (block.halfBlockY === 0) {
                palette.setForegroundColour(block.upperBlockColour);
            } else {
                palette.setForegroundColour(block.lowerBlockColour);
            }
        } else {
            block = textArtCanvas.getBlock(block.x, Math.floor(block.y / 2));
            palette.setForegroundColour(block.foregroundColour);
            palette.setBackgroundColour(block.backgroundColour);
            if (block.charCode >= 176 && block.charCode <= 178) {
                freestyle.select(block.charCode);
                divFreestyle.click();
            } else {
                characterBrush.select(block.charCode);
                divCharacterBrush.click();
            }
        }
    }

    function canvasDown(evt) {
        sample(evt.detail.x, evt.detail.halfBlockY);
    }

    function enable() {
        document.addEventListener("onTextCanvasDown", canvasDown);
    }

    function disable() {
        document.removeEventListener("onTextCanvasDown", canvasDown);
    }

    return {
        "enable": enable,
        "disable": disable,
        "sample": sample
    };
}

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
