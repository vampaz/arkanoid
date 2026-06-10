import { canvas } from './canvas.js';
import { state, STATE, BRICK_TYPE, BALL_RADIUS, PADDLE_WIDTH_START, COLS, ROWS, BRICK_WIDTH, BRICK_HEIGHT, POWERUP, createBall, addScore, loseLife, checkStageClear, nextStage, saveSeenPowerUp } from './gameState.js';
import { sfx, startMusic, stopMusic } from './audio.js';
import { spawnExplosion, spawnLaser, removeLaser, updateParticles, lasers } from './particles.js';
import { enemies, spawnEnemies, updateEnemies, checkEnemyCollision, checkLaserEnemyCollision } from './enemies.js';
import { boss, isBossStage, initBoss, updateBoss, checkBossBallCollision, checkBossLaserCollision, resetBoss } from './boss.js';

const POWERUP_DROP_CHANCE = 0.25;
const LASER_COOLDOWN = 8;

function update() {
  const dt = state.dt;
  state.frameCount++;

  if (state.current === STATE.STAGE_INTRO) {
    state.stageIntroTimer -= dt;
    if (state.stageIntroTimer <= 0) {
      state.current = STATE.PLAYING;
      startMusic(state.stage);
      spawnEnemies(state.stage);
      if (isBossStage(state.stage)) {
        initBoss(state.stage);
      }
    }
    updatePaddle(dt);
    return;
  }

  if (state.current === STATE.STAGE_CLEAR) {
    state.stageClearTimer -= dt;
    if (state.stageClearTimer <= 0) {
      nextStage();
    }
    return;
  }

  if (state.current === STATE.ALL_CLEAR) {
    state.allClearTimer -= dt;
    return;
  }

  if (state.current === STATE.GAME_OVER || state.current === STATE.MENU || state.current === STATE.DIFFICULTY || state.current === STATE.STAGE_SELECT) {
    return;
  }

  if (state.current === STATE.PAUSE_MENU) return;

  if (state.current !== STATE.PLAYING) return;

  if (state.comboTimer > 0) {
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) state.combo = 0;
  }
  if (state.laserTimer > 0) {
    state.laserTimer -= dt;
    if (state.laserTimer <= 0) state.laserActive = false;
  }
  if (state.expandTimer > 0) {
    state.expandTimer -= dt;
    if (state.expandTimer <= 0 && state.paddle) {
      state.paddle.width = PADDLE_WIDTH_START;
    }
  }
  if (state.ballGrabTimer > 0) {
    state.ballGrabTimer -= dt;
    if (state.ballGrabTimer <= 0) state.ballGrabActive = false;
  }
  if (state.reverseTimer > 0) {
    state.reverseTimer -= dt;
    if (state.reverseTimer <= 0) {
      state.reverseControls = false;
      state.reverseTimer = 0;
    }
  }
  if (state.missTimer > 0) {
    state.missTimer -= dt;
    if (state.missTimer <= 0) {
      state.missActive = false;
      state.missTimer = 0;
    }
  }

  if (state.screenShake.timer > 0) {
    state.screenShake.timer -= dt;
    if (state.screenShake.timer <= 0) {
      state.screenShake.intensity = 0;
    }
  }

  if (state.paddleFlash > 0) {
    state.paddleFlash -= dt;
  }

  if (state.tooltipTimer > 0) {
    state.tooltipTimer -= dt;
    if (state.tooltipTimer <= 0) {
      state.showPowerUpTooltip = null;
    }
  }

  for (let i = state.brickFlashes.length - 1; i >= 0; i--) {
    state.brickFlashes[i].timer -= dt;
    if (state.brickFlashes[i].timer <= 0) {
      state.brickFlashes.splice(i, 1);
    }
  }

  if (state.displayScore < state.score) {
    const diff = state.score - state.displayScore;
    state.displayScore += Math.max(1, Math.ceil(diff * 0.1 * dt));
    if (state.displayScore > state.score) state.displayScore = state.score;
  }

  state.bgOffset += 0.15 * dt;

  if (state.laserCooldown > 0) {
    state.laserCooldown -= dt;
  }

  updatePaddle(dt);
  updateBalls(dt);
  updateLasers(dt);
  updatePowerUps(dt);
  updateParticles();
  updateBallTrails(dt);
  updateEnemies(dt, state);
  updateBoss(dt, state);
  updateDecoyPaddle(dt);

  if (checkStageClear()) {
    state.current = STATE.STAGE_CLEAR;
    state.stageClearTimer = 120;
    sfx.stageClear();
    stopMusic();
    resetBoss();
  }
}

