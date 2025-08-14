var worker;
var title;
var palette;
var font;
var textArtCanvas;
var cursor;
var selectionCursor;
var positionInfo;
var toolPreview;
var pasteTool;
//var chat;
var sampleTool;

function $(divName) {
	"use strict";
	return document.getElementById(divName);
}
if(typeof(createWorkerHandler)==="undefined"){
	function createWorkerHandler(_){void _}
}
function createCanvas(width, height) {
	"use strict";
	var canvas = document.createElement("CANVAS");
	canvas.width = width;
	canvas.height = height;
	return canvas;
}

document.addEventListener("DOMContentLoaded", () => {
	"use strict";
	pasteTool = createPasteTool($("cut"), $("copy"), $("paste"), $("delete"));
	positionInfo = createPositionInfo($("position-info"));
	textArtCanvas = createTextArtCanvas($("canvas-container"), () => {
		selectionCursor = createSelectionCursor($("canvas-container"));
		cursor = createCursor($("canvas-container"));
		document.addEventListener("keydown", undoAndRedo);
		onClick($("new"), () => {
			if (confirm("All changes will be lost. Are you sure?") === true) {
				textArtCanvas.clear();
				$("sauce-title").value = "";
				$("sauce-group").value = "";
				$("sauce-author").value = "";
			}
		});
		onClick($("open"), () => {
			showOverlay($("open-overlay"));
		});
		onClick($("save-ansi"), Save.ans);
		onClick($("save-utf8"), Save.utf8);
		onClick($("save-bin"), Save.bin);
		onClick($("save-xbin"), Save.xb);
		onClick($("save-png"), Save.png);
		onClick($("cut"), pasteTool.cut);
		onClick($("copy"), pasteTool.copy);
		onClick($("paste"), pasteTool.paste);
		onClick($("system-paste"), pasteTool.systemPaste);
		onClick($("delete"), pasteTool.deleteSelection);
		onClick($("file-menu"), menuHover);
		onClick($("edit-menu"), menuHover);
		onClick($("view-menu"), menuHover);
		var palettePreview = createPalettePreview($("palette-preview"));
		var palettePicker = createPalettePicker($("palette-picker"));
		var iceColoursToggle = createSettingToggle($("ice-colors-toggle"), textArtCanvas.getIceColours, textArtCanvas.setIceColours);
		var letterSpacingToggle = createSettingToggle($("letter-spacing-toggle"), () => {
			return font.getLetterSpacing();
		}, (newLetterSpacing) => {
			font.setLetterSpacing(newLetterSpacing);
		});
		onFileChange($("open-file"), (file) => {
			Load.file(file, (columns, rows, imageData, iceColours, letterSpacing) => {
				var indexOfPeriod = file.name.lastIndexOf(".");
				if (indexOfPeriod !== -1) {
					title.setName(file.name.substr(0, indexOfPeriod));
				} else {
					title.setName(file.name);
				}
				textArtCanvas.setImageData(columns, rows, imageData, iceColours, letterSpacing);
				iceColoursToggle.update();
				letterSpacingToggle.update();
				hideOverlay($("open-overlay"));
				$("open-file").value = "";
			});
		});
		onClick($("open-cancel"), () => {
			hideOverlay($("open-overlay"));
		});
		onClick($("edit-sauce"), () => {
			showOverlay($("sauce-overlay"));
			keyboard.ignore();
			paintShortcuts.ignore();
			$("sauce-title").focus();
			freestyle.ignore();
			characterBrush.ignore();
		});
		onClick($("sauce-done"), () => {
			hideOverlay($("sauce-overlay"));
			keyboard.unignore();
			paintShortcuts.unignore();
			freestyle.unignore();
			characterBrush.unignore();
		});
		onReturn($("sauce-title"), $("sauce-done"));
		onReturn($("sauce-group"), $("sauce-done"));
		onReturn($("sauce-author"), $("sauce-done"));
		var paintShortcuts = createPaintShortcuts({
			"D": $("default-colour"),
			"Q": $("swap-colours"),
			"K": $("keyboard"),
			"F": $("freestyle"),
			"B": $("character-brush"),
			"N": $("fill"),
			"A": $("attrib"),
			"G": $("grid-toggle")
		});
		var keyboard = createKeyboardController();
		Toolbar.add($("keyboard"), () => {
			paintShortcuts.disable();
			keyboard.enable();
		}, () => {
			paintShortcuts.enable();
			keyboard.disable();
		}).enable();
		title = createTitleHandler($("artwork-title"), () => {
			keyboard.ignore();
			paintShortcuts.ignore();
			freestyle.ignore();
			characterBrush.ignore();
		}, () => {
			keyboard.unignore();
			paintShortcuts.unignore();
			freestyle.unignore();
			characterBrush.unignore();
		});
		onClick($("undo"), textArtCanvas.undo);
		onClick($("redo"), textArtCanvas.redo);
		onClick($("resize"), () => {
			showOverlay($("resize-overlay"));
			$("columns-input").value = textArtCanvas.getColumns();
			$("rows-input").value = textArtCanvas.getRows();
			keyboard.ignore();
			paintShortcuts.ignore();
			freestyle.ignore();
			characterBrush.ignore();
			$("columns-input").focus();
		});
		onClick($("resize-apply"), () => {
			var columnsValue = parseInt($("columns-input").value, 10);
			var rowsValue = parseInt($("rows-input").value, 10);
			if (!isNaN(columnsValue) && !isNaN(rowsValue)) {
				textArtCanvas.resize(columnsValue, rowsValue);
				hideOverlay($("resize-overlay"));
			}
			keyboard.unignore();
			paintShortcuts.unignore();
			freestyle.unignore();
			characterBrush.unignore();
		});
		onReturn($("columns-input"), $("resize-apply"));
		onReturn($("rows-input"), $("resize-apply"));
		onClick($("resize-cancel"), () => {
			hideOverlay($("resize-overlay"));
			keyboard.unignore();
			paintShortcuts.unignore();
			freestyle.unignore();
			characterBrush.unignore();
		});
		onClick($("default-colour"), () => {
			palette.setForegroundColour(7);
			palette.setBackgroundColour(0);
		});
		onClick($("swap-colours"), () => {
			var tempForeground = palette.getForegroundColour();
			palette.setForegroundColour(palette.getBackgroundColour());
			palette.setBackgroundColour(tempForeground);
		});
		onClick($("palette-preview"), () => {
			var tempForeground = palette.getForegroundColour();
			palette.setForegroundColour(palette.getBackgroundColour());
			palette.setBackgroundColour(tempForeground);
		});
		onClick($("fonts"), () => {
			showOverlay($("fonts-overlay"));
		});
		onSelectChange($("font-select"), () => {
			textArtCanvas.setFont($("font-select").value, () => {
				hideOverlay($("fonts-overlay"));
			});
		});
		onClick($("fonts-cancel"), () => {
			hideOverlay($("fonts-overlay"));
		});
		var grid = createGrid($("grid"));
		var gridToggle = createSettingToggle($("grid-toggle"), grid.isShown, grid.show);
		var freestyle = createFreehandController(createShadingPanel());
		Toolbar.add($("freestyle"), freestyle.enable, freestyle.disable);
		var characterBrush = createFreehandController(createCharacterBrushPanel());
		Toolbar.add($("character-brush"), characterBrush.enable, characterBrush.disable);
		var fill = createFillController();
		Toolbar.add($("fill"), fill.enable, fill.disable);
		var attributeBrush = createAttributeBrushController();
		Toolbar.add($("attrib"), attributeBrush.enable, attributeBrush.disable);
		var line = createLineController();
		Toolbar.add($("line"), line.enable, line.disable);
		var square = createSquareController();
		Toolbar.add($("square"), square.enable, square.disable);
		var circle = createCircleController();
		Toolbar.add($("circle"), circle.enable, circle.disable);
		toolPreview = createToolPreview($("tool-preview"));
		var selection = createSelectionTool($("canvas-container"));
		Toolbar.add($("selection"), selection.enable, selection.disable);
		//chat = createChatController($("chat-button"), $("chat-window"), $("message-window"), $("user-list"), $("handle-input"), $("message-input"), $("notification-checkbox"), () => {
		//	keyboard.ignore();
		//	paintShortcuts.ignore();
		//	freestyle.ignore();
		//	characterBrush.ignore();
		//}, () => {
		//	keyboard.unignore();
		//	paintShortcuts.unignore();
		//	freestyle.unignore();
		//	characterBrush.unignore();
		//});
		//var chatToggle = createSettingToggle($("chat-toggle"), chat.isEnabled, chat.toggle);
		//onClick($("chat-button"), chat.toggle);
		sampleTool = createSampleTool($("sample"), freestyle, $("freestyle"), characterBrush, $("character-brush"));
		Toolbar.add($("sample"), sampleTool.enable, sampleTool.disable);
		worker = createWorkerHandler($("handle-input"));
	});
});
