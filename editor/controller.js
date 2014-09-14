var AnsiEditController;

document.addEventListener("DOMContentLoaded", function () {
    "use strict";
    var options;
    options = {
        "columns": 80,
        "rows": 25,
        "noblink": false,
        "colors": [0, 1, 2, 3, 4, 5, 20, 7, 56, 57, 58, 59, 60, 61, 62, 63],
        // "retina": window.devicePixelRatio > 1
        // "retina": false
        "retina": true
    };

    AnsiEditController = (function () {
        var colors, palette, codepage, preview, editor, toolbar, title;

        function loadTools(urls) {
            var i;
            i = 0;
            (function next() {
                var script;

                function load() {
                    if (++i < urls.length) {
                        next();
                    } else {
                        toolbar.onload();
                    }
                }

                script = document.createElement("script");
                script.onload = load;
                script.onerror = load;
                script.src = urls[i];
                document.head.appendChild(script);
            }());
        }

        colors = options.colors.map(function (value) {
            return new Uint8Array([
                (((value & 32) >> 5) + ((value & 4) >> 1)) * 0x55,
                (((value & 16) >> 4) + ((value & 2))) * 0x55,
                (((value & 8) >> 3) + ((value & 1) << 1)) * 0x55,
                255
            ]);
        });
        codepage = codepageGenerator(colors, options.retina);
        palette = paletteWidget(document.getElementById("palette"), colors, options.retina);
        preview = previewCanvas(document.getElementById("preview"), document.getElementById("editor"), codepage, options.retina);
        editor = editorCanvas(document.getElementById("editor"), options.columns, options.rows, palette, options.noblink, preview, codepage, options.retina);
        toolbar = toolbarWidget(editor);
        title = titleWidget(document.getElementById("title"), editor, toolbar);

        editor.init();
        toolbar.init(title);

        loadTools([
            "tools/freehand.js?" + Math.random(),
            "tools/line.js?" + Math.random(),
            "tools/shading.js?" + Math.random(),
            "tools/verticalblock.js?" + Math.random(),
            "tools/extendedbrush.js?" + Math.random(),
            "tools/smudge.js?" + Math.random(),
            "tools/text.js?" + Math.random(),
            "tools/box.js?" + Math.random(),
            "tools/ellipse.js?" + Math.random(),
            "tools/shiftcolor.js?" + Math.random(),
            "tools/mirror.js?" + Math.random(),
            "tools/fill.js?" + Math.random(),
            "tools/colorreplacement.js?" + Math.random(),
            "tools/createbrush.js?" + Math.random(),
            "tools/custombrush.js?" + Math.random(),
            "tools/flipbrushx.js?" + Math.random(),
            "tools/flipbrushy.js?" + Math.random(),
            "tools/grid.js?" + Math.random(),
            "tools/showinvisibles.js?" + Math.random(),
            "tools/undo.js?" + Math.random(),
            "tools/reference.js?" + Math.random(),
            "tools/shadedpalette.js?" + Math.random(),
            "tools/icecolors.js?" + Math.random(),
            "tools/resizecanvas.js?" + Math.random(),
            "tools/load.js?" + Math.random(),
            "tools/save.js?" + Math.random(),
            "tools/saveasxbin.js?" + Math.random(),
            "tools/saveasansi.js?" + Math.random(),
            "tools/editsauce.js?" + Math.random(),
            "tools/clear.js?" + Math.random(),
            "tools/loadbrush.js?" + Math.random(),
            "tools/savebrush.js?" + Math.random(),
            "tools/loadfont.js?" + Math.random(),
            "tools/exportpng.js?" + Math.random(),
            "tools/info.js?" + Math.random()
        ]);

        return {
            "addTool": function (callback, elementId, shortcut, functionKeys) {
                toolbar.addTool(callback(editor, toolbar), elementId, shortcut, functionKeys);
            }
        };
    }());
}, false);