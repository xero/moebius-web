function exportPNG(editor, toolbar) {
    "use strict";

    function init() {
        var modal, canvas;

        function dismiss() {
            modal.remove();
            editor.startListening();
            toolbar.startListening();
        }

        modal = modalBox();
        canvas = editor.renderImageData(editor.getImageData(0, 0, editor.columns, editor.getHighestRow(), false));
        modal.addButton("download", {"textContent": "Download ansiedit.png", "href": canvas.toDataURL(), "onclick": dismiss, "download": "ansiedit.png"});
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
        return "Export as PNG";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "exportPNG"
    };
}

AnsiEditController.addTool(exportPNG, "tools-left");