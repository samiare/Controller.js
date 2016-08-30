// Settings object

const GC_Setting = function(name, defaultValue, setterFunction) {
    this.name = name;
    this.defaultValue = defaultValue;
    this.setterFunction = setterFunction;
};

const GC_Settings = function(isGlobalSettingList) {

    const globalSettings = (isGlobalSettingList) ? false : Controller.globalSettings;

    let localSettings = {};

    Object.defineProperty(this, 'global', {
        value: !!isGlobalSettingList,
        writable: false,
        enumerable: false,
        configurable: false
    });

    this.register = function(setting) {

        if (!isGlobalSettingList) {
            console.warn('You can only register settings globally:\nController.globalSettings.register()');
            return false;
        }

        if (typeof setting.defaultValue === 'object') {
            setting.value = Object.assign({}, setting.defaultValue);
        } else {
            setting.value = setting.defaultValue;
        }

        Object.defineProperty(this.constructor.prototype, setting.name, {

            get: function() {

                if (!this.global && setting.name in localSettings) {
                    return localSettings[setting.name];
                } else {
                    return setting.value;
                }

            },

            set: function(value) {

                if (value === undefined || (value === 'default' && this.global)) {

                    if (this.global) {
                        if (typeof setting.defaultValue === 'object') {
                            setting.value = Object.assign({}, setting.defaultValue);
                        } else {
                            setting.value = setting.defaultValue;
                        }
                    } else {
                        delete localSettings[setting.name];
                    }

                } else if (value === 'default') {

                    if (typeof setting.defaultValue === 'object') {
                        localSettings[setting.name] = Object.assign({}, setting.defaultValue);
                    } else {
                        localSettings[setting.name] = setting.defaultValue;
                    }

                } else {

                    const newValue = setting.setterFunction(value);
                    if (newValue !== null) {
                        if (this.global) {
                            if (typeof newValue === 'object') {
                                Object.assign(setting.value, newValue);
                            } else {
                                setting.value = newValue;
                            }
                        } else {
                            if (typeof newValue === 'object') {
                                Object.assign(localSettings[setting.name], newValue);
                            } else {
                                localSettings[setting.name] = newValue;
                            }
                        }
                    }

                }

            },

            enumerable: true

        });

        return true;

    };

};

GC_Settings.prototype.list = function() {

    let output = {};

    for (let name in this.constructor.prototype) {
        if (this.constructor.prototype.hasOwnProperty(name) && typeof this.constructor.prototype[name] !== 'function') {
            output[name] = this[name];
        }
    }

    return output;

};

GC_Settings.prototype.clear = function() {

    for (let name in this.constructor.prototype) {
        if (this.constructor.prototype.hasOwnProperty(name) && typeof this.constructor.prototype[name] !== 'function') {
            this[name] = undefined;
        }
    }

    return true;

};

GC_Settings.prototype.update = function() {

    let success = false;

    switch(arguments.length) {

        case 1:
            if (typeof arguments[0] === 'object') {
                updateMultiple.call(this, arguments[0]);
            } else {
                console.warn('GC_Settings.update(settings) expects "settings" to be an object of key/value pairs.');
            }
            break;

        case 2:
            if (typeof arguments[0] === 'string' && arguments[0] in this) {
                this[arguments[0]] = arguments[1];
            } else {
                console.warn('GC_Settings.update(settingName, value) expects "settingname" to be the name of a setting.');
            }
            break;

        default:
            console.warn('GC_Settings.update() expects either 1 or 2 arguments:\nupdate(settings) - where "settings" is an object key/value pairs\nupdate(settingName, value) - where "settingName" is the setting you want to change and "value" is what you want to change it to.');
            break;

    }

    function updateMultiple(list) {
        for (let name in list) {
            this[name] = list[name];
        }
    }

    return success;

};


// Create the global setting object

Controller.globalSettings = new GC_Settings(true);