function updateDecoyPaddle(dt) {
  if (!state.decoyPaddle) return;

  state.decoyPaddle.y += state.decoyPaddle.dy * dt;
  if (state.decoyPaddle.y > canvas.height) {
    state.decoyPaddle = null;
  }
}

function updatePaddle(dt) {
  if (!state.paddle) return;

  state.paddle.dx = 0;
  const leftKey = state.reverseControls ? 'ArrowRight' : 'ArrowLeft';
  const rightKey = state.reverseControls ? 'ArrowLeft' : 'ArrowRight';
  const leftAlt = state.reverseControls ? 'd' : 'a';
  const rightAlt = state.reverseControls ? 'a' : 'd';

  if (state.keys[leftKey] || state.keys[leftAlt]) state.paddle.dx = -state.paddle.speed;
  if (state.keys[rightKey] || state.keys[rightAlt]) state.paddle.dx = state.paddle.speed;

  state.paddle.x += state.paddle.dx * dt;
  if (state.paddle.x < 0) state.paddle.x = 0;
  if (state.paddle.x + state.paddle.width > canvas.width) {
    state.paddle.x = canvas.width - state.paddle.width;
  }

  if (state.laserActive && state.laserCooldown <= 0) {
    fireLaser();
    state.laserCooldown = LASER_COOLDOWN;
  }
}

function updateBallTrails(dt) {
  state.balls.forEach(ball => {
    if (!ball.onPaddle && ball.x !== null) {
      if (!ball.trail) ball.trail = [];
      ball.trail.push({ x: ball.x, y: ball.y, life: 10 });
      if (ball.trail.length > 12) ball.trail.shift();
    }
    if (ball.trail) {
      for (let i = ball.trail.length - 1; i >= 0; i--) {
        ball.trail[i].life -= dt;
        if (ball.trail[i].life <= 0) {
          ball.trail.splice(i, 1);
        }
      }
    }
  });
}

