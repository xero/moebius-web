var AnsiEditController;

document.addEventListener("DOMContentLoaded", function () {
    "use strict";
    var options;
    options = {
        "columns": 80,
        "rows": 25,
        "noblink": false
    };

    AnsiEditController = (function () {
        var codepage, preview, editor, toolbar, title;

        function loadTools(urls) {
            var i;
            i = 0;
            (function next() {
                var script;

                function load() {
                    i += 1;
                    if (i < urls.length) {
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

        codepage = codepageGenerator();
        preview = previewCanvas(document.getElementById("preview"), document.getElementById("editor"), codepage);
        editor = editorCanvas(document.getElementById("editor"), options.columns, options.rows, options.noblink, preview, codepage);
        toolbar = toolbarWidget(editor);
        title = titleWidget(document.getElementById("title"), editor, toolbar);

        editor.init();
        toolbar.init(title);

        loadTools([
            "tools/fontbrush.js?" + Math.random(),
            "tools/freehand.js?" + Math.random(),
            "tools/line.js?" + Math.random(),
            "tools/shading.js?" + Math.random(),
            "tools/verticalblock.js?" + Math.random(),
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
            "tools/palette.js?" + Math.random(),
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
            "tools/savefont.js?" + Math.random(),
            "tools/changefont.js?" + Math.random(),
            "tools/loadpalette.js?" + Math.random(),
            "tools/savepalette.js?" + Math.random(),
            "tools/changepalette.js?" + Math.random(),
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