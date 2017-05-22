import game from './game';
import renderer from './rendering';

const render = renderer();
(function start(stage, score) {
    const progress = { stage, score };
    game(stage, score).subscribe({
        next: (state) => {
            render(state);
            if (state.get('lootCollected')) {
                progress.stage = stage + 1;
                progress.score = state.get('score');
            }
            if (state.get('shipDestroyed')) {
                progress.stage = 1;
                progress.score = 0;
            }
        },
        error: error => console.error(error),
        complete: () => start(progress.stage, progress.score),
    });
}(1, 0));
