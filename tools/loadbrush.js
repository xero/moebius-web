function loadBrush(editor, toolbar) {
    "use strict";

    function init() {
        var modal, divFileZone, paragraph, fileInputContainer, fileInput;

        divFileZone = ElementHelper.create("div", {"className": "file-zone"});
        paragraph = ElementHelper.create("p", {"textContent": "Drag and drop an AnsiEdit, ANSi, XBin, or Bin file here, or select a file by clicking on the Browse button."});
        fileInputContainer = ElementHelper.create("div", {"className": "file-input-container"});
        fileInput = ElementHelper.create("input", {"type": "file"});

        function dismiss() {
            toolbar.modalEnd("load-brush");
            modal.remove();
            toolbar.startListening();
        }

        function loadFile(file) {
            Loaders.loadFile(file, function (imageData) {
                editor.fireCustomEvent("custom-brush", {"operation": "load", "imageData": imageData});
            }, editor.getBlinkStatus());
            dismiss();
        }

        divFileZone.addEventListener("dragover", function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            evt.dataTransfer.dropEffect = "copy";
        }, false);

        divFileZone.addEventListener("drop", function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            if (evt.dataTransfer.files.length) {
                loadFile(evt.dataTransfer.files[0]);
            }
        }, false);

        fileInput.addEventListener("change", function (evt) {
            if (evt.target.files.length > 0) {
                loadFile(evt.target.files[0]);
            }
        }, false);

        modal = modalBox();
        divFileZone.appendChild(paragraph);
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
        return "Load Brush";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "load-brush",
        "isModal": true
    };
}

AnsiEditController.addTool(loadBrush, "tools-left");