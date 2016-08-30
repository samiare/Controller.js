/*
 * analogStickDeadzone
 * -------------------
 * Assigns a dead area to analog sticks. Min affects an area from center and max from the outter rim.
 *
 * default: {min: 0, max: 1}
 * possible: min - 0.0 to 1.0, max - 0.0 to 1.0
 *
 */

Controller.globalSettings.register(new GC_Setting('analogStickDeadzone', {min: 0, max: 1}, function(value) {

    if (typeof value !== 'object' || !('min' in value || 'max' in value)) {
        console.warn('Value must be an object containing either/both "min" and "max" values');
        return null;
    }

    let output = {};

    if ('min' in value && typeof value.min === 'number' && value.min >=0 && value.min <= 1) {
        output.min = value.min;
    }

    if ('max' in value && typeof value.max === 'number' && value.max >=0 && value.max <= 1) {
        output.max = value.max;
    }

    return output;

}));
