function loadBrush(editor, toolbar) {
    "use strict";

    function init() {
        var modal, divFileZone, paragraph, fileInput;

        divFileZone = ElementHelper.create("div", {"className": "file-zone"});
        paragraph = ElementHelper.create("p", {"textContent": "Drag and drop an AnsiEdit, ANSi, XBin, or Bin file here, or select a file by clicking on the Browse button."});
        fileInput = ElementHelper.create("input", {"type": "file"});

        function dismiss() {
            toolbar.modalEnd("load-brush");
            modal.remove();
            editor.startListening();
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
        modal.addPanel(fileInput);
        modal.addButton("cancel", {"textContent": "Cancel", "href": "#", "onclick": function (evt) {
            evt.preventDefault();
            dismiss();
        }});
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