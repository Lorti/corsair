// http://reactivex.io/rxjs/
// https://facebook.github.io/immutable-js/

import Rx from 'rxjs/Rx';
import Immutable from 'immutable';
import clock from './clock';
import input from './input';
import { coinFactory, cannonballFactory, detectCollision } from './helpers';
import renderer from './rendering';

const initialState = Immutable.fromJS({
    player: {
        position: Math.PI * 0.5,
        direction: -1,
        radius: 6,
    },
    speed: 1.25 / 1000,
    coins: coinFactory(),
    cannonballs: [],
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

const cannonballs = events.map(([clock]) => state =>
    state.update('cannonballs', cannonballs => cannonballs.map(cannonball =>
        cannonball.update('radius', radius => radius + clock.get('delta') * state.get('speed') * 50))
    ));

const cannon = events.throttleTime(1000).map(() => state =>
    state.update('cannonballs', cannonballs => cannonballs.push(Immutable.fromJS(cannonballFactory()))),
);

const score = events.map(() => (state) => {
    const lootCollected = state.get('coins').some(coin => !coin.get('collected'));
    const shipDestroyed = state.get('cannonballs').find(cannonball => cannonball.get('collision'));
    return state.set('gameOver', !lootCollected || shipDestroyed);
});

const state = Rx.Observable
    .merge(player, cannon, coins, cannonballs, score)
    .scan((state, reducer) => reducer(state), initialState)
    .takeWhile(state => !state.get('gameOver'));

const update = renderer();
update(initialState);
state.subscribe(state => update(state));
