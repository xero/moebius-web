function createCursor(canvasContainer) {
    "use strict";
    var canvas = document.createElement("CANVAS");
    var x = 0;
    var y = 0;
    var dx = 0;
    var dy = 0;
    var visible = false;

    function show() {
        canvas.style.display = "block";
        visible = true;
    }

    function hide() {
        canvas.style.display = "none";
        visible = false;
    }

    function startSelection() {
        selectionCursor.setStart(x, y);
        dx = x;
        dy = y;
        hide();
    }

    function endSelection() {
        selectionCursor.hide();
        show();
    }

    function move(newX, newY) {
        if (selectionCursor.isVisible() === true) {
            endSelection();
        }
        x = Math.min(Math.max(newX, 0), textArtCanvas.getColumns() - 1);
        y = Math.min(Math.max(newY, 0), textArtCanvas.getRows() - 1);
        var canvasWidth = font.getWidth();
        if (font.getLetterSpacing() === true) {
            canvasWidth += 1;
        }
        canvas.style.left = (x * canvasWidth) - 2 + "px";
        canvas.style.top = (y * font.getHeight()) - 2 + "px";
        positionInfo.update(x, y);
        pasteTool.setSelection(x, y, 1, 1);
    }

    function updateDimensions() {
        var canvasWidth = font.getWidth();
        if (font.getLetterSpacing() === true) {
            canvasWidth += 1;
        }
        canvas.width = canvasWidth;
        canvas.height = font.getHeight();
        move(x, y);
    }

    function getX() {
        return x;
    }

    function getY() {
        return y;
    }

    function left() {
        move(x - 1 , y);
    }

    function right() {
        move(x + 1 , y);
    }

    function up() {
        move(x, y - 1);
    }

    function down() {
        move(x, y + 1);
    }

    function newLine() {
        move(0, y + 1);
    }

    function startOfCurrentRow() {
        move(0, y);
    }

    function endOfCurrentRow() {
        move(textArtCanvas.getColumns() - 1, y);
    }

    function shiftLeft() {
        if (selectionCursor.isVisible() === false) {
            startSelection();
        }
        dx = Math.max(dx - 1, 0);
        selectionCursor.setEnd(dx, dy);
    }

    function shiftRight() {
        if (selectionCursor.isVisible() === false) {
            startSelection();
        }
        dx = Math.min(dx + 1, textArtCanvas.getColumns() - 1);
        selectionCursor.setEnd(dx, dy);
    }

    function shiftUp() {
        if (selectionCursor.isVisible() === false) {
            startSelection();
        }
        dy = Math.max(dy - 1, 0);
        selectionCursor.setEnd(dx, dy);
    }

    function shiftDown() {
        if (selectionCursor.isVisible() === false) {
            startSelection();
        }
        dy = Math.min(dy + 1, textArtCanvas.getRows() - 1);
        selectionCursor.setEnd(dx, dy);
    }

    function keyDown(evt) {
        var keyCode = (evt.keyCode || evt.which);
        if (evt.ctrlKey === false && evt.altKey === false) {
            if (evt.shiftKey === false && evt.metaKey === false) {
                switch(keyCode) {
                case 13:
                    evt.preventDefault();
                    newLine();
                    break;
                case 35:
                    evt.preventDefault();
                    endOfCurrentRow();
                    break;
                case 36:
                    evt.preventDefault();
                    startOfCurrentRow();
                    break;
                case 37:
                    evt.preventDefault();
                    left();
                    break;
                case 38:
                    evt.preventDefault();
                    up();
                    break;
                case 39:
                    evt.preventDefault();
                    right();
                    break;
                case 40:
                    evt.preventDefault();
                    down();
                    break;
                default:
                    break;
                }
            } else if (evt.metaKey === true && evt.shiftKey === false) {
                switch(keyCode) {
                case 37:
                    evt.preventDefault();
                    startOfCurrentRow();
                    break;
                case 39:
                    evt.preventDefault();
                    endOfCurrentRow();
                    break;
                default:
                    break;
                }
            } else if (evt.shiftKey === true && evt.metaKey === false) {
                switch(keyCode) {
                case 37:
                    evt.preventDefault();
                    shiftLeft();
                    break;
                case 38:
                    evt.preventDefault();
                    shiftUp();
                    break;
                case 39:
                    evt.preventDefault();
                    shiftRight();
                    break;
                case 40:
                    evt.preventDefault();
                    shiftDown();
                    break;
                default:
                    break;
                }
            }
        }
    }

    function enable() {
        document.addEventListener("keydown", keyDown);
        show();
        pasteTool.setSelection(x, y, 1, 1);
    }

    function disable() {
        document.removeEventListener("keydown", keyDown);
        hide();
        pasteTool.disable();
    }

    function isVisible() {
        return visible;
    }

    canvas.classList.add("cursor");
    hide();
    canvasContainer.insertBefore(canvas, canvasContainer.firstChild);
    document.addEventListener("onLetterSpacingChange", updateDimensions);
    document.addEventListener("onTextCanvasSizeChange", updateDimensions);
    document.addEventListener("onFontChange", updateDimensions);
    document.addEventListener("onOpenedFile", updateDimensions);
    updateDimensions();

    return {
        "show": show,
        "hide": hide,
        "move": move,
        "getX": getX,
        "getY": getY,
        "left": left,
        "right": right,
        "up": up,
        "down": down,
        "newLine": newLine,
        "startOfCurrentRow": startOfCurrentRow,
        "endOfCurrentRow": endOfCurrentRow,
        "shiftLeft": shiftLeft,
        "shiftRight": shiftRight,
        "enable": enable,
        "disable": disable,
        "isVisible": isVisible
    };
}

function createSelectionCursor(divElement) {
    "use strict";
    var cursor = document.createElement("canvas");
    var sx, sy, dx, dy, x, y, width, height;
    var visible = false;

    function processCoords() {
        x = Math.min(sx, dx);
        y = Math.min(sy, dy);
        x = Math.max(x, 0);
        y = Math.max(y, 0);
        var columns = textArtCanvas.getColumns();
        var rows = textArtCanvas.getRows();
        width = Math.abs(dx - sx) + 1;
        height = Math.abs(dy - sy) + 1;
        width = Math.min(width, columns - x);
        height = Math.min(height, rows - y);
    }

    function show() {
        cursor.style.display = "block";
    }

    function hide() {
        cursor.style.display = "none";
        visible = false;
        pasteTool.disable();
    }

    function updateCursor() {
        var fontWidth = font.getWidth();
        var fontHeight = font.getHeight();
        if (font.getLetterSpacing() === true) {
            fontWidth += 1;
        }
        cursor.style.left = x * fontWidth - 1 + "px";
        cursor.style.top = y * fontHeight - 1 + "px";
        cursor.width = width * fontWidth + 1;
        cursor.height = height * fontHeight + 1;
    }

    function setStart(startX, startY) {
        sx = startX;
        sy = startY;
        processCoords();
        x = startX;
        y = startY;
        width = 1;
        height = 1;
        updateCursor();
    }

    function setEnd(endX, endY) {
        show();
        dx = endX;
        dy = endY;
        processCoords();
        updateCursor();
        pasteTool.setSelection(x, y, width, height);
        visible = true;
    }

    function isVisible() {
        return visible;
    }

    cursor.classList.add("selection-cursor");
    cursor.style.display = "none";
    divElement.appendChild(cursor);

    return {
        "show": show,
        "hide": hide,
        "setStart": setStart,
        "setEnd": setEnd,
        "isVisible": isVisible
    };
}
