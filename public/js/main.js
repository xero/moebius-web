import { Load, Save } from './file.js';
import { State, $, $$, createCanvas } from './state.js';
import {
	createSettingToggle,
	onClick,
	onReturn,
	onFileChange,
	onSelectChange,
	createPositionInfo,
	showOverlay,
	hideOverlay,
	undoAndRedo,
	createPaintShortcuts,
	createGenericController,
	createGrid,
	createToolPreview,
	menuHover,
	enforceMaxBytes,
} from './ui.js';
import Toolbar from './toolbar.js';
import {
	createDefaultPalette,
	createPalettePreview,
	createPalettePicker,
} from './palette.js';
import {
	createTextArtCanvas,
} from './canvas.js';
import {
	createBrushController,
	createHalfBlockController,
	createShadingController,
	createShadingPanel,
	createCharacterBrushPanel,
	createFillController,
	createLineController,
	createSquareController,
	createShapesController,
	createCircleController,
	createAttributeBrushController,
	createSelectionTool,
	createSampleTool
} from './freehand_tools.js';
import { createWorkerHandler, createChatController } from './network.js';
import {
	createCursor,
	createSelectionCursor,
	createKeyboardController,
	createPasteTool
} from './keyboard.js';


document.addEventListener("DOMContentLoaded", async () => {
	try {
		// Start global state initialization
		State.startInitialization();

		// Create global dependencies first (needed by core.js functions)
		State.title = $('artwork-title');
		State.pasteTool = createPasteTool($("cut"), $("copy"), $("paste"), $("delete"));
		State.positionInfo = createPositionInfo($("position-info"));

		// Initialize canvas and wait for completion state
		State.textArtCanvas = createTextArtCanvas($("canvas-container"), () => {
			// Initialize cursors
			State.selectionCursor = createSelectionCursor($("canvas-container"));
			State.cursor = createCursor($("canvas-container"));

			// Wait for all core dependencies to be ready before continuing
			State.waitFor(
				['positionInfo', 'pasteTool', 'textArtCanvas', 'cursor', 'selectionCursor', 'palette', 'font'],
				(_deps) => {
					initializeAppComponents();
				}
			);
		});
	} catch (error) {
		console.error("Error during initialization:", error);
		// Handle initialization failure gracefully
		alert("Failed to initialize the application. Please refresh the page.");
	}
});

function initializeAppComponents() {
	document.addEventListener("keydown", undoAndRedo);
	onClick($("new"), () => {
		if (confirm("All changes will be lost. Are you sure?") === true) {
			$('body-container').classList.add('loading');
			State.textArtCanvas.clearXBData(_=>{
				State.palette =  createDefaultPalette();
				palettePicker.updatePalette();
				palettePreview.updatePreview();
				State.textArtCanvas.setFont("CP437 8x16", () => {
					State.font.setLetterSpacing(false);
					State.textArtCanvas.resize(80, 25);
					State.textArtCanvas.clear();
					State.textArtCanvas.setIceColors(false);
					$("artwork-title").value = "untitled";
					$("sauce-title").value = "untitled";
					$("sauce-group").value = "";
					$("sauce-author").value = "";
					$("sauce-comments").value = "";
					$("sauce-bytes").value = "0/16320 bytes";
					// Update font display last
					updateFontDisplay();
					$('body-container').classList.remove('loading');
				});
			});
		}
	});
	onClick($("open"), () => {
		$('open-file').click();
	});
	onClick($("file-menu"), menuHover);
	onClick($("save-ansi"), Save.ans);
	onClick($("save-utf8"), Save.utf8);
	onClick($("save-bin"), Save.bin);
	onClick($("save-xbin"), Save.xb);
	onClick($("save-png"), Save.png);
	onClick($("cut"), State.pasteTool.cut);
	onClick($("copy"), State.pasteTool.copy);
	onClick($("paste"), State.pasteTool.paste);
	onClick($("system-paste"), State.pasteTool.systemPaste);
	onClick($("delete"), State.pasteTool.deleteSelection);

	onClick($("edit-menu"), menuHover);
	onClick($("nav-cut"), State.pasteTool.cut);
	onClick($("nav-copy"), State.pasteTool.copy);
	onClick($("nav-paste"), State.pasteTool.paste);
	onClick($("nav-system-paste"), State.pasteTool.systemPaste);
	onClick($("nav-delete"), State.pasteTool.deleteSelection);
	onClick($("nav-undo"), State.textArtCanvas.undo);
	onClick($("nav-redo"), State.textArtCanvas.redo);

	const palettePreview = createPalettePreview($("palette-preview"));
	const palettePicker = createPalettePicker($("palette-picker"));

	onFileChange($("open-file"), (file) => {
		$('body-container').classList.add('loading');
		State.textArtCanvas.clearXBData();
		State.textArtCanvas.clear();
		Load.file(file, (columns, rows, imageData, iceColors, letterSpacing, fontName) => {
			const indexOfPeriod = file.name.lastIndexOf(".");
			let fileTitle;
			if (indexOfPeriod !== -1) {
				fileTitle = file.name.substr(0, indexOfPeriod);
			} else {
				fileTitle = file.name;
			}
			State.title.value = fileTitle;
			document.title = `text.0w.nz: ${fileTitle}`;
			$('body-container').classList.remove('loading');

			// Apply font from SAUCE if available
			function applyData() {
				State.textArtCanvas.setImageData(columns, rows, imageData, iceColors, letterSpacing);
				palettePicker.updatePalette(); // ANSi
				$("open-file").value = "";
			}
			// Check if this is an XB file by file extension
			const isXBFile = file.name.toLowerCase().endsWith('.xb');

			if (fontName && !isXBFile) {
				// Only handle non-XB files here, as XB files handle font loading internally
				const appFontName = Load.sauceToAppFont(fontName.trim());
				if (appFontName) {
					State.textArtCanvas.setFont(appFontName, applyData);
					return; // Exit early since callback will be called from setFont
				}
			}
			applyData(); // Apply data without font change
			palettePicker.updatePalette(); // XB
		});
	});

	onClick($("artwork-title"), () => {
		showOverlay($("sauce-overlay"));
		keyboard.ignore();
		paintShortcuts.ignore();
		$("sauce-title").focus();
		shadeBrush.ignore(); characterBrush.ignore();
	});

	onClick($("sauce-done"), () => {
		State.title.value = $("sauce-title").value;
		$('artwork-title').value = State.title.value;
		hideOverlay($("sauce-overlay"));
		keyboard.unignore();
		paintShortcuts.unignore();
		shadeBrush.unignore();
		characterBrush.unignore();
	});

	onClick($("sauce-cancel"), () => {
		hideOverlay($("sauce-overlay"));
		keyboard.unignore();
		paintShortcuts.unignore();
		shadeBrush.unignore();
		characterBrush.unignore();
	});

	$('sauce-comments').addEventListener('input', enforceMaxBytes);
	onReturn($("sauce-title"), $("sauce-done"));
	onReturn($("sauce-group"), $("sauce-done"));
	onReturn($("sauce-author"), $("sauce-done"));
	onReturn($("sauce-comments"), $("sauce-done"));
	const paintShortcuts = createPaintShortcuts({
		"D": $("default-color"),
		"Q": $("swap-colors"),
		"K": $("keyboard"),
		"F": $("brushes"),
		"B": $("character-brush"),
		"N": $("fill"),
		"A": $("attrib"),
		"G": $("navGrid"),
		"M": $("mirror")
	});
	const keyboard = createKeyboardController();
	Toolbar.add($("keyboard"), () => {
		paintShortcuts.disable();
		keyboard.enable();
		$('keyboard-toolbar').classList.remove('hide');
	}, () => {
		paintShortcuts.enable();
		keyboard.disable();
		$('keyboard-toolbar').classList.add('hide');
	}).enable();
	onClick($("undo"), State.textArtCanvas.undo);
	onClick($("redo"), State.textArtCanvas.redo);
	onClick($("resolution"), () => {
		showOverlay($("resize-overlay"));
		$("columns-input").value = State.textArtCanvas.getColumns();
		$("rows-input").value = State.textArtCanvas.getRows();
		keyboard.ignore();
		paintShortcuts.ignore();
		shadeBrush.ignore();
		characterBrush.ignore();
		$("columns-input").focus();
	});
	onClick($("resize-apply"), () => {
		const columnsValue = parseInt($("columns-input").value, 10);
		const rowsValue = parseInt($("rows-input").value, 10);
		if (!isNaN(columnsValue) && !isNaN(rowsValue)) {
			State.textArtCanvas.resize(columnsValue, rowsValue);
			// Broadcast resize to other users if in collaboration mode
			if (State.worker && State.worker.sendResize) {
				State.worker.sendResize(columnsValue, rowsValue);
			}
			hideOverlay($("resize-overlay"));
			$('resolution-label').innerText = `${columnsValue}x${rowsValue}`;
		}
		keyboard.unignore();
		paintShortcuts.unignore();
		shadeBrush.unignore();
		characterBrush.unignore();
	});
	onReturn($("columns-input"), $("resize-apply"));
	onReturn($("rows-input"), $("resize-apply"));
	onClick($("resize-cancel"), () => {
		hideOverlay($("resize-overlay"));
		keyboard.unignore();
		paintShortcuts.unignore();
		shadeBrush.unignore();
		characterBrush.unignore();
	});

	// Edit action menu items
	onClick($("insert-row"), keyboard.insertRow);
	onClick($("delete-row"), keyboard.deleteRow);
	onClick($("insert-column"), keyboard.insertColumn);
	onClick($("delete-column"), keyboard.deleteColumn);
	onClick($("erase-row"), keyboard.eraseRow);
	onClick($("erase-row-start"), keyboard.eraseToStartOfRow);
	onClick($("erase-row-end"), keyboard.eraseToEndOfRow);
	onClick($("erase-column"), keyboard.eraseColumn);
	onClick($("erase-column-start"), keyboard.eraseToStartOfColumn);
	onClick($("erase-column-end"), keyboard.eraseToEndOfColumn);

	onClick($("default-color"), () => {
		State.palette.setForegroundColor(7);
		State.palette.setBackgroundColor(0);
	});
	onClick($("swap-colors"), () => {
		const tempForeground = State.palette.getForegroundColor();
		State.palette.setForegroundColor(State.palette.getBackgroundColor());
		State.palette.setBackgroundColor(tempForeground);
	});
	onClick($("palette-preview"), () => {
		const tempForeground = State.palette.getForegroundColor();
		State.palette.setForegroundColor(State.palette.getBackgroundColor());
		State.palette.setBackgroundColor(tempForeground);
	});

	const navICE = createSettingToggle($("navICE"), State.textArtCanvas.getIceColors, (newIceColors) => {
		State.textArtCanvas.setIceColors(newIceColors);
		// Broadcast ice colors change to other users if in collaboration mode
		if (State.worker && State.worker.sendIceColorsChange) {
			State.worker.sendIceColorsChange(newIceColors);
		}
	});

	const nav9pt = createSettingToggle($("nav9pt"), State.font.getLetterSpacing, (newLetterSpacing) => {
		State.font.setLetterSpacing(newLetterSpacing);
		// Broadcast letter spacing change to other users if in collaboration mode
		if (State.worker && State.worker.sendLetterSpacingChange) {
			State.worker.sendLetterSpacingChange(newLetterSpacing);
		}
	});

	function updateFontDisplay() {
		const currentFont = State.textArtCanvas.getCurrentFontName();
		$$("#current-font-display kbd").textContent = currentFont.replace(/\s\d+x\d+$/, '');
		$("font-select").value = currentFont;
		nav9pt.sync(State.font.getLetterSpacing, State.font.setLetterSpacing);
		navICE.update();
	}

	function updateFontPreview(fontName) {
		const previewInfo = $("font-preview-info");
		const previewImage = $("font-preview-image");
		if (!previewInfo || !previewImage) { return; }

		// Load font for preview
		if (fontName === "XBIN") {
			// Handle XB font preview - render embedded font if available
			if (State.textArtCanvas.getCurrentFontName() === "XBIN") {
				// Current font is XBIN, render the embedded font
				const fontWidth = State.font.getWidth();
				const fontHeight = State.font.getHeight();

				// Create a canvas to render the font preview
				const previewCanvas = createCanvas(fontWidth * 16, fontHeight * 16);
				const previewCtx = previewCanvas.getContext("2d");

				// Use white foreground on black background for clear visibility
				const foreground = 15; // White
				const background = 0;  // Black

				// Render all 256 characters in a 16x16 grid
				for (let y = 0, charCode = 0; y < 16; y++) {
					for (let x = 0; x < 16; x++, charCode++) {
						State.font.draw(charCode, foreground, background, previewCtx, x, y);
					}
				}

				// Update info and display the rendered font
				previewInfo.textContent = "XBIN (embedded font) " + fontWidth + "x" + fontHeight;
				previewImage.src = previewCanvas.toDataURL();
				previewImage.style.display = "block";
			} else {
				// No embedded font currently loaded
				previewInfo.textContent = "XBIN (embedded font - not currently loaded)";
				previewImage.style.display = "none";
				previewImage.src = "";
			}
		} else {
			// Load regular PNG font for preview
			const img = new Image();
			img.onload = function() {
				// Calculate font dimensions
				const fontWidth = img.width / 16;  // 16 characters per row
				const fontHeight = img.height / 16; // 16 rows

				// Update font info with name and size on same line
				previewInfo.textContent = fontName + " " + fontWidth + "x" + fontHeight;

				// Show the entire PNG font file
				previewImage.src = img.src;
				previewImage.style.display = "block";
			};

			img.onerror = function() {
				// Font loading failed
				previewInfo.textContent = fontName + " (not found)";
				previewImage.style.display = "none";
				previewImage.src = "";
			};

			img.src = "ui/fonts/" + fontName + ".png";
		}
	}

	// Listen for font changes and update display
	["onPaletteChange", "onFontChange", "onXBFontLoaded","onOpenedFile"]
		.forEach(e=>{document.addEventListener(e, updateFontDisplay)});

	onClick($('current-font-display'), () => {
		$('fonts').click();
	});
	onClick($("change-font"), () => {
		showOverlay($("fonts-overlay"));
		keyboard.ignore();
		updateFontPreview($("font-select").value);
	});
	onSelectChange($("font-select"), () => {
		updateFontPreview($("font-select").value);
	});
	onClick($("fonts-apply"), () => {
		const selectedFont = $("font-select").value;
		State.textArtCanvas.setFont(selectedFont, () => {
			updateFontDisplay();
			if (State.worker && State.worker.sendFontChange) {
				State.worker.sendFontChange(selectedFont);
			}
			hideOverlay($("fonts-overlay"));
			keyboard.unignore();
		});
	});
	onClick($("fonts-cancel"), () => {
		hideOverlay($("fonts-overlay"));
	});
	const grid = createGrid($("grid"));
	createSettingToggle($("navGrid"), grid.isShown, grid.show);

	// Initialize toolPreview early
	State.toolPreview = createToolPreview($("tool-preview"));
	const brushes = createBrushController();
	Toolbar.add($("brushes"), brushes.enable, brushes.disable);
	const halfblock = createHalfBlockController();
	Toolbar.add($("halfblock"), halfblock.enable, halfblock.disable);
	const shadeBrush = createShadingController(createShadingPanel(), false);
	Toolbar.add($("shading-brush"), shadeBrush.enable, shadeBrush.disable);
	const characterBrush = createShadingController(createCharacterBrushPanel(), true);
	Toolbar.add($("character-brush"), characterBrush.enable, characterBrush.disable);
	const fill = createFillController();
	Toolbar.add($("fill"), fill.enable, fill.disable);
	const attributeBrush = createAttributeBrushController();
	Toolbar.add($("attrib"), attributeBrush.enable, attributeBrush.disable);
	const shapes = createShapesController();
	Toolbar.add($("shapes"), shapes.enable, shapes.disable);
	const line = createLineController();
	Toolbar.add($("line"), line.enable, line.disable);
	const square = createSquareController();
	Toolbar.add($("square"), square.enable, square.disable);
	const circle = createCircleController();
	Toolbar.add($("circle"), circle.enable, circle.disable);
	const fonts = createGenericController($('font-toolbar'), $('fonts'));
	Toolbar.add($('fonts'), fonts.enable, fonts.disable);
	const clipboard = createGenericController($('clipboard-toolbar'), $('clipboard'));
	Toolbar.add($('clipboard'), clipboard.enable, clipboard.disable);
	const selection = createSelectionTool();
	Toolbar.add($("selection"), () => {
		paintShortcuts.disable();
		selection.enable();
	}, () => {
		paintShortcuts.enable();
		selection.disable();
	});
	State.sampleTool = createSampleTool(shadeBrush, $("shading-brush"), characterBrush, $("character-brush"));
	Toolbar.add($("sample"), State.sampleTool.enable, State.sampleTool.disable);
	createSettingToggle($("mirror"), State.textArtCanvas.getMirrorMode, State.textArtCanvas.setMirrorMode);
	updateFontDisplay();

	// Initialize chat before creating network handler
	State.chat = createChatController($("chat-button"), $("chat-window"), $("message-window"), $("user-list"), $("handle-input"), $("message-input"), $("notification-checkbox"), () => {
		keyboard.ignore();
		paintShortcuts.ignore();
		shadeBrush.ignore();
		characterBrush.ignore();
	}, () => {
		keyboard.unignore();
		paintShortcuts.unignore();
		shadeBrush.unignore();
		characterBrush.unignore();
	});
	createSettingToggle($("chat-button"), State.chat.isEnabled, State.chat.toggle);
	State.worker = createWorkerHandler($("handle-input"));
}
