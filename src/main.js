import game from './game';
import renderer from './rendering';

const update = renderer();
game.subscribe(([, state]) => update(state));
