function loadImageAndGetImageData(url, callback) {
    "use strict";
    var imgElement = new Image();
    imgElement.addEventListener("load", () => {
        var canvas = document.createElement("CANVAS");
        canvas.width = imgElement.width;
        canvas.height = imgElement.height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(imgElement, 0, 0);
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        callback(imageData);
    });
    imgElement.addEventListener("error", () => {
        callback(undefined);
    });
    imgElement.src = url;
}

function loadFontFromImage(fontName, letterSpacing, palette, callback) {
    "use strict";
    var fontData = {};
    var fontGlyphs;
    var alphaGlyphs;
    var letterSpacingImageData;

    function parseFontData(imageData) {
        var fontWidth = imageData.width / 16;
        var fontHeight = imageData.height / 16;
        if ((fontWidth === 8) && (imageData.height % 16 === 0) && (fontHeight >= 1 && fontHeight <= 32)) {
            var data = new Uint8Array(fontWidth * fontHeight * 256 / 8);
            var k = 0;
            for (var value = 0; value < 256; value += 1) {
                var x = (value % 16) * fontWidth;
                var y = Math.floor(value / 16) * fontHeight;
                var pos = (y * imageData.width + x) * 4;
                var i = 0;
                while (i < fontWidth * fontHeight) {
                    data[k] = data[k] << 1;
                    if (imageData.data[pos] > 127) {
                        data[k] += 1;
                    }
                    if ((i += 1) % fontWidth === 0) {
                        pos += (imageData.width - 8) * 4;
                    }
                    if (i % 8 === 0) {
                        k += 1;
                    }
                    pos += 4;
                }
            }
            return {
                "width": fontWidth,
                "height": fontHeight,
                "data": data
            };
        }
        return undefined;
    }

    function generateNewFontGlyphs() {
        var canvas = document.createElement("CANVAS");
        canvas.width = fontData.width;
        canvas.height = fontData.height;
        var ctx = canvas.getContext("2d");
        var bits = new Uint8Array(fontData.width * fontData.height * 256);
        for (var i = 0, k = 0; i < fontData.width * fontData.height * 256 / 8; i += 1) {
            for (var j = 7; j >= 0; j -= 1, k += 1) {
                bits[k] = (fontData.data[i] >> j) & 1;
            }
        }
        fontGlyphs = new Array(16);
        for (var foreground = 0; foreground < 16; foreground++) {
            fontGlyphs[foreground] = new Array(16);
            for (var background = 0; background < 16; background++) {
                fontGlyphs[foreground][background] = new Array(256);
                for (var charCode = 0; charCode < 256; charCode++) {
                    fontGlyphs[foreground][background][charCode] = ctx.createImageData(fontData.width, fontData.height);
                    for (var i = 0, j = charCode * fontData.width * fontData.height; i < fontData.width * fontData.height; i += 1, j += 1) {
                        var colour = palette.getRGBAColour((bits[j] === 1) ? foreground : background);
                        fontGlyphs[foreground][background][charCode].data.set(colour, i * 4);
                    }
                }
            }
        }
        alphaGlyphs = new Array(16);
        for (var foreground = 0; foreground < 16; foreground++) {
            alphaGlyphs[foreground] = new Array(256);
            for (var charCode = 0; charCode < 256; charCode++) {
                if (charCode === 220 || charCode === 223) {
                    var imageData = ctx.createImageData(fontData.width, fontData.height);
                    for (var i = 0, j = charCode * fontData.width * fontData.height; i < fontData.width * fontData.height; i += 1, j += 1) {
                        if (bits[j] === 1) {
                            imageData.data.set(palette.getRGBAColour(foreground), i * 4);
                        }
                    }
                    var alphaCanvas = document.createElement("CANVAS");
                    alphaGlyphs.width = imageData.width;
                    alphaGlyphs.height = imageData.height;
                    alphaCanvas.getContext("2d").putImageData(imageData, 0, 0);
                    alphaGlyphs[foreground][charCode] = alphaCanvas;
                }
            }
        }
        letterSpacingImageData = new Array(16);
        for (var i = 0; i < 16; i++) {
            var canvas = document.createElement("CANVAS");
            canvas.width = 1;
            canvas.height = fontData.height;
            var ctx = canvas.getContext("2d");
            var imageData = ctx.getImageData(0, 0, 1, fontData.height);
            var colour = palette.getRGBAColour(i);
            for (var j = 0; j < fontData.height; j++) {
                imageData.data.set(colour, j * 4);
            }
            letterSpacingImageData[i] = imageData;
        }
    }

    function getWidth() {
        return fontData.width;
    }

    function getHeight() {
        return fontData.height;
    }

    function setLetterSpacing(newLetterSpacing) {
        if (newLetterSpacing !== letterSpacing) {
            generateNewFontGlyphs();
            letterSpacing = newLetterSpacing;
            document.dispatchEvent(new CustomEvent("onLetterSpacingChange", {"detail": letterSpacing}));
        }
    }

    function getLetterSpacing() {
        return letterSpacing;
    }

    loadImageAndGetImageData("fonts/" + fontName + ".png", (imageData) => {
        if (imageData === undefined) {
            callback(false);
        } else {
            var newFontData = parseFontData(imageData);
            if (newFontData === undefined) {
                callback(false);
            } else {
                fontData = newFontData;
                generateNewFontGlyphs();
                callback(true);
            }
        }
    });

    function draw(charCode, foreground, background, ctx, x, y) {
        if (letterSpacing === true) {
            ctx.putImageData(fontGlyphs[foreground][background][charCode], x * (fontData.width + 1), y * fontData.height);
            if (charCode >= 192 && charCode <= 223) {
                ctx.putImageData(fontGlyphs[foreground][background][charCode], x * (fontData.width + 1) + 1, y * fontData.height, fontData.width - 1, 0, 1, fontData.height);
            } else {
                ctx.putImageData(letterSpacingImageData[background], x * (fontData.width + 1) + 8, y * fontData.height);
            }
        } else {
            ctx.putImageData(fontGlyphs[foreground][background][charCode], x * fontData.width, y * fontData.height);
        }
    }

    function drawWithAlpha(charCode, foreground, ctx, x, y) {
        if (letterSpacing === true) {
            ctx.drawImage(alphaGlyphs[foreground][charCode], x * (fontData.width + 1), y * fontData.height);
            if (charCode >= 192 && charCode <= 223) {
                ctx.drawImage(alphaGlyphs[foreground][charCode], fontData.width - 1, 0, 1, fontData.height, x * (fontData.width + 1) + fontData.width, y * fontData.height, 1, fontData.height);
            }
        } else {
            ctx.drawImage(alphaGlyphs[foreground][charCode], x * fontData.width, y * fontData.height);
        }
    }

    return {
        "getWidth": getWidth,
        "getHeight": getHeight,
        "setLetterSpacing": setLetterSpacing,
        "getLetterSpacing": getLetterSpacing,
        "draw": draw,
        "drawWithAlpha": drawWithAlpha
    };
}
