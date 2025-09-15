// TODO: Uncomment the following import/export statements and update script tags in index.html to fully activate ES6 modules.
// ES6 module imports (commented out for script-based loading)
/*
// No imports needed for this module
*/

const Savers = (function() {
	// function toANSFormat(input) {
	//	   var highest, inputIndex, end, charCode, fg, bg, bold, blink, currentFg, currentBg, currentBold, currentBlink, attribs, attribIndex, output;
	//
	//	   function ansiColor(binColor) {
	//		   switch (binColor) {
	//		   case 1:
	//			   return 4;
	//		   case 3:
	//			   return 6;
	//		   case 4:
	//			   return 1;
	//		   case 6:
	//			   return 3;
	//		   default:
	//			   return binColor;
	//		   }
	//	   }
	//
	//	   highest = getHighestRow(input);
	//	   output = [27, 91, 48, 109];
	//	   for (inputIndex = 0, end = highest * 80 * 3, currentFg = 7, currentBg = 0, currentBold = false, currentBlink = false; inputIndex < end; inputIndex += 3) {
	//		   attribs = [];
	//		   charCode = input[inputIndex];
	//		   fg = input[inputIndex + 1];
	//		   bg = input[inputIndex + 2];
	//		   if (fg > 7) {
	//			   bold = true;
	//			   fg = fg - 8;
	//		   } else {
	//			   bold = false;
	//		   }
	//		   if (bg > 7) {
	//			   blink = true;
	//			   bg = bg - 8;
	//		   } else {
	//			   blink = false;
	//		   }
	//		   if ((currentBold && !bold) || (currentBlink && !blink)) {
	//			   attribs.push([48]);
	//			   currentFg = 7;
	//			   currentBg = 0;
	//			   currentBold = false;
	//			   currentBlink = false;
	//		   }
	//		   if (bold && !currentBold) {
	//			   attribs.push([49]);
	//			   currentBold = true;
	//		   }
	//		   if (blink && !currentBlink) {
	//			   attribs.push([53]);
	//			   currentBlink = true;
	//		   }
	//		   if (fg !== currentFg) {
	//			   attribs.push([51, 48 + ansiColor(fg)]);
	//			   currentFg = fg;
	//		   }
	//		   if (bg !== currentBg) {
	//			   attribs.push([52, 48 + ansiColor(bg)]);
	//			   currentBg = bg;
	//		   }
	//		   if (attribs.length) {
	//			   output.push(27, 91);
	//			   for (attribIndex = 0; attribIndex < attribs.length; ++attribIndex) {
	//				   output = output.concat(attribs[attribIndex]);
	//				   if (attribIndex !== attribs.length - 1) {
	//					   output.push(59);
	//				   } else {
	//					   output.push(109);
	//				   }
	//			   }
	//		   }
	//		   output.push(charCode);
	//	   }
	//	   return new Uint8Array(output);
	// }

	function imageDataToDataURL(imageData, noblink) {
		let i, j;
		const bytes = new Uint8Array((imageData.width * imageData.height * 2) + 11);
		const flags = noblink ? 8 : 0;
		bytes.set(new Uint8Array([88, 66, 73, 78, 26, (imageData.width & 0xff), (imageData.width >> 8), (imageData.height & 0xff), (imageData.height >> 8), 16, flags]), 0);
		for (i = 0, j = 11; i < imageData.data.length; i += 3, j += 2) {
			bytes[j] = imageData.data[i];
			bytes[j + 1] = imageData.data[i + 1] + (imageData.data[i + 2] << 4);
		}
		return "data:image/x-bin;base64," + btoa(String.fromCharCode.apply(null, bytes));
	}

	return {
		"imageDataToDataURL": imageDataToDataURL
	};
}());

// ES6 module exports
export { Savers };
