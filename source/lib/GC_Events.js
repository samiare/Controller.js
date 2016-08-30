// Defines all gc[…] events

const GC_Events = function() {

    const pre = 'gc';

    this.getName = function(base, action) {
        const message = [
            pre,
            this[base.toUpperCase()].base,
            this[base.toUpperCase()].actions[action]
        ];
        return message.join('.');
    };

};

Object.defineProperty(GC_Events.prototype, 'CONTROLLER', {

    value: {
        base: 'controller',
        actions: {
            connect: 'found',
            disconnect: 'lost'
        }
    }

});

Object.defineProperty(GC_Events.prototype, 'BUTTON', {

    value: {
        base: 'button',
        actions: {
            start: 'press',
            during: 'hold',
            end: 'release'
        }
    }

});

Object.defineProperty(GC_Events.prototype, 'ANALOG', {

    value: {
        base: 'analog',
        actions: {
            start: 'start',
            during: 'hold',
            change: 'change',
            end: 'end'
        }
    }

});

Controller.events = new GC_Events();
