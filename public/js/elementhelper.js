function create(elementName, args) {
	const element = document.createElement(elementName);
	args = args || {};
	Object.getOwnPropertyNames(args).forEach(function(name) {
		if (typeof args[name] === "object") {
			Object.getOwnPropertyNames(args[name]).forEach(function(subName) {
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
	create: create
};

export default ElementHelper;
