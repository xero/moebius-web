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

        function addTool(callback, shortcut, name, options) {
            toolbar.addTool(callback(toolbar, options, name), shortcut);
        }

        retina = window.devicePixelRatio > 1;
        palette = paletteWidget(retina);
        codepage = codepageGenerator(palette, retina);
        preview = previewCanvas(100, codepage, retina);
        editor = editorCanvas(100, palette, preview, codepage, retina);
        toolbar = toolbarWidget(palette, codepage, preview, editor, retina);

        preview.init(document.getElementById("preview"));
        editor.init(document.getElementById("editor"));
        toolbar.init();

        loadTools([
            "tools/freehand.js?",
            "tools/shading.js?",
            "tools/verticalblock.js?",
            "tools/extendedbrush.js?",
            "tools/text.js?",
            "tools/brighten.js?",
            "tools/darken.js?",
            "tools/mirror.js?",
            "tools/fill.js?",
            "tools/colorbrush.js?",
            "tools/grid.js?",
            "tools/undo.js?",
            "tools/clear.js?",
            "tools/load.js?",
            "tools/save.js?"
        ]);

        return {
            "addTool": addTool
        };
    }());
});