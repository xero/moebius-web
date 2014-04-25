function saveTool(editor, toolbar) {
    "use strict";

    function init() {
        var modal;

        function dismiss() {
            modal.remove();
            editor.startListening();
            toolbar.startListening();
        }

        modal = modalBox();
        modal.addButton("download", {"textContent": "Download ansiedit.xb", "href": Savers.imageDataToDataURL(editor.getImageData(0, 0, 80, editor.getHighestRow())), "onclick": dismiss, "download": "ansiedit.xb"});
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
        return "Save";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "save"
    };
}

AnsiEditController.addTool(saveTool, "tools-left");