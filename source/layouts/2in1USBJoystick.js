(function() {

    var usb2in1 = {
        match: '2In1 USB Joystick',
        name: 'Wired Controller for PS3 by Mgear',
        description: 'A wired, PS3-style controller.',
        buttons: {
            'FACE_1'                :  0,
            'FACE_2'                :  1,
            'FACE_3'                :  2,
            'FACE_4'                :  3,
            'LEFT_SHOULDER'         :  6,
            'RIGHT_SHOULDER'        :  7,
            'LEFT_SHOULDER_BOTTOM'  :  4,
            'RIGHT_SHOULDER_BOTTOM' :  5,
            'LEFT_ANALOG_BUTTON'    : 10,
            'RIGHT_ANALOG_BUTTON'   : 11,
            'START'                 :  9,
            'SELECT'                :  8,
            'DPAD_UP'               : 12,
            'DPAD_DOWN'             : 13,
            'DPAD_LEFT'             : 14,
            'DPAD_RIGHT'            : 15
        },
        axes: {
            'LEFT_ANALOG_STICK_HOR'       :  0,
            'LEFT_ANALOG_STICK_VERT'      :  1,
            'RIGHT_ANALOG_STICK_HOR'      :  3,
            'RIGHT_ANALOG_STICK_VERT'     :  2
        }
    };

    Controller.layouts.register(usb2in1);

}());
