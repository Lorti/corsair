// http://reactivex.io/rxjs/
// https://facebook.github.io/immutable-js/

import Rx from 'rxjs/Rx';
import Immutable from 'immutable';
import clock from './clock';
import input from './input';
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
    player: {
        position: Math.PI * 0.5,
        direction: -1,
    },
    speed: 1.25 / 1000,
    coins: coinFactory(),
});

const player = clock.withLatestFrom(input)
    .map(([clock, input]) => (state) => {
        const position = state.getIn(['player', 'position']) + clock.get('delta') * input.get('direction') * state.get('speed');
        const normalized = (position + 2 * Math.PI) % (2 * Math.PI);
        return state.merge({
            player: {
                position: normalized,
                direction: input.get('direction'),
            },
        });
    });

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
    .merge(player)
    .scan((state, reducer) => reducer(state), initialState);

const loop = clock.withLatestFrom(state, (clock, state) => state);
loop.subscribe(state => update(state));
