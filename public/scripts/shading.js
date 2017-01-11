function createShadingPanel() {
    "use strict";
    var panelWidth = font.getWidth() * 20;
    if (font.getLetterSpacing() === true) {
        panelWidth += 20;
    }
    var panel = createFloatingPanel(50, 30);
    var palettePanel = createFloatingPanelPalette(panelWidth, 40);
    var canvasContainer = document.createElement("div");
    var cursor = createPanelCursor(canvasContainer);
    var canvases = new Array(16);
    var halfBlockMode = true;
    var x = 0;
    var y = 0;

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
            var canvas = document.createElement("canvas");
            canvas.width = panelWidth;
            canvas.height = fontHeight * 15;
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

    function enable() {
        document.addEventListener("keydown", keyDown);
        panel.enable();
    }

    function disable() {
        document.removeEventListener("keydown", keyDown);
        panel.disable();
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
        if (font.getLetterSpacing() === true) {
            panelWidth += 20;
        }
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
        "select": select
    };
}
