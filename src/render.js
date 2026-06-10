import { ctx, canvas } from './canvas.js';
import { state, STATE, BRICK_TYPE, COLS, ROWS, BRICK_WIDTH, BRICK_HEIGHT, POWERUP_CONFIG, POWERUP_DESCRIPTIONS, BRICK_COLORS, STAGE_THEMES, DIFFICULTY, DIFFICULTY_CONFIG, getTheme } from './gameState.js';
import { particles, lasers } from './particles.js';

function draw() {
  ctx.save();

  if (state.screenShake.intensity > 0 && state.current === STATE.PLAYING) {
    const sx = (Math.random() - 0.5) * state.screenShake.intensity * 2;
    const sy = (Math.random() - 0.5) * state.screenShake.intensity * 2;
    ctx.translate(sx, sy);
  }

  clearCanvas();

  switch (state.current) {
    case STATE.MENU:
      drawMenu();
      break;
    case STATE.DIFFICULTY:
      drawDifficultySelect();
      break;
    case STATE.STAGE_SELECT:
      drawStageSelect();
      break;
    case STATE.STAGE_INTRO:
      drawGame();
      drawStageIntro();
      break;
    case STATE.PLAYING:
      drawGame();
      break;
    case STATE.PAUSE_MENU:
      drawGame();
      drawPauseMenu();
      break;
    case STATE.GAME_OVER:
      drawGame();
      drawGameOver();
      break;
    case STATE.STAGE_CLEAR:
      drawGame();
      drawStageClear();
      break;
    case STATE.ALL_CLEAR:
      drawAllClear();
      break;
  }

  ctx.restore();
}

function clearCanvas() {
  const theme = (state.current === STATE.PLAYING || state.current === STATE.STAGE_INTRO || state.current === STATE.STAGE_CLEAR || state.current === STATE.PAUSE_MENU) ? getTheme() : STAGE_THEMES[0];

  ctx.fillStyle = theme.bg;
  ctx.fillRect(-10, -10, canvas.width + 20, canvas.height + 20);
  drawGrid(theme);
}

function drawGrid(theme) {
  const offset = state.bgOffset % 40;

  ctx.strokeStyle = theme.grid;
  ctx.lineWidth = 1;

  for (let x = -40 + offset; x <= canvas.width + 40; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = -40 + offset * 0.5; y <= canvas.height + 40; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawGame() {
  drawBricks();
  drawBrickFlashes();
  drawPowerUps();
  drawLasers();
  drawBallTrails();
  drawBalls();
  drawPaddle();
  drawParticles();
  drawTrajectoryPreview();
  drawHUD();
  drawLives();
  drawPowerUpTooltip();
  drawMuteIndicator();
}

function drawParticles() {
  particles.forEach((p) => {
    const alpha = p.life / p.maxLife;
    ctx.fillStyle = `${p.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  });
}

function drawBrickFlashes() {
  state.brickFlashes.forEach(f => {
    const alpha = f.timer / 6;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
    ctx.fillRect(f.x, f.y, BRICK_WIDTH, BRICK_HEIGHT);
  });
}

function drawBricks() {
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const brick = state.bricks[c][r];
      if (brick.type === BRICK_TYPE.NONE || brick.hits <= 0) continue;

      const colors = BRICK_COLORS[brick.type];
      let color = colors[r % colors.length];

      if (brick.type === BRICK_TYPE.HARD && brick.hits < brick.maxHits) {
        color = '#666666';
      }

      ctx.fillStyle = color;
      ctx.fillRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);

      if (brick.type === BRICK_TYPE.STEEL) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(brick.x + 2, brick.y + 2, BRICK_WIDTH / 2 - 2, BRICK_HEIGHT / 2 - 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(brick.x + BRICK_WIDTH / 2, brick.y + BRICK_HEIGHT / 2, BRICK_WIDTH / 2 - 2, BRICK_HEIGHT / 2 - 2);
      }

      if (brick.type === BRICK_TYPE.TELEPORTER) {
        const pulse = Math.sin(state.frameCount * 0.1 + brick.teleporterIndex) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(170, 0, 255, ${pulse})`;
        ctx.fillRect(brick.x + 2, brick.y + 2, BRICK_WIDTH - 4, BRICK_HEIGHT - 4);
        ctx.fillStyle = '#fff';
        ctx.font = '10px "Courier New"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('<>', brick.x + BRICK_WIDTH / 2, brick.y + BRICK_HEIGHT / 2);
      }

      if (brick.type === BRICK_TYPE.LIFE) {
        ctx.fillStyle = '#ff0055';
        roundRect(ctx, brick.x + 4, brick.y + 6, BRICK_WIDTH - 8, BRICK_HEIGHT - 12, 3);
        ctx.fill();
      }

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);

      if (brick.type === BRICK_TYPE.HARD && brick.hits < brick.maxHits) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(brick.x + BRICK_WIDTH / 2, brick.y, BRICK_WIDTH / 2, BRICK_HEIGHT);
      }
    }
  }
}

