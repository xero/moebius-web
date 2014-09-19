function loadFontTool(editor, toolbar) {
    "use strict";

    function init() {
        var modal, divFileZone, paragraphs, fileInputContainer, fileInput;

        divFileZone = ElementHelper.create("div", {"className": "file-zone"});
        paragraphs = [
            ElementHelper.create("p", {"textContent": "Drag and drop an image file here."}),
            ElementHelper.create("p", {"textContent": "The font must be drawn as white text on a black background and aligned to a 16x16 grid with no additional spacing. Each glyph must be 8 pixels wide, and no more than 32 pixels high. Any transparency (alpha channel) information will be ignored."})
        ];
        fileInputContainer = ElementHelper.create("div", {"className": "file-input-container"});
        fileInput = ElementHelper.create("input", {"type": "file"});

        function dismiss() {
            toolbar.modalEnd("load-font");
            modal.remove();
            editor.startListening();
            toolbar.startListening();
        }

        function loadFont(file) {
            var reader;
            reader = new FileReader();
            reader.onload = function (data) {
                Loaders.loadFont(data.target.result, function (font) {
                    editor.fireCustomEvent("change-font", "custom_image");
                    editor.setFont(font.width, font.height, font.bytes);
                    dismiss();
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
                loadFont(evt.dataTransfer.files[0]);
            }
        }, false);

        fileInput.addEventListener("change", function (evt) {
            if (evt.target.files.length > 0) {
                loadFont(evt.target.files[0]);
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

        editor.stopListening();
        toolbar.stopListening();
        modal.init();

        return false;
    }

    function toString() {
        return "Load Font";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "load-font",
        "isModal": true
    };
}

AnsiEditController.addTool(loadFontTool, "tools-left");