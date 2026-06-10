import { canvas } from './canvas.js';
import { STAGES } from './stages.js';

const PADDLE_WIDTH_START = 120;
const PADDLE_HEIGHT = 16;
const BALL_RADIUS = 7;
const BRICK_WIDTH = 68;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 4;
const BRICK_OFFSET_TOP = 60;

const COLS = 11;
const ROWS = 8;

const BRICK_OFFSET_LEFT = (canvas.width - (COLS * (BRICK_WIDTH + BRICK_PADDING) - BRICK_PADDING)) / 2;

const STATE = {
  MENU: 'menu',
  DIFFICULTY: 'difficulty',
  STAGE_SELECT: 'stage_select',
  STAGE_INTRO: 'stage_intro',
  PLAYING: 'playing',
  PAUSED: 'paused',
  PAUSE_MENU: 'pause_menu',
  GAME_OVER: 'game_over',
  STAGE_CLEAR: 'stage_clear',
  ALL_CLEAR: 'all_clear',
};

const BRICK_TYPE = {
  NONE: 0,
  NORMAL: 1,
  HARD: 2,
  STEEL: 3,
  TELEPORTER: 4,
  LIFE: 5,
};

const DIFFICULTY = {
  EASY: 'easy',
  NORMAL: 'normal',
  HARD: 'hard',
};

const DIFFICULTY_CONFIG = {
  [DIFFICULTY.EASY]: { lives: 5, ballSpeedMod: -1, label: 'EASY', color: '#00ff55' },
  [DIFFICULTY.NORMAL]: { lives: 3, ballSpeedMod: 0, label: 'NORMAL', color: '#ffaa00' },
  [DIFFICULTY.HARD]: { lives: 1, ballSpeedMod: 1, label: 'HARD', color: '#ff0055' },
};

const STAGE_THEMES = [
  { bg: '#0a0a1a', grid: 'rgba(30, 30, 60, 0.5)', accent: '#ff0055', name: 'Classic' },
  { bg: '#0a1a0a', grid: 'rgba(30, 60, 30, 0.5)', accent: '#00ff55', name: 'Matrix' },
  { bg: '#1a0a1a', grid: 'rgba(60, 30, 60, 0.5)', accent: '#aa00ff', name: 'Neon' },
  { bg: '#0a1a1a', grid: 'rgba(30, 60, 60, 0.5)', accent: '#00ccdd', name: 'Ocean' },
  { bg: '#1a1a0a', grid: 'rgba(60, 60, 30, 0.5)', accent: '#ffaa00', name: 'Amber' },
  { bg: '#1a0a0a', grid: 'rgba(60, 30, 30, 0.5)', accent: '#ff4400', name: 'Inferno' },
  { bg: '#0a0a1a', grid: 'rgba(40, 30, 60, 0.5)', accent: '#6644ff', name: 'Violet' },
  { bg: '#0a1a10', grid: 'rgba(30, 60, 40, 0.5)', accent: '#44ff88', name: 'Emerald' },
  { bg: '#1a100a', grid: 'rgba(60, 40, 30, 0.5)', accent: '#ff8844', name: 'Sunset' },
  { bg: '#0f0f0f', grid: 'rgba(50, 50, 50, 0.5)', accent: '#ffffff', name: 'Void' },
];

const BRICK_COLORS = {
  [BRICK_TYPE.NORMAL]: ['#ff0055', '#ff4400', '#ffaa00', '#aaff00', '#00ff55', '#00ccdd', '#3366ff'],
  [BRICK_TYPE.HARD]: ['#aa0033', '#aa2200', '#776600', '#558800', '#008833', '#007788', '#1133aa'],
  [BRICK_TYPE.STEEL]: ['#888888', '#999999', '#aaaaaa', '#bbbbbb', '#cccccc', '#666666', '#777777'],
  [BRICK_TYPE.TELEPORTER]: ['#aa00ff', '#cc44ff'],
  [BRICK_TYPE.LIFE]: ['#ff0055', '#ff4488'],
};

const POWERUP = {
  EXPAND: 'expand',
  SLOW: 'slow',
  MULTIBALL: 'multiball',
  CATCH: 'catch',
  LASER: 'laser',
  REVERSE: 'reverse',
  WARP_NEXT: 'warp_next',
  WARP_PREV: 'warp_prev',
  DECOY: 'decoy',
  MISS: 'miss',
};

const POWERUP_CONFIG = {
  [POWERUP.EXPAND]: { color: '#00ff55', label: 'E' },
  [POWERUP.SLOW]: { color: '#00ccff', label: 'S' },
  [POWERUP.MULTIBALL]: { color: '#ffff00', label: 'B' },
  [POWERUP.CATCH]: { color: '#aa88ff', label: 'C' },
  [POWERUP.LASER]: { color: '#00ffaa', label: 'L' },
  [POWERUP.REVERSE]: { color: '#ff3344', label: 'D' },
  [POWERUP.WARP_NEXT]: { color: '#ff6600', label: 'F' },
  [POWERUP.WARP_PREV]: { color: '#ff6600', label: 'G' },
  [POWERUP.DECOY]: { color: '#88ff88', label: 'P' },
  [POWERUP.MISS]: { color: '#ff0000', label: 'M' },
};

