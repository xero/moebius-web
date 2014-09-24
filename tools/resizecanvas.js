function resizeCanvasTool(editor, toolbar) {
    "use strict";

    function init() {
        var modal, paragraph, divContainers, widthLabel, widthInput, heightLabel, heightInput;

        function dismiss() {
            toolbar.modalEnd("resize-canvas");
            modal.remove();
            toolbar.startListening();
        }

        function validate() {
            var width, height;
            width = parseInt(widthInput.value, 10);
            height = parseInt(heightInput.value, 10);
            if (width >= parseInt(widthInput.min, 10) && width <= parseInt(widthInput.max, 10) && height >= parseInt(heightInput.min, 10) && height <= parseInt(heightInput.max, 10)) {
                dismiss();
                if (width !== editor.getColumns() || height !== editor.getRows()) {
                    editor.resize(width, height);
                }
            }
        }

        function keypress(evt) {
            var keyCode = evt.keyCode || evt.which;
            if (keyCode === 13) {
                validate();
            } else if ((keyCode < 48 || keyCode > 57) && keyCode !== 9 && keyCode !== 8) {
                evt.preventDefault();
            }
        }

        modal = modalBox();

        divContainers = [
            ElementHelper.create("div", {"className": "input-container resize"}),
            ElementHelper.create("div", {"className": "input-container resize"})
        ];

        paragraph = ElementHelper.create("p", {"textContent": "The canvas can be resized to a maximum width of 320 characters, and a height of 1000 characters."});
        widthLabel = ElementHelper.create("label", {"for": "canvas-width", "textContent": "Width: "});
        widthInput = ElementHelper.create("input", {"id": "canvas-width", "type": "number", "min": "1", "max": "320", "value": editor.getColumns()});
        heightLabel = ElementHelper.create("label", {"for": "canvas-height", "textContent": "Height: "});
        heightInput = ElementHelper.create("input", {"id": "canvas-height", "type": "number", "min": "1", "max": "1000", "value": editor.getRows()});

        widthInput.addEventListener("keypress", keypress, false);
        heightInput.addEventListener("keypress", keypress, false);

        divContainers[0].appendChild(widthLabel);
        divContainers[0].appendChild(widthInput);
        divContainers[1].appendChild(heightLabel);
        divContainers[1].appendChild(heightInput);
        modal.addPanel(paragraph);
        modal.addPanel(divContainers[0]);
        modal.addPanel(divContainers[1]);

        modal.addButton("default", {"textContent": "Resize", "href": "#", "onclick": function (evt) {
            evt.preventDefault();
            validate();
        }});

        modal.addButton("cancel", {"textContent": "Cancel", "href": "#", "onclick": function (evt) {
            evt.preventDefault();
            dismiss();
        }});

        toolbar.stopListening();
        modal.init();

        return false;
    }

    function toString() {
        return "Resize Canvas";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "resize-canvas",
        "isModal": true
    };
}

AnsiEditController.addTool(resizeCanvasTool, "tools-left");