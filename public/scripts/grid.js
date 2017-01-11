function createGrid(divElement) {
    "use strict";
    var canvases = [];
    var enabled = false;

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
        canvases = [];
        for (var i = 0; i < Math.floor(rows / 25); i++) {
            var canvas = document.createElement("CANVAS");
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            canvases.push(canvas);
        }
        if (rows % 25 !== 0) {
            var canvas = document.createElement("CANVAS");
            canvas.width = canvasWidth;
            canvas.height = fontHeight * (rows % 25);
            canvases.push(canvas);
        }
    }

    function renderGrid(canvas) {
        var columns = textArtCanvas.getColumns();
        var rows = Math.min(textArtCanvas.getRows(), 25);
        var fontWidth = canvas.width / columns;
        var fontHeight = font.getHeight();
        var ctx = canvas.getContext("2d");
        var imageData = ctx.createImageData(canvas.width, canvas.height);
        var byteWidth = canvas.width * 4;
        var darkGray = new Uint8Array([63, 63, 63, 255]);
        for (var y = 0; y < rows; y += 1) {
            for (var x = 0, i = y * fontHeight * byteWidth; x < canvas.width; x += 1, i += 4) {
                imageData.data.set(darkGray, i);
            }
        }
        for (var x = 0; x < columns; x += 1) {
            for (var y = 0, i = x * fontWidth * 4; y < canvas.height; y += 1, i += byteWidth) {
                imageData.data.set(darkGray, i);
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }

    function createGrid() {
        createCanvases();
        renderGrid(canvases[0]);
        divElement.appendChild(canvases[0]);
        for (var i = 1; i < canvases.length; i++) {
            canvases[i].getContext("2d").drawImage(canvases[0], 0, 0);
            divElement.appendChild(canvases[i]);
        }
    }

    function resize() {
        canvases.forEach((canvas) => {
            divElement.removeChild(canvas);
        });
        createGrid();
    }

    createGrid();

    document.addEventListener("onTextCanvasSizeChange", resize);
    document.addEventListener("onLetterSpacingChange", resize);
    document.addEventListener("onFontChange", resize);
    document.addEventListener("onOpenedFile", resize);

    function isShown() {
        return enabled;
    }

    function show(turnOn) {
        if (enabled === true && turnOn === false) {
            divElement.classList.remove("enabled");
            enabled = false;
        } else if (enabled === false && turnOn === true) {
            divElement.classList.add("enabled");
            enabled = true;
        }
    }

    return {
        "isShown": isShown,
        "show": show
    };
}
