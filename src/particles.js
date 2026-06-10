const MAX_PARTICLES = 500;
const MAX_LASERS = 50;

const particlePool = [];
const laserPool = [];
const particles = [];
const lasers = [];

for (let i = 0; i < MAX_PARTICLES; i++) {
  particlePool.push({ x: 0, y: 0, dx: 0, dy: 0, life: 0, maxLife: 0, color: '', size: 0, active: false });
}
for (let i = 0; i < MAX_LASERS; i++) {
  laserPool.push({ x: 0, y: 0, dy: 0, active: false });
}

function getParticle() {
  for (let i = 0; i < particlePool.length; i++) {
    if (!particlePool[i].active) return particlePool[i];
  }
  return null;
}

function getLaser() {
  for (let i = 0; i < laserPool.length; i++) {
    if (!laserPool[i].active) return laserPool[i];
  }
  return null;
}

function spawnExplosion(x, y, color) {
  for (let i = 0; i < 8; i++) {
    const p = getParticle();
    if (!p) break;
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    p.x = x;
    p.y = y;
    p.dx = Math.cos(angle) * speed;
    p.dy = Math.sin(angle) * speed;
    p.life = 30 + Math.random() * 20;
    p.maxLife = 50;
    p.color = color;
    p.size = 2 + Math.random() * 3;
    p.active = true;
    if (!particles.includes(p)) particles.push(p);
  }
}

function spawnLaser(x, y, dy) {
  const l = getLaser();
  if (!l) return null;
  l.x = x;
  l.y = y;
  l.dy = dy;
  l.active = true;
  if (!lasers.includes(l)) lasers.push(l);
  return l;
}

function removeLaser(l) {
  l.active = false;
  const idx = lasers.indexOf(l);
  if (idx !== -1) lasers.splice(idx, 1);
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.dx;
    p.y += p.dy;
    p.life--;

    if (p.life <= 0) {
      p.active = false;
      particles.splice(i, 1);
    }
  }
}

export { particles, lasers, spawnExplosion, spawnLaser, removeLaser, updateParticles };
