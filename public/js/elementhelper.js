"use strict";

function create(elementName, args) {
	args = args || {};
	const element = document.createElement(elementName);
	Object.getOwnPropertyNames(args).forEach((name) => {
		if (typeof args[name] === "object") {
			Object.getOwnPropertyNames(args[name]).forEach((subName) => {
				element[name][subName] = args[name][subName];
			});
		} else {
			element[name] = args[name];
		}
	});
	return element;
}

// ES6 module exports
export { create };

export const ElementHelper = {
	create
};

export default ElementHelper;
