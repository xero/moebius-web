function saveTool(toolbar) {
    "use strict";

    function toDataURL(bytes) {
        return "data:application/octet-stream;base64," + btoa(String.fromCharCode.apply(null, bytes));
    }

    function getHighestRow(input) {
        var inputIndex, highest;
        highest = 26;
        for (inputIndex = 0; inputIndex < input.length; inputIndex += 3) {
            if (input[inputIndex]) {
                highest = Math.max(Math.ceil(inputIndex / 240), highest);
            }
        }
        return highest;
    }

    function toBinFormat(input) {
        var output, inputIndex, outputIndex, highest, end, flags;
        highest = getHighestRow(input);
        output = new Uint8Array((input.length / 3 * 2) + 11);
        flags = toolbar.editor.noblink ? 8 : 0;
        output.set(new Uint8Array([88, 66, 73, 78, 26, 80, 0, highest, 0, 16, flags]), 0);
        for (inputIndex = 0, outputIndex = 11, end = highest * 80 * 3; inputIndex < end; inputIndex += 3, outputIndex += 2) {
            output[outputIndex] = input[inputIndex];
            output[outputIndex + 1] = input[inputIndex + 1] + (input[inputIndex + 2] << 4);
        }
        return output;
    }

    // function toANSFormat(input) {
    //     var highest, inputIndex, end, charCode, fg, bg, bold, blink, currentFg, currentBg, currentBold, currentBlink, attribs, attribIndex, output;
    // 
    //     function ansiColor(binColor) {
    //         switch (binColor) {
    //         case 1:
    //             return 4;
    //         case 3:
    //             return 6;
    //         case 4:
    //             return 1;
    //         case 6:
    //             return 3;
    //         default:
    //             return binColor;
    //         }
    //     }
    // 
    //     highest = getHighestRow(input);
    //     output = [27, 91, 48, 109];
    //     for (inputIndex = 0, end = highest * 80 * 3, currentFg = 7, currentBg = 0, currentBold = false, currentBlink = false; inputIndex < end; inputIndex += 3) {
    //         attribs = [];
    //         charCode = input[inputIndex];
    //         fg = input[inputIndex + 1];
    //         bg = input[inputIndex + 2];
    //         if (fg > 7) {
    //             bold = true;
    //             fg = fg - 8;
    //         } else {
    //             bold = false;
    //         }
    //         if (bg > 7) {
    //             blink = true;
    //             bg = bg - 8;
    //         } else {
    //             blink = false;
    //         }
    //         if ((currentBold && !bold) || (currentBlink && !blink)) {
    //             attribs.push([48]);
    //             currentFg = 7;
    //             currentBg = 0;
    //             currentBold = false;
    //             currentBlink = false;
    //         }
    //         if (bold && !currentBold) {
    //             attribs.push([49]);
    //             currentBold = true;
    //         }
    //         if (blink && !currentBlink) {
    //             attribs.push([53]);
    //             currentBlink = true;
    //         }
    //         if (fg !== currentFg) {
    //             attribs.push([51, 48 + ansiColor(fg)]);
    //             currentFg = fg;
    //         }
    //         if (bg !== currentBg) {
    //             attribs.push([52, 48 + ansiColor(bg)]);
    //             currentBg = bg;
    //         }
    //         if (attribs.length) {
    //             output.push(27, 91);
    //             for (attribIndex = 0; attribIndex < attribs.length; ++attribIndex) {
    //                 output = output.concat(attribs[attribIndex]);
    //                 if (attribIndex !== attribs.length - 1) {
    //                     output.push(59);
    //                 } else {
    //                     output.push(109);
    //                 }
    //             }
    //         }
    //         output.push(charCode);
    //     }
    //     return new Uint8Array(output);
    // }

    function init() {
        var modal;

        function dismiss() {
            modal.remove();
            toolbar.editor.startListening();
            toolbar.startListening();
        }

        modal = modalBox();
        // modal.addButton("download", {"textContent": "Download ansiedit.ans", "href": toDataURL(toANSFormat(toolbar.editor.image)), "onclick": dismiss, "download": "ansiedit.ans"});
        modal.addButton("download", {"textContent": "Download ansiedit.xb", "href": toDataURL(toBinFormat(toolbar.editor.image)), "onclick": dismiss, "download": "ansiedit.xb"});
        modal.addButton("cancel", {"textContent": "Cancel", "href": "#", "onclick": function (evt) {
            evt.preventDefault();
            dismiss();
        }});

        toolbar.editor.stopListening();
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

AnsiEditController.addTool(saveTool);