function createCharacterBrushPanel(divElement) {
    "use strict";
    var panelWidth = font.getWidth() * 16;
    if (font.getLetterSpacing() === true) {
        panelWidth += 16;
    }
    var panel = createFloatingPanel(50, 30);
    var palettePanel = createFloatingPanelPalette(panelWidth, 40);
    var canvasContainer = document.createElement("div");
    var cursor = createPanelCursor(canvasContainer);
    var canvas = document.createElement("canvas");
    canvas.width = panelWidth;
    canvas.height = font.getHeight() * 16;
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
        if (font.getLetterSpacing() === true) {
            panelWidth += 16;
        }
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
