function textTool(toolbar) {
    "use strict";
    var textOverlay, ctx, currentColor, cursor, startTextX, textEntryMode, cursorPositions;
    textOverlay = ElementHelper.create("canvas", {"width": 80 * toolbar.codepage.fontWidth, "height": toolbar.editor.height * toolbar.codepage.fontHeight});
    ctx = textOverlay.getContext("2d");

    function clearCursor(cursor) {
        ctx.clearRect(cursor.textX * toolbar.codepage.fontWidth, cursor.textY * toolbar.codepage.fontHeight, toolbar.codepage.fontWidth, toolbar.codepage.fontHeight);
    }

    function drawCursor(cursor) {
        ctx.fillStyle = toolbar.palette.styleRGBA(currentColor, 0.7);
        ctx.fillRect(cursor.textX * toolbar.codepage.fontWidth, cursor.textY * toolbar.codepage.fontHeight, toolbar.codepage.fontWidth, toolbar.codepage.fontHeight);
    }

    function storeCursorPos(textX, textY) {
        cursor = {"textX": textX, "textY": textY};
    }

    function updateCursorPos(coord) {
        if (cursor) {
            clearCursor(cursor);
        }
        storeCursorPos(coord.textX, coord.textY);
        drawCursor(cursor);
    }

    function enterTextEntryMode(keypressHandler) {
        if (!textEntryMode) {
            toolbar.stopListening();
            toolbar.palette.stopListening();
            document.addEventListener("keypress", keypressHandler, false);
            textEntryMode = true;
            startTextX = cursor.textX;
            cursorPositions = [];
        }
    }

    function leaveTextEntryMode(keypressHandler) {
        if (textEntryMode) {
            toolbar.startListening();
            toolbar.palette.startListening();
            document.removeEventListener("keypress", keypressHandler);
            clearCursor(cursor);
            cursor = undefined;
            textEntryMode = false;
        }
    }

    function keypress(evt) {
        var keyCode, textBlock;
        keyCode = evt.keyCode || evt.which;
        if (evt.altKey) {
            switch (keyCode) {
            case 13:
                leaveTextEntryMode(keypress);
                break;
            }
        } else {
            if (keyCode === 8) {
                evt.preventDefault();
                if (cursorPositions.length) {
                    if (toolbar.editor.undo()) {
                        clearCursor(cursor);
                        cursor = cursorPositions.pop();
                        drawCursor(cursor);
                    }
                }
            } else if (keyCode === 13) {
                evt.preventDefault();
                clearCursor(cursor);
                cursor.textX = startTextX;
                cursor.textY = Math.min(toolbar.editor.height - 1, cursor.textY + 1);
                drawCursor(cursor);
            } else if (keyCode >= 32 && keyCode <= 126) {
                evt.preventDefault();
                toolbar.editor.takeUndoSnapshot();
                clearCursor(cursor);
                textBlock = toolbar.editor.getTextBlock(cursor.textX, cursor.textY);
                toolbar.editor.setChar(textBlock, keyCode, currentColor);
                cursorPositions.push({"textX": cursor.textX, "textY": cursor.textY});
                if (++cursor.textX === 80) {
                    cursor.textX = 0;
                    cursor.textY = Math.min(toolbar.editor.height - 1, cursor.textY + 1);
                }
                drawCursor(cursor);
            }
        }
    }

    function canvasDown(evt) {
        leaveTextEntryMode(keypress);
        updateCursorPos(evt.detail);
    }

    function canvasDrag(evt) {
        updateCursorPos(evt.detail);
    }

    function canvasUp(evt) {
        storeCursorPos(evt.detail.textX, evt.detail.textY);
        enterTextEntryMode(keypress);
    }

    function colorChange(evt) {
        currentColor = evt.detail;
        if (cursor) {
            drawCursor(cursor);
        }
    }

    function init() {
        toolbar.editor.canvas.addEventListener("canvasDown", canvasDown, false);
        toolbar.editor.canvas.addEventListener("canvasDrag", canvasDrag, false);
        toolbar.editor.canvas.addEventListener("canvasUp", canvasUp, false);
        toolbar.palette.canvas.addEventListener("colorChange", colorChange, false);
        currentColor = toolbar.palette.getCurrentColor();
        toolbar.editor.addOverlay(textOverlay, "text");
        return true;
    }

    function remove() {
        toolbar.editor.canvas.removeEventListener("canvasDown", canvasDown);
        toolbar.editor.canvas.removeEventListener("canvasDrag", canvasDrag);
        toolbar.editor.canvas.removeEventListener("canvasUp", canvasUp);
        toolbar.palette.canvas.removeEventListener("colorChange", colorChange);
        if (textEntryMode) {
            leaveTextEntryMode(keypress);
        }
        toolbar.editor.removeOverlay("text");
    }

    function toString() {
        return "Text";
    }

    return {
        "init": init,
        "remove": remove,
        "toString": toString,
        "uid": "text"
    };
}

AnsiEditController.addTool(textTool, 116);