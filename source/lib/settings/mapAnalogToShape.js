/*
 * mapAnalogToShape
 * ----------------
 * When set to true, analog stick values will be mapped to a square (x and y can be maxed out at the same time).
 * When set to false, analog stick values are restricted to a circle.
 *
 * default: "none"
 * possible: "none", "square"
 *
 */

Controller.globalSettings.register(new GC_Setting('mapAnalogToShape', 'none', function(value) {

    if (value === 'none') {
        return 'none';
    } else if (value === 'square') {
        return 'square';
    } else {
        return null;
    }

}));