const POWERUP_DESCRIPTIONS = {
  [POWERUP.EXPAND]: 'Widens paddle',
  [POWERUP.SLOW]: 'Slows balls down',
  [POWERUP.MULTIBALL]: 'Splits into 3 balls',
  [POWERUP.CATCH]: 'Ball sticks to paddle',
  [POWERUP.LASER]: 'Paddle shoots lasers',
  [POWERUP.REVERSE]: 'Reverse controls',
  [POWERUP.WARP_NEXT]: 'Warp to next stage',
  [POWERUP.WARP_PREV]: 'Warp to previous stage',
  [POWERUP.DECOY]: 'Extra paddle below',
  [POWERUP.MISS]: 'Ball drops straight down',
};

const state = {
  current: STATE.MENU,
  score: 0,
  displayScore: 0,
  lives: 3,
  stage: 1,
  totalStages: 33,
  highScore: parseInt(localStorage.getItem('arkanoid_highscore') || '0', 10),
  unlockedStages: parseInt(localStorage.getItem('arkanoid_unlocked_stages') || '1', 10),
  combo: 0,
  comboTimer: 0,
  stageIntroTimer: 0,
  stageClearTimer: 0,
  allClearTimer: 0,
  extraLifeScores: [8000, 16000],
  nextExtraLifeIndex: 0,

  paddle: null,
  balls: [],
  bricks: [],
  powerUps: [],
  lasers: [],
  enemies: [],
  boss: null,
  decoyPaddle: null,

  keys: {},
  mouseDown: false,

  ballOnPaddle: true,
  laserActive: false,
  laserTimer: 0,
  expandTimer: 0,
  ballGrabActive: false,
  ballGrabTimer: 0,
  reverseControls: false,
  reverseTimer: 0,
  missActive: false,
  missTimer: 0,

  frameCount: 0,
  dt: 1,

  teleporters: [],

  screenShake: { intensity: 0, timer: 0 },
  paddleFlash: 0,
  brickFlashes: [],
  ballTrails: [],
  bgOffset: 0,

  difficulty: DIFFICULTY.NORMAL,
  difficultyIndex: 1,
  mute: false,
  volume: 0.5,

  pauseMenuIndex: 0,
  stageSelectIndex: 0,

  seenPowerUps: new Set(JSON.parse(localStorage.getItem('arkanoid_seen_powerups') || '[]')),
  showPowerUpTooltip: null,
  tooltipTimer: 0,

  laserCooldown: 0,
};

function createPaddle() {
  return {
    x: (canvas.width - PADDLE_WIDTH_START) / 2,
    y: canvas.height - 50,
    width: PADDLE_WIDTH_START,
    height: PADDLE_HEIGHT,
    dx: 0,
    speed: 9,
  };
}

function createBall(onPaddle = true) {
  const diffConfig = DIFFICULTY_CONFIG[state.difficulty];
  const tier = Math.floor((state.stage - 1) / 5);
  const speedTiers = [4, 5, 6, 7, 8];
  const speed = speedTiers[Math.min(tier, speedTiers.length - 1)] + diffConfig.ballSpeedMod;
  return {
    x: onPaddle ? null : canvas.width / 2,
    y: onPaddle ? null : canvas.height - 70,
    dx: 0,
    dy: 0,
    radius: BALL_RADIUS,
    speed: Math.max(3, speed),
    onPaddle: onPaddle,
    trail: [],
  };
}

function resetBall() {
  state.balls = [createBall(true)];
  state.ballOnPaddle = true;
  state.laserActive = false;
  state.laserTimer = 0;
  state.ballGrabActive = false;
  state.ballGrabTimer = 0;
  state.reverseControls = false;
  state.reverseTimer = 0;
  state.missActive = false;
  state.missTimer = 0;
  state.decoyPaddle = null;
  state.ballTrails = [];
}

function initPaddle() {
  state.paddle = createPaddle();
  if (state.expandTimer > 0) {
    state.paddle.width = Math.min(250, state.paddle.width + 40);
  }
}

function loadStage(stageNum) {
  state.bricks = [];
  const layout = STAGES[stageNum - 1];

  state.teleporters = [];
  let teleporterIndex = 0;

  for (let r = 0; r < ROWS; r++) {
    state.bricks[r] = [];
    for (let c = 0; c < COLS; c++) {
      const type = layout[r] && layout[r][c] ? layout[r][c] : 0;
      const brick = {
        x: c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT,
        y: r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP,
        type: type,
        hits: 1,
        maxHits: 1,
      };

      if (type === BRICK_TYPE.HARD) {
        brick.hits = 2;
        brick.maxHits = 2;
      }

      if (type === BRICK_TYPE.TELEPORTER) {
        brick.teleporterIndex = teleporterIndex;
        state.teleporters.push(brick);
        teleporterIndex++;
      }

      state.bricks[r][c] = brick;
    }
  }
}

