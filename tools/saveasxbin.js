function saveAsXbinTool(editor, toolbar) {
    "use strict";

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

    function saveXBinData(imageData, noblink, title, author, group, filename) {
        var xbin, sauce, combined;
        xbin = imageDataToXBin(imageData, noblink);
        sauce = Savers.createSauce(Savers.DATATYPE_XBIN, Savers.FILETYPE_NONE, xbin.length, imageData.width, imageData.height, title, author, group, 0, undefined);
        combined = new Uint8Array(xbin.length + sauce.length);
        combined.set(xbin, 0);
        combined.set(sauce, xbin.length);
        Savers.saveFile(combined, "image/x-bin", filename);
    }

    function init() {
        var metadata;
        metadata = editor.getMetadata();
        saveXBinData(editor.getImageData(0, 0, editor.getColumns(), editor.getRows()), editor.getBlinkStatus(), metadata.title, metadata.author, metadata.group, toolbar.getTitleText() + ".xb");

        return false;
    }

    function toString() {
        return "Save as XBin";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "save-xbin"
    };
}

AnsiEditController.addTool(saveAsXbinTool, "tools-left");