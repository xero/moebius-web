function loadTool(editor, toolbar, title) {
    "use strict";

    function removeExtension(text) {
        var index;
        index = text.lastIndexOf(".");
        return (index >= 0) ? text.substring(0, index) : text;
    }

    function init() {
        var modal, divFileZone, paragraph, fileInputContainer, fileInput;

        divFileZone = ElementHelper.create("div", {"className": "file-zone"});
        paragraph = ElementHelper.create("p", {"textContent": "Drag and drop an AnsiEdit, ANSi, XBin, or Bin file here, or select a file by clicking on the Browse button."});
        fileInputContainer = ElementHelper.create("div", {"className": "file-input-container"});
        fileInput = ElementHelper.create("input", {"type": "file"});

        function dismiss() {
            toolbar.modalEnd("load");
            modal.remove();
            editor.startListening();
            toolbar.startListening();
        }

        function loadFile(file) {
            title.setText(removeExtension(file.name));
            Loaders.loadFile(file, function (imageData) {
                editor.setImage(imageData, imageData.noblink);
            }, true, editor, toolbar);
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
            if (evt.dataTransfer.files.length > 0) {
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