function updateBalls(dt) {
  for (let i = state.balls.length - 1; i >= 0; i--) {
    const ball = state.balls[i];

    if (ball.onPaddle) {
      ball.x = state.paddle.x + state.paddle.width / 2;
      ball.y = state.paddle.y - ball.radius;

      if (state.ballGrabActive) {
        ball.onPaddle = true;
        continue;
      }

      if (state.keys[' '] || state.keys['Enter'] || state.mouseDown) {
        launchBall(ball);
      }
      continue;
    }

    ball.x += ball.dx * dt;
    ball.y += ball.dy * dt;

    if (state.ballGrabActive && ball.dy > 0) {
      ball.onPaddle = true;
      continue;
    }

    if (ball.x - ball.radius < 0) {
      ball.x = ball.radius;
      ball.dx = Math.abs(ball.dx);
      sfx.wallHit();
    }
    if (ball.x + ball.radius > canvas.width) {
      ball.x = canvas.width - ball.radius;
      ball.dx = -Math.abs(ball.dx);
      sfx.wallHit();
    }
    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius;
      ball.dy = Math.abs(ball.dy);
      sfx.wallHit();
    }

    if (ball.y + ball.radius > canvas.height) {
      if (state.decoyPaddle &&
          ball.x > state.decoyPaddle.x &&
          ball.x < state.decoyPaddle.x + state.decoyPaddle.width &&
          ball.y + ball.radius > state.decoyPaddle.y &&
          ball.y + ball.radius < state.decoyPaddle.y + state.decoyPaddle.height) {
        ball.dy = -Math.abs(ball.dy);
        ball.y = state.decoyPaddle.y - ball.radius;
        continue;
      }

      state.balls.splice(i, 1);
      if (state.balls.length === 0) {
        loseLife();
        sfx.loseLife();
      }
      continue;
    }

    if (ball.dy > 0 &&
        ball.y + ball.radius >= state.paddle.y &&
        ball.y + ball.radius <= state.paddle.y + state.paddle.height + 6 &&
        ball.x >= state.paddle.x - 2 &&
        ball.x <= state.paddle.x + state.paddle.width + 2) {

      ball.speed = Math.min(10, ball.speed + 0.1);

      const hitPos = (ball.x - (state.paddle.x + state.paddle.width / 2)) / (state.paddle.width / 2);
      const clampedHit = Math.max(-0.9, Math.min(0.9, hitPos));
      const angle = clampedHit * (Math.PI / 3);

      ball.dx = Math.sin(angle) * ball.speed;
      ball.dy = -Math.cos(angle) * ball.speed;
      ball.y = state.paddle.y - ball.radius;

      state.paddleFlash = 6;
      sfx.paddleHit();
    }

    const enemyHit = checkEnemyCollision(ball);
    if (enemyHit) {
      addScore(100);
      sfx.brickHit(0);
      spawnExplosion(enemyHit.x, enemyHit.y, '#ffaa00');
      state.screenShake.intensity = 3;
      state.screenShake.timer = 4;
      continue;
    }

    if (checkBossBallCollision(ball)) {
      addScore(50);
      sfx.brickHit(0);
      state.screenShake.intensity = 4;
      state.screenShake.timer = 5;
      continue;
    }

    checkTeleporters(ball);
    collideBricks(ball, i);
  }
}

function checkTeleporters(ball) {
  for (let t = 0; t < state.teleporters.length; t++) {
    const tp = state.teleporters[t];
    if (tp.hits <= 0) continue;

    if (ball.x + ball.radius > tp.x &&
        ball.x - ball.radius < tp.x + BRICK_WIDTH &&
        ball.y + ball.radius > tp.y &&
        ball.y - ball.radius < tp.y + BRICK_HEIGHT) {

      const pairIndex = (t % 2 === 0) ? t + 1 : t - 1;
      if (pairIndex < state.teleporters.length && state.teleporters[pairIndex].hits > 0) {
        const pair = state.teleporters[pairIndex];
        ball.x = pair.x + BRICK_WIDTH / 2;
        ball.y = pair.y + BRICK_HEIGHT / 2;
        sfx.teleport();
      }
      break;
    }
  }
}

function collideBricks(ball, ballIndex) {
  let hit = false;

  for (let r = 0; r < ROWS && !hit; r++) {
    for (let c = 0; c < COLS && !hit; c++) {
      const brick = state.bricks[r][c];
      if (brick.type === BRICK_TYPE.NONE || brick.hits <= 0) continue;

      if (!checkBrickCollision(ball, brick)) continue;

      if (brick.type === BRICK_TYPE.LIFE) {
        state.lives++;
        brick.hits = 0;
        sfx.powerUp();
        hit = true;
        continue;
      }

      if (brick.type === BRICK_TYPE.STEEL) {
        resolveBrickCollision(ball, brick);
        sfx.steelHit();
        hit = true;
        continue;
      }

      resolveBrickCollision(ball, brick);

      brick.hits--;
      const rowScore = (ROWS - r + 1) * 10;
      addScore(rowScore);
      sfx.brickHit(r);

      state.brickFlashes.push({ x: brick.x, y: brick.y, timer: 6 });
      state.screenShake.intensity = 3;
      state.screenShake.timer = 4;

      if (brick.hits <= 0) {
        brick.type = BRICK_TYPE.NONE;
        spawnExplosion(brick.x + BRICK_WIDTH / 2, brick.y + BRICK_HEIGHT / 2, '#ffaa00');
        if (Math.random() < POWERUP_DROP_CHANCE) {
          spawnPowerUp(brick.x + BRICK_WIDTH / 2, brick.y + BRICK_HEIGHT / 2);
        }
      }

      hit = true;
    }
  }
}

