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

function detectCollision(aPosition, aDirection, aRadius,
                         bPosition, bDirection, bRadius,
                         resolution = 1) {
    const circleCollision = (aPos, bPos, aRad, bRad) => Math.abs(aPos - bPos) <= aRad + bRad;
    for (let i = 0; i < resolution; i++) {
        const intermediateFrame = (1 / resolution) * i;
        const aPos = aPosition + aDirection * intermediateFrame;
        const bPos = bPosition + bDirection * intermediateFrame;
        if (circleCollision(aPos, bPos, aRadius, bRadius)) {
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
