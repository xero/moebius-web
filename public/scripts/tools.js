function createSettingToggle(divButton, getter, setter) {
    "use strict";
    var currentSetting;

    function update() {
        currentSetting = getter();
        if (currentSetting === true) {
            divButton.classList.add("enabled");
        } else {
            divButton.classList.remove("enabled");
        }
    }

    function changeSetting(evt) {
        evt.preventDefault();
        currentSetting = !currentSetting;
        setter(currentSetting);
        update();
    }

    divButton.addEventListener("click", changeSetting);
    update();

    return {
        "update": update
    };
}

var Toolbar = (function () {
    "use strict";
    var currentButton;
    var currentOnBlur;

    function add(divButton, onFocus, onBlur) {
        function enable() {
            if (currentButton !== divButton) {
                if (currentButton !== undefined) {
                    currentButton.classList.remove("toolbar-displayed");
                }
                if (currentOnBlur !== undefined) {
                    currentOnBlur();
                }
                divButton.classList.add("toolbar-displayed");
                currentButton = divButton;
                currentOnBlur = onBlur;
                if (onFocus  !== undefined) {
                    onFocus();
                }
            }
        }
        divButton.addEventListener("click", (evt) => {
            evt.preventDefault();
            enable();
        });
        return {
            "enable": enable
        };
    }

    return {
        "add": add
    };
}());

function onReturn(divElement, divTarget) {
    "use strict";
    divElement.addEventListener("keypress", (evt) => {
        var keyCode = (evt.keyCode || evt.which);
        if (evt.altKey === false && evt.ctrlKey === false && evt.metaKey === false && keyCode === 13) {
            evt.preventDefault();
            evt.stopPropagation();
            divTarget.click();
        }
    });
}

function onClick(divElement, func) {
    "use strict";
    divElement.addEventListener("click", (evt) => {
        evt.preventDefault();
        func();
    });
}

function onFileChange(divElement, func) {
    "use strict";
    divElement.addEventListener("change", (evt) => {
        if (evt.target.files.length > 0) {
            func(evt.target.files[0]);
        }
    });
}

function onSelectChange(divElement, func) {
    "use strict";
    divElement.addEventListener("change", (evt) => {
        func(divElement.value);
    });
}

function createPositionInfo(divElement) {
    "use strict";
    function update(x, y) {
        divElement.textContent = (x + 1) + ", " + (y + 1);
    }

    return {
        "update": update
    };
}

function showOverlay(divElement) {
    "use strict";
    divElement.classList.add("enabled");
}

function hideOverlay(divElement) {
    "use strict";
    divElement.classList.remove("enabled");
}

function undoAndRedo(evt) {
    "use strict";
    var keyCode = (evt.keyCode || evt.which);
    if ((evt.ctrlKey === true || (evt.metaKey === true && evt.shiftKey === false)) && keyCode === 90) {
        evt.preventDefault();
        textArtCanvas.undo();
    } else if ((evt.ctrlKey === true && evt.keyCode === 89) || (evt.metaKey ===true && evt.shiftKey === true && keyCode === 90)) {
        evt.preventDefault();
        textArtCanvas.redo();
    }
}

function createTitleHandler(inputElement, onFocusCallback, onBlurCallback) {
    "use strict";
    function updateTitle() {
        document.title = inputElement.value + " - ANSiEdit";
    }

    function onFocus() {
        onFocusCallback();
    }

    function onBlur() {
        onBlurCallback();
        updateTitle();
    }

    function keyPress(evt) {
        var keyCode = (evt.keyCode || evt.which);
        if (keyCode === 13) {
            evt.preventDefault();
            evt.stopPropagation();
            if (inputElement.value === "") {
                inputElement.value = "Untitled";
            }
            inputElement.blur();
        }
    }

    function setName(newName) {
        inputElement.value = newName;
        updateTitle();
    }

    function getName() {
        return inputElement.value;
    }

    function reset() {
        setName("Untitled");
    }

    inputElement.addEventListener("focus", onFocus);
    inputElement.addEventListener("blur", onBlur);
    inputElement.addEventListener("keypress", keyPress);
    reset();

    return {
        "getName": getName,
        "setName": setName,
        "reset": reset
    };
}

function createPaintShortcuts(keyPair) {
    "use strict";
    var ignored = false;

    function keyDown(evt) {
        if (ignored === false) {
            var keyCode = (evt.keyCode || evt.which);
            if (evt.ctrlKey === false && evt.altKey === false && evt.shiftKey === false && evt.metaKey === false) {
                if (keyCode >= 48 && keyCode <= 55) {
                    var colour = keyCode - 48;
                    var currentColour = palette.getForegroundColour();
                    if (currentColour === colour) {
                        palette.setForegroundColour(colour + 8);
                    } else {
                        palette.setForegroundColour(colour);
                    }
                } else {
                    var charCode = String.fromCharCode(keyCode);
                    if (keyPair[charCode] !== undefined) {
                        if (socket.isConnected() === false || keyPair[charCode].classList.contains("excluded-for-websocket") === false) {
                            evt.preventDefault();
                            keyPair[charCode].click();
                        }
                    }
                }
            }
        }
    }

    function keyDownWithCtrl(evt) {
        if (ignored === false) {
            var keyCode = (evt.keyCode || evt.which);
            if (evt.ctrlKey === true && evt.altKey === false && evt.shiftKey === false && evt.metaKey === false) {
                var charCode = String.fromCharCode(keyCode);
                if (keyPair[charCode] !== undefined) {
                    if (socket.isConnected() === false || keyPair[charCode].classList.contains("excluded-for-websocket") === false) {
                        evt.preventDefault();
                        keyPair[charCode].click();
                    }
                }
            }
        }
    }

    document.addEventListener("keydown", keyDownWithCtrl);

    function enable() {
        document.addEventListener("keydown", keyDown);
    }

    function disable() {
        document.removeEventListener("keydown", keyDown);
    }

    function ignore() {
        ignored = true;
    }

    function unignore() {
        ignored = false;
    }

    enable();

    return {
        "enable": enable,
        "disable": disable,
        "ignore": ignore,
        "unignore": unignore
    };
}

function createToggleButton(stateOneName, stateTwoName, stateOneClick, stateTwoClick) {
    "use strict";
    var divContainer = document.createElement("DIV");
    divContainer.classList.add("toggle-button-container");
    var stateOne = document.createElement("DIV");
    stateOne.classList.add("toggle-button");
    stateOne.classList.add("left");
    stateOne.textContent = stateOneName;
    var stateTwo = document.createElement("DIV");
    stateTwo.classList.add("toggle-button");
    stateTwo.classList.add("right");
    stateTwo.textContent = stateTwoName;
    divContainer.appendChild(stateOne);
    divContainer.appendChild(stateTwo);

    function getElement() {
        return divContainer;
    }

    function setStateOne() {
        stateOne.classList.add("enabled");
        stateTwo.classList.remove("enabled");
    }

    function setStateTwo() {
        stateTwo.classList.add("enabled");
        stateOne.classList.remove("enabled");
    }

    stateOne.addEventListener("click", (evt) => {
        setStateOne();
        stateOneClick();
    });

    stateTwo.addEventListener("click", (evt) => {
        setStateTwo();
        stateTwoClick();
    });

    return {
        "getElement": getElement,
        "setStateOne": setStateOne,
        "setStateTwo": setStateTwo
    };
}
