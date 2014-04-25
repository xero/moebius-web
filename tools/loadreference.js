function loadReferenceTool(editor, toolbar) {
    "use strict";

    function init() {
        var modal, divFileZone, paragraph;

        divFileZone = ElementHelper.create("div", {"className": "file-zone"});
        paragraph = ElementHelper.create("p", {"textContent": "Drag and drop an image here."});

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
            var reader, loadImageEvt;
            evt.stopPropagation();
            evt.preventDefault();
            if (evt.dataTransfer.files.length) {
                reader = new FileReader();
                reader.onload = function (data) {
                    loadImageEvt = new CustomEvent("referenceImage", {"detail": data.target.result});
                    editor.canvas.dispatchEvent(loadImageEvt);
                };
                reader.readAsDataURL(evt.dataTransfer.files[0]);
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
        return "Load Reference Image";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "loadreference"
    };
}

AnsiEditController.addTool(loadReferenceTool, "tools-left");