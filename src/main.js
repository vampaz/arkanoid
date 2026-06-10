import { initAudio, sfx, startMusic, stopMusic } from './audio.js';
import { state, startGame, restartGame } from './gameState.js';
import { update } from './update.js';
import { draw } from './render.js';
import { init as initInput } from './input.js';

initInput(startGame, restartGame, state);

document.addEventListener('click', () => initAudio(), { once: true });
document.addEventListener('keydown', () => initAudio(), { once: true });

let lastTime = performance.now();

function loop(now) {
  const elapsed = now - lastTime;
  lastTime = now;
  state.dt = Math.min(elapsed / (1000 / 60), 3);

  update();
  draw();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
