function exportPNG(editor, toolbar) {
    "use strict";

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
            Savers.saveFile(data.bytes, data.mimeType, filename);
        }
    }

    function init() {
        saveCanvas(editor.renderImageData(editor.getImageData(0, 0, editor.getColumns(), editor.getRows(), false)), toolbar.getTitleText() + ".png");

        return false;
    }

    function toString() {
        return "Export as PNG";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "export-png"
    };
}

AnsiEditController.addTool(exportPNG, "tools-left");