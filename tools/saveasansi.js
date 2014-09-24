function saveAsAnsiTool(editor, toolbar) {
    "use strict";

    function imageDataToAnsi(imageData) {
        var inputIndex, end, charCode, fg, bg, bold, blink, currentFg, currentBg, currentBold, currentBlink, attribs, attribIndex, output;

        function ansiColor(binColor) {
            switch (binColor) {
            case 1:
                return 4;
            case 3:
                return 6;
            case 4:
                return 1;
            case 6:
                return 3;
            default:
                return binColor;
            }
        }

        output = [27, 91, 48, 109];
        for (inputIndex = 0, end = imageData.height * imageData.width * 3, currentFg = 7, currentBg = 0, currentBold = false, currentBlink = false; inputIndex < end; inputIndex += 3) {
            attribs = [];
            charCode = imageData.data[inputIndex];
            switch (charCode) {
            case 10:
                charCode = 9;
                break;
            case 13:
                charCode = 14;
                break;
            case 26:
                charCode = 16;
                break;
            case 27:
                charCode = 17;
                break;
            default:
            }
            fg = imageData.data[inputIndex + 1];
            bg = imageData.data[inputIndex + 2];
            if (fg > 7) {
                bold = true;
                fg = fg - 8;
            } else {
                bold = false;
            }
            if (bg > 7) {
                blink = true;
                bg = bg - 8;
            } else {
                blink = false;
            }
            if ((currentBold && !bold) || (currentBlink && !blink)) {
                attribs.push([48]);
                currentFg = 7;
                currentBg = 0;
                currentBold = false;
                currentBlink = false;
            }
            if (bold && !currentBold) {
                attribs.push([49]);
                currentBold = true;
            }
            if (blink && !currentBlink) {
                attribs.push([53]);
                currentBlink = true;
            }
            if (fg !== currentFg) {
                attribs.push([51, 48 + ansiColor(fg)]);
                currentFg = fg;
            }
            if (bg !== currentBg) {
                attribs.push([52, 48 + ansiColor(bg)]);
                currentBg = bg;
            }
            if (attribs.length) {
                output.push(27, 91);
                for (attribIndex = 0; attribIndex < attribs.length; attribIndex += 1) {
                    output = output.concat(attribs[attribIndex]);
                    if (attribIndex !== attribs.length - 1) {
                        output.push(59);
                    } else {
                        output.push(109);
                    }
                }
            }
            output.push(charCode);
        }
        return new Uint8Array(output);
    }

    function saveAnsiData(imageData, noblink, title, author, group, filename) {
        var ansi, sauce, combined;
        ansi = imageDataToAnsi(imageData, noblink);
        sauce = Savers.createSauce(Savers.DATATYPE_CHARACTER, Savers.FILETYPE_ANSI, ansi.length, imageData.width, imageData.height, title, author, group, (noblink ? 1 : 0) + 2 + 16, "IBM VGA");
        combined = new Uint8Array(ansi.length + sauce.length);
        combined.set(ansi, 0);
        combined.set(sauce, ansi.length);
        Savers.saveFile(combined, "image/ansi", filename);
    }

    function init() {
        var modal;

        function dismiss() {
            toolbar.modalEnd("save-ansi");
            modal.remove();
            toolbar.startListening();
        }

        modal = modalBox();

        modal.addPanel(ElementHelper.create("p", {"textContent": "Warning: Certain characters cannot be reliably displayed in an ANSi file. These are new-line, carriage return, end-of-file, and escape characters."}));
        modal.addPanel(ElementHelper.create("p", {"textContent": "If you continue this operation, these characters will be saved as horiztonal tab, shift out, data link escape, and device control 1, respectively. These substitute characters appear similar to their replacements."}));
        modal.addPanel(ElementHelper.create("p", {"textContent": "Also, custom colors and fonts will be ignored."}));

        modal.addButton("default", {"textContent": "Save as ANSi", "href": "#", "onclick": function (evt) {
            var metadata;
            evt.preventDefault();
            metadata = editor.getMetadata();
            saveAnsiData(editor.getImageData(0, 0, editor.getColumns(), editor.getRows()), editor.getBlinkStatus(), metadata.title, metadata.author, metadata.group, toolbar.getTitleText() + ".ans");
            dismiss();
        }});

        modal.addButton("cancel", {"textContent": "Cancel", "href": "#", "onclick": function (evt) {
            evt.preventDefault();
            dismiss();
        }});

        toolbar.stopListening();
        modal.init();

        return false;
    }

    function toString() {
        return "Save as ANSi";
    }

    return {
        "init": init,
        "toString": toString,
        "isModal": true,
        "uid": "save-ansi"
    };
}

AnsiEditController.addTool(saveAsAnsiTool, "tools-left");