function drawPaddle() {
  if (!state.paddle) return;

  const p = state.paddle;
  const theme = getTheme();

  ctx.shadowColor = state.paddleFlash > 0 ? '#ffffff' : theme.accent;
  ctx.shadowBlur = state.paddleFlash > 0 ? 25 : 15;

  const gradient = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.height);
  if (state.paddleFlash > 0) {
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, '#ffccdd');
    gradient.addColorStop(1, '#ff88aa');
  } else {
    gradient.addColorStop(0, '#ff4488');
    gradient.addColorStop(0.5, '#ff0055');
    gradient.addColorStop(1, '#aa0033');
  }

  ctx.fillStyle = gradient;
  roundRect(ctx, p.x, p.y, p.width, p.height, 4);
  ctx.fill();

  ctx.shadowBlur = 0;

  if (state.laserActive) {
    ctx.fillStyle = '#00ffaa';
    ctx.fillRect(p.x + 4, p.y - 6, 4, 8);
    if (p.width > 60) {
      ctx.fillRect(p.x + p.width - 8, p.y - 6, 4, 8);
    }
  }
}

function drawBallTrails() {
  state.balls.forEach(ball => {
    if (!ball.trail || ball.trail.length === 0) return;
    ball.trail.forEach((t, idx) => {
      const alpha = (t.life / 10) * 0.4;
      const size = ball.radius * (0.3 + (idx / ball.trail.length) * 0.7);
      if (ball.fireball) {
        ctx.fillStyle = `rgba(255, 102, 0, ${alpha})`;
      } else {
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      }
      ctx.beginPath();
      ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
      ctx.fill();
    });
  });
}

function drawBalls() {
  state.balls.forEach((ball) => {
    if (ball.onPaddle && state.current === STATE.STAGE_INTRO) return;

    ctx.shadowColor = ball.fireball ? '#ff6600' : '#ffffff';
    ctx.shadowBlur = ball.fireball ? 20 : 10;

    if (ball.fireball) {
      const gradient = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.radius * 2);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.3, '#ff6600');
      gradient.addColorStop(0.7, '#ff3300');
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = ball.fireball ? '#ff8844' : '#ffffff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  });
}

function drawTrajectoryPreview() {
  if (!state.ballOnPaddle && state.balls.length > 0 && state.balls[0].onPaddle && state.current === STATE.PLAYING) {
    const ball = state.balls[0];
    const px = state.paddle.x + state.paddle.width / 2;
    const py = state.paddle.y - ball.radius;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 8]);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px, py - 120);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawPowerUps() {
  state.powerUps.forEach((pu) => {
    const config = POWERUP_CONFIG[pu.type];

    ctx.shadowColor = config.color;
    ctx.shadowBlur = 10;

    ctx.fillStyle = config.color;
    roundRect(ctx, pu.x - 12, pu.y - 8, 24, 16, 3);
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    roundRect(ctx, pu.x - 12, pu.y - 8, 24, 16, 3);
    ctx.stroke();

    ctx.font = 'bold 10px "Courier New"';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.label, pu.x, pu.y);
  });
}

function drawLasers() {
  lasers.forEach((laser) => {
    if (!laser.active) return;
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#00ffcc';
    ctx.fillRect(laser.x - 2, laser.y, 4, 10);
    ctx.shadowBlur = 0;
  });
}

function drawPowerUpTooltip() {
  if (!state.showPowerUpTooltip) return;
  const type = state.showPowerUpTooltip;
  const config = POWERUP_CONFIG[type];
  const desc = POWERUP_DESCRIPTIONS[type];
  const alpha = Math.min(1, state.tooltipTimer / 30);

  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  const tw = ctx.measureText(desc).width + 40;
  const tx = canvas.width / 2 - tw / 2;
  const ty = 50;
  roundRect(ctx, tx, ty, tw, 28, 6);
  ctx.fill();

  ctx.strokeStyle = config.color;
  ctx.lineWidth = 1;
  roundRect(ctx, tx, ty, tw, 28, 6);
  ctx.stroke();

  ctx.fillStyle = config.color;
  ctx.font = 'bold 11px "Courier New"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${config.label} - ${desc}`, canvas.width / 2, ty + 14);
  ctx.globalAlpha = 1;
}

