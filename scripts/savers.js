var Savers = (function () {
    "use strict";
    var DATATYPE_CHARACTER, DATATYPE_XBIN, FILETYPE_NONE, FILETYPE_ANSI, FLAG_NONE, FLAG_PALETTE, FLAG_FONT, FLAG_NOBLINK;
    DATATYPE_CHARACTER = 1;
    DATATYPE_XBIN = 6;
    FILETYPE_NONE = 0;
    FILETYPE_ANSI = 1;
    FLAG_NONE = 0;
    FLAG_PALETTE = 1;
    FLAG_FONT = 2;
    FLAG_NOBLINK = 8;

    function saveFile(bytes, mimeType, filename) {
        var downloadLink, blob, clickEvent, base64String, i;
        downloadLink = document.createElement("a");
        if ((navigator.userAgent.indexOf("Chrome") === -1) && (navigator.userAgent.indexOf("Safari") !== -1)) {
            base64String = "";
            for (i = 0; i < bytes.length; i += 1) {
                base64String += String.fromCharCode(bytes[i]);
            }
            downloadLink.href = "data:" + mimeType + ";base64," + btoa(base64String);
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
        for (i = 0; i < maxlength; i += 1) {
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

    function imageDataToXBin(imageData, noblink, fontHeight, fontBytes, palette) {
        var bytes, i, j, flags;
        bytes = new Uint8Array(11 + fontBytes.length + 48 + (imageData.width * imageData.height * 2));
        flags = (noblink ? FLAG_NOBLINK : FLAG_NONE) | FLAG_FONT | FLAG_PALETTE;
        bytes.set(new Uint8Array([88, 66, 73, 78, 26, (imageData.width & 0xff), (imageData.width >> 8), (imageData.height & 0xff), (imageData.height >> 8), fontHeight, flags]), 0);
        for (i = 0, j = 11; i < 16; i += 1, j += 3) {
            bytes[j] = palette[i][0];
            bytes[j + 1] = palette[i][1];
            bytes[j + 2] = palette[i][2];
        }
        bytes.set(fontBytes, j);
        j += fontBytes.length;
        for (i = 0; i < imageData.data.length; i += 3, j += 2) {
            bytes[j] = imageData.data[i];
            bytes[j + 1] = imageData.data[i + 1] + (imageData.data[i + 2] << 4);
        }
        return bytes;
    }

    function saveXBinData(imageData, noblink, fontHeight, fontBytes, palette, title, author, group, filename) {
        var xbin, sauce, combined;
        xbin = imageDataToXBin(imageData, noblink, fontHeight, fontBytes, palette);
        sauce = createSauce(DATATYPE_XBIN, FILETYPE_NONE, xbin.length, imageData.width, imageData.height, title, author, group, 0, undefined);
        combined = new Uint8Array(xbin.length + sauce.length);
        combined.set(xbin, 0);
        combined.set(sauce, xbin.length);
        saveFile(combined, "image/x-bin", filename);
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
                for (i = 0; i < bytes.length; i += 1) {
                    bytes[i] = byteChars.charCodeAt(i);
                }
                return {"bytes": bytes, "mimeType": mimeType};
            }
        }
        return undefined;
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
        "createSauce": createSauce,
        "DATATYPE_CHARACTER": DATATYPE_CHARACTER,
        "DATATYPE_XBIN": DATATYPE_XBIN,
        "FILETYPE_NONE": FILETYPE_NONE,
        "FILETYPE_ANSI": FILETYPE_ANSI,
        "saveXBinData": saveXBinData,
        "saveCanvas": saveCanvas
    };
}());
