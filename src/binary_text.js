var fs = require("fs");

function createSauce(columns, rows, datatype, filetype, filesize, doFlagsAndTInfoS, iceColours, letterSpacing) {
    function addText(text, maxlength, index) {
        var i;
        for (i = 0; i < maxlength; i += 1) {
            sauce[i + index] = (i < text.length) ? text.charCodeAt(i) : 0x20;
        }
    }
    var sauce = new Uint8Array(129);
    sauce[0] = 0x1A;
    sauce.set(new Uint8Array([0x53, 0x41, 0x55, 0x43, 0x45, 0x30, 0x30]), 1);
    addText("", 35, 8);
    addText("", 20, 43);
    addText("", 20, 63);
    var date = new Date();
    addText(date.getFullYear().toString(10), 4, 83);
    var month = date.getMonth() + 1;
    addText((month < 10) ? ("0" + month.toString(10)) : month.toString(10), 2, 87);
    var day = date.getDate();
    addText((day < 10) ? ("0" + day.toString(10)) : day.toString(10), 2, 89);
    sauce[91] = filesize & 0xFF;
    sauce[92] = (filesize >> 8) & 0xFF;
    sauce[93] = (filesize >> 16) & 0xFF;
    sauce[94] = filesize >> 24;
    sauce[95] = datatype;
    sauce[96] = filetype;
    sauce[97] = columns & 0xFF;
    sauce[98] = columns >> 8;
    sauce[99] = rows & 0xFF;
    sauce[100] = rows >> 8;
    sauce[105] = 0;
    if (doFlagsAndTInfoS === true) {
        var flags = 0;
        if (iceColours === true) {
            flags += 1;
        }
        if (letterSpacing === false) {
            flags += (1 << 1);
        } else {
            flags += (1 << 2);
        }
        sauce[106] = flags;
        var fontName = "IBM VGA";
        addText(fontName, fontName.length, 107);
    }
    return sauce;
}

function convert16BitArrayTo8BitArray(Uint16s) {
    var Uint8s = new Uint8Array(Uint16s.length * 2);
    for (var i = 0, j = 0; i < Uint16s.length; i++, j += 2) {
        Uint8s[j] = Uint16s[i] >> 8;
        Uint8s[j + 1] = Uint16s[i] & 255;
    }
    return Uint8s;
}

function bytesToString(bytes, offset, size) {
    var text = "", i;
    for (i = 0; i < size; i++) {
        text += String.fromCharCode(bytes[offset + i]);
    }
    return text;
}

function getSauce(bytes, defaultColumnValue) {
    var sauce, fileSize, dataType, columns, rows, flags;

    function removeTrailingWhitespace(text) {
        return text.replace(/\s+$/, "");
    }

    if (bytes.length >= 128) {
        sauce = bytes.slice(-128);
        if (bytesToString(sauce, 0, 5) === "SAUCE" && bytesToString(sauce, 5, 2) === "00") {
            fileSize = (sauce[93] << 24) + (sauce[92] << 16) + (sauce[91] << 8) + sauce[90];
            dataType = sauce[94];
            if (dataType === 5) {
                columns = sauce[95] * 2;
                rows = fileSize / columns / 2;
            } else {
                columns = (sauce[97] << 8) + sauce[96];
                rows = (sauce[99] << 8) + sauce[98];
            }
            flags = sauce[105];
            return {
                "title": removeTrailingWhitespace(bytesToString(sauce, 7, 35)),
                "author": removeTrailingWhitespace(bytesToString(sauce, 42, 20)),
                "group": removeTrailingWhitespace(bytesToString(sauce, 62, 20)),
                "fileSize": (sauce[93] << 24) + (sauce[92] << 16) + (sauce[91] << 8) + sauce[90],
                "columns": columns,
                "rows": rows,
                "iceColours": (flags & 0x01) === 1,
                "letterSpacing": (flags >> 1 & 0x02) === 2
            };
        }
    }
    return {
        "title": "",
        "author": "",
        "group": "",
        "fileSize": bytes.length,
        "columns": defaultColumnValue,
        "rows": undefined,
        "iceColours": false,
        "letterSpacing": false
    };
}

function convertUInt8ToUint16(uint8Array, start, size) {
    var i, j;
    var uint16Array = new Uint16Array(size / 2);
    for (i = 0, j = 0; i < size; i += 2, j += 1) {
        uint16Array[j] = (uint8Array[start + i] << 8) + uint8Array[start + i + 1];
    }
    return uint16Array;
}

function load(filename, callback) {
    fs.readFile(filename, (err, bytes) => {
        var sauce = getSauce(bytes, 160);
        var data;
        if (err) {
            saveImageData();
        } else {
            data = convertUInt8ToUint16(bytes, 0, sauce.columns * sauce.rows * 2);
            callback({
                "columns": sauce.columns,
                "rows": sauce.rows,
                "data": data,
                "iceColours": sauce.iceColours,
                "letterSpacing": sauce.letterSpacing
            });
        }
    });
}

function save(filename, imageData, callback) {
    var data = convert16BitArrayTo8BitArray(imageData.data);
    var sauce = createSauce(0, 0, 5, imageData.columns / 2, data.length, true, imageData.iceColours, imageData.letterSpacing);
    output = new Uint8Array(data.length + sauce.length);
    output.set(data, 0);
    output.set(sauce, data.length);
    fs.writeFile(filename, Buffer.from(output.buffer), () => {
        if (callback !== undefined) {
            callback();
        }
    });
}

module.exports = {
    "load": load,
    "save": save
};
