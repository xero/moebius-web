var AnsiEditController;

document.addEventListener("DOMContentLoaded", function () {
    "use strict";
    AnsiEditController = (function () {
        var retina, palette, codepage, preview, editor, toolbar;

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
                    }
                }, function (evt) {
                    console.log(evt);
                    if (++i < urls.length) {
                        next();
                    }
                });
            }());
        }

        retina = window.devicePixelRatio > 1;
        palette = paletteWidget(document.getElementById("palette"));
        codepage = codepageGenerator(palette, retina);
        preview = previewCanvas(document.getElementById("preview"));
        editor = editorCanvas(100, palette, false, preview, codepage, retina);
        toolbar = toolbarWidget(editor);

        editor.init(document.getElementById("editor"));
        toolbar.init();

        loadTools([
            "tools/freehand.js?" + Math.random(),
            "tools/line.js?" + Math.random(),
            "tools/shading.js?" + Math.random(),
            "tools/verticalblock.js?" + Math.random(),
            "tools/extendedbrush.js?" + Math.random(),
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
            "tools/undo.js?" + Math.random(),
            "tools/load.js?" + Math.random(),
            "tools/save.js?" + Math.random(),
            "tools/clear.js?" + Math.random(),
            "tools/loadimagestamp.js?" + Math.random(),
            "tools/saveimagestamp.js?" + Math.random(),
            "tools/loadreference.js?" + Math.random(),
            "tools/info.js?" + Math.random()
        ]);

        return {
            "addTool": function (callback, elementId, shortcut) {
                toolbar.addTool(callback(editor, toolbar), elementId, shortcut);
            }
        };
    }());
});