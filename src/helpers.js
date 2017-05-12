import { Vector2 } from 'three';

function polarToCartesian(angle, radius) {
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return new Vector2(x, y);
}

function detectCollision(playerPosition, playerDirection, playerRadius,
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
    polarToCartesian,
    detectCollision,
};
