import Rx from 'rxjs/Rx';
import Immutable from 'immutable';
import { Vector2 } from 'three';
import clockStream from './clock';
import inputStream from './input';
import { polarToCartesian, detectCollision } from './helpers';

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

function cannonballFactory(last) {
    let angle;
    do {
        angle = Math.random() * Math.PI * 2;
    } while (angle > last - Math.PI / 2 && angle < last + Math.PI / 2);
    return {
        angle,
        radius: 0,
        size: 1,
        collision: false,
    };
}

function calculatePlayerSpeed(stage) {
    const BASE = 1.35;
    const ACCELERATION = 0.05;
    return (BASE + stage * ACCELERATION) / 1000;
}

function calculateCannonSpeed(stage) {
    const BASE = 750;
    const ACCELERATION = 7.5;
    return BASE / (1 + stage / ACCELERATION);
}

function calculateCannonballSpeed(stage) {
    const BASE = 35;
    const ACCELERATION = 0.5;
    return (BASE + stage * ACCELERATION) / 1000;
}

function gameFactory(stage, score) {
    const initialState = Immutable.fromJS({
        player: {
            angle: Math.PI * 0.5,
            radius: RADIUS,
            direction: -1,
            size: 6,
        },
        speed: {
            player: calculatePlayerSpeed(stage),
            cannon: calculateCannonSpeed(stage),
            cannonball: calculateCannonballSpeed(stage),
        },
        coins: coinFactory(),
        cannonballs: [],
        score,
        lootCollected: false,
        shipDestroyed: false,
        lingering: 60,
    });

    const clock = clockStream();
    const input = inputStream();

    const events = clock.withLatestFrom(input);

    const player = events.map(([clock, input]) => (state) => {
        if (state.get('lootCollected') || state.get('shipDestroyed')) {
            return state;
        }

        const position = state.getIn(['player', 'angle']) +
            clock.get('delta') * input.get('direction') * state.getIn(['speed', 'player']);
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
                const playerSpeed = clock.get('delta') * state.getIn(['player', 'direction']) * state.getIn(['speed', 'player']);
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
            const playerSpeed = clock.get('delta') * state.getIn(['player', 'direction']) * state.getIn(['speed', 'cannonball']);
            const playerSize = state.getIn(['player', 'size']);

            return cannonballs.map((cannonball) => {
                const cannonballAngle = cannonball.get('angle');
                const cannonballSpeed = clock.get('delta') * calculateCannonballSpeed(stage);
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

    const cannon = events
        .throttleTime(initialState.getIn(['speed', 'cannon']))
        .map(() => (state) => {
            if (state.get('lootCollected') || state.get('shipDestroyed')) {
                return state;
            }
            const angle = state.get('cannonballs').size ? state.get('cannonballs').last().get('angle') : 0;
            const cannonball = Immutable.fromJS(cannonballFactory(angle));
            return state.update('cannonballs', cannonballs => cannonballs.push(cannonball));
        });

    const finish = events.map(() => (state) => {
        const lootCollected = state.get('coins').every(coin => coin.get('collected'));
        const shipDestroyed = state.get('cannonballs').find(cannonball => cannonball.get('collision'));
        if (lootCollected || shipDestroyed) {
            return state
                .set('lootCollected', lootCollected)
                .set('shipDestroyed', shipDestroyed)
                .update('lingering', lingering => lingering - 1);
        }
        return state;
    });

    const state = Rx.Observable
        .merge(player, cannon, coins, cannonballs, finish)
        .startWith(initialState)
        .scan((state, reducer) => reducer(state));

    return clock
        .withLatestFrom(state)
        .takeWhile(([, state]) => state.get('lingering') >= 0);
}

export default gameFactory;
