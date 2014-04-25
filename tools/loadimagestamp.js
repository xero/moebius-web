function loadImageStamp(editor, toolbar) {
    "use strict";

    function init() {
        var modal, divFileZone, paragraph;

        divFileZone = ElementHelper.create("div", {"className": "file-zone"});
        paragraph = ElementHelper.create("p", {"textContent": "Drag and drop an ANSi, XBin, or image here."});

        function dismiss() {
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
                    var canvasStampEvt;
                    canvasStampEvt = new CustomEvent("canvasStamp", {"detail": imageData});
                    editor.canvas.dispatchEvent(canvasStampEvt);
                }, editor.palette, editor.codepage, editor.noblink);
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
        return "Load Image Stamp";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "loadimage"
    };
}

AnsiEditController.addTool(loadImageStamp, "tools-left");