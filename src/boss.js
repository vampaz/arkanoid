import { canvas } from './canvas.js';

const BOSS_WIDTH = 120;
const BOSS_HEIGHT = 40;

const boss = {
  active: false,
  x: 0,
  y: 0,
  width: BOSS_WIDTH,
  height: BOSS_HEIGHT,
  hp: 0,
  maxHp: 0,
  dx: 2,
  phase: 0,
  attackTimer: 0,
  attackPattern: 0,
  projectiles: [],
  name: '',
};

const BOSS_CONFIGS = {
  7: { hp: 8, speed: 1.5, name: 'DOH', color: '#ff4444' },
  14: { hp: 12, speed: 2, name: 'DOH II', color: '#ff8800' },
  21: { hp: 16, speed: 2.5, name: 'DOH III', color: '#ffaa00' },
  28: { hp: 20, speed: 3, name: 'DOH IV', color: '#ff00ff' },
  33: { hp: 25, speed: 3.5, name: 'DOH V', color: '#ff0000' },
};

function isBossStage(stageNum) {
  return [7, 14, 21, 28, 33].includes(stageNum);
}

function initBoss(stageNum) {
  const config = BOSS_CONFIGS[stageNum];
  if (!config) {
    boss.active = false;
    return;
  }

  boss.active = true;
  boss.x = (canvas.width - BOSS_WIDTH) / 2;
  boss.y = 80;
  boss.hp = config.hp;
  boss.maxHp = config.hp;
  boss.dx = config.speed;
  boss.phase = 0;
  boss.attackTimer = 0;
  boss.attackPattern = 0;
  boss.projectiles = [];
  boss.name = config.name;
  boss.color = config.color;
}

function updateBoss(dt, state) {
  if (!boss.active) return;

  boss.phase += 0.03 * dt;
  boss.x += boss.dx * dt;

  if (boss.x < 50) {
    boss.x = 50;
    boss.dx = Math.abs(boss.dx);
  }
  if (boss.x + boss.width > canvas.width - 50) {
    boss.x = canvas.width - 50 - boss.width;
    boss.dx = -Math.abs(boss.dx);
  }

  boss.y = 80 + Math.sin(boss.phase) * 20;

  boss.attackTimer += dt;

  if (boss.attackTimer > 90) {
    boss.attackTimer = 0;
    bossAttack();
  }

  for (let i = boss.projectiles.length - 1; i >= 0; i--) {
    const proj = boss.projectiles[i];
    proj.x += proj.dx * dt;
    proj.y += proj.dy * dt;

    if (proj.y > canvas.height || proj.x < 0 || proj.x > canvas.width) {
      boss.projectiles.splice(i, 1);
      continue;
    }

    if (state.paddle &&
        proj.x > state.paddle.x &&
        proj.x < state.paddle.x + state.paddle.width &&
        proj.y > state.paddle.y - 5 &&
        proj.y < state.paddle.y + state.paddle.height) {
      boss.projectiles.splice(i, 1);
    }
  }
}

function bossAttack() {
  const pattern = boss.attackPattern % 3;
  boss.attackPattern++;

  const cx = boss.x + boss.width / 2;
  const cy = boss.y + boss.height;

  if (pattern === 0) {
    boss.projectiles.push({ x: cx, y: cy, dx: 0, dy: 3, radius: 6 });
  } else if (pattern === 1) {
    boss.projectiles.push({ x: cx - 20, y: cy, dx: -1, dy: 3, radius: 6 });
    boss.projectiles.push({ x: cx, y: cy, dx: 0, dy: 3, radius: 6 });
    boss.projectiles.push({ x: cx + 20, y: cy, dx: 1, dy: 3, radius: 6 });
  } else {
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI / 6) + (i * Math.PI / 12);
      boss.projectiles.push({
        x: cx,
        y: cy,
        dx: Math.cos(angle) * 2.5,
        dy: Math.sin(angle) * 2.5,
        radius: 5,
      });
    }
  }
}

function checkBossBallCollision(ball) {
  if (!boss.active) return false;

  if (ball.x + ball.radius > boss.x &&
      ball.x - ball.radius < boss.x + boss.width &&
      ball.y + ball.radius > boss.y &&
      ball.y - ball.radius < boss.y + boss.height) {

    const overlapLeft = (ball.x + ball.radius) - boss.x;
    const overlapRight = (boss.x + boss.width) - (ball.x - ball.radius);
    const overlapTop = (ball.y + ball.radius) - boss.y;
    const overlapBottom = (boss.y + boss.height) - (ball.y - ball.radius);

    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

    if (minOverlap === overlapTop || minOverlap === overlapBottom) {
      ball.dy = -ball.dy;
    } else {
      ball.dx = -ball.dx;
    }

    boss.hp--;
    return true;
  }

  for (let i = 0; i < boss.projectiles.length; i++) {
    const proj = boss.projectiles[i];
    const dx = ball.x - proj.x;
    const dy = ball.y - proj.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < ball.radius + proj.radius) {
      ball.dx = -ball.dx;
      ball.dy = -ball.dy;
      boss.projectiles.splice(i, 1);
      return false;
    }
  }

  return false;
}

function checkBossLaserCollision(laser) {
  if (!boss.active) return false;

  if (laser.x > boss.x &&
      laser.x < boss.x + boss.width &&
      laser.y > boss.y &&
      laser.y < boss.y + boss.height) {
    boss.hp--;
    return true;
  }
  return false;
}

function resetBoss() {
  boss.active = false;
  boss.projectiles = [];
}

export { boss, isBossStage, initBoss, updateBoss, checkBossBallCollision, checkBossLaserCollision, resetBoss };
