import Rx from 'rxjs/Rx';
import Immutable from 'immutable';

const state = Immutable.fromJS({
    time: performance.now(),
    delta: 0,
});

const stream = Rx.Observable
    .interval(0, Rx.Scheduler.animationFrame)
    .scan((previous) => {
        const time = performance.now();
        return state.merge({
            time,
            delta: time - previous.get('time'),
        });
    }, state);

export default stream;