function drawMuteIndicator() {
  if (state.mute) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '12px "Courier New"';
    ctx.textAlign = 'right';
    ctx.fillText('MUTED', canvas.width - 16, 44);
  }
}

function drawHUD() {
  ctx.textAlign = 'left';
  ctx.font = 'bold 16px "Courier New"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`SCORE: ${state.displayScore}`, 16, 24);

  ctx.textAlign = 'center';
  const theme = getTheme();
  ctx.fillStyle = theme.accent;
  ctx.fillText(`STAGE ${state.stage}`, canvas.width / 2, 24);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`HI: ${state.highScore}`, canvas.width - 16, 24);

  if (state.combo > 1) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 14px "Courier New"';
    ctx.fillText(`COMBO x${state.combo}`, canvas.width / 2, 44);
  }

  const activeTimers = [];
  if (state.fireballActive) activeTimers.push({ label: `FIRE: ${Math.ceil(state.fireballTimer / 60)}s`, color: '#ff6600', align: 'left' });
  if (state.laserActive) activeTimers.push({ label: `LASER: ${Math.ceil(state.laserTimer / 60)}s`, color: '#00ffaa', align: 'right' });
  if (state.ballGrabActive) activeTimers.push({ label: `GRAB: ${Math.ceil(state.ballGrabTimer / 60)}s`, color: '#aa88ff', align: 'center' });

  activeTimers.forEach(t => {
    ctx.textAlign = t.align;
    ctx.fillStyle = t.color;
    ctx.font = '12px "Courier New"';
    const y = canvas.height - 8;
    const x = t.align === 'left' ? 16 : t.align === 'right' ? canvas.width - 16 : canvas.width / 2;
    ctx.fillText(t.label, x, y);
  });
}

function drawLives() {
  for (let i = 0; i < state.lives; i++) {
    const x = canvas.width / 2 - (state.lives * 20) + i * 40 + 10;
    const y = canvas.height - 20;

    ctx.fillStyle = '#ff0055';
    roundRect(ctx, x - 12, y - 4, 24, 8, 2);
    ctx.fill();
  }
}

function drawMenu() {
  const titleY = canvas.height / 2 - 80;

  ctx.textAlign = 'center';

  ctx.shadowColor = '#ff0055';
  ctx.shadowBlur = 30;
  ctx.font = 'bold 64px "Courier New"';
  ctx.fillStyle = '#ff0055';
  ctx.fillText('ARKANOID', canvas.width / 2, titleY);

  ctx.shadowBlur = 0;
  ctx.font = '16px "Courier New"';
  ctx.fillStyle = '#ffaa00';
  ctx.fillText('~ RETRO EDITION ~', canvas.width / 2, titleY + 30);

  ctx.font = '14px "Courier New"';
  ctx.fillStyle = '#888';
  ctx.fillText(`HIGH SCORE: ${state.highScore}`, canvas.width / 2, titleY + 70);

  if (state.unlockedStages > 5) {
    ctx.fillStyle = '#00ff55';
    ctx.fillText(`STAGES UNLOCKED: ${state.unlockedStages}/10`, canvas.width / 2, titleY + 90);
  }

  const pulse = Math.sin(state.frameCount * 0.08) * 0.3 + 0.7;
  ctx.globalAlpha = pulse;
  ctx.font = 'bold 20px "Courier New"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('PRESS SPACE TO START', canvas.width / 2, titleY + 140);
  ctx.globalAlpha = 1;

  ctx.font = '12px "Courier New"';
  ctx.fillStyle = '#666';
  ctx.fillText('ARROW KEYS / A,D - MOVE', canvas.width / 2, titleY + 180);
  ctx.fillText('SPACE / CLICK - LAUNCH', canvas.width / 2, titleY + 200);
  ctx.fillText('P - PAUSE  |  M - MUTE', canvas.width / 2, titleY + 220);
}

