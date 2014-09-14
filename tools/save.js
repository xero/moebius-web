function saveTool(editor, toolbar) {
    "use strict";
    var UNCOMPRESSED, COMPRESS_LZ77, UNDO_RESIZE;

    UNCOMPRESSED = 0;
    COMPRESS_LZ77 = 1;
    UNDO_RESIZE = 2;

    function put32BitNumber(value, array, index) {
        array[index] = value & 0xff;
        array[index + 1] = (value >> 8) & 0xff;
        array[index + 2] = (value >> 16) & 0xff;
        array[index + 3] = value >> 24;
    }

    function put16BitNumber(value, array, index) {
        array[index] = value & 0xff;
        array[index + 1] = (value >> 8) & 0xff;
    }

    function putNullTerminatedString(text, array, index) {
        var i;
        for (i = 0; i < text.length; i += 1) {
            array[index + i] = text.charCodeAt(i);
        }
        array[index + i] = 0;
    }

    function createBlock(header, length) {
        return {
            "header": header,
            "bytes": new Uint8Array(length)
        };
    }

    function encodeBlock(block, compression) {
        var compressedBytes, bytes, i;
        if (compression === 1) {
            compressedBytes = LZ77.compress(block.bytes, 5);
            if (compressedBytes === undefined) {
                compression = 0;
            } else {
                block.bytes = compressedBytes;
            }
        }
        bytes = new Uint8Array(9 + block.bytes.length);
        for (i = 0; i < 4; i += 1) {
            bytes[i] = block.header.charCodeAt(i);
        }
        put32BitNumber(block.bytes.length, bytes, 5);
        bytes[4] = compression;
        bytes.set(block.bytes, 9);
        return bytes;
    }

    function createMetadata(sauce) {
        var block;
        block = createBlock("META", sauce.title.length + sauce.author.length + sauce.group.length + 3);
        putNullTerminatedString(sauce.title, block.bytes, 0);
        putNullTerminatedString(sauce.author, block.bytes, sauce.title.length + 1);
        putNullTerminatedString(sauce.group, block.bytes, sauce.title.length + 1 + sauce.author.length + 1);
        return encodeBlock(block, UNCOMPRESSED);
    }

    function compressImage(bytes) {
        var compressedImage, i, j;
        compressedImage = new Uint8Array(bytes.length / 3 * 2);
        for (i = 0, j = 0; i < bytes.length; i += 3, j += 2) {
            compressedImage[j] = bytes[i];
            compressedImage[j + 1] = bytes[i + 1] + (bytes[i + 2] << 4);
        }
        return compressedImage;
    }

    function createUndos(undos, types) {
        var block, i, j, k, type, value;
        i = 0;
        for (j = 0; j < undos.length; j += 1) {
            if (types[j] === UNDO_RESIZE) {
                i += undos[j][2].length / 3 * 2 + 4;
            } else {
                i += undos[j].length * 6;
            }
            i += 5;
        }
        block = createBlock("UNDO", i);
        i = 0;
        for (j = 0; j < undos.length; j += 1) {
            type = types[j];
            block.bytes[i] = type;
            i += 1;
            put32BitNumber(undos[j].length, block.bytes, i);
            i += 4;
            if (type === UNDO_RESIZE) {
                put16BitNumber(undos[j][0], block.bytes, i);
                i += 2;
                put16BitNumber(undos[j][1], block.bytes, i);
                i += 2;
                block.bytes.set(compressImage(undos[j][2]), i);
                i += undos[j][0] * undos[j][1] * 2;
            } else {
                for (k = 0; k < undos[j].length; k += 1) {
                    value = undos[j][k];
                    block.bytes[i] = value[0];
                    block.bytes[i + 1] = value[1] + (value[2] << 4);
                    put32BitNumber(value[3], block.bytes, i + 2);
                    i += 6;
                }
            }
        }
        return encodeBlock(block, UNCOMPRESSED);
    }

    function createImage(imageData, noblink) {
        var block;
        block = createBlock("DISP", imageData.width * imageData.height * 2 + 5);
        put16BitNumber(imageData.width, block.bytes, 0);
        put16BitNumber(imageData.height, block.bytes, 2);
        block.bytes[4] = noblink ? 1 : 0;
        block.bytes.set(compressImage(imageData.data), 5);
        return encodeBlock(block, UNCOMPRESSED);
    }

    function createFont(fontWidth, fontHeight, fontBytes) {
        var block;
        block = createBlock("FONT", fontBytes.length + 2);
        block.bytes[0] = fontWidth;
        block.bytes[1] = fontHeight;
        block.bytes.set(fontBytes, 2);
        return encodeBlock(block, UNCOMPRESSED);
    }

    function createStates(currentColor, currentTool, states) {
        var i, j, block;
        i = 0;
        Object.keys(states).forEach(function (key) {
            i += 4;
            i += key.length + 1;
            i += states[key].length;
        });
        block = createBlock("TOOL", i + 1 + currentTool.length + 1);
        block.bytes[0] = currentColor;
        putNullTerminatedString(currentTool, block.bytes, 1);
        i = 1 + currentTool.length + 1;
        Object.keys(states).forEach(function (key) {
            putNullTerminatedString(key, block.bytes, i);
            i += key.length + 1;
            put32BitNumber(states[key].length, block.bytes, i);
            i += 4;
            for (j = 0; j < states[key].length; j += 1, i += 1) {
                block.bytes[i] = states[key][j];
            }
        });
        return encodeBlock(block, UNCOMPRESSED);
    }

    function concatBytes(array) {
        var i, block;
        i = 0;
        array.forEach(function (blockBytes) {
            i += blockBytes.length;
        });
        block = createBlock("ANSi", i);
        i = 0;
        array.forEach(function (blockBytes) {
            block.bytes.set(blockBytes, i);
            i += blockBytes.length;
        });
        return encodeBlock(block, COMPRESS_LZ77);
    }

    function init() {
        var modal;

        function dismiss() {
            toolbar.modalEnd("save-ansi");
            modal.remove();
            editor.startListening();
            toolbar.startListening();
        }

        modal = modalBox();

        modal.addPanel(ElementHelper.create("p", {"textContent": "Warning: This file format is still in the process of being finalised."}));
        modal.addPanel(ElementHelper.create("p", {"textContent": "It is recommended that you also save as an XBin as a backup strategy."}));

        modal.addButton("default", {"textContent": "Save", "href": "#", "onclick": function (evt) {
            var image, font, undoHistory, undos, metadata, states, bytes;
            evt.preventDefault();
            image = createImage(editor.getImageData(0, 0, editor.getColumns(), editor.getRows()), editor.getBlinkStatus());
            font = createFont(editor.codepage.getFontWidth(), editor.codepage.getFontHeight(), editor.codepage.getFontBytes());
            metadata = createMetadata(editor.getMetadata());
            undoHistory = editor.getUndoHistory();
            undos = createUndos(undoHistory.queue, undoHistory.types);
            states = createStates(editor.getCurrentColor(), toolbar.getCurrentTool(), toolbar.getStates());
            bytes = concatBytes([image, font, metadata, undos, states]);
            Savers.saveFile(bytes, "image/ansiedit", toolbar.getTitleText() + ".ansiedit");
            dismiss();
        }});

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