function checkBrickCollision(ball, brick) {
  return ball.x + ball.radius > brick.x &&
         ball.x - ball.radius < brick.x + BRICK_WIDTH &&
         ball.y + ball.radius > brick.y &&
         ball.y - ball.radius < brick.y + BRICK_HEIGHT;
}

function resolveBrickCollision(ball, brick) {
  const dx = ball.x - (brick.x + BRICK_WIDTH / 2);
  const dy = ball.y - (brick.y + BRICK_HEIGHT / 2);

  const overlapX = (BRICK_WIDTH / 2 + ball.radius) - Math.abs(dx);
  const overlapY = (BRICK_HEIGHT / 2 + ball.radius) - Math.abs(dy);

  if (overlapX < overlapY) {
    ball.dx = dx > 0 ? Math.abs(ball.dx) : -Math.abs(ball.dx);
  } else {
    ball.dy = dy > 0 ? Math.abs(ball.dy) : -Math.abs(ball.dy);
  }
}

function launchBall(ball) {
  ball.onPaddle = false;
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.3;
  ball.dx = Math.cos(angle) * ball.speed;
  ball.dy = Math.sin(angle) * ball.speed;
  sfx.launch();
}

function fireLaser() {
  spawnLaser(state.paddle.x + 10, state.paddle.y - 8, -8);
  if (state.paddle.width > 60) {
    spawnLaser(state.paddle.x + state.paddle.width - 10, state.paddle.y - 8, -8);
  }
  sfx.laser();
}

function updateLasers(dt) {
  for (let i = lasers.length - 1; i >= 0; i--) {
    const laser = lasers[i];
    laser.y += laser.dy * dt;

    if (laser.y < 0) {
      removeLaser(laser);
      continue;
    }

    let hit = false;

    const enemyHit = checkLaserEnemyCollision(laser);
    if (enemyHit) {
      addScore(100);
      sfx.brickHit(0);
      spawnExplosion(enemyHit.x, enemyHit.y, '#ffaa00');
      state.screenShake.intensity = 2;
      state.screenShake.timer = 3;
      removeLaser(laser);
      hit = true;
      continue;
    }

    if (checkBossLaserCollision(laser)) {
      addScore(50);
      sfx.brickHit(0);
      state.screenShake.intensity = 3;
      state.screenShake.timer = 4;
      removeLaser(laser);
      hit = true;
      continue;
    }

    for (let r = 0; r < ROWS && !hit; r++) {
      for (let c = 0; c < COLS && !hit; c++) {
        const brick = state.bricks[r][c];
        if (brick.type === BRICK_TYPE.NONE || brick.hits <= 0) continue;

        if (laser.x > brick.x && laser.x < brick.x + BRICK_WIDTH &&
            laser.y > brick.y && laser.y < brick.y + BRICK_HEIGHT) {

          if (brick.type !== BRICK_TYPE.STEEL && brick.type !== BRICK_TYPE.TELEPORTER) {
            brick.hits--;
            const rowScore = (ROWS - r + 1) * 5;
            addScore(rowScore);
            sfx.brickHit(r);

            state.brickFlashes.push({ x: brick.x, y: brick.y, timer: 6 });
            state.screenShake.intensity = 2;
            state.screenShake.timer = 3;

            if (brick.hits <= 0) {
              brick.type = BRICK_TYPE.NONE;
              spawnExplosion(brick.x + BRICK_WIDTH / 2, brick.y + BRICK_HEIGHT / 2, '#ffaa00');
              if (Math.random() < POWERUP_DROP_CHANCE) {
                spawnPowerUp(brick.x + BRICK_WIDTH / 2, brick.y);
              }
            }
          } else {
            sfx.steelHit();
          }

          removeLaser(laser);
          hit = true;
        }
      }
    }
  }
}

function spawnPowerUp(x, y) {
  const types = [
    POWERUP.EXPAND, POWERUP.SLOW, POWERUP.MULTIBALL, POWERUP.CATCH,
    POWERUP.LASER, POWERUP.REVERSE, POWERUP.WARP_NEXT, POWERUP.WARP_PREV,
    POWERUP.DECOY, POWERUP.MISS
  ];
  const weights = [15, 10, 10, 10, 10, 5, 5, 5, 5, 5];
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * totalWeight;

  let type = types[0];
  for (let i = 0; i < types.length; i++) {
    rand -= weights[i];
    if (rand <= 0) {
      type = types[i];
      break;
    }
  }

  state.powerUps.push({ x, y, dy: 2.5, type });

  if (!state.seenPowerUps.has(type)) {
    saveSeenPowerUp(type);
    state.showPowerUpTooltip = type;
    state.tooltipTimer = 180;
  }
}

function updatePowerUps(dt) {
  for (let i = state.powerUps.length - 1; i >= 0; i--) {
    const pu = state.powerUps[i];
    pu.y += pu.dy * dt;

    if (pu.y > canvas.height) {
      state.powerUps.splice(i, 1);
      continue;
    }

    if (pu.y + 12 >= state.paddle.y &&
        pu.x >= state.paddle.x &&
        pu.x <= state.paddle.x + state.paddle.width) {

      applyPowerUp(pu.type);
      sfx.powerUp();
      state.powerUps.splice(i, 1);
    }
  }
}

function applyPowerUp(type) {
  switch (type) {
    case POWERUP.EXPAND:
      if (state.paddle) state.paddle.width = Math.min(250, state.paddle.width + 40);
      state.expandTimer = 600;
      break;
    case POWERUP.SLOW:
      state.balls.forEach(b => {
        if (!b.onPaddle) {
          b.speed = Math.max(3, b.speed - 1);
          const angle = Math.atan2(b.dy, b.dx);
          b.dx = Math.cos(angle) * b.speed;
          b.dy = Math.sin(angle) * b.speed;
        }
      });
      break;
    case POWERUP.MULTIBALL:
      const activeBalls = state.balls.filter(b => !b.onPaddle);
      if (activeBalls.length > 0) {
        const baseBall = activeBalls[0];
        for (let i = 0; i < 2; i++) {
          const angle = Math.atan2(baseBall.dy, baseBall.dx) + (i === 0 ? 0.5 : -0.5);
          state.balls.push({
            x: baseBall.x, y: baseBall.y,
            dx: Math.cos(angle) * baseBall.speed,
            dy: Math.sin(angle) * baseBall.speed,
            radius: BALL_RADIUS,
            speed: baseBall.speed,
            onPaddle: false,
            trail: [],
          });
        }
      }
      break;
    case POWERUP.CATCH:
      state.ballGrabActive = true;
      state.ballGrabTimer = 400;
      break;
    case POWERUP.LASER:
      state.laserActive = true;
      state.laserTimer = 500;
      break;
    case POWERUP.REVERSE:
      state.reverseControls = true;
      state.reverseTimer = 600;
      break;
    case POWERUP.WARP_NEXT:
      if (state.stage < state.totalStages) {
        state.stage++;
        resetStage();
        state.current = STATE.STAGE_INTRO;
        state.stageIntroTimer = 120;
      }
      break;
    case POWERUP.WARP_PREV:
      if (state.stage > 1) {
        state.stage--;
        resetStage();
        state.current = STATE.STAGE_INTRO;
        state.stageIntroTimer = 120;
      }
      break;
    case POWERUP.DECOY:
      state.decoyPaddle = {
        x: state.paddle.x,
        y: canvas.height - 100,
        width: state.paddle.width,
        height: state.paddle.height,
        dy: 0.5,
      };
      break;
    case POWERUP.MISS:
      state.missActive = true;
      state.missTimer = 300;
      state.balls.forEach(b => {
        if (!b.onPaddle) {
          b.dx = 0;
          b.dy = b.speed;
        }
      });
      break;
  }
}

export { update };
