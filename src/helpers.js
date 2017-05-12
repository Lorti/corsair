import { Vector2 } from 'three';

function coinFactory() {
    const coins = [];
    const n = 32;
    for (let i = 0; i < n; i++) {
        const coin = {
            angle: ((2 * Math.PI) / n) * i,
            radius: 1,
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
        angle: Math.random() * 2 * Math.PI, // TODO
        radius: 0, // TODO
        size: 1,
        collision: false,
    };
}

function polarToCartesian(angle, radius) {
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return new Vector2(x, y);
}

function detectCollision1D(playerPosition, playerDirection, playerRadius,
                         objectPosition, objectDirection, objectRadius,
                         resolution = 1) {
    const circleCollision = (aPos, bPos, aRad, bRad) => Math.abs(aPos - bPos) <= aRad + bRad;
    for (let i = 0; i < resolution; i++) {
        const intermediateFrame = (1 / resolution) * i;
        const aPos = playerPosition + playerDirection * intermediateFrame;
        const bPos = objectPosition + objectDirection * intermediateFrame;
        if (circleCollision(aPos, bPos, playerRadius, objectRadius)) {
            return true;
        }
    }
    return false;
}

function detectCollision2D(playerPosition, playerDirection, playerRadius,
                           objectPosition, objectDirection, objectRadius,
                           resolution = 1) {
    const circleCollision = (aPos, bPos, aRad, bRad) => aPos.distanceTo(bPos) <= aRad + bRad;
    for (let i = 0; i < resolution; i++) {
        const intermediateFrame = (1 / resolution) * i;
        const aPos = playerPosition.add(playerDirection.multiplyScalar(intermediateFrame));
        const bPos = objectPosition.add(objectDirection.multiplyScalar(intermediateFrame));
        if (circleCollision(aPos, bPos, playerRadius, objectRadius)) {
            return true;
        }
    }
    return false;
}

export {
    coinFactory,
    cannonballFactory,
    polarToCartesian,
    detectCollision1D,
    detectCollision2D,
};
