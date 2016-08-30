/*
 * analogStickDpadThreshold
 * ------------------------
 * Specifies how far an analog stick must be pressed to register as a dpad press.
 *
 * default: 0.7
 * possible: [float] range - 0.0 to 1.0
 *
 */

Controller.globalSettings.register(new GC_Setting('analogStickDpadThreshold', 0.7, function(value) {

    if (typeof value === 'number' && value >=0 && value <= 1) {
        return value;
    } else {
        console.warn('angry');
        return null;
    }

}));
