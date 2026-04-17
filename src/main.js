const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 20;
const BALL_RADIUS = 8;
const BRICK_ROWS = 6;
const BRICK_COLS = 10;
const BRICK_WIDTH = 75;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 5;
const BRICK_OFFSET_TOP = 50;
const BRICK_OFFSET_LEFT = 12.5;

let score = 0;
let lives = 3;
let gameOver = false;
let gameWon = false;

const paddle = {
  x: (canvas.width - PADDLE_WIDTH) / 2,
  y: canvas.height - PADDLE_HEIGHT - 10,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
  dx: 0
};

const ball = {
  x: canvas.width / 2,
  y: canvas.height - PADDLE_HEIGHT - 20,
  dx: 4,
  dy: -4,
  radius: BALL_RADIUS
};

const bricks = [];
for (let c = 0; c < BRICK_COLS; c++) {
  bricks[c] = [];
  for (let r = 0; r < BRICK_ROWS; r++) {
    bricks[c][r] = { x: 0, y: 0, status: 1 };
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'd') paddle.dx = 7;
  if (e.key === 'ArrowLeft' || e.key === 'a') paddle.dx = -7;
});

document.addEventListener('keyup', (e) => {
  if ((e.key === 'ArrowRight' || e.key === 'd') && paddle.dx === 7) paddle.dx = 0;
  if ((e.key === 'ArrowLeft' || e.key === 'a') && paddle.dx === -7) paddle.dx = 0;
});

function collisionDetection() {
  for (let c = 0; c < BRICK_COLS; c++) {
    for (let r = 0; r < BRICK_ROWS; r++) {
      const b = bricks[c][r];
      if (b.status === 1) {
        if (ball.x > b.x && ball.x < b.x + BRICK_WIDTH && ball.y > b.y && ball.y < b.y + BRICK_HEIGHT) {
          ball.dy = -ball.dy;
          b.status = 0;
          score += 10;
          if (score === BRICK_ROWS * BRICK_COLS * 10) {
            gameWon = true;
          }
        }
      }
    }
  }
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.closePath();
}

function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height);
  ctx.fillStyle = '#0095DD';
  ctx.fill();
  ctx.closePath();
}

function drawBricks() {
  for (let c = 0; c < BRICK_COLS; c++) {
    for (let r = 0; r < BRICK_ROWS; r++) {
      if (bricks[c][r].status === 1) {
        const brickX = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
        const brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;
        ctx.beginPath();
        ctx.rect(brickX, brickY, BRICK_WIDTH, BRICK_HEIGHT);
        ctx.fillStyle = `hsl(${r * 40}, 70%, 50%)`;
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}

function drawScore() {
  ctx.font = '16px Arial';
  ctx.fillStyle = '#fff';
  ctx.fillText(`Score: ${score}`, 8, 20);
}

function drawLives() {
  ctx.font = '16px Arial';
  ctx.fillStyle = '#fff';
  ctx.fillText(`Lives: ${lives}`, canvas.width - 65, 20);
}

function update() {
  if (gameOver || gameWon) return;

  paddle.x += paddle.dx;
  if (paddle.x < 0) paddle.x = 0;
  if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;

  ball.x += ball.dx;
  ball.y += ball.dy;

  if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
    ball.dx = -ball.dx;
  }

  if (ball.y - ball.radius < 0) {
    ball.dy = -ball.dy;
  } else if (ball.y + ball.radius > paddle.y && 
             ball.x > paddle.x && 
             ball.x < paddle.x + paddle.width) {
    ball.dy = -ball.dy;
    // Add some angle based on where it hits the paddle
    const hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
    ball.dx = hitPos * 5;
  } else if (ball.y + ball.radius > canvas.height) {
    lives--;
    if (lives === 0) {
      gameOver = true;
    } else {
      ball.x = canvas.width / 2;
      ball.y = canvas.height - PADDLE_HEIGHT - 20;
      ball.dx = 4;
      ball.dy = -4;
    }
  }

  collisionDetection();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBall();
  drawPaddle();
  drawScore();
  drawLives();

  if (gameOver) {
    ctx.font = '48px Arial';
    ctx.fillStyle = 'red';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
  }

  if (gameWon) {
    ctx.font = '48px Arial';
    ctx.fillStyle = 'lime';
    ctx.textAlign = 'center';
    ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
