function exportTool(editor, toolbar) {
    "use strict";

    function toDataURL(bytes) {
        return "data:application/octet-stream;base64," + btoa(String.fromCharCode.apply(null, bytes));
    }

    function toBinFormat(input) {
        var output, inputIndex, outputIndex, highest, end;
        highest = 26;
        for (inputIndex = 0; inputIndex < input.length; inputIndex += 3) {
            if (input[inputIndex]) {
                highest = Math.max(Math.ceil(inputIndex / 240), highest);
            }
        }
        output = new Uint8Array((input.length / 3 * 2) + 11);
        output.set(new Uint8Array([88, 66, 73, 78, 26, 80, 0, highest, 0, 16, 0]), 0);
        for (inputIndex = 0, outputIndex = 11, end = highest * 80 * 3; inputIndex < end; inputIndex += 3, outputIndex += 2) {
            output[outputIndex] = input[inputIndex];
            output[outputIndex + 1] = input[inputIndex + 1] + (input[inputIndex + 2] << 4);
        }
        return output;
    }

    function init() {
        var modal;

        function dismiss() {
            modal.remove();
            editor.startListening();
            toolbar.startListening();
        }

        modal = modalBox();
        modal.addButton("download", {"textContent": "Download ansiedit.xb", "href": toDataURL(toBinFormat(editor.image)), "onclick": dismiss, "download": "ansiedit.xb"});
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
        return "Export";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "export"
    };
}