function drawDifficultySelect() {
  ctx.textAlign = 'center';

  ctx.shadowColor = '#ffaa00';
  ctx.shadowBlur = 20;
  ctx.font = 'bold 36px "Courier New"';
  ctx.fillStyle = '#ffaa00';
  ctx.fillText('SELECT DIFFICULTY', canvas.width / 2, 150);
  ctx.shadowBlur = 0;

  const diffs = [DIFFICULTY.EASY, DIFFICULTY.NORMAL, DIFFICULTY.HARD];
  const yStart = 250;

  diffs.forEach((d, i) => {
    const config = DIFFICULTY_CONFIG[d];
    const y = yStart + i * 70;
    const selected = i === state.difficultyIndex;

    if (selected) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      roundRect(ctx, canvas.width / 2 - 150, y - 20, 300, 50, 8);
      ctx.fill();
      ctx.strokeStyle = config.color;
      ctx.lineWidth = 2;
      roundRect(ctx, canvas.width / 2 - 150, y - 20, 300, 50, 8);
      ctx.stroke();
    }

    ctx.font = selected ? 'bold 24px "Courier New"' : '20px "Courier New"';
    ctx.fillStyle = selected ? config.color : '#666';
    ctx.fillText(config.label, canvas.width / 2, y + 5);

    if (selected) {
      ctx.font = '12px "Courier New"';
      ctx.fillStyle = '#888';
      const desc = d === DIFFICULTY.EASY ? '5 lives, slower ball' : d === DIFFICULTY.NORMAL ? '3 lives, standard' : '1 life, faster ball';
      ctx.fillText(desc, canvas.width / 2, y + 25);
    }
  });

  const pulse = Math.sin(state.frameCount * 0.08) * 0.3 + 0.7;
  ctx.globalAlpha = pulse;
  ctx.font = '14px "Courier New"';
  ctx.fillStyle = '#fff';
  ctx.fillText('UP/DOWN TO SELECT, SPACE TO CONFIRM', canvas.width / 2, 500);
  ctx.globalAlpha = 1;
}

function drawStageSelect() {
  ctx.textAlign = 'center';

  ctx.shadowColor = '#00ccdd';
  ctx.shadowBlur = 20;
  ctx.font = 'bold 36px "Courier New"';
  ctx.fillStyle = '#00ccdd';
  ctx.fillText('SELECT STAGE', canvas.width / 2, 100);
  ctx.shadowBlur = 0;

  const cols = 5;
  const cellW = 100;
  const cellH = 80;
  const startX = (canvas.width - cols * cellW) / 2;
  const startY = 160;

  for (let i = 0; i < 10; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * cellW + cellW / 2;
    const y = startY + row * cellH + cellH / 2;
    const selected = i === state.stageSelectIndex;
    const unlocked = i < state.unlockedStages;
    const theme = STAGE_THEMES[i];

    if (selected) {
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 2;
      roundRect(ctx, x - cellW / 2 + 5, y - cellH / 2 + 5, cellW - 10, cellH - 10, 6);
      ctx.stroke();
      ctx.fillStyle = `${theme.accent}15`;
      roundRect(ctx, x - cellW / 2 + 5, y - cellH / 2 + 5, cellW - 10, cellH - 10, 6);
      ctx.fill();
    }

    ctx.font = selected ? 'bold 20px "Courier New"' : '16px "Courier New"';
    ctx.fillStyle = unlocked ? (selected ? theme.accent : '#fff') : '#444';
    ctx.fillText(unlocked ? `${i + 1}` : 'X', x, y - 5);

    ctx.font = '10px "Courier New"';
    ctx.fillStyle = unlocked ? '#888' : '#333';
    ctx.fillText(unlocked ? theme.name : 'LOCKED', x, y + 15);
  }

  const pulse = Math.sin(state.frameCount * 0.08) * 0.3 + 0.7;
  ctx.globalAlpha = pulse;
  ctx.font = '14px "Courier New"';
  ctx.fillStyle = '#fff';
  ctx.fillText('LEFT/RIGHT TO SELECT, SPACE TO START', canvas.width / 2, 500);
  ctx.globalAlpha = 1;
}

function drawStageIntro() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const theme = getTheme();

  ctx.textAlign = 'center';
  ctx.shadowColor = theme.accent;
  ctx.shadowBlur = 20;
  ctx.font = 'bold 48px "Courier New"';
  ctx.fillStyle = theme.accent;
  ctx.fillText(`STAGE ${state.stage}`, canvas.width / 2, canvas.height / 2 - 20);

  ctx.shadowBlur = 0;
  ctx.font = '14px "Courier New"';
  ctx.fillStyle = '#888';
  ctx.fillText(theme.name.toUpperCase(), canvas.width / 2, canvas.height / 2 + 10);

  ctx.font = '16px "Courier New"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('GET READY', canvas.width / 2, canvas.height / 2 + 40);
}

