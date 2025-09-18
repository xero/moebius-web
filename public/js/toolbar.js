const Toolbar = (function() {
	let currentButton;
	let currentOnBlur;
	let previousButton;
	const tools = {};

	function add(divButton, onFocus, onBlur) {
		function enable() {
			if (currentButton !== divButton) {
				// Store previous tool before switching
				if (currentButton !== undefined) {
					previousButton = currentButton;
					currentButton.classList.remove('toolbar-displayed');
				}
				if (currentOnBlur !== undefined) {
					currentOnBlur();
				}
				divButton.classList.add('toolbar-displayed');
				currentButton = divButton;
				currentOnBlur = onBlur;
				if (onFocus !== undefined) {
					onFocus();
				}
			} else {
				onFocus();
			}
		}

		divButton.addEventListener('click', evt=>{
			evt.preventDefault();
			enable();
		});

		// Store tool reference for programmatic access
		tools[divButton.id] = {
			button: divButton,
			enable: enable,
			onFocus: onFocus,
			onBlur: onBlur,
		};

		return { enable: enable };
	}

	function switchTool(toolId) {
		if (tools[toolId]) {
			tools[toolId].enable();
		}
	}

	function returnToPreviousTool() {
		if (previousButton && tools[previousButton.id]) {
			tools[previousButton.id].enable();
		}
	}

	function getCurrentTool() {
		return currentButton ? currentButton.id : null;
	}

	return {
		add: add,
		switchTool: switchTool,
		returnToPreviousTool: returnToPreviousTool,
		getCurrentTool: getCurrentTool,
	};
})();

export default Toolbar;
