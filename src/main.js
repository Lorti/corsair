// http://reactivex.io/rxjs/
// https://facebook.github.io/immutable-js/

import Rx from 'rxjs/Rx';
import Immutable from 'immutable';
import clock from './clock';
import input from './input';
import { coinFactory, detectCollision } from './helpers';
import renderer from './rendering';

const initialState = Immutable.fromJS({
    player: {
        position: Math.PI * 0.5,
        direction: -1,
        radius: 6,
    },
    speed: 1.25 / 1000,
    coins: coinFactory(),
});

const events = clock.withLatestFrom(input);

const player = events.map(([clock, input]) => (state) => {
    const position = state.getIn(['player', 'position']) + clock.get('delta') * input.get('direction') * state.get('speed');
    const normalized = (position + 2 * Math.PI) % (2 * Math.PI);
    return state.mergeDeep({
        player: {
            position: normalized,
            direction: input.get('direction'),
        },
    });
});

const coins = events.map(([clock]) => state => state.update('coins', (coins) => {
    const playerPosition = state.getIn(['player', 'position']);
    const playerSpeed = clock.get('delta') * state.getIn(['player', 'direction']) * state.get('speed');
    const playerRadius = state.getIn(['player', 'radius']) * Math.PI / 180;

    return coins.map((coin) => {
        const coinPosition = coin.get('angle');
        const coinSpeed = 0;
        const coinRadius = coin.get('radius') * Math.PI / 180;

        if (detectCollision(playerPosition, playerSpeed, playerRadius, coinPosition, coinSpeed, coinRadius, 4)) {
            return coin.set('collected', true);
        }

        return coin;
    });
}));

const state = Rx.Observable
    .merge(player, coins)
    .scan((state, reducer) => reducer(state), initialState);

const update = renderer();
update(initialState);
state.subscribe(state => update(state));