function resetStage() {
  loadStage(state.stage);
  state.powerUps = [];
  state.lasers = [];
  state.brickFlashes = [];
  state.ballTrails = [];
  state.reverseControls = false;
  state.reverseTimer = 0;
  state.missActive = false;
  state.missTimer = 0;
  state.decoyPaddle = null;
  resetBall();
  initPaddle();
}

function startGame() {
  state.score = 0;
  state.displayScore = 0;
  const diffConfig = DIFFICULTY_CONFIG[state.difficulty];
  state.lives = diffConfig.lives;
  state.stage = 1;
  state.combo = 0;
  state.nextExtraLifeIndex = 0;
  state.expandTimer = 0;
  resetStage();
  state.current = STATE.STAGE_INTRO;
  state.stageIntroTimer = 120;
}

function startGameAtStage(stageNum) {
  state.score = 0;
  state.displayScore = 0;
  const diffConfig = DIFFICULTY_CONFIG[state.difficulty];
  state.lives = diffConfig.lives;
  state.stage = stageNum;
  state.combo = 0;
  state.nextExtraLifeIndex = 0;
  state.expandTimer = 0;
  resetStage();
  state.current = STATE.STAGE_INTRO;
  state.stageIntroTimer = 120;
}

function nextStage() {
  state.stage++;
  if (state.stage > state.totalStages) {
    state.current = STATE.ALL_CLEAR;
    state.allClearTimer = 180;
    if (state.unlockedStages < state.totalStages) {
      state.unlockedStages = state.totalStages;
      localStorage.setItem('arkanoid_unlocked_stages', state.totalStages.toString());
    }
    return;
  }
  if (state.stage > state.unlockedStages) {
    state.unlockedStages = state.stage;
    localStorage.setItem('arkanoid_unlocked_stages', state.stage.toString());
  }
  resetStage();
  state.current = STATE.STAGE_INTRO;
  state.stageIntroTimer = 120;
}

function loseLife() {
  state.lives--;
  if (state.lives <= 0) {
    if (state.score > state.highScore) {
      state.highScore = state.score;
      localStorage.setItem('arkanoid_highscore', state.score.toString());
    }
    state.current = STATE.GAME_OVER;
    return;
  }
  resetBall();
  state.reverseControls = false;
  state.reverseTimer = 0;
  state.missActive = false;
  state.missTimer = 0;
  state.decoyPaddle = null;
}

function addScore(points) {
  state.combo++;
  state.comboTimer = 120;
  const multiplier = Math.min(state.combo, 10);
  state.score += points * multiplier;

  while (state.nextExtraLifeIndex < state.extraLifeScores.length &&
         state.score >= state.extraLifeScores[state.nextExtraLifeIndex]) {
    state.lives++;
    state.nextExtraLifeIndex++;
  }
}

function checkStageClear() {
  if (state.boss && state.boss.active) {
    return state.boss.hp <= 0;
  }
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const b = state.bricks[r][c];
      if (b.type !== BRICK_TYPE.NONE && b.type !== BRICK_TYPE.TELEPORTER && b.hits > 0) {
        return false;
      }
    }
  }
  return true;
}

function restartGame() {
  state.score = 0;
  state.displayScore = 0;
  const diffConfig = DIFFICULTY_CONFIG[state.difficulty];
  state.lives = diffConfig.lives;
  state.stage = 1;
  state.combo = 0;
  state.nextExtraLifeIndex = 0;
  state.expandTimer = 0;
  resetStage();
  state.current = STATE.STAGE_INTRO;
  state.stageIntroTimer = 120;
}

function saveSeenPowerUp(type) {
  if (!state.seenPowerUps.has(type)) {
    state.seenPowerUps.add(type);
    localStorage.setItem('arkanoid_seen_powerups', JSON.stringify([...state.seenPowerUps]));
  }
}

function getTheme() {
  return STAGE_THEMES[(state.stage - 1) % STAGE_THEMES.length];
}

export {
  state, STATE, BRICK_TYPE, DIFFICULTY, DIFFICULTY_CONFIG, canvas,
  PADDLE_WIDTH_START, PADDLE_HEIGHT, BALL_RADIUS, BRICK_WIDTH, BRICK_HEIGHT,
  BRICK_PADDING, BRICK_OFFSET_TOP, BRICK_OFFSET_LEFT, COLS, ROWS, POWERUP,
  POWERUP_CONFIG, POWERUP_DESCRIPTIONS, BRICK_COLORS, STAGE_THEMES,
  createBall, resetBall, initPaddle, loadStage, resetStage, startGame,
  startGameAtStage, nextStage, loseLife, addScore, checkStageClear,
  restartGame, saveSeenPowerUp, getTheme, STAGES,
};
