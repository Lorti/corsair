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

function polarToCartesian(angle, radius) {
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return { x, y };
}

function detectCollision(playerPosition, playerDirection, playerRadius,
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

export {
    coinFactory,
    polarToCartesian,
    detectCollision,
};
