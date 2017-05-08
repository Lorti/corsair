// http://reactivex.io/rxjs/
// https://facebook.github.io/immutable-js/

import Rx from 'rxjs/Rx';
import Immutable from 'immutable';
import renderer from './rendering';

const update = renderer();

function coinFactory() {
    const coins = [];
    for (let i = 0; i < 24; i++) {
        coins.push({
            angle: ((2 * Math.PI) / 24) * i,
            radius: 1,
            collected: false,
        });
    }
    return coins;
}

const initialState = Immutable.fromJS({
    position: Math.PI * 0.5,
    direction: -1,
    speed: 1.25 / 1000,
    coins: coinFactory(),
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
        (state.get('position') + (clock.delta * state.get('direction') * state.get('speed')) + 2 * Math.PI) % (2 * Math.PI), // TODO
    ));

const updateCoins = state => state.update('coins', coins => coins.map((coin) => { // TODO
    const pCoin = coin.get('angle');
    const rCoin = ((2 * Math.PI) / 360) * coin.get('radius'); // TODO
    const pPlayer = state.get('position');
    const pRadius = ((2 * Math.PI) / 360) * 6; // TODO
//    console.log(pPlayer);
    if (Math.abs(pPlayer - pCoin) <= rCoin + pRadius) {
        return coin.set('collected', true);
    }
//    debugger;
    return coin;
}));

const state = Rx.Observable
    .merge(input, player)
    .scan((state, reducer) => updateCoins(reducer(state)), initialState);

const loop = clock.withLatestFrom(state, (clock, state) => ({ clock, state }));

loop.subscribe(({ clock, state }) => {
    update({ clock, state });
});
