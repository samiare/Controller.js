/*
 * useAnalogAsDpad
 * ---------------
 * Specifies whether analog sticks should fire dpad events, and if so, which.
 *
 * default: 'none'
 * possible: 'none', 'left', 'right', 'both', false
 *
 */

Controller.globalSettings.register(new GC_Setting('useAnalogAsDpad', 'none', function(value) {

    const possible = ['none', 'left', 'right', 'both', false];
    if (possible.indexOf(value) > -1) {
        return value;
    } else {
        console.warn('Not a valid option for "useAnalogAsDpad".');
        return null;
    }

}));
