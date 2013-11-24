function textTool(editor, toolbar) {
    "use strict";
    var textOverlay, ctx, currentColor, cursor, startTextX, textEntryMode, cursorPositions;
    textOverlay = ElementHelper.create("canvas", {"width": 80 * editor.codepage.fontWidth, "height": editor.height * editor.codepage.fontHeight});
    ctx = textOverlay.getContext("2d");

    function clearCursor(cursor) {
        ctx.clearRect(cursor.textX * editor.codepage.fontWidth, cursor.textY * editor.codepage.fontHeight, editor.codepage.fontWidth, editor.codepage.fontHeight);
    }

    function drawCursor(cursor) {
        ctx.fillStyle = editor.palette.styleRGBA(currentColor, 0.7);
        ctx.fillRect(cursor.textX * editor.codepage.fontWidth, cursor.textY * editor.codepage.fontHeight, editor.codepage.fontWidth, editor.codepage.fontHeight);
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
            editor.palette.stopListening();
            document.addEventListener("keypress", keypressHandler, false);
            textEntryMode = true;
            startTextX = cursor.textX;
            cursorPositions = [];
        }
    }

    function leaveTextEntryMode(keypressHandler) {
        if (textEntryMode) {
            toolbar.startListening();
            editor.palette.startListening();
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
                    if (editor.undo()) {
                        clearCursor(cursor);
                        cursor = cursorPositions.pop();
                        drawCursor(cursor);
                    }
                }
            } else if (keyCode === 13) {
                evt.preventDefault();
                clearCursor(cursor);
                cursor.textX = startTextX;
                cursor.textY = Math.min(editor.height - 1, cursor.textY + 1);
                drawCursor(cursor);
            } else if (keyCode >= 32 && keyCode <= 126) {
                evt.preventDefault();
                editor.takeUndoSnapshot();
                clearCursor(cursor);
                textBlock = editor.getTextBlock(cursor.textX, cursor.textY);
                editor.setChar(textBlock, keyCode, currentColor);
                cursorPositions.push({"textX": cursor.textX, "textY": cursor.textY});
                if (++cursor.textX === 80) {
                    cursor.textX = 0;
                    cursor.textY = Math.min(editor.height - 1, cursor.textY + 1);
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
        editor.canvas.addEventListener("canvasDown", canvasDown, false);
        editor.canvas.addEventListener("canvasDrag", canvasDrag, false);
        editor.canvas.addEventListener("canvasUp", canvasUp, false);
        editor.canvas.addEventListener("colorChange", colorChange, false);
        currentColor = editor.getCurrentColor();
        editor.addOverlay(textOverlay, "text");
        return true;
    }

    function remove() {
        editor.canvas.removeEventListener("canvasDown", canvasDown);
        editor.canvas.removeEventListener("canvasDrag", canvasDrag);
        editor.canvas.removeEventListener("canvasUp", canvasUp);
        editor.canvas.removeEventListener("colorChange", colorChange);
        if (textEntryMode) {
            leaveTextEntryMode(keypress);
        }
        editor.removeOverlay("text");
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

AnsiEditController.addTool(textTool, "tools-right", 116);