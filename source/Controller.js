// No turning back now…

function Controller(HTMLgamepad) {
    "use strict";


    // Return if gamepad is not a Gamepad object

    if (HTMLgamepad.constructor.name !== 'Gamepad') {
        return false;
    }


    // CONTROLLER INITIALIZATION -------------------------------------------- //

    const id = HTMLgamepad.id;
    const index = HTMLgamepad.index;
    const timestamp = Date.now();

    let RAF = null;             // Stores the requestAnimationFrame id
    let lastUpdated = 0;        // Timestamp of the last time the controller was updated
    let analogMap = {};         // Stores the mapping from input analog locations to their layout counterpart
    let eventQueue = {};        // Stores the input events that need to be queues
    let layoutInfo = {};        // Stores information about this layout
    let connected = true;       // Whether this controller is connected
    let state = {};             // Holds a copy of the current input states
    let unknownLayout = true;   // Whether the gamepad layout is known or not

    let settings = arguments[1] || false;
    let gamepad = HTMLgamepad;

    // Creates a reference to a bound function for event listeners.
    const _disconnectController = disconnectController.bind(this);

    // --------------------------------------------------- END INITIALIZATION //


    // Main update loop

    function updateController() {

        // Makes sure the controller is still connected before continuing
        if (!connected) {
            window.cancelAnimationFrame(RAF);
            RAF = null;
            return;
        }

        checkInputs.call(this);
        RAF = window.requestAnimationFrame(updateController.bind(this));

    }

    function checkInputs() {
        /* ---------------------------------------------------- *
         * This is where the logic of each refresh loop happens *
         * ---------------------------------------------------- */

        // Gets the gamepad for this frame
        gamepad = this.constructor.gamepads[index];

        // Updates timestamp
        lastUpdated = performance.now();

        // Loops through and queues button events
        loopThroughButtons.call(this);

        // Queues left analog stick events
        if ('LEFT_ANALOG_STICK_HOR' in analogMap && 'LEFT_ANALOG_STICK_VERT' in analogMap) {
            processAnalogStick.call(this, 'LEFT_ANALOG_STICK', {
                x: getNormalizedAnalogInput(gamepad.axes[analogMap.LEFT_ANALOG_STICK_HOR]),
                y: getNormalizedAnalogInput(gamepad.axes[analogMap.LEFT_ANALOG_STICK_VERT])
            });
        }

        // Queues right analog stick events
        if ('RIGHT_ANALOG_STICK_HOR' in analogMap && 'RIGHT_ANALOG_STICK_VERT' in analogMap) {
            processAnalogStick.call(this, 'RIGHT_ANALOG_STICK', {
                x: getNormalizedAnalogInput(gamepad.axes[analogMap.RIGHT_ANALOG_STICK_HOR]),
                y: getNormalizedAnalogInput(gamepad.axes[analogMap.RIGHT_ANALOG_STICK_VERT])
            });
        }

        // Queues D-pad events for analog sticks
        switch(this.settings.useAnalogAsDpad) {

            case 'left':
                processAnalogAsDpad.call(this, 'left');
                break;

            case 'right':
                processAnalogAsDpad.call(this, 'right');
                break;

            case 'both':
                processAnalogAsDpad.call(this, 'left');
                processAnalogAsDpad.call(this, 'right');
                break;

        }

        // Fires queued events
        for (let input in eventQueue) {

            const event = eventQueue[input];
            dispatchCustomEvent(event.name, event.detail, event.info);
            delete eventQueue[input];

        }

    }


    // Controller setup

    function setupController() {

        // Create empty settings object
        this.settings = new GC_Settings();
        if (settings) {
            initSettings.call(this);
        }

        // Initialize mapping and initial values
        const layout = initControllerMapping.call(this);
        initPreviousInputs.call(this, layout);

        // Run a layout maps's initializer, if available
        if (layout.init && typeof layout.init === 'function') {
            layout.init(gamepad);
        }

        // controllerCount will be 0 if this is the first controller connected
        // because it does not get updated until setupController() finishes
        if (this.constructor.controllerCount === 0) {
            window.addEventListener('gamepaddisconnected', _disconnectController, false);
        }

        // Start listening for input
        updateController.call(this);

    }

    function initControllerMapping() {

        let layout = {};

        // Get the correct mapping layout, if available
        if (this.constructor.layouts.has(this.name)) {
            unknownLayout = false;
            layout = this.constructor.layouts.get(this.name);
        } else if (gamepad.mapping === 'standard') {
            unknownLayout = false;
            layout = this.constructor.layouts.get('standard');
        } else {
            console.warn(GC_Errors.MAP);
            layout = this.constructor.layouts.get('_unknown');
        }

        // Store layout info
        setLayoutInfo(layout);

        if (unknownLayout) {
            return layout;
        }

        // Check for browser-specific variant of layout
        const browser = getBrowser();

        if (browser && browser in layout) {
            layout = layout[browser];
        }

        // Map analog sticks to corresponding axes
        for (let name in layout.axes) {

            switch(name) {
                case 'LEFT_ANALOG_STICK_HOR':
                case 'LEFT_ANALOG_STICK_VERT':
                case 'RIGHT_ANALOG_STICK_HOR':
                case 'RIGHT_ANALOG_STICK_VERT':
                    analogMap[name] = layout.axes[name];
                    break;
            }

        }

        // Sets up references for analog to dpad conversion
        layout.misc = {
            'L_DPAD_UP'     : 0,
            'L_DPAD_DOWN'   : 1,
            'L_DPAD_LEFT'   : 2,
            'L_DPAD_RIGHT'  : 3,
            'R_DPAD_UP'     : 4,
            'R_DPAD_DOWN'   : 5,
            'R_DPAD_LEFT'   : 6,
            'R_DPAD_RIGHT'  : 7
        };

        return layout;

    }

    function initPreviousInputs(layout) {

        let buttonNames = [];
        let axisNames = [];

        lastUpdated = performance.now();

        state.buttons = {};
        state.axes = {};
        state.misc = {};

        for (let group in state) {
            let map = layout[group];

            for (let name in map) {
                const inputIndex = map[name].index || map[name];
                const type = map[name].type || group;
                const data = map[name].data || undefined;

                let options = {};

                if (typeof map[name] === 'object') {

                    options = {
                        inputMin: map[name].inputMin || undefined,
                        inputMax: map[name].inputMax || undefined,
                        method: map[name].method || undefined,
                        ignoreConversion: map[name].ignoreConversion || undefined
                    };

                }

                if (type === 'axes') {

                    if (name.endsWith('_HOR')) {
                        name = name.slice(0, -4);
                    } else if (name.endsWith('_VERT')) {
                        name = name.slice(0, -5);
                    }

                    state[type][name] = new AnalogStick(name, {
                        map: [group, inputIndex],
                        settings: this.settings,
                        options: options,
                        data: data
                    });

                    axisNames.push(inputIndex);

                } else if (type === 'buttons') {

                    if (gamepad.buttons[inputIndex]) {
                        state[type][name] = new Button(name, {
                            map: [group, inputIndex],
                            settings: this.settings,
                            options: options,
                            data: data
                        });
                    }

                    buttonNames.push(inputIndex);

                } else if (type === 'misc') {

                    state[type][name] = new Button(name, {
                        map: [group, inputIndex],
                        settings: this.settings,
                        options: options,
                        data: data
                    });

                }

            }

        }

        if (layout.options && layout.options.allowsExtras) {
            setupExtraButtons.call(this, buttonNames, 'buttons');
            setupExtraButtons.call(this, axisNames, 'axes');
        }

    }

    function initSettings() {
        this.settings.update(settings);
    }

    function disconnectController(event) {

        if (event.gamepad.index === this.index) {

            connected = false;

            this.unwatch.call(this);

            delete this.constructor.controllers[this.index];

            if (this.constructor.controllerCount === 0) {
                window.removeEventListener('gamepaddisconnected', _disconnectController);
            }

            dispatchCustomEvent(
                this.constructor.events.getName('controller', 'disconnect'),
                {
                    index: this.index,
                    timestamp: Date.now()
                },
                'Controller at index ' + this.index + ' disconnected.'
            );
        }

    }

    function setupExtraButtons(list, type) {

        const prefix = (type === 'buttons') ? 'BUTTON' : 'AXIS';

        let i = 0;
        for (let index in gamepad[type]) {

            if (list.indexOf(parseInt(index)) === -1) {
                i++;

                const name = 'MISC' + prefix + '_' + i;

                state.buttons[name] = new Button(name, {
                    map: [type, index],
                    settings: this.settings
                });

            }

        }

    }

    function setLayoutInfo(layout) {
        // layout: Nicely formatted name of layout
        // description: An optional description of the layout map
        // isKnown: whether the layout is known or not

        layoutInfo.name = layout.name || undefined;
        layoutInfo.description = layout.description || undefined;
        layoutInfo.unknownLayout = unknownLayout || undefined;

        for (let index in layoutInfo) {
            if (layoutInfo[index] === undefined) delete layoutInfo[index];
        }

    }


    // Processing and reporting inputs

    function loopThroughButtons() {

        // Runs processButton() for each button input

        const inputs = state.buttons;

        for (let name in inputs) {
            const index = inputs[name].getGamepadIndex();
            const section = inputs[name].getGamepadSection();
            const value = (typeof gamepad[section][index] === 'object') ? gamepad[section][index].value : gamepad[section][index];

            processButton.call(this, name, value);
        }

    }

    function processButton(name, value) {

        if (value === undefined) {
            return;
        }

        const inputName = (name.startsWith('L_') || name.startsWith('R_')) ? name.substring(2) : name;
        const button = state.buttons[name] || state.axes[name] || state.misc[name];

        if (eventQueue[inputName] && eventQueue[inputName].name === this.constructor.events.getName('button', 'during')) {
            return;
        }

        if (typeof button.getOption('method') === 'function') {
            value = button.getOption('method').call(this, this.constructor.gamepads[this.index], button);
        }

        if (value !== button.value) {
            button.hasUpdated = true;
        }

        if (!button.getOption('ignoreConversion') && button.hasUpdated) {
            const min = button.getOption('inputMin') || 0;
            const max = button.getOption('inputMax') || 1;
            value = getLinearConversion(value, min, max, 0, 1);
        }

        const pressed = value > 0;
        const previouslyPressed = button.value > 0;

        if (!pressed && !previouslyPressed) {
            return;
        }

        button.update(value);

        let copy = button.copy();
        copy.name = inputName;

        if (pressed && !previouslyPressed) {
            queueEvent(inputName, this.constructor.events.getName('button', 'start'), copy);
        } else if (pressed && previouslyPressed) {
            queueEvent(inputName, this.constructor.events.getName('button', 'during'), copy);
        } else if (!pressed && previouslyPressed) {
            queueEvent(inputName, this.constructor.events.getName('button', 'end'), copy);
        }

    }

    function processAnalogStick(name, input) {

        if (input.x === undefined || input.y === undefined) {
            return;
        }

        if (eventQueue[name] && eventQueue[name].name === this.constructor.events.getName('analog', 'during')) {
            return;
        }

        const analogStick = state.axes[name] || state.buttons[name] || state.misc[name];
        const values = calculateAnalogValues.call(this, input);
        const pressed = isAnalogStickPressed(values);
        const previouslyPressed = isAnalogStickPressed(analogStick.position);
        const previousValues = {x: analogStick.position.x, y: analogStick.position.y};

        if (!pressed && !previouslyPressed) {
            return;
        }

        analogStick.update(values);

        const changed = (analogStick.position.x !== previousValues.x || analogStick.position.y !== previousValues.y);

        const copy = analogStick.copy();

        if (pressed && !previouslyPressed) {
            queueEvent(name + 'start', this.constructor.events.getName('analog', 'start'), copy);
        } else if (pressed && previouslyPressed) {
            queueEvent(name + 'during', this.constructor.events.getName('analog', 'during'), copy);
        } else if (!pressed && previouslyPressed) {
            queueEvent(name + 'end', this.constructor.events.getName('analog', 'end'), copy);
        }

        if (changed) {
            queueEvent(name + 'change', this.constructor.events.getName('analog', 'change'), copy);
        }

    }

    function processAnalogAsDpad(stick) {

        const prefix = (stick === 'left') ? 'L_' : 'R_';
        const analogStick = (stick === 'left') ? 'LEFT_ANALOG_STICK' : 'RIGHT_ANALOG_STICK';

        const names = [
            'DPAD_UP',
            'DPAD_DOWN',
            'DPAD_LEFT',
            'DPAD_RIGHT'
        ];

        for (let name of names) {
            let inputAxis = 0;
            let otherAxis = 0;
            let isPastThreshold = false;

            switch(name) {
                case 'DPAD_UP':
                    inputAxis = state.axes[analogStick].position.y;
                    otherAxis = state.axes[analogStick].position.x;
                    isPastThreshold = (inputAxis <= this.settings.analogStickDpadThreshold * -1);
                    break;
                case 'DPAD_DOWN':
                    inputAxis = state.axes[analogStick].position.y;
                    otherAxis = state.axes[analogStick].position.x;
                    isPastThreshold = (inputAxis >= this.settings.analogStickDpadThreshold);
                    break;
                case 'DPAD_LEFT':
                    inputAxis = state.axes[analogStick].position.x;
                    otherAxis = state.axes[analogStick].position.y;
                    isPastThreshold = (inputAxis <= this.settings.analogStickDpadThreshold * -1);
                    break;
                case 'DPAD_RIGHT':
                    inputAxis = state.axes[analogStick].position.x;
                    otherAxis = state.axes[analogStick].position.y;
                    isPastThreshold = (inputAxis >= this.settings.analogStickDpadThreshold);
                    break;
            }

            const value = (isPastThreshold && Math.abs(inputAxis) > Math.abs(otherAxis)) ? 1 : 0;

            processButton.call(this, prefix + name, value);
        }

    }

    function calculateAnalogValues(values) {

        let output = {
            x: 0,
            y: 0
        };

        if (values.x !== 0) {
            output.x = getLinearConversion(Math.abs(values.x), this.settings.analogStickDeadzone.min, this.settings.analogStickDeadzone.max, 0, 1);
            if (values.x < 0 && output.x !== 0) {
                output.x *= -1;
            }
        }

        if (values.y !== 0) {
            output.y = getLinearConversion(Math.abs(values.y), this.settings.analogStickDeadzone.min, this.settings.analogStickDeadzone.max, 0, 1);
            if (values.y < 0 && output.y !== 0) {
                output.y *= -1;
            }
        }

        return (this.settings.mapAnalogToShape === 'square') ? getCoordsMappedToSquare(output) : output;

    }


    // Helpers

    function dispatchCustomEvent(eventName, detail, info) {

        detail = detail || {};
        info = info || undefined;

        if (info) {
            console.info(info);
        }

        const event = new CustomEvent(eventName, {
            detail: detail,
            bubbles: true,
            cancelable: false
        });

        window.dispatchEvent(event);

    }

    function getCoordsMappedToSquare(coords) {

        if (coords.x === 0 || coords.y === 0) {

            return {
                x: coords.x,
                y: coords.y,
            };

        } else {

            const abs = {
                x: Math.abs(coords.x),
                y: Math.abs(coords.y)
            };

            const oldLength = Math.hypot(abs.x, abs.y);

            let max = 1;

            if (abs.x > abs.y) {
                max = oldLength * (1 / abs.x);
            } else {
                max = oldLength * (1 / abs.y);
            }

            const newVals = getShortenedLineDistance(abs, getLinearConversion(oldLength, 0, 1, 0, max));

            return {
                x: (coords.x > 0) ? newVals.x : -newVals.x,
                y: (coords.y > 0) ? newVals.y : -newVals.y,
            };

        }

    }

    function getLinearConversion(value, oldMin, oldMax, newMin, newMax) {

        let result = (((value - oldMin) * (newMax - newMin)) / (oldMax - oldMin)) + newMin;

        if (newMax < newMin) {
            if (result < newMax) {
                result = newMax;
            } else if (result > newMin) {
                result = newMin;
            }
        } else {
            if (result > newMax) {
                result = newMax;
            } else if (result < newMin) {
                result = newMin;
            }
        }

        return result;

    }

    function getNormalizedAnalogInput(input) {

        if (Math.abs(input) < 0.1) {
            return 0;
        } else {
            return getLinearConversion(input, -0.9, 1, -1, 1);
        }

    }

    function getShortenedLineDistance(values, distance) {

        const hypotenuse = Math.hypot(values.x, values.y);
        const angle = Math.acos(values.y / hypotenuse);

        return {
            x: Math.sin(angle) * distance,
            y: Math.cos(angle) * distance
        };

    }

    function isAnalogStickPressed(values) {
        return Math.abs(values.x) > 0 || Math.abs(values.y) > 0;
    }

    function queueEvent(input, eventName, detail, info) {

        eventQueue[input] = {
            name: eventName,
            detail: detail || {},
            info: info || undefined
        };

    }

    function getBrowser() {
        if ('chrome' in window) {
            return 'Chrome';
        } else if ('opera' in window && ({}).toString.call(window.opera) === '[object Opera]') {
            return 'Opera';
        } else if ('MozAppearance' in document.documentElement.style) {
            return 'Mozilla';
        } else if ('WebkitAppearance' in document.documentElement.style) {
            return 'Webkit';
        } else {
            return undefined;
        }
    }


    // Public methods

    this.watch = function() {

        if (!RAF) {
            updateController.call(this);
        }

    };

    this.unwatch = function() {

        if (RAF) {
            window.cancelAnimationFrame(RAF);
            RAF = undefined;
        }

    };


    // Public attributes

    Object.defineProperty(this, 'index', {

        get: function() {
            return index;
        }

    });

    Object.defineProperty(this, 'id', {

        get: function() {
            return id;
        }

    });

    Object.defineProperty(this, 'name', {

        get: function() {
            for (let regex of Controller.layouts.regex) {
                if (regex.test(id)) {
                    return id.match(regex)[1].trim();
                }
            }
        }

    });

    Object.defineProperty(this, 'connectedTimestamp', {

        get: function() {
            return timestamp;
        }

    });

    Object.defineProperty(this, 'layoutInfo', {

        get: function() {
            return layoutInfo;
        }

    });

    Object.defineProperty(this, 'inputs', {

        get: function() {
            let buttons = {};
            let analogSticks = {};

            for (let button in state.buttons) {
                buttons[button] = state.buttons[button].copy();
            }

            for (let axis in state.axes) {
                analogSticks[axis] = state.axes[axis].copy();
            }

            return {
                buttons: buttons,
                analogSticks: analogSticks
            };
        }

    });


    // Define input data types

    function Button(name, args) {

        args = args || {};

        // 0: layout section
        // 1: layout index
        const map = args.map || [];

        // layout options
        const options = args.options || {};

        // controller settings
        const settings = args.settings || {};

        // extra data that needs to be stored for this input
        let data = args.data || undefined;

        let updated = false;

        this.controllerIndex = index;
        this.name = name;
        this.value = 0;

        setPressed.call(this);
        setTime.call(this);

        function setPressed() {
            this.pressed = this.value > (settings.buttonThreshold || 0);
        }

        function setTime() {
            this.time = lastUpdated;
        }

        this.getGamepadSection = function() {
            return map[0];
        };

        this.getGamepadIndex = function() {
            return map[1];
        };

        this.getOption = function(option) {
            return options[option];
        };

        this.update = function(value) {
            this.value = value;
            setPressed.call(this);
            setTime.call(this);

            if (!updated) {
                updated = true;
            }
        };

        this.copy = function() {
            let copy = {};
            for (let property in this) {
                if (typeof this[property] !== 'function') {
                    copy[property] = this[property];
                }
            }
            return copy;
        };

        Object.defineProperty(this, 'data', {

            get: function() {
                return data;
            },

            set: function(newData) {
                data = newData;
            }

        });

        Object.defineProperty(this, 'hasUpdated', {

            get: function() {
                return updated;
            },

            set: function(hasUpdated) {
                updated = hasUpdated;
            }

        });

    }

    function AnalogStick(name, args) {

        args = args || {};

        // 0: layout section
        // 1: layout index
        const map = args.map || [];

        // layout options
        const options = args.options || {};

        // controller settings
        const settings = args.settings || {};

        // extra data that needs to be stored for this input
        let data = args.data || undefined;

        let updated = false;

        this.controllerIndex = index;
        this.name = name;
        this.position = getPosition.call(this, {x: 0, y: 0});

        setAngle.call(this);
        setTime.call(this);

        function setAngle() {
            const radians = coordinatesToRadians(this.position.x, -this.position.y);
            const degrees = radiansToDegrees(radians);

            this.angle = {
                radians: getShortenedNumber(radians, 3),
                degrees: getShortenedNumber(degrees, 3)
            };
        }

        function setTime() {
            this.time = lastUpdated;
        }

        function getPosition(values) {
            return {
                x: roundPosition(values.x),
                y: roundPosition(values.y)
            };
        }

        function coordinatesToRadians(x, y) {
            if (x === 0 && y === 0) {
                return NaN;
            }

            let radians = Math.atan2(y, x);
            if (radians < 0) {
                radians += 2 * Math.PI;
            }
            return Math.abs(radians);
        }

        function roundPosition(number) {
            let result = 0;
            if (Math.abs(number) > 1) {
                result = Math.floor(number);
                if (result === -2) {
                    result = -1;
                }
            } else {
                result = Math.fround(number);
            }
            return result;
        }

        function getShortenedNumber(number, places) {
            const mult = Math.pow(10, places);
            return Math.round(number * mult) / mult;
        }

        function radiansToDegrees(radians) {
            if (isNaN(radians)) {
                return NaN;
            }

            return radians * (180 / Math.PI);
        }

        this.getGamepadSection = function() {
            return map[0];
        };

        this.getGamepadIndex = function() {
            return map[1];
        };

        this.getOption = function(option) {
            return options[option];
        };

        this.update = function(values) {
            this.position = getPosition.call(this, values);
            setAngle.call(this);
            setTime.call(this);

            if (!updated) {
                updated = true;
            }
        };

        this.copy = function() {
            let copy = {};
            for (let property in this) {
                if (typeof this[property] !== 'function') {
                    copy[property] = this[property];
                }
            }
            return copy;
        };

        Object.defineProperty(this, 'data', {

            get: function() {
                return data;
            },

            set: function(newData) {
                data = newData;
            }

        });

        Object.defineProperty(this, 'hasUpdated', {

            get: function() {
                return updated;
            },

            set: function(hasUpdated) {
                updated = hasUpdated;
            }

        });

    }


    // This runs after the controller is finished initializing

    this._postSetup = function() {

        let data = {
            controller: this,
            id: id,
            index: index,
            timestamp: timestamp
        };

        if (unknownLayout) {
            data.unknownLayout = unknownLayout;
        }

        // Dispatch found event and listen for disconnected event
        dispatchCustomEvent(
            this.constructor.events.getName('controller', 'connect'),
            data,
            'Gamepad connected at index ' + index + '.'
        );

    };


    // Initialize controller

    setupController.call(this);

}


// Global Controller methods and properties

Controller.search = function(options) {

    const timer = options && options.interval || 500;
    const limit = options && options.limit || undefined;

    // Check for GamepadAPI support and return if not
    if (!Controller.supported) {
        if (options && typeof options.unsupportedCallback === 'function') {
            options.unsupportedCallback();
        }
        return false;
    }

    this.interval = setInterval((function() {

        if (limit !== undefined && this.controllerCount >= limit) {
            clearInterval(this.interval);
            return;
        }

        for (let index in this.gamepads) {
            index = parseInt(index, 10);

            if (isNaN(index)) {
                return;
            }

            if (this.gamepads[index] !== undefined && this.gamepads[index] !== null && this.getController(index) === undefined) {

                if (!this.controllers) {
                    this.controllers = {};
                }

                let settings = {};

                if (options && 'settings' in options) {
                    settings = options.settings;
                }
                this.controllers[index] = new Controller(this.gamepads[index], settings);

                // Calling this from outside of the object initializer ensures
                // it's called post-initialization
                this.controllers[index]._postSetup.call(this.controllers[index]);

            }
        }

    }).bind(this), timer);

};

Controller.getController = function(index) {

    index = parseInt(index);

    if (typeof index !== 'number' || isNaN(index)) {
        console.warn(index + ' must be a number');
    } else if (index % 1 !== 0) {
        console.warn(index + ' must be an int');
    } else if (index < 0) {
        console.warn(index + ' must be positive');
    }

    return this.controllers && this.controllers[index];

};

Controller.watchAll = function() {

    for (let index in Controller.controllers) {
        Controller.getController(index).watch();
    }

};

Controller.unwatchAll = function() {

    for (let index in Controller.controllers) {
        Controller.getController(index).unwatch();
    }

};

Object.defineProperty(Controller, 'controllerCount', {

    get: function() {
        if (this.controllers) {
            return Object.keys(this.controllers).length;
        } else {
            return 0;
        }
    }

});

Object.defineProperty(Controller, 'supported', {

    get: function() {
        try {
            if (this.gamepads === null) {
                throw 'GAMEPAD';
            } else if (!('defineProperty' in Object)) {
                throw 'DEFINEPROPERTY';
            } else {
                return true;
            }
        } catch(error) {
            console.warn(GC_Errors[error]);
            return false;
        }
    }

});

Object.defineProperty(Controller, 'gamepads', {

    get: function() {

        let gamepads = null;

        if ('getGamepads' in navigator) {
            gamepads = navigator.getGamepads();
        } else if ('webkitGamepads' in navigator) {
            gamepads = navigator.webkitGamepads();
        } else if ('mozGamepads' in navigator) {
            gamepads = navigator.mozGamepads();
        } else if ('gamepads' in navigator) {
            gamepads = navigator.gamepads();
        }

        return gamepads;
    },

    enumerable: false

});


// Polyfills

Math.hypot = Math.hypot || function() {

    let y = 0;

    for (let arg of arguments) {
        if (arg === Infinity || arg === -Infinity) {
            return Infinity;
        }
        y += arg * arg;
    }
    return Math.sqrt(y);

};

Object.assign = Object.assign || function(target) {
    "use strict";

    if (target === null) {
        throw new TypeError('Cannot convert undefined or null to object');
    }

    target = Object(target);

    for (var index = 1; index < arguments.length; index++) {

        var source = arguments[index];

        if (source !== null) {
            for (var key in source) {
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }

    }

    return target;

};
