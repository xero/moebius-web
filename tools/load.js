function loadTool(editor, toolbar) {
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

        divFileZone.addEventListener('dragover', function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            evt.dataTransfer.dropEffect = "copy";
        }, false);

        divFileZone.addEventListener('drop', function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            if (evt.dataTransfer.files.length) {
                editor.clearImage();
                editor.takeUndoSnapshot();
                Loaders.loadFile(evt.dataTransfer.files[0], function (imageData) {
                    editor.putImageData(imageData, 0, 0, false);
                    editor.clearUndoHistory();
                    editor.redraw();
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

        editor.stopListening();
        toolbar.stopListening();
        modal.init();

        return false;
    }

    function toString() {
        return "Load";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "load"
    };
}

AnsiEditController.addTool(loadTool, "tools-left");