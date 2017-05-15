import Rx from 'rxjs/Rx';
import Immutable from 'immutable';
import { Vector2 } from 'three';
import clockStream from './clock';
import inputStream from './input';
import { polarToCartesian, detectCollision } from './helpers';

const COINS = 32;
const RADIUS = 50;
const SPEED = 1.25;
const ACCELERATION = 0.1;

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

function gameFactory(stage = 1, score = 0) {
    const initialState = Immutable.fromJS({
        player: {
            angle: Math.PI * 0.5,
            radius: RADIUS,
            direction: -1,
            size: 6,
        },
        speed: (SPEED + (stage - 1) * ACCELERATION) / 1000,
        coins: coinFactory(),
        cannonballs: [],
        score,
        lootCollected: false,
        shipDestroyed: false,
    });

    const clock = clockStream();
    const input = inputStream();

    const events = clock.withLatestFrom(input);

    const player = events.map(([clock, input]) => (state) => {
        if (state.get('shipDestroyed')) {
            return state;
        }

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

    const coins = events.map(([clock]) => (state) => {
        let collected = 0;
        return state
            .update('coins', (coins) => {
                const playerAngle = state.getIn(['player', 'angle']);
                const playerSpeed = clock.get('delta') * state.getIn(['player', 'direction']) * state.get('speed');
                const playerSize = state.getIn(['player', 'size']) * Math.PI / 180;

                return coins.map((coin) => {
                    if (coin.get('collected')) {
                        return coin;
                    }

                    const coinAngle = coin.get('angle');
                    const coinSpeed = 0;
                    const coinSize = coin.get('size') * Math.PI / 180;

                    const collision = detectCollision(
                        new Vector2(playerAngle, 0), new Vector2(playerSpeed, 0), playerSize,
                        new Vector2(coinAngle, 0), new Vector2(coinSpeed, 0), coinSize,
                        4,
                    );

                    if (collision) {
                        collected++;
                        return coin.set('collected', true);
                    }

                    return coin;
                });
            })
            .update('score', score => score + collected);
    });

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
                const cannonBallSize = cannonball.get('size');

                const collision = detectCollision(
                    polarToCartesian(playerAngle, playerRadius),
                    polarToCartesian(playerAngle + (Math.PI / 2) * playerDirection, playerSpeed),
                    playerSize,
                    polarToCartesian(cannonballAngle, cannonball.get('radius')),
                    polarToCartesian(cannonballAngle, 1).setLength(cannonballSpeed),
                    cannonBallSize,
                    4,
                );

                const next = cannonball.update('radius', radius => radius + cannonballSpeed);

                if (collision) {
                    return next.set('collision', true);
                }

                return next;
            });
        }));

    const cannon = events.throttleTime(1000).map(() => (state) => {
        if (state.get('shipDestroyed')) {
            return state;
        }
        return state.update('cannonballs', cannonballs =>
            cannonballs.push(Immutable.fromJS(cannonballFactory())));
    });

    const finish = events.map(() => (state) => {
        const lootCollected = state.get('coins').every(coin => coin.get('collected'));
        const shipDestroyed = state.get('cannonballs').find(cannonball => cannonball.get('collision'));
        return state.set('lootCollected', lootCollected).set('shipDestroyed', shipDestroyed);
    });

    const state = Rx.Observable
        .merge(player, cannon, coins, cannonballs, finish)
        .startWith(initialState)
        .scan((state, reducer) => reducer(state));

    return clock
        .withLatestFrom(state);
}

export default gameFactory;
