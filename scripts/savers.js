var Savers = (function () {
    "use strict";
    var DATATYPE_CHARACTER, DATATYPE_XBIN, FILETYPE_NONE, FILETYPE_ANSI;
    DATATYPE_CHARACTER = 1;
    DATATYPE_XBIN = 6;
    FILETYPE_NONE = 0;
    FILETYPE_ANSI = 1;

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
                for (attribIndex = 0; attribIndex < attribs.length; ++attribIndex) {
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

    function imageDataToXBin(imageData, noblink) {
        var bytes, i, j, flags;
        bytes = new Uint8Array((imageData.width * imageData.height * 2) + 11);
        flags = noblink ? 8 : 0;
        bytes.set(new Uint8Array([88, 66, 73, 78, 26, (imageData.width & 0xff), (imageData.width >> 8), (imageData.height & 0xff), (imageData.height >> 8), 16, flags]), 0);
        for (i = 0, j = 11; i < imageData.data.length; i += 3, j += 2) {
            bytes[j] = imageData.data[i];
            bytes[j + 1] = imageData.data[i + 1] + (imageData.data[i + 2] << 4);
        }
        return bytes;
    }

    function dataUrlToBytes(dataURL) {
        var base64Index, mimeType, byteChars, bytes, i;
        if (dataURL.indexOf("data:") === 0) {
            base64Index = dataURL.indexOf(";base64,");
            if (base64Index !== -1) {
                mimeType = dataURL.substr(5, base64Index - 5);
                base64Index += 8;
                byteChars = atob(dataURL.substr(base64Index, dataURL.length - base64Index));
                bytes = new Uint8Array(byteChars.length);
                for (i = 0; i < bytes.length; ++i) {
                    bytes[i] = byteChars.charCodeAt(i);
                }
                return {"bytes": bytes, "mimeType": mimeType};
            }
        }
        return undefined;
    }

    function saveFile(bytes, mimeType, filename) {
        var downloadLink, blob, clickEvent;
        downloadLink = document.createElement("a");
        if ((navigator.userAgent.indexOf("Chrome") === -1) && (navigator.userAgent.indexOf("Safari") !== -1)) {
            downloadLink.href = "data:" + mimeType + ";base64," + btoa(String.fromCharCode.apply(null, bytes));
        } else {
            blob = new Blob([bytes], {"type": mimeType});
            downloadLink.href = URL.createObjectURL(blob);
        }
        downloadLink.download = filename;
        clickEvent = document.createEvent("MouseEvent");
        clickEvent.initEvent("click", true, true);
        downloadLink.dispatchEvent(clickEvent);
    }

    function addText(sauce, text, maxlength, index) {
        var i;
        for (i = 0; i < maxlength; i++) {
            sauce[i + index] = (i < text.length) ? text.charCodeAt(i) : 0x20;
        }
    }

    function createSauce(datatype, filetype, filesize, columns, rows, title, author, group, flags, fontName) {
        var sauce, date, month, day;
        sauce = new Uint8Array(129);
        sauce[0] = 26;
        sauce.set(new Uint8Array([0x53, 0x41, 0x55, 0x43, 0x45, 0x30, 0x30]), 1);
        addText(sauce, title, 35, 8);
        addText(sauce, author, 20, 43);
        addText(sauce, group, 20, 63);
        date = new Date();
        addText(sauce, date.getFullYear().toString(10), 4, 83);
        month = date.getMonth() + 1;
        addText(sauce, (month < 10) ? ("0" + month.toString(10)) : month.toString(10), 2, 87);
        day = date.getDate();
        addText(sauce, (day < 10) ? ("0" + day.toString(10)) : day.toString(10), 2, 89);
        sauce[91] = filesize & 0xff;
        sauce[92] = (filesize >> 8) & 0xff;
        sauce[93] = (filesize >> 16) & 0xff;
        sauce[94] = filesize >> 24;
        sauce[95] = datatype;
        sauce[96] = filetype;
        sauce[97] = columns & 0xff;
        sauce[98] = columns >> 8;
        sauce[99] = rows & 0xff;
        sauce[100] = rows >> 8;
        sauce[105] = 0;
        sauce[106] = flags;
        if (fontName !== undefined) {
            addText(sauce, fontName, fontName.length, 107);
        }
        return sauce;
    }


    function saveXBinData(imageData, noblink, title, author, group, filename) {
        var xbin, sauce, combined;
        xbin = imageDataToXBin(imageData, noblink);
        sauce = createSauce(DATATYPE_XBIN, FILETYPE_NONE, xbin.length, imageData.width, imageData.height, title, author, group, 0, undefined);
        combined = new Uint8Array(xbin.length + sauce.length);
        combined.set(xbin, 0);
        combined.set(sauce, xbin.length);
        saveFile(combined, "image/x-bin", filename);
    }

    function saveAnsiData(imageData, noblink, title, author, group, filename) {
        var ansi, sauce, combined;
        ansi = imageDataToAnsi(imageData, noblink);
        sauce = createSauce(DATATYPE_CHARACTER, FILETYPE_ANSI, ansi.length, imageData.width, imageData.height, title, author, group, (noblink ? 1 : 0) + 2 + 16, "IBM VGA");
        combined = new Uint8Array(ansi.length + sauce.length);
        combined.set(ansi, 0);
        combined.set(sauce, ansi.length);
        saveFile(combined, "image/ansi", filename);
    }

    function saveCanvas(canvas, filename) {
        var data;
        data = dataUrlToBytes(canvas.toDataURL());
        if (data !== undefined) {
            saveFile(data.bytes, data.mimeType, filename);
        }
    }

    return {
        "saveFile": saveFile,
        "saveXBinData": saveXBinData,
        "saveAnsiData": saveAnsiData,
        "saveCanvas": saveCanvas
    };
}());
