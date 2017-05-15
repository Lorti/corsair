import game from './game';
import renderer from './rendering';

const render = renderer();
(function start(stage, score) {
    const loop = game(stage, score).subscribe(([, state]) => {
        render(state);
        if (state.get('lootCollected')) {
            loop.unsubscribe();
            start(stage + 1, state.get('score'));
        }
        if (state.get('shipDestroyed')) {
            loop.unsubscribe();
            // TODO
        }
    });
}(1, 0));
