function loadTool(editor, toolbar, title) {
    "use strict";

    function removeExtension(text) {
        var index;
        index = text.lastIndexOf(".");
        return (index >= 0) ? text.substring(0, index) : text;
    }

    function init() {
        var modal, divFileZone, paragraph;

        divFileZone = ElementHelper.create("div", {"className": "file-zone"});
        paragraph = ElementHelper.create("p", {"textContent": "Drag and drop an AnsiEdit, ANSi, XBin, or Bin file here."});

        function dismiss() {
            toolbar.modalEnd("load");
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
                title.setText(removeExtension(evt.dataTransfer.files[0].name));
                Loaders.loadFile(evt.dataTransfer.files[0], function (imageData) {
                    editor.setImage(imageData, imageData.noblink);
                }, true, editor, toolbar);
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
        "uid": "load",
        "isModal": true
    };
}

AnsiEditController.addTool(loadTool, "tools-left");