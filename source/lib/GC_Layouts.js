// Controller layout mapping registry

const GC_Layouts = {

    list: {
        _unknown: {
            name: 'Unknown Layout',
            description: 'A fallback for when no appropriate layouts are found.',
            options: {
                allowsExtras: true
            }
        }
    },

    register: function(map) {

        const layouts = Controller.layouts;

        let id = map.match;

        for (let i = 0; i < layouts.regex.length; i++) {
            const regex = this.regex[i];
            if (regex.test(id)) {
                id = id.match(regex)[1].trim();
                break;
            }
        }

        layouts.list[id.toLowerCase()] = map;

    },

    has: function(name) {
        name = name.toLowerCase();
        return name in Controller.layouts.list;
    },

    get: function(name) {
        name = name.toLowerCase();
        return Controller.layouts.list[name];
    },

    get regex() {
        return [
            /(.*)\(.*\)/,
            /[a-zA-Z0-9]{3,4}-[a-zA-Z0-9]{3,4}-(.*)/
        ];
    }

};

Controller.layouts = GC_Layouts;


// The W3C standard layout

(function() {

    var standard = {
        match: 'Standard',
        name: 'Standard',
        description: 'The W3C standard gamepad layout.',
        buttons: {
            'FACE_1'                    :  0,
            'FACE_2'                    :  1,
            'FACE_3'                    :  2,
            'FACE_4'                    :  3,
            'LEFT_SHOULDER'             :  4,
            'RIGHT_SHOULDER'            :  5,
            'LEFT_SHOULDER_BOTTOM'      :  6,
            'RIGHT_SHOULDER_BOTTOM'     :  7,
            'SELECT'                    :  8,
            'START'                     :  9,
            'LEFT_ANALOG_BUTTON'        : 10,
            'RIGHT_ANALOG_BUTTON'       : 11,
            'DPAD_UP'                   : 12,
            'DPAD_DOWN'                 : 13,
            'DPAD_LEFT'                 : 14,
            'DPAD_RIGHT'                : 15,
            'HOME'                      : 16
        },
        axes: {
            'LEFT_ANALOG_STICK_HOR'     :  0,
            'LEFT_ANALOG_STICK_VERT'    :  1,
            'RIGHT_ANALOG_STICK_HOR'    :  2,
            'RIGHT_ANALOG_STICK_VERT'   :  3
        },
        options: {
            allowsExtras: true
        }
    };

    Controller.layouts.register(standard);

}());
