// http://reactivex.io/rxjs/
// https://facebook.github.io/immutable-js/

import Rx from 'rxjs/Rx';
import Immutable from 'immutable';
import { Vector2 } from 'three';
import clock from './clock';
import input from './input';
import { polarToCartesian, detectCollision } from './helpers';
import renderer from './rendering';

const COINS = 32;
const RADIUS = 50;

function coinFactory() {
    const coins = [];
    const n = COINS;
    for (let i = 0; i < n; i++) {
        const coin = {
            angle: ((2 * Math.PI) / n) * i,
            radius: RADIUS,
            size: 1,
            collected: false,
        };
        if (coin.angle !== Math.PI / 2) {
            coins.push(coin);
        }
    }
    return coins;
}

function cannonballFactory() {
    return {
        angle: Math.random() * 2 * Math.PI,
        radius: 0,
        size: 1,
        collision: false,
    };
}

const initialState = Immutable.fromJS({
    player: {
        angle: Math.PI * 0.5,
        radius: RADIUS,
        direction: -1,
        size: 6,
    },
    speed: 1.25 / 1000,
    coins: coinFactory(),
    cannonballs: [],
});

const events = clock.withLatestFrom(input);

const player = events.map(([clock, input]) => (state) => {
    const position = state.getIn(['player', 'angle']) + clock.get('delta') * input.get('direction') * state.get('speed');
    const normalized = (position + 2 * Math.PI) % (2 * Math.PI);
    return state.mergeDeep({
        player: {
            angle: normalized,
            direction: input.get('direction'),
        },
    });
});

const coins = events.map(([clock]) => state => state.update('coins', (coins) => {
    const playerPosition = state.getIn(['player', 'angle']);
    const playerSpeed = clock.get('delta') * state.getIn(['player', 'direction']) * state.get('speed');
    const playerSize = state.getIn(['player', 'size']) * Math.PI / 180;

    return coins.map((coin) => {
        const coinPosition = coin.get('angle');
        const coinSpeed = 0;
        const coinSize = coin.get('size') * Math.PI / 180;

        if (detectCollision(new Vector2(playerPosition, 0), new Vector2(playerSpeed, 0), playerSize,
                new Vector2(coinPosition, 0), new Vector2(coinSpeed, 0), coinSize, 4)) {
            return coin.set('collected', true);
        }

        return coin;
    });
}));

const cannonballs = events.map(([clock]) => state =>
    state.update('cannonballs', (cannonballs) => {
        const playerPosition = state.getIn(['player', 'angle']);
        const playerSpeed = clock.get('delta') * state.getIn(['player', 'direction']) * state.get('speed');
        const playerSize = state.getIn(['player', 'size']);

        return cannonballs.map((cannonball) => {
            const cannonballPosition = cannonball.get('angle');
            const cannonballSpeed = clock.get('delta') * state.get('speed') * 50;
            const cannonballRadius = cannonball.get('size');

            // TODO
            const collision = detectCollision(
                polarToCartesian(playerPosition, 50),
                polarToCartesian(playerPosition + (Math.PI / 2) * state.getIn(['player', 'direction']), 50).setLength(playerSpeed),
                playerSize,
                polarToCartesian(cannonballPosition, cannonball.get('radius')),
                polarToCartesian(cannonballPosition, 1).setLength(cannonballSpeed),
                cannonballRadius,
                4);

            return cannonball.update('radius', radius => radius + cannonballSpeed).set('collision', collision);
        });
    }));

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
