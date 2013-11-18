function textTool(editor, toolbar, palette, codepage, retina) {
    "use strict";
    var textOverlay, ctx, currentColor, cursor, startTextX, textEntryMode;
    textOverlay = ElementHelper.create("canvas", {"width": 80 * (retina ? 16 : 8), "height": editor.height * (retina ? 32 : 16), "style": {"width": "640px", "height": (editor.height * 16) + "px"}});
    ctx = textOverlay.getContext("2d");

    function clearCursor(cursor) {
        ctx.clearRect(cursor.textX * codepage.fontWidth, cursor.textY * codepage.fontHeight, codepage.fontWidth, codepage.fontHeight);
    }

    function drawCursor(cursor) {
        ctx.fillStyle = palette.styleRGBA(currentColor, 0.7);
        ctx.fillRect(cursor.textX * codepage.fontWidth, cursor.textY * codepage.fontHeight, codepage.fontWidth, codepage.fontHeight);
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
            editor.takeUndoSnapshot();
            toolbar.stopListening();
            palette.stopListening();
            document.addEventListener("keypress", keypressHandler, false);
            textEntryMode = true;
            startTextX = cursor.textX;
        }
    }

    function leaveTextEntryMode(keypressHandler) {
        if (textEntryMode) {
            toolbar.startListening();
            palette.startListening();
            document.removeEventListener("keypress", keypressHandler);
            clearCursor(cursor);
            cursor = undefined;
            textEntryMode = false;
        }
    }

    function keypress(evt) {
        var keyCode;
        keyCode = evt.keyCode || evt.which;
        if (evt.altKey) {
            switch (keyCode) {
            case 13:
                leaveTextEntryMode(keypress);
                break;
            }
        } else {
            if (keyCode === 13) {
                evt.preventDefault();
                clearCursor(cursor);
                cursor.textX = startTextX;
                cursor.textY = Math.min(editor.height - 1, cursor.textY + 1);
                drawCursor(cursor);
            } else if (keyCode >= 32 && keyCode <= 126) {
                evt.preventDefault();
                clearCursor(cursor);
                editor.setChar(keyCode, currentColor, editor.getTextCoord(cursor.textX, cursor.textY));
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
        palette.canvas.addEventListener("colorChange", colorChange, false);
        currentColor = palette.getCurrentColor();
        editor.addOverlay(textOverlay, "text");
        return true;
    }

    function remove() {
        editor.canvas.removeEventListener("canvasDown", canvasDown);
        editor.canvas.removeEventListener("canvasDrag", canvasDrag);
        editor.canvas.removeEventListener("canvasUp", canvasUp);
        palette.canvas.removeEventListener("colorChange", colorChange);
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