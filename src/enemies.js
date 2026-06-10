import { canvas } from './canvas.js';

const ENEMY_RADIUS = 16;
const ENEMY_SPEED = 1.5;

const enemies = [];

function createEnemy(x, y, type = 'dome') {
  return {
    x,
    y,
    dx: (Math.random() - 0.5) * ENEMY_SPEED * 2,
    dy: (Math.random() - 0.5) * ENEMY_SPEED,
    radius: ENEMY_RADIUS,
    type,
    hits: 1,
    maxHits: 1,
    phase: Math.random() * Math.PI * 2,
  };
}

function spawnEnemies(stageNum) {
  enemies.length = 0;

  if (stageNum % 7 === 0) return;

  const count = Math.min(2 + Math.floor(stageNum / 5), 6);

  for (let i = 0; i < count; i++) {
    const x = 100 + Math.random() * (canvas.width - 200);
    const y = 200 + Math.random() * 200;
    enemies.push(createEnemy(x, y));
  }
}

function updateEnemies(dt, state) {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];

    enemy.phase += 0.02 * dt;
    enemy.x += enemy.dx * dt;
    enemy.y += (Math.sin(enemy.phase) * 0.5) * dt;

    if (enemy.x - enemy.radius < 0) {
      enemy.x = enemy.radius;
      enemy.dx = Math.abs(enemy.dx);
    }
    if (enemy.x + enemy.radius > canvas.width) {
      enemy.x = canvas.width - enemy.radius;
      enemy.dx = -Math.abs(enemy.dx);
    }
    if (enemy.y - enemy.radius < 60) {
      enemy.y = 60 + enemy.radius;
      enemy.dy = Math.abs(enemy.dy);
    }
    if (enemy.y + enemy.radius > canvas.height - 100) {
      enemy.y = canvas.height - 100 - enemy.radius;
      enemy.dy = -Math.abs(enemy.dy);
    }

    if (enemy.hits <= 0) {
      enemies.splice(i, 1);
    }
  }
}

function checkEnemyCollision(ball) {
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    const dx = ball.x - enemy.x;
    const dy = ball.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < ball.radius + enemy.radius) {
      const angle = Math.atan2(dy, dx);
      ball.dx = Math.cos(angle) * ball.speed;
      ball.dy = Math.sin(angle) * ball.speed;

      enemy.hits--;
      return enemy;
    }
  }
  return null;
}

function checkLaserEnemyCollision(laser) {
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    if (laser.x > enemy.x - enemy.radius &&
        laser.x < enemy.x + enemy.radius &&
        laser.y > enemy.y - enemy.radius &&
        laser.y < enemy.y + enemy.radius) {
      enemy.hits--;
      return enemy;
    }
  }
  return null;
}

export { enemies, spawnEnemies, updateEnemies, checkEnemyCollision, checkLaserEnemyCollision, createEnemy };
