const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.static(path.join(__dirname, 'public')));

// ── Game State ──────────────────────────────────────────────
const players = {};   // { socketId: PlayerState }
const enemies = {};   // { id: EnemyState }
let enemyIdCounter = 0;

const WORLD_W = 2880;
const WORLD_H = 2880;
const MAX_ENEMIES = 12;
const ENEMY_SPEED = 1.4;
const ENEMY_HEALTH = 60;
const ENEMY_DAMAGE_RATE = 0.08; // hp per tick when touching player
const TICK_MS = 50; // 20 fps server tick

// ── Enemy Helpers ────────────────────────────────────────────
function spawnEnemy() {
  if (Object.keys(enemies).length >= MAX_ENEMIES) return;
  const id = ++enemyIdCounter;
  // Spawn away from centre so players aren't instantly overwhelmed
  const side = Math.floor(Math.random() * 4);
  let x, y;
  if (side === 0) { x = Math.random() * WORLD_W; y = Math.random() * 400; }
  else if (side === 1) { x = Math.random() * WORLD_W; y = WORLD_H - Math.random() * 400; }
  else if (side === 2) { x = Math.random() * 400; y = Math.random() * WORLD_H; }
  else { x = WORLD_W - Math.random() * 400; y = Math.random() * WORLD_H; }

  enemies[id] = { id, x, y, health: ENEMY_HEALTH, maxHealth: ENEMY_HEALTH };
}

// ── Server Game Loop ─────────────────────────────────────────
function gameLoop() {
  const playerList = Object.values(players);
  if (playerList.length === 0) return;

  for (const enemy of Object.values(enemies)) {
    // Chase nearest player
    let nearest = null;
    let minDist = Infinity;
    for (const p of playerList) {
      const dx = p.x - enemy.x;
      const dy = p.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) { minDist = dist; nearest = p; }
    }

    if (nearest && minDist > 28) {
      const dx = nearest.x - enemy.x;
      const dy = nearest.y - enemy.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      enemy.x += (dx / len) * ENEMY_SPEED;
      enemy.y += (dy / len) * ENEMY_SPEED;
    }

    // Damage player on contact
    if (nearest && minDist < 32) {
      nearest.health = Math.max(0, nearest.health - ENEMY_DAMAGE_RATE);
    }
  }

  io.emit('gameState', { players, enemies });
}

// Spawn initial enemies and keep spawning
setTimeout(() => { spawnEnemy(); spawnEnemy(); spawnEnemy(); }, 800);
setInterval(() => {
  if (Object.keys(players).length > 0) spawnEnemy();
}, 6000);

setInterval(gameLoop, TICK_MS);

// ── Socket Handlers ──────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('+ connected:', socket.id);

  socket.on('joinGame', ({ character, name }) => {
    players[socket.id] = {
      id: socket.id,
      name: (name || 'Hero').slice(0, 15),
      character: character === 'flash' ? 'flash' : 'super',
      x: 1390 + Math.random() * 40,
      y: 1390 + Math.random() * 40,
      facing: 'down',
      heroMode: false,
      health: 100,
      maxHealth: 100,
      score: 0,
    };
    socket.emit('joined', { playerId: socket.id });
    console.log(`  ${players[socket.id].name} joined as ${character}`);
  });

  socket.on('playerUpdate', (data) => {
    const p = players[socket.id];
    if (!p) return;
    p.x = data.x;
    p.y = data.y;
    p.facing = data.facing;
    p.heroMode = data.heroMode;
  });

  socket.on('attackEnemy', ({ enemyId }) => {
    const p = players[socket.id];
    if (!p || !enemies[enemyId]) return;
    const dmg = p.heroMode ? 25 : 5;
    enemies[enemyId].health -= dmg;
    if (enemies[enemyId].health <= 0) {
      delete enemies[enemyId];
      p.score += 100;
      io.emit('enemyDefeated', { enemyId, scorerId: socket.id, score: p.score });
    }
  });

  socket.on('disconnect', () => {
    console.log('- disconnected:', socket.id);
    delete players[socket.id];
  });
});

// ── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`\n🦸 Super Chilalas running at http://localhost:${PORT}`);
  console.log('   Share your local IP for friends to join the same network\n');
});
