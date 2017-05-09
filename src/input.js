import Rx from 'rxjs/Rx';
import Immutable from 'immutable';

const state = Immutable.fromJS({
    direction: -1,
});

const stream = Rx.Observable
    .fromEvent(document, 'keypress')
    .startWith(state)
    .scan((previous, event) => {
        if (event.keyCode === 32) {
            return previous.set('direction', previous.get('direction') * (-1));
        }
        return previous;
    })
    .distinctUntilChanged();

export default stream;
