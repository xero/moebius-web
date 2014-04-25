function saveImageStampTool(editor, toolbar) {
    "use strict";
    var stampImageData;

    editor.canvas.addEventListener("canvasStamp", function (evt) {
        stampImageData = evt.detail;
    }, false);

    function init() {
        var modal;

        function dismiss() {
            modal.remove();
            editor.startListening();
            toolbar.startListening();
        }

        if (stampImageData) {
            modal = modalBox();
            modal.addButton("download", {"textContent": "Download imagestamp.xb", "href": Savers.imageDataToDataURL(stampImageData), "onclick": dismiss, "download": "imagestamp.xb"});
            modal.addButton("cancel", {"textContent": "Cancel", "href": "#", "onclick": function (evt) {
                evt.preventDefault();
                dismiss();
            }});

            editor.stopListening();
            toolbar.stopListening();
            modal.init();
        }

        return false;
    }

    function toString() {
        return "Save Image Stamp";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "saveimagestamp"
    };
}

AnsiEditController.addTool(saveImageStampTool, "tools-left");