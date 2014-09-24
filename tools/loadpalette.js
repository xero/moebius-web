function loadPalette(editor, toolbar) {
    "use strict";

    function init() {
        var modal, divFileZone, paragraphs, fileInputContainer, fileInput;

        divFileZone = ElementHelper.create("div", {"className": "file-zone"});
        paragraphs = [
            ElementHelper.create("p", {"textContent": "Drag and drop an image file here."}),
            ElementHelper.create("p", {"textContent": "The palette image must be 160 pixels wide, and 40 pixels high, consisting of 16 square blocks of color exactly 20 pixels in size for both dimensions. The higher intensity colors must be placed on the top row of the image."})
        ];
        fileInputContainer = ElementHelper.create("div", {"className": "file-input-container"});
        fileInput = ElementHelper.create("input", {"type": "file"});

        function dismiss() {
            toolbar.modalEnd("load-palette");
            modal.remove();
            toolbar.startListening();
        }

        function loadPalette(file) {
            var reader;
            reader = new FileReader();
            reader.onload = function (data) {
                Loaders.loadPalette(data.target.result, function (palette) {
                    if (palette !== undefined) {
                        editor.setPalette(palette);
                        dismiss();
                    }
                });
            };
            reader.readAsDataURL(file);
        }

        divFileZone.addEventListener("dragover", function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            evt.dataTransfer.dropEffect = "copy";
        }, false);

        divFileZone.addEventListener("drop", function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            if (evt.dataTransfer.files.length > 0) {
                loadPalette(evt.dataTransfer.files[0]);
            }
        }, false);

        fileInput.addEventListener("change", function (evt) {
            if (evt.target.files.length > 0) {
                loadPalette(evt.target.files[0]);
            }
        }, false);

        modal = modalBox();
        divFileZone.appendChild(paragraphs[0]);
        divFileZone.appendChild(paragraphs[1]);
        modal.addPanel(divFileZone);
        fileInputContainer.appendChild(fileInput);
        modal.addPanel(fileInputContainer);
        modal.addButton("cancel", {"textContent": "Cancel", "href": "#", "onclick": function (evt) {
            evt.preventDefault();
            dismiss();
        }});

        toolbar.stopListening();
        modal.init();

        return false;
    }

    function toString() {
        return "Load Palette";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "load-palette",
        "isModal": true
    };
}

AnsiEditController.addTool(loadPalette, "tools-left");