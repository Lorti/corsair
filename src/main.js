import game from './game';
import renderer from './rendering';

const render = renderer();
(function start(stage, score) {
    const round = { stage, score };
    game(...round).subscribe({
        next: ([, state]) => {
            render(state);
            if (state.get('lootCollected')) {
                round.stage = stage + 1;
                round.score = state.get('score');
                // TODO
            }
            if (state.get('shipDestroyed')) {
                // TODO
            }
        },
        error: error => console.error(error),
        complete: () => start(...round),
    });
}(1, 0));
