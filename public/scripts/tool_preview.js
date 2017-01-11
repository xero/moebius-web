function createToolPreview(divElement) {
    "use strict";
    var canvases = [];
    var ctxs = [];

    function createCanvases() {
        var fontWidth = font.getWidth();
        var fontHeight = font.getHeight();
        var columns = textArtCanvas.getColumns();
        var rows = textArtCanvas.getRows();
        var canvasWidth = (fontWidth * columns);
        if (font.getLetterSpacing() === true) {
            canvasWidth += columns;
        }
        var canvasHeight = fontHeight * 25;
        canvases = new Array();
        ctxs = new Array();
        for (var i = 0; i < Math.floor(rows / 25); i++) {
            var canvas = document.createElement("CANVAS");
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            canvases.push(canvas);
            ctxs.push(canvas.getContext("2d"));
        }
        if (rows % 25 !== 0) {
            var canvas = document.createElement("CANVAS");
            canvas.width = canvasWidth;
            canvas.height = fontHeight * (rows % 25);
            canvases.push(canvas);
            ctxs.push(canvas.getContext("2d"));
        }
        canvases.forEach((canvas) => {
            divElement.appendChild(canvas);
        });
    }

    function resize() {
        canvases.forEach((canvas) => {
            divElement.removeChild(canvas);
        });
        createCanvases();
    }

    function drawHalfBlock(foreground, x, y) {
        var halfBlockY = y % 2;
        var textY = Math.floor(y / 2);
        var ctxIndex = Math.floor(textY / 25);
        if (ctxIndex >= 0 && ctxIndex < ctxs.length) {
            font.drawWithAlpha((halfBlockY === 0) ? 223 : 220, foreground, ctxs[ctxIndex], x, textY % 25);
        }
    }

    function clear() {
        for (var i = 0; i < ctxs.length; i++) {
            ctxs[i].clearRect(0, 0, canvases[i].width, canvases[i].height);
        }
    }

    createCanvases();
    divElement.classList.add("enabled");

    document.addEventListener("onTextCanvasSizeChange", resize);
    document.addEventListener("onLetterSpacingChange", resize);
    document.addEventListener("onFontChange", resize);
    document.addEventListener("onOpenedFile", resize);

    return {
        "clear": clear,
        "drawHalfBlock": drawHalfBlock,
    };
}
