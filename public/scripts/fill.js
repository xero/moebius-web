function createFillController() {
    "use strict";

    function fillPoint(evt) {
        var block = textArtCanvas.getHalfBlock(evt.detail.x, evt.detail.halfBlockY);
        if (block.isBlocky) {
            var targetColour = (block.halfBlockY === 0) ? block.upperBlockColour : block.lowerBlockColour;
            var fillColour = palette.getForegroundColour();
            if (targetColour !== fillColour) {
                var columns = textArtCanvas.getColumns();
                var rows = textArtCanvas.getRows();
                var coord = [evt.detail.x, evt.detail.halfBlockY];
                var queue = [coord];
                textArtCanvas.startUndo();
                textArtCanvas.drawHalfBlock((callback) => {
                    while (queue.length !== 0) {
                        coord = queue.pop();
                        block = textArtCanvas.getHalfBlock(coord[0], coord[1]);
                        if (block.isBlocky && (((block.halfBlockY === 0) && (block.upperBlockColour === targetColour)) || ((block.halfBlockY === 1) && (block.lowerBlockColour === targetColour)))) {
                            callback(fillColour, coord[0], coord[1]);
                            if (coord[0] > 0) {
                                queue.push([coord[0] - 1, coord[1]]);
                            }
                            if (coord[0] < columns - 1) {
                                queue.push([coord[0] + 1, coord[1]]);
                            }
                            if (coord[1] > 0) {
                                queue.push([coord[0], coord[1] - 1]);
                            }
                            if (coord[1] < rows * 2 - 1) {
                                queue.push([coord[0], coord[1] + 1]);
                            }
                        }
                    }
                });
            }
        }
    }

    function enable() {
        document.addEventListener("onTextCanvasDown", fillPoint);
    }

    function disable() {
        document.removeEventListener("onTextCanvasDown", fillPoint);
    }

    return {
        "enable": enable,
        "disable": disable
    };
}
