function loadBrush(editor, toolbar) {
    "use strict";

    function init() {
        var modal, divFileZone, paragraph;

        divFileZone = ElementHelper.create("div", {"className": "file-zone"});
        paragraph = ElementHelper.create("p", {"textContent": "Drag and drop an ANSi or XBin here."});

        function dismiss() {
            toolbar.modalEnd("loadbrush");
            modal.remove();
            editor.startListening();
            toolbar.startListening();
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
                Loaders.loadFile(evt.dataTransfer.files[0], function (imageData) {
                    editor.fireCustomEvent("custombrush", {"operation": "load", "imageData": imageData});
                }, editor.getBlinkStatus());
                dismiss();
            }
        }, false);

        modal = modalBox();
        divFileZone.appendChild(paragraph);
        modal.addPanel(divFileZone);
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
        "uid": "loadbrush",
        "isModal": true
    };
}

AnsiEditController.addTool(loadBrush, "tools-left");