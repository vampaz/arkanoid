import { canvas } from './canvas.js';
import { STATE, DIFFICULTY } from './gameState.js';
import { setMute, stopMusic } from './audio.js';
import { startGameAtStage } from './gameState.js';

let _startGame = null;
let _restartGame = null;
let _state = null;

function init(startGameFn, restartGameFn, stateRef) {
  _startGame = startGameFn;
  _restartGame = restartGameFn;
  _state = stateRef;
}

document.addEventListener('keydown', (e) => {
  if (!_state) return;
  _state.keys[e.key] = true;

  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();

    if (_state.current === STATE.MENU) {
      _state.current = STATE.DIFFICULTY;
    } else if (_state.current === STATE.DIFFICULTY) {
      _state.difficulty = [DIFFICULTY.EASY, DIFFICULTY.NORMAL, DIFFICULTY.HARD][_state.difficultyIndex];
      _state.current = STATE.STAGE_SELECT;
      _state.stageSelectIndex = 0;
    } else if (_state.current === STATE.STAGE_SELECT) {
      const stageNum = _state.stageSelectIndex + 1;
      if (stageNum <= _state.unlockedStages) {
        startGameAtStage(stageNum);
      }
    } else if (_state.current === STATE.GAME_OVER || _state.current === STATE.ALL_CLEAR) {
      _state.current = STATE.MENU;
    } else if (_state.current === STATE.PAUSE_MENU) {
      const idx = _state.pauseMenuIndex;
      if (idx === 0) {
        _state.current = STATE.PLAYING;
      } else if (idx === 1) {
        _restartGame();
      } else if (idx === 2) {
        stopMusic();
        _state.current = STATE.MENU;
      }
    }
  }

  if (e.key === 'p' || e.key === 'P') {
    if (_state.current === STATE.PLAYING) {
      _state.current = STATE.PAUSE_MENU;
      _state.pauseMenuIndex = 0;
    } else if (_state.current === STATE.PAUSE_MENU) {
      _state.current = STATE.PLAYING;
    }
  }

  if (e.key === 'm' || e.key === 'M') {
    if (_state.current === STATE.PLAYING || _state.current === STATE.PAUSE_MENU || _state.current === STATE.MENU) {
      _state.mute = !_state.mute;
      setMute(_state.mute);
    }
  }

  if (_state.current === STATE.DIFFICULTY) {
    if (e.key === 'ArrowUp' || e.key === 'w') {
      _state.difficultyIndex = Math.max(0, _state.difficultyIndex - 1);
    }
    if (e.key === 'ArrowDown' || e.key === 's') {
      _state.difficultyIndex = Math.min(2, _state.difficultyIndex + 1);
    }
  }

  if (_state.current === STATE.STAGE_SELECT) {
    if (e.key === 'ArrowLeft' || e.key === 'a') {
      _state.stageSelectIndex = Math.max(0, _state.stageSelectIndex - 1);
    }
    if (e.key === 'ArrowRight' || e.key === 'd') {
      _state.stageSelectIndex = Math.min(32, _state.stageSelectIndex + 1);
    }
    if (e.key === 'ArrowUp' || e.key === 'w') {
      _state.stageSelectIndex = Math.max(0, _state.stageSelectIndex - 6);
    }
    if (e.key === 'ArrowDown' || e.key === 's') {
      _state.stageSelectIndex = Math.min(32, _state.stageSelectIndex + 6);
    }
  }

  if (_state.current === STATE.PAUSE_MENU) {
    if (e.key === 'ArrowUp' || e.key === 'w') {
      _state.pauseMenuIndex = Math.max(0, _state.pauseMenuIndex - 1);
    }
    if (e.key === 'ArrowDown' || e.key === 's') {
      _state.pauseMenuIndex = Math.min(2, _state.pauseMenuIndex + 1);
    }
  }
});

document.addEventListener('keyup', (e) => {
  if (!_state) return;
  _state.keys[e.key] = false;
});

canvas.addEventListener('mousedown', (e) => {
  e.preventDefault();
  if (!_state) return;
  _state.mouseDown = true;

  if (_state.current === STATE.MENU) {
    _state.current = STATE.DIFFICULTY;
  } else if (_state.current === STATE.DIFFICULTY) {
    _state.difficulty = [DIFFICULTY.EASY, DIFFICULTY.NORMAL, DIFFICULTY.HARD][_state.difficultyIndex];
    _state.current = STATE.STAGE_SELECT;
    _state.stageSelectIndex = 0;
  } else if (_state.current === STATE.STAGE_SELECT) {
    const stageNum = _state.stageSelectIndex + 1;
    if (stageNum <= _state.unlockedStages) {
      startGameAtStage(stageNum);
    }
  } else if (_state.current === STATE.GAME_OVER || _state.current === STATE.ALL_CLEAR) {
    _state.current = STATE.MENU;
  }
});

canvas.addEventListener('mouseup', () => {
  if (!_state) return;
  _state.mouseDown = false;
});

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (!_state) return;
  _state.mouseDown = true;

  if (_state.current === STATE.MENU) {
    _state.current = STATE.DIFFICULTY;
  } else if (_state.current === STATE.DIFFICULTY) {
    _state.difficulty = [DIFFICULTY.EASY, DIFFICULTY.NORMAL, DIFFICULTY.HARD][_state.difficultyIndex];
    _state.current = STATE.STAGE_SELECT;
    _state.stageSelectIndex = 0;
  } else if (_state.current === STATE.STAGE_SELECT) {
    const stageNum = _state.stageSelectIndex + 1;
    if (stageNum <= _state.unlockedStages) {
      startGameAtStage(stageNum);
    }
  } else if (_state.current === STATE.GAME_OVER || _state.current === STATE.ALL_CLEAR) {
    _state.current = STATE.MENU;
  }

  handleTouch(e.touches[0], canvas);
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (!_state || !_state.paddle) return;
  handleTouch(e.touches[0], canvas);
});

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  if (!_state) return;
  _state.mouseDown = false;
});

function handleTouch(touch, cvs) {
  const rect = cvs.getBoundingClientRect();
  const scaleX = cvs.width / rect.width;
  const touchX = (touch.clientX - rect.left) * scaleX;

  if (_state.paddle) {
    _state.paddle.x = touchX - _state.paddle.width / 2;
    if (_state.paddle.x < 0) _state.paddle.x = 0;
    if (_state.paddle.x + _state.paddle.width > cvs.width) {
      _state.paddle.x = cvs.width - _state.paddle.width;
    }
  }
}

export { init };