function drawPauseMenu() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = 'center';
  ctx.font = 'bold 36px "Courier New"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('PAUSED', canvas.width / 2, 200);

  const options = ['RESUME', 'RESTART', 'QUIT TO MENU'];
  const yStart = 280;

  options.forEach((opt, i) => {
    const y = yStart + i * 50;
    const selected = i === state.pauseMenuIndex;

    if (selected) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      roundRect(ctx, canvas.width / 2 - 120, y - 15, 240, 40, 6);
      ctx.fill();
      ctx.strokeStyle = '#ff0055';
      ctx.lineWidth = 1;
      roundRect(ctx, canvas.width / 2 - 120, y - 15, 240, 40, 6);
      ctx.stroke();
    }

    ctx.font = selected ? 'bold 18px "Courier New"' : '16px "Courier New"';
    ctx.fillStyle = selected ? '#ffffff' : '#666';
    ctx.fillText(opt, canvas.width / 2, y + 5);
  });

  ctx.font = '12px "Courier New"';
  ctx.fillStyle = '#555';
  ctx.fillText('UP/DOWN TO SELECT, SPACE TO CONFIRM, P TO RESUME', canvas.width / 2, 480);
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = 'center';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 25;
  ctx.font = 'bold 56px "Courier New"';
  ctx.fillStyle = '#ff0044';
  ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);

  ctx.shadowBlur = 0;
  ctx.font = '20px "Courier New"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`FINAL SCORE: ${state.displayScore}`, canvas.width / 2, canvas.height / 2 + 10);

  if (state.score >= state.highScore) {
    ctx.fillStyle = '#ffaa00';
    ctx.fillText('NEW HIGH SCORE!', canvas.width / 2, canvas.height / 2 + 40);
  }

  const pulse = Math.sin(state.frameCount * 0.08) * 0.3 + 0.7;
  ctx.globalAlpha = pulse;
  ctx.font = '16px "Courier New"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('PRESS SPACE FOR MENU', canvas.width / 2, canvas.height / 2 + 80);
  ctx.globalAlpha = 1;
}

function drawStageClear() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const theme = getTheme();

  ctx.textAlign = 'center';
  ctx.shadowColor = theme.accent;
  ctx.shadowBlur = 20;
  ctx.font = 'bold 48px "Courier New"';
  ctx.fillStyle = theme.accent;
  ctx.fillText(`STAGE ${state.stage} CLEAR!`, canvas.width / 2, canvas.height / 2 - 20);

  ctx.shadowBlur = 0;
  ctx.font = '18px "Courier New"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`SCORE: ${state.displayScore}`, canvas.width / 2, canvas.height / 2 + 20);
}

function drawAllClear() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const colors = ['#ff0055', '#ffaa00', '#00ff55', '#00ccdd', '#3366ff', '#aa00ff', '#ff4400', '#44ff88', '#ff8844', '#ffffff'];
  ctx.textAlign = 'center';

  const word = 'ARKANOID';
  for (let i = 0; i < word.length; i++) {
    ctx.shadowColor = colors[i % colors.length];
    ctx.shadowBlur = 20;
    ctx.font = 'bold 48px "Courier New"';
    ctx.fillStyle = colors[i % colors.length];
    const totalWidth = word.length * 42;
    const startX = canvas.width / 2 - totalWidth / 2 + 21;
    ctx.fillText(word[i], startX + i * 42, canvas.height / 2 - 60);
  }

  ctx.shadowBlur = 0;
  ctx.font = '24px "Courier New"';
  ctx.fillStyle = '#ffaa00';
  ctx.fillText('CONGRATULATIONS!', canvas.width / 2, canvas.height / 2);

  ctx.font = '18px "Courier New"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`FINAL SCORE: ${state.displayScore}`, canvas.width / 2, canvas.height / 2 + 40);

  const pulse = Math.sin(state.frameCount * 0.08) * 0.3 + 0.7;
  ctx.globalAlpha = pulse;
  ctx.font = '16px "Courier New"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('PRESS SPACE FOR MENU', canvas.width / 2, canvas.height / 2 + 90);
  ctx.globalAlpha = 1;
}

function roundRect(context, x, y, w, h, r) {
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + w - r, y);
  context.quadraticCurveTo(x + w, y, x + w, y + r);
  context.lineTo(x + w, y + h - r);
  context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  context.lineTo(x + r, y + h);
  context.quadraticCurveTo(x, y + h, x, y + h - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

export { draw };
