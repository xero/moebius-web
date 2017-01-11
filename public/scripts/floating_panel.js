function createPanelCursor(divElement) {
    "use strict";
    var cursor = document.createElement("CANVAS");
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
    var canvas = document.createElement("CANVAS");
    canvasContainer.appendChild(canvas);
    canvas.width = width;
    canvas.height = height;
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
