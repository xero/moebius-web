var AnsiEditController;

document.addEventListener("DOMContentLoaded", function () {
    "use strict";
    var options;
    options = {
        "columns": 80,
        "rows": 80,
        "noblink": false,
        "colors": [0, 1, 2, 3, 4, 5, 20, 7, 56, 57, 58, 59, 60, 61, 62, 63],
        "retina": window.devicePixelRatio > 1
        // "retina": false
    };

    AnsiEditController = (function () {
        var colors, palette, codepage, preview, editor, toolbar, title;

        function loadTool(src, onload, onerror) {
            var script;
            script = document.createElement("script");
            script.addEventListener("onerror", onerror, false);
            script.onload = onload;
            script.onerror = onerror;
            script.src = src;
            document.head.appendChild(script);
        }

        function loadTools(urls) {
            var i;
            i = 0;
            (function next() {
                loadTool(urls[i], function () {
                    if (++i < urls.length) {
                        next();
                    } else {
                        toolbar.onload();
                    }
                }, function () {
                    if (++i < urls.length) {
                        next();
                    } else {
                        toolbar.onload();
                    }
                });
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
        editor = editorCanvas(options.columns, options.rows, palette, options.noblink, preview, codepage, options.retina);
        toolbar = toolbarWidget(editor);
        title = titleWidget(document.getElementById("title"), editor, toolbar);

        editor.init(document.getElementById("editor"));
        toolbar.init();

        loadTools([
            "tools/shadedpalette.js?" + Math.random(),
            "tools/load.js?" + Math.random(),
            "tools/save.js?" + Math.random(),
            "tools/clear.js?" + Math.random(),
            "tools/loadimagestamp.js?" + Math.random(),
            "tools/saveimagestamp.js?" + Math.random(),
            "tools/loadreference.js?" + Math.random(),
            "tools/exportpng.js?" + Math.random(),
            "tools/info.js?" + Math.random(),
            "tools/freehand.js?" + Math.random(),
            "tools/line.js?" + Math.random(),
            "tools/shading.js?" + Math.random(),
            "tools/verticalblock.js?" + Math.random(),
            "tools/extendedbrush.js?" + Math.random(),
            "tools/clonebrush.js?" + Math.random(),
            "tools/imagestamp.js?" + Math.random(),
            "tools/text.js?" + Math.random(),
            "tools/box.js?" + Math.random(),
            "tools/ellipse.js?" + Math.random(),
            "tools/brighten.js?" + Math.random(),
            "tools/darken.js?" + Math.random(),
            "tools/mirror.js?" + Math.random(),
            "tools/fill.js?" + Math.random(),
            "tools/attributebrush.js?" + Math.random(),
            "tools/copy.js?" + Math.random(),
            "tools/fliphorizontal.js?" + Math.random(),
            "tools/flipvertical.js?" + Math.random(),
            "tools/grid.js?" + Math.random(),
            "tools/reference.js?" + Math.random(),
            "tools/undo.js?" + Math.random()
        ]);

        return {
            "addTool": function (callback, elementId, shortcut) {
                toolbar.addTool(callback(editor, toolbar, title), elementId, shortcut);
            }
        };
    }());
});