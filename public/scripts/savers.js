var Save = (function () {
    "use strict";
    function saveFile(bytes, sauce, filename) {
        var outputBytes;
        if (sauce !== undefined) {
            outputBytes = new Uint8Array(bytes.length + sauce.length);
            outputBytes.set(sauce, bytes.length);
        } else {
            outputBytes = new Uint8Array(bytes.length);
        }
        outputBytes.set(bytes, 0);
        var downloadLink = document.createElement("A");
        if ((navigator.userAgent.indexOf("Chrome") === -1) && (navigator.userAgent.indexOf("Safari") !== -1)) {
            var base64String = "";
            for (var i = 0; i < outputBytes.length; i += 1) {
                base64String += String.fromCharCode(outputBytes[i]);
            }
            downloadLink.href = "data:application/octet-stream;base64," + btoa(base64String);
        } else {
            var blob = new Blob([outputBytes], {"type": "application/octet-stream"});
            downloadLink.href = URL.createObjectURL(blob);
        }
        downloadLink.download = filename;
        var clickEvent = document.createEvent("MouseEvent");
        clickEvent.initEvent("click", true, true);
        downloadLink.dispatchEvent(clickEvent);
        window.URL.revokeObjectURL(downloadLink.href);
    }

    function createSauce(datatype, filetype, filesize, doFlagsAndTInfoS) {
        function addText(sauce, text, maxlength, index) {
            var i;
            for (i = 0; i < maxlength; i += 1) {
                sauce[i + index] = (i < text.length) ? text.charCodeAt(i) : 0x20;
            }
        }
        var sauce = new Uint8Array(129);
        sauce[0] = 26;
        sauce.set(new Uint8Array([0x53, 0x41, 0x55, 0x43, 0x45, 0x30, 0x30]), 1);
        addText(sauce, $("sauce-title").value, 35, 8);
        addText(sauce, $("sauce-author").value, 20, 43);
        addText(sauce, $("sauce-group").value, 20, 63);
        var date = new Date();
        addText(sauce, date.getFullYear().toString(10), 4, 83);
        var month = date.getMonth() + 1;
        addText(sauce, (month < 10) ? ("0" + month.toString(10)) : month.toString(10), 2, 87);
        var day = date.getDate();
        addText(sauce, (day < 10) ? ("0" + day.toString(10)) : day.toString(10), 2, 89);
        sauce[91] = filesize & 0xff;
        sauce[92] = (filesize >> 8) & 0xff;
        sauce[93] = (filesize >> 16) & 0xff;
        sauce[94] = filesize >> 24;
        sauce[95] = datatype;
        sauce[96] = filetype;
        var columns = textArtCanvas.getColumns();
        sauce[97] = columns & 0xff;
        sauce[98] = columns >> 8;
        var rows = textArtCanvas.getRows();
        sauce[99] = rows & 0xff;
        sauce[100] = rows >> 8;
        sauce[105] = 0;
        if (doFlagsAndTInfoS) {
            var flags = 0;
            if (textArtCanvas.getIceColours() === true) {
                flags += 1;
            }
            if (font.getLetterSpacing() === false) {
                flags += (1 << 1);
            } else {
                flags += (1 << 2);
            }
            sauce[106] = flags;
            var fontName = "IBM VGA";
            addText(sauce, fontName, fontName.length, 107);
        }
        return sauce;
    }

    function getUnicode(charCode) {
        switch(charCode) {
        case 1: return 0x263A;
        case 2: return 0x263B;
        case 3: return 0x2665;
        case 4: return 0x2666;
        case 5: return 0x2663;
        case 6: return 0x2660;
        case 7: return 0x2022;
        case 8: return 0x25D8;
        case 9: return 0x25CB;
        case 10: return 0x25D9;
        case 11: return 0x2642;
        case 12: return 0x2640;
        case 13: return 0x266A;
        case 14: return 0x266B;
        case 15: return 0x263C;
        case 16: return 0x25BA;
        case 17: return 0x25C4;
        case 18: return 0x2195;
        case 19: return 0x203C;
        case 20: return 0x00B6;
        case 21: return 0x00A7;
        case 22: return 0x25AC;
        case 23: return 0x21A8;
        case 24: return 0x2191;
        case 25: return 0x2193;
        case 26: return 0x2192;
        case 27: return 0x2190;
        case 28: return 0x221F;
        case 29: return 0x2194;
        case 30: return 0x25B2;
        case 31: return 0x25BC;
        case 127: return 0x2302;
        case 128: return 0x00C7;
        case 129: return 0x00FC;
        case 130: return 0x00E9;
        case 131: return 0x00E2;
        case 132: return 0x00E4;
        case 133: return 0x00E0;
        case 134: return 0x00E5;
        case 135: return 0x00E7;
        case 136: return 0x00EA;
        case 137: return 0x00EB;
        case 138: return 0x00E8;
        case 139: return 0x00EF;
        case 140: return 0x00EE;
        case 141: return 0x00EC;
        case 142: return 0x00C4;
        case 143: return 0x00C5;
        case 144: return 0x00C9;
        case 145: return 0x00E6;
        case 146: return 0x00C6;
        case 147: return 0x00F4;
        case 148: return 0x00F6;
        case 149: return 0x00F2;
        case 150: return 0x00FB;
        case 151: return 0x00F9;
        case 152: return 0x00FF;
        case 153: return 0x00D6;
        case 154: return 0x00DC;
        case 155: return 0x00A2;
        case 156: return 0x00A3;
        case 157: return 0x00A5;
        case 158: return 0x20A7;
        case 159: return 0x0192;
        case 160: return 0x00E1;
        case 161: return 0x00ED;
        case 162: return 0x00F3;
        case 163: return 0x00FA;
        case 164: return 0x00F1;
        case 165: return 0x00D1;
        case 166: return 0x00AA;
        case 167: return 0x00BA;
        case 168: return 0x00BF;
        case 169: return 0x2310;
        case 170: return 0x00AC;
        case 171: return 0x00BD;
        case 172: return 0x00BC;
        case 173: return 0x00A1;
        case 174: return 0x00AB;
        case 175: return 0x00BB;
        case 176: return 0x2591;
        case 177: return 0x2592;
        case 178: return 0x2593;
        case 179: return 0x2502;
        case 180: return 0x2524;
        case 181: return 0x2561;
        case 182: return 0x2562;
        case 183: return 0x2556;
        case 184: return 0x2555;
        case 185: return 0x2563;
        case 186: return 0x2551;
        case 187: return 0x2557;
        case 188: return 0x255D;
        case 189: return 0x255C;
        case 190: return 0x255B;
        case 191: return 0x2510;
        case 192: return 0x2514;
        case 193: return 0x2534;
        case 194: return 0x252C;
        case 195: return 0x251C;
        case 196: return 0x2500;
        case 197: return 0x253C;
        case 198: return 0x255E;
        case 199: return 0x255F;
        case 200: return 0x255A;
        case 201: return 0x2554;
        case 202: return 0x2569;
        case 203: return 0x2566;
        case 204: return 0x2560;
        case 205: return 0x2550;
        case 206: return 0x256C;
        case 207: return 0x2567;
        case 208: return 0x2568;
        case 209: return 0x2564;
        case 210: return 0x2565;
        case 211: return 0x2559;
        case 212: return 0x2558;
        case 213: return 0x2552;
        case 214: return 0x2553;
        case 215: return 0x256B;
        case 216: return 0x256A;
        case 217: return 0x2518;
        case 218: return 0x250C;
        case 219: return 0x2588;
        case 220: return 0x2584;
        case 221: return 0x258C;
        case 222: return 0x2590;
        case 223: return 0x2580;
        case 224: return 0x03B1;
        case 225: return 0x00DF;
        case 226: return 0x0393;
        case 227: return 0x03C0;
        case 228: return 0x03A3;
        case 229: return 0x03C3;
        case 230: return 0x00B5;
        case 231: return 0x03C4;
        case 232: return 0x03A6;
        case 233: return 0x0398;
        case 234: return 0x03A9;
        case 235: return 0x03B4;
        case 236: return 0x221E;
        case 237: return 0x03C6;
        case 238: return 0x03B5;
        case 239: return 0x2229;
        case 240: return 0x2261;
        case 241: return 0x00B1;
        case 242: return 0x2265;
        case 243: return 0x2264;
        case 244: return 0x2320;
        case 245: return 0x2321;
        case 246: return 0x00F7;
        case 247: return 0x2248;
        case 248: return 0x00B0;
        case 249: return 0x2219;
        case 250: return 0x00B7;
        case 251: return 0x221A;
        case 252: return 0x207F;
        case 253: return 0x00B2;
        case 254: return 0x25A0;
        case 0:
        case 255:
            return 0x00A0;
        default:
            return charCode;
        }
    }

    function unicodeToArray(unicode) {
        if(unicode < 0x80) {
            return [unicode];
        } else if(unicode < 0x800) {
            return [(unicode >> 6) | 192, (unicode & 63) | 128];
        }
        return [(unicode >> 12) | 224, ((unicode >> 6) & 63) | 128, (unicode & 63) | 128];
    }

    function getUTF8(charCode) {
        return unicodeToArray(getUnicode(charCode));
    }

    function encodeANSi(useUTF8) {
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
        var imageData = textArtCanvas.getImageData();
        var columns = textArtCanvas.getColumns();
        var rows = textArtCanvas.getRows();
        var output = [27, 91, 48, 109];
        var bold = false;
        var blink = false;
        var currentForeground = 7;
        var currentBackground = 0;
        var currentBold = false;
        var currentBlink = false;
        for (var inputIndex = 0; inputIndex < rows * columns; inputIndex++) {
            var attribs = [];
            var charCode = imageData[inputIndex] >> 8;
            var foreground = imageData[inputIndex] & 15;
            var background = imageData[inputIndex] >> 4 & 15;
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
                break;
            }
            if (foreground > 7) {
                bold = true;
                foreground = foreground - 8;
            } else {
                bold = false;
            }
            if (background > 7) {
                blink = true;
                background = background - 8;
            } else {
                blink = false;
            }
            if ((currentBold && !bold) || (currentBlink && !blink)) {
                attribs.push([48]);
                currentForeground = 7;
                currentBackground = 0;
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
            if (foreground !== currentForeground) {
                attribs.push([51, 48 + ansiColor(foreground)]);
                currentForeground = foreground;
            }
            if (background !== currentBackground) {
                attribs.push([52, 48 + ansiColor(background)]);
                currentBackground = background;
            }
            if (attribs.length) {
                output.push(27, 91);
                for (var attribIndex = 0; attribIndex < attribs.length; attribIndex += 1) {
                    output = output.concat(attribs[attribIndex]);
                    if (attribIndex !== attribs.length - 1) {
                        output.push(59);
                    } else {
                        output.push(109);
                    }
                }
            }
            if (useUTF8 === true) {
                getUTF8(charCode).forEach((utf8Code) => {
                    output.push(utf8Code);
                });
                if ((inputIndex + 1) % columns === 0) {
                    output.push(10);
                }
            } else {
                output.push(charCode);
            }
        }
        var sauce = createSauce(1, 1, output.length, true);
        saveFile(new Uint8Array(output), sauce, (useUTF8 === true) ? title.getName() + ".utf8.ans" : title.getName() + ".ans");
    }

    function ans() {
        encodeANSi(false);
    }

    function utf8() {
        encodeANSi(true);
    }

    function convert16BitArrayTo8BitArray(Uint16s) {
        var Uint8s = new Uint8Array(Uint16s.length * 2);
        for (var i = 0, j = 0; i < Uint16s.length; i++, j += 2) {
            Uint8s[j] = Uint16s[i] >> 8;
            Uint8s[j + 1] = Uint16s[i] & 255;
        }
        return Uint8s;
    }

    function bin() {
        var columns = textArtCanvas.getColumns();
        if (columns % 2 === 0) {
            var imageData = convert16BitArrayTo8BitArray(textArtCanvas.getImageData());
            var sauce = createSauce(5, columns / 2, imageData.length, true);
            saveFile(imageData, sauce, title.getName() + ".bin");
        }
    }

    function xb() {
        var imageData = convert16BitArrayTo8BitArray(textArtCanvas.getImageData());
        var columns = textArtCanvas.getColumns();
        var rows = textArtCanvas.getRows();
        var iceColours = textArtCanvas.getIceColours();
        var flags = 0;
        if (iceColours === true) {
            flags += 1 << 3;
        }
        var output = new Uint8Array(11 + imageData.length);
        output.set(new Uint8Array([
            88, 66, 73, 78, 26,
            columns & 255,
            columns >> 8,
            rows & 255,
            rows >> 8,
            font.getHeight(),
            flags
        ]), 0);
        output.set(imageData, 11);
        var sauce = createSauce(6, 0, imageData.length, false);
        saveFile(output, sauce, title.getName() + ".xb");
    }

    function dataUrlToBytes(dataURL) {
        var base64Index = dataURL.indexOf(";base64,") + 8;
        var byteChars = atob(dataURL.substr(base64Index, dataURL.length - base64Index));
        var bytes = new Uint8Array(byteChars.length);
        for (var i = 0; i < bytes.length; i++) {
            bytes[i] = byteChars.charCodeAt(i);
        }
        return bytes;
    }

    function png() {
        saveFile(dataUrlToBytes(textArtCanvas.getImage().toDataURL()), undefined, title.getName() + ".png");
    }

    return {
        "ans": ans,
        "utf8": utf8,
        "bin": bin,
        "xb": xb,
        "png": png
    };
}());
