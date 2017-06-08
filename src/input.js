import Rx from 'rxjs/Rx';
import Immutable from 'immutable';

export default () => {
    const state = Immutable.fromJS({
        direction: 1,
    });

    return Rx.Observable
        .fromEvent(document, 'keypress')
        .scan((previous, event) => {
            if (event.keyCode === 32) {
                return previous.update('direction', direction => direction * -1);
            }
            return previous;
        }, state)
        .distinctUntilChanged();
};
