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
            angle: ((Math.PI * 2) / n) * i,
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
        angle: Math.random() * Math.PI * 2,
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
    score: 0,
    finish: false,
});

const events = clock.withLatestFrom(input);

const player = events.map(([clock, input]) => (state) => {
    const position = state.getIn(['player', 'angle']) +
        clock.get('delta') * input.get('direction') * state.get('speed');
    const normalized = (position + Math.PI * 2) % (Math.PI * 2);

    return state.mergeDeep({
        player: {
            angle: normalized,
            direction: input.get('direction'),
        },
    });
});

const coins = events.map(([clock]) => state =>
    state.update('coins', (coins) => {
        const playerAngle = state.getIn(['player', 'angle']);
        const playerSpeed = clock.get('delta') * state.getIn(['player', 'direction']) * state.get('speed');
        const playerSize = state.getIn(['player', 'size']) * Math.PI / 180;

        return coins.map((coin) => {
            const coinAngle = coin.get('angle');
            const coinSpeed = 0;
            const coinSize = coin.get('size') * Math.PI / 180;

            const collision = detectCollision(
                new Vector2(playerAngle, 0), new Vector2(playerSpeed, 0), playerSize,
                new Vector2(coinAngle, 0), new Vector2(coinSpeed, 0), coinSize,
                4,
            );

            if (collision) {
                return coin.set('collected', true);
            }

            return coin;
        });
    }));

const cannonballs = events.map(([clock]) => state =>
    state.update('cannonballs', (cannonballs) => {
        const playerAngle = state.getIn(['player', 'angle']);
        const playerRadius = state.getIn(['player', 'radius']);
        const playerDirection = state.getIn(['player', 'direction']);
        const playerSpeed = clock.get('delta') * state.getIn(['player', 'direction']) * state.get('speed');
        const playerSize = state.getIn(['player', 'size']);

        return cannonballs.map((cannonball) => {
            const cannonballAngle = cannonball.get('angle');
            const cannonballSpeed = clock.get('delta') * state.get('speed') * 50;
            const cannonballRadius = cannonball.get('size');

            const collision = detectCollision(
                polarToCartesian(playerAngle, playerRadius),
                polarToCartesian(playerAngle + (Math.PI / 2) * playerDirection, playerSpeed),
                playerSize,
                polarToCartesian(cannonballAngle, cannonball.get('radius')),
                polarToCartesian(cannonballAngle, 1).setLength(cannonballSpeed),
                cannonballRadius,
                4,
            );

            const next = cannonball.update('radius', radius => radius + cannonballSpeed);

            if (collision) {
                return next.set('collision', collision);
            }

            return next;
        });
    }));

const cannon = clock.throttleTime(1000).map(() => state =>
    state.update('cannonballs', cannonballs => cannonballs.push(Immutable.fromJS(cannonballFactory()))),
);

const score = clock.map(() => (state) => {
    const score = state.get('coins').reduce((score, coin) => score + coin.get('collected'), 0);
    const lootCollected = state.get('coins').some(coin => !coin.get('collected'));
    const shipDestroyed = state.get('cannonballs').find(cannonball => cannonball.get('collision'));
    return state
        .set('score', score)
        .set('finish', !lootCollected || shipDestroyed);
});

const state = Rx.Observable
    .merge(player, cannon, coins, cannonballs, score)
    .scan((state, reducer) => reducer(state), initialState)
    .takeWhile(state => !state.get('finish'));

const update = renderer();
update(initialState);
state.subscribe(state => update(state));
