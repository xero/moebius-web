function createSampleTool(divElement, freestyle, divFreestyle, characterBrush, divCharacterBrush) {
    "use strict";

    function sample(x, halfBlockY) {
        var block = textArtCanvas.getHalfBlock(x, halfBlockY);
        if (block.isBlocky) {
            if (block.halfBlockY === 0) {
                palette.setForegroundColour(block.upperBlockColour);
            } else {
                palette.setForegroundColour(block.lowerBlockColour);
            }
        } else {
            block = textArtCanvas.getBlock(block.x, Math.floor(block.y / 2));
            palette.setForegroundColour(block.foregroundColour);
            palette.setBackgroundColour(block.backgroundColour);
            if (block.charCode >= 176 && block.charCode <= 178) {
                freestyle.select(block.charCode);
                divFreestyle.click();
            } else {
                characterBrush.select(block.charCode);
                divCharacterBrush.click();
            }
        }
    }

    function canvasDown(evt) {
        sample(evt.detail.x, evt.detail.halfBlockY);
    }

    function enable() {
        document.addEventListener("onTextCanvasDown", canvasDown);
    }

    function disable() {
        document.removeEventListener("onTextCanvasDown", canvasDown);
    }

    return {
        "enable": enable,
        "disable": disable,
        "sample": sample
    };
}
