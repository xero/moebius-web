# AnsiEdit file format

the entire file, is described with with block headers. Each block header contains a unique id for that section, the compression method, and the length of bytes that follow it. The format is 4 bytes, which stores the ID, the compression bytes, which indicates the compression method, or uncompressed (0), then a 32-bit number stored in little endian format which gives the size for that section. All numbers are stored in little endian (intel) format.

No compression methods have yet been implemented.

The entire file is wrapped in a block with the the id "ANSi", which also serves as the magic number. After the header follows the series of bytes, which are also composed of the same block header-bytes structure.

Currently, the types of blocks used are:

**ALL BLOCK FORMATS ARE SUBJECT TO CHANGE**

## DISP

Contains the information to display the current image.

  - columns (16bits)
  - rows (16bits)
  - noblink/iCEColors (8bit 1 for true/on, 0 for false/off)

And then multiples of:

  - character code
  - foreground/background (8bit, with the background color in the upper 4bits)


## META

A subset of SAUCE metadata.

  - title (null-terminated string)
  - author (null-terminated string)
  - group (null-terminated string)

## UNDO

A description of the complete undo history.

Multiples of:

  - length of 'undo chunk' (32bit)
 
And each 'undo chunk' contains, multiples of:
 
  - character code (8bit)
  - foreground/background (8bit, with the background color in the upper 4bits)
  - index (32bit, the position of the character code if the screen is read sequentially, left to right and top to bottom)

## TOOL

The state of individual tools in the editor.

  - current color (8bit, values 1 to 16)  
  - current tool (null-terminated string)

And then an array of:

  - uid (null-terminated string which contains the uid of the specific tool)
  - length (32bit, the length of bytes that follow this number)
  - bytes (a sequence of 8bit bytes that are passed to the tool in order to recall its state)

