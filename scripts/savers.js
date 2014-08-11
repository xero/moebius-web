var Savers = (function () {
    "use strict";

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
        if (navigator.userAgent.indexOf("Safari") !== -1) {
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

    function saveXBinData(imageData, noblink, filename) {
        saveFile(imageDataToXBin(imageData, noblink), "image/x-bin", filename);
    }

    function saveCanvas(canvas, filename) {
        var data;
        data = dataUrlToBytes(canvas.toDataURL());
        if (data !== undefined) {
            saveFile(data.bytes, data.mimeType, filename);
        }
    }

    return {
        "saveXBinData": saveXBinData,
        "saveCanvas": saveCanvas
    };
}());
