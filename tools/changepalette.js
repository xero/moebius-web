function changePalette(editor, toolbar) {
    "use strict";
    var canvas, paletteCanvas, selectionCanvas, inputSliders, currentColor, palette, spanValues;

    currentColor = 0;

    function createSelectionCanvas() {
        var ctx;
        selectionCanvas = ElementHelper.create("canvas", {"width": 25, "height": 25});
        ctx = selectionCanvas.getContext("2d");
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, selectionCanvas.width, 1);
        ctx.fillRect(0, selectionCanvas.height - 1, selectionCanvas.width, 1);
        ctx.fillRect(0, 0, 1, selectionCanvas.height);
        ctx.fillRect(selectionCanvas.width - 1, 0, 1, selectionCanvas.height);
        return selectionCanvas;
    }

    function getStyleFor(color) {
        return "rgb(" + (palette[color][0] << 2 | palette[color][0] >> 4) + ", " + (palette[color][1] << 2 | palette[color][1] >> 4) + ", " + (palette[color][2] << 2 | palette[color][2] >> 4) + ")";
    }

    function updateTool() {
        var ctx;
        ctx = canvas.getContext("2d");
        ctx.drawImage(paletteCanvas, 0, 0);
        if (currentColor < 8) {
            ctx.drawImage(selectionCanvas, currentColor * 25, 75);
        } else {
            ctx.drawImage(selectionCanvas, (currentColor - 8) * 25, 50);
        }
    }

    function updateCurrentColorOnCanvas() {
        var ctx;
        ctx = paletteCanvas.getContext("2d");
        ctx.fillStyle = getStyleFor(currentColor);
        ctx.fillRect(0, 0, 200, 50);
        updateTool();
    }

    function updateSwatch(color) {
        var ctx;
        ctx = paletteCanvas.getContext("2d");
        ctx.fillStyle = getStyleFor(color);
        ctx.fillRect(
            (color % 8) * paletteCanvas.width / 8,
            (color < 8) ? 75 : 50,
            paletteCanvas.width / 8,
            25
        );
    }


    function updateValues() {
        spanValues.red.textContent = inputSliders.red.value + " (" + (Math.floor(parseInt(inputSliders.red.value, 10) / 63 * 255)) + ")";
        spanValues.green.textContent = inputSliders.green.value + " (" + (Math.floor(parseInt(inputSliders.green.value, 10) / 63 * 255)) + ")";
        spanValues.blue.textContent = inputSliders.blue.value + " (" + (Math.floor(parseInt(inputSliders.blue.value, 10) / 63 * 255)) + ")";
    }

    function selectColor(color) {
        currentColor = color;
        inputSliders.red.value = palette[color][0];
        inputSliders.green.value = palette[color][1];
        inputSliders.blue.value = palette[color][2];
        updateCurrentColorOnCanvas();
        updateTool();
        updateValues();
        editor.setCurrentColor(color);
    }

    function canvasSelection(evt) {
        var pos, color;
        pos = evt.currentTarget.getBoundingClientRect();
        color = ((1 - Math.floor((evt.clientY - pos.top - 50) / 25))) * 8 + Math.floor((evt.clientX - pos.left) / 25);
        if (color >= 0 && color <= 15) {
            selectColor(color);
        }
    }

    function createCanvas() {
        canvas = ElementHelper.create("canvas", {"width": 200, "height": 100, "style": {"cursor": "crosshair"}});
        canvas.style.verticalAlign = "bottom";
        canvas.addEventListener("mousedown", canvasSelection, false);
        canvas.addEventListener("mousemove", function (evt) {
            var mouseButton;
            mouseButton = (evt.buttons !== undefined) ? evt.buttons : evt.which;
            if (mouseButton) {
                canvasSelection(evt);
            }
        }, false);
    }

    function createPaletteCanvas() {
        var ctx, i;
        paletteCanvas = ElementHelper.create("canvas", {"width": 200, "height": 100});
        ctx = paletteCanvas.getContext("2d");
        for (i = 0; i < 16; i += 1) {
            updateSwatch(i);
        }
    }

    function changeCurrentColor() {
        palette[currentColor] = [parseInt(inputSliders.red.value, 10), parseInt(inputSliders.green.value, 10), parseInt(inputSliders.blue.value, 10)];
        updateCurrentColorOnCanvas();
        updateSwatch(currentColor);
        updateValues();
    }

    createSelectionCanvas();
    createCanvas();

    function init() {
        var modal, divPaletteContainer, divPaletteSliders, divSliders, labelSliders;

        currentColor = editor.getCurrentColor();
        palette = editor.getPalette().slice(0);
        createPaletteCanvas();

        divSliders = {
            "red": ElementHelper.create("div", {"className": "slider-container"}),
            "green": ElementHelper.create("div", {"className": "slider-container"}),
            "blue": ElementHelper.create("div", {"className": "slider-container"})
        };
        labelSliders = {
            "red": ElementHelper.create("label", {"for": "red", "textContent": "Red:"}),
            "green": ElementHelper.create("label", {"for": "green", "textContent": "Green:"}),
            "blue": ElementHelper.create("label", {"for": "blue", "textContent": "Blue:"})
        };
        inputSliders = {
            "red": ElementHelper.create("input", {"name": "red", "type": "range", "min": "0", "max": "63"}),
            "green": ElementHelper.create("input", {"name": "green", "type": "range", "min": "0", "max": "63"}),
            "blue": ElementHelper.create("input", {"name": "blue", "type": "range", "min": "0", "max": "63"})
        };
        spanValues = {
            "red": ElementHelper.create("label", {"className": "rgb-value"}),
            "green": ElementHelper.create("label", {"className": "rgb-value"}),
            "blue": ElementHelper.create("label", {"className": "rgb-value"})
        };

        inputSliders.red.addEventListener("input", changeCurrentColor, false);
        inputSliders.red.addEventListener("change", changeCurrentColor, false);
        inputSliders.green.addEventListener("input", changeCurrentColor, false);
        inputSliders.green.addEventListener("change", changeCurrentColor, false);
        inputSliders.blue.addEventListener("input", changeCurrentColor, false);
        inputSliders.blue.addEventListener("change", changeCurrentColor, false);

        divSliders.red.appendChild(labelSliders.red);
        divSliders.red.appendChild(inputSliders.red);
        divSliders.red.appendChild(spanValues.red);
        divSliders.green.appendChild(labelSliders.green);
        divSliders.green.appendChild(inputSliders.green);
        divSliders.green.appendChild(spanValues.green);
        divSliders.blue.appendChild(labelSliders.blue);
        divSliders.blue.appendChild(inputSliders.blue);
        divSliders.blue.appendChild(spanValues.blue);

        function dismiss() {
            toolbar.modalEnd("change-palette");
            modal.remove();
            toolbar.startListening();
        }

        modal = modalBox();

        divPaletteContainer = ElementHelper.create("div", {"className": "palette-container"});
        divPaletteSliders = ElementHelper.create("div", {"className": "palette-sliders"});
        divPaletteContainer.appendChild(canvas);

        divPaletteSliders.appendChild(divSliders.red);
        divPaletteSliders.appendChild(divSliders.green);
        divPaletteSliders.appendChild(divSliders.blue);

        modal.addPanel(divPaletteContainer);
        modal.addPanel(divPaletteSliders);

        modal.addButton("default", {"textContent": "Change Palette", "href": "#", "onclick": function (evt) {
            evt.preventDefault();
            editor.setPalette(palette);
            dismiss();
        }});

        modal.addButton("default", {"textContent": "Reset to Default Values", "href": "#", "onclick": function (evt) {
            evt.preventDefault();
            editor.setPaletteToDefault();
            dismiss();
        }});

        modal.addButton("cancel", {"textContent": "Cancel", "href": "#", "onclick": function (evt) {
            evt.preventDefault();
            dismiss();
        }});

        selectColor(currentColor);
        updateTool();

        toolbar.stopListening();
        modal.init();

        return false;
    }

    function toString() {
        return "Change Palette";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "change-palette",
        "isModal": true
    };
}

AnsiEditController.addTool(changePalette, "tools-left");