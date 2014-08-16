Demonstration available at [http://andyherbert.github.io/ansiedit/](http://andyherbert.github.io/ansiedit/).

# Changing Colors

Keys '1' to '8' will choose the first eight colors without the bold-bit set, holding shift down while making the selection will choose from the highlighted palette. Alternatively, hitting the same key again will select the same color from the highlighted palette range.  
The 'q' and 'w' keys will cycle through all sixteen colors in descending, and ascending order respectively. The ordering will loop endlessly.  
Pressing the 'tab' key will change back to the previously selected color, assuming one was already chosen, hitting 'tab' again will change back. This switching can be performed as many times as required.

# Freehand - f

Freehand mode enables 'half block' characters to be used as large pixels. Since only eight colors can be used for the background in 'blink mode', if two 'half blocks' are drawn on the same text-character space with the bold-shifted palette, then the editor assumes the current color takes precedence and shifts the other color sharing the same space to the lower-palette. Pressing 'alt', or 'option', reverses this precedence, and any other colors sharing the same space with be favored instead.  
Holding shift whilst clicking on the canvas will create a straight line using 'half block' pixels from the last drawing position.

# Line - l

Allows a line to be drawn between two points, but unlike pressing 'shift' with the freehand tool this gives an immediate preview. Pressing 'alt' or 'option' has the same effect here as the freehand tool, namely any attribute clashes will favour the other, conflicting color.

# Shading  - s

Reselecting the option will cycle through the light, medium, and dark varieties of shading.  
Usage is similar to freehand mode, including using the 'shift' key to draw straight lines.  
When choosing the area to shade the background color is chosen from the area directly under the cursor, and this includes 'half-block' pixels. For instance, if a single text-character has a different color in both the upper and lower half of the glyph, then clicking on either the top of the bottom of the glyph will choose a different background color for shading.  
Attribute conflicts are resolved by shifting the background color to the lower palette.

# Vertical Block - v

Toggles between left and right-handed vertical blocks, operates in the same way as shading mode.

# Extended Brush - e

Allows a selected character from the extended-ASCII set to be used as a brush, as with the other modes this also supports drawing with straight lines, as well as fixing any attribute conflicts.  
Pressing the F1 to F10 keys will quickly select light shade, medium shade, dark shade, full, upper, lower, left, right, middle, and dot blocks respectively.

# Clone Brush - comma

Once a text block has been selected by using the 'alt' or 'option' key, it can then be used as a brush anywhere else on the image. Holding down ctrl whilst dragging the mouse will clone the text character immediately underneath the pointer when the drag operation is started, effectively 'smearing' the text character over the canvas.

# Text - t

Clicking anywhere on the cursor will place a cursor, text can then be entered directly via the keyboard. To escape from text-entry mode, press 'alt' or 'option' and enter.

# Box - x

Draws a rectangle. Pressing 'alt' or 'option' will favour the non-current color in the case of an attribute clash. Pressing 'shift' whilst starting the drag operation will fill the rectangle with the current color, otherwise just the border will be visible.

# Ellipse - i

Draws an ellipse. Pressing 'alt' or 'option' will favour the non-current color in the case of an attribute clash. Pressing 'shift' whilst starting the drag operation will fill the ellipse with the current color, otherwise just the border will be visible.

# Brighten - b

Brightens the half-block, or the foreground color of the text-character directly underneath the cursor. Pressing 'alt' or 'option' key whilst painting will preserve the brightness-status of any other half block sharing the same text character.

# Darken - d

Darkens the half-block, or the foreground color of the text-character directly underneath the cursor.

# Mirror - m

Mirrors the drawing activity in the opposing side of the screen.

# Fill - n

Fill mode operates in a similar way to most paint packages, although it will only operates on text-characters that are only one single color, or are upper and lower 'half-block' characters.  
When conflicts arise with two highlighted colors sharing the same text-character then the editor corrects this by giving the fill color precedence and shifting the other color to the lower-palette, as with the freehand mode, this is reversed by pressing the 'alt' or 'option' key.

# Attribute Brush - a

Changes the foreground attribute of the text-character immediately underneath the pointer to the currently selected color.  
If 'alt' or 'option' is held down whilst using this tool then the background color is changed instead; the color is automatically shifted to the lower palette if a conflict is detected.

<a name="createcustombrush"></a>

# Create Custom Brush - c

A selection from the canvas can be made to define a custom brush to be used with the 'Custom Brush Tool'. Character codes set to `NULL` will be interpreted as an alpha channel. Pressing the 'alt' or 'option' key will replace the selection with `NULL` values after the selection is made.

See also '[Load Brush](#loadbrush)', '[Save Brush](#savebrush)', and '[Custom Brush](#custombrush)'.

<a name="custombrush"></a>

# Custom Brush - p

After a custom brush is either created or loaded it can be used to draw on the canvas. Pressing 'alt' or 'option' whilst using this tool will ignore any alpha channel in the stamp.

See also '[Create Custom Brush](#createcustombrush)', '[Load Brush](#loadbrush)', and '[Save Brush](#savebrush)'.

# Custom Brush FlipX - [

Flips a selection horizontally. Also changes left-vertical blocks to right-vertical blocks, and vice versa, in the process. After this option is chosen the 'Custom Brush Tool' is automatically selected.

See also '[Custom Brush](#custombrush)', '[Create Custom Brush](#createcustombrush)', '[Load Brush](#loadbrush)', and '[Save Brush](#savebrush)'.

# Custom Brush FlipY - ]

Flips a selection vertically. Also changes lower-half blocks to upper half blocks, and vice versa, in the process. After this option is chosen the 'Custom Brush Tool' is automatically selected.

See also '[Custom Brush](#custombrush)', '[Create Custom Brush](#createcustombrush)', '[Load Brush](#loadbrush)', and '[Save Brush](#savebrush)'.

# Grid mode - g

Turns on and off, and toggles between, two different types of grids, 'Light' and 'Dark'. The light grid is has higher visibility on darker backgrounds, but less pronounced on lighter backgrounds. The opposite is true for the dark grid.

# Undo / Redo - z / Z

Reverses the previous operation, to redo, use the shift modifier key.

# Shaded Palette - space

Allows a light, medium, or dark-shaded block to be selected immediately based on the currently selected color.

# Load

Allows an ANSi or XBin file to be loaded by dragging and dropping a file on to the browser.

# Save

Saves an XBin file using the current filename to the browser's download folder.

See also '[Changing the default filename](#changedefaultfilename)'.

# Clear

Resets the canvas to the initial state. All un-saved work will be lost.

<a name="loadbrush"></a>

# Load Brush

Loads an ANS or XBin file, which can be used as a stamp using the 'Custom Brush' tool. After this option is chosen the 'Custom Brush Tool' is automatically selected.

See also '[Custom Brush](#custombrush)' and '[Save Brush](#savebrush)'.

<a name="savebrush"></a>

# Save Brush

Saves an XBin file, based on the current 'Custome Brush' selection, to the browser's download folder.

See also '[Custom Brush](#custombrush)' and '[Load Brush](#loadbrush)', and '[Changing the default filename](#changedefaultfilename)'.

# Export as PNG

Saves a PNG file using the current filename to the browser's download folder.

See also '[Changing the default filename](#changedefaultfilename)'.

# Information

Displays information on the text-character currently under the mouse cursor whilst editing.

<a name="changedefaultfilename"></a>

# Changing the Default Filename

By default, all files with be named 'Untitled'. To change the default filename click on the name in the titlebar, type a new name, and press 'Return'.