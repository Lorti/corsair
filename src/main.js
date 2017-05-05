// http://reactivex.io/rxjs/
// https://facebook.github.io/immutable-js/

import Rx from 'rxjs/Rx';
import Immutable from 'immutable';
import renderer from './rendering';

const update = renderer();
const initialState = Immutable.fromJS({
    position: 0,
    direction: 1,
});

const clock = Rx.Observable
    .interval(0, Rx.Scheduler.animationFrame)
    .map(() => ({
        time: window.performance.now(),
        delta: 1,
    }))
    .scan((previous, current) => ({
        time: current.time,
        delta: current.time - previous.time,
    }));

const input = Rx.Observable
    .fromEvent(document, 'keypress')
    .map(event => (state) => {
        if (event.keyCode === 32) {
            return state.set('direction', state.get('direction') * (-1));
        }
        return state;
    });

const player = clock
    .map(clock => state => state.set('position',
        (state.get('position') + (clock.delta * state.get('direction') * 0.001)) % (2 * Math.PI),
    ));

const state = Rx.Observable
    .merge(input, player)
    .scan((state, reducer) => reducer(state), initialState);

const loop = clock.withLatestFrom(state, (clock, state) => ({ clock, state }));

loop.subscribe(({ clock, state }) => {
    update({ clock, state });
});
