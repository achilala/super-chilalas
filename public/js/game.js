// ── Game State ────────────────────────────────────────────────
let canvas, ctx;
let offscreen, octx;           // low-res pixel canvas
const GAME_W = 560;
const GAME_H = 315;

let localPlayer = null;
let remotePlayers = {};
let serverEnemies = {};
let enemyAnimFrame = 0;

const keys = {};
let lastTime = 0;
let gameStarted = false;

const camera = { x: 0, y: 0 };

// ── Initialise ────────────────────────────────────────────────
window.addEventListener('load', () => {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Offscreen low-res canvas (this is what gets scaled up, creating the pixel look)
  offscreen = document.createElement('canvas');
  offscreen.width = GAME_W;
  offscreen.height = GAME_H;
  octx = offscreen.getContext('2d');
  octx.imageSmoothingEnabled = false;

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') { e.preventDefault(); onSpace(); }
    if (e.key === 'Shift') { e.preventDefault(); onShift(); }
  });
  window.addEventListener('keyup', (e) => { keys[e.key] = false; });

  Network.onJoined = (playerId) => { console.log('Joined:', playerId); };
  Network.onGameState = (state) => {
    if (!localPlayer) return;
    const serverSelf = state.players[localPlayer.id];
    if (serverSelf) {
      localPlayer.health = serverSelf.health;
      localPlayer.score = serverSelf.score;
    }
    remotePlayers = {};
    for (const [id, p] of Object.entries(state.players)) {
      if (id !== localPlayer.id) remotePlayers[id] = p;
    }
    serverEnemies = state.enemies;
  };
  Network.onEnemyDefeated = ({ enemyId, scorerId }) => {
    delete serverEnemies[enemyId];
    if (localPlayer && scorerId === localPlayer.id) UI.showMessage('Enemy defeated! +100');
  };

  Network.connect();
  UI.init();
});

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.imageSmoothingEnabled = false;
}

// ── Character Select ──────────────────────────────────────────
function selectHero(character) { UI.selectCharacter(character); }

function startGame() {
  const character = UI.selectedChar;
  if (!character) return;
  const name = document.getElementById('playerName').value.trim()
    || (character === 'flash' ? 'Flash Boy' : 'Super Boy');

  document.getElementById('selectScreen').style.display = 'none';
  document.getElementById('hud').style.display = 'flex';
  canvas.style.display = 'block';

  localPlayer = new Player('local', character, name);
  Network.joinGame(character, name);
  Network.onJoined = (playerId) => { localPlayer.id = playerId; };

  gameStarted = true;
  UI.showMessage(`Welcome ${name}! SPACE = transform`, 3000);
  requestAnimationFrame(loop);
}

// ── Input ─────────────────────────────────────────────────────
function onSpace() {
  if (!localPlayer) return;
  localPlayer.transform();
  const msg = localPlayer.heroMode
    ? (localPlayer.character === 'flash' ? '⚡ Flash Boy!' : '🦸 Super Boy!')
    : 'Back to normal...';
  UI.showMessage(msg, 1500);
}

function onShift() {
  if (!localPlayer) return;
  if (!localPlayer.heroMode) { UI.showMessage('Transform first! SPACE', 1200); return; }
  localPlayer.tryAttack(serverEnemies, Network.socket);
}

// ── Game Loop ─────────────────────────────────────────────────
function loop(ts) {
  if (!gameStarted) return;
  const dt = ts - lastTime;
  lastTime = ts;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

let networkTimer = 0;
function update(dt) {
  if (!localPlayer) return;

  localPlayer.update(keys, dt);

  // Camera smoothly follows player; target = player at centre of low-res canvas
  const targetX = localPlayer.x - GAME_W / 2;
  const targetY = localPlayer.y - GAME_H / 2;
  camera.x += (targetX - camera.x) * 0.14;
  camera.y += (targetY - camera.y) * 0.14;
  camera.x = Math.max(0, Math.min(WORLD_W - GAME_W, camera.x));
  camera.y = Math.max(0, Math.min(WORLD_H - GAME_H, camera.y));

  networkTimer += dt;
  if (networkTimer > 50) { networkTimer = 0; Network.sendPlayerUpdate(localPlayer); }

  enemyAnimFrame++;

  UI.updateHUD(localPlayer, Object.keys(remotePlayers).length + 1);
}

function render() {
  // ── Draw everything to the tiny offscreen canvas ─────────────
  octx.clearRect(0, 0, GAME_W, GAME_H);

  drawWorld(octx, camera.x, camera.y, GAME_W, GAME_H);

  for (const enemy of Object.values(serverEnemies)) {
    drawEnemy(octx, enemy, camera.x, camera.y, enemyAnimFrame);
  }

  for (const p of Object.values(remotePlayers)) {
    drawRemotePlayer(octx, p, camera.x, camera.y);
  }

  if (localPlayer) {
    // Flash dash trail
    if (localPlayer.dashEffect) {
      const d = localPlayer.dashEffect;
      const alpha = d.life / 300;
      octx.fillStyle = `rgba(255,220,0,${alpha * 0.5})`;
      const steps = 5;
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        octx.fillRect(
          d.x + d.dx * t * 0.8 - camera.x - 3,
          d.y + d.dy * t * 0.8 - camera.y - 3,
          6, 6
        );
      }
    }

    drawPlayer(octx, localPlayer, true, camera.x, camera.y);
    drawAttackEffect(octx, localPlayer.attackEffect, camera.x, camera.y);
  }

  // Minimap (drawn on the offscreen too)
  UI.drawMinimap(octx, GAME_W, GAME_H, localPlayer, remotePlayers, serverEnemies);

  // Controls hint (tiny pixel font)
  octx.fillStyle = 'rgba(0,0,0,0.5)';
  octx.fillRect(2, 2, 148, 22);
  octx.fillStyle = '#bbb';
  octx.font = '5px monospace';
  octx.textAlign = 'left';
  octx.fillText('WASD=Move  SPACE=Transform  SHIFT=Power', 5, 10);

  // ── Scale the small canvas up to the full screen ─────────────
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(offscreen, 0, 0, canvas.width, canvas.height);
}

function drawRemotePlayer(ctx, p, camX, camY) {
  const proxy = {
    id: p.id, character: p.character, name: p.name,
    x: p.x, y: p.y, facing: p.facing || 'down',
    heroMode: p.heroMode || false,
    health: p.health, maxHealth: p.maxHealth, score: p.score,
    animFrame: enemyAnimFrame % 4, transformEffect: 0,
  };
  drawPlayer(ctx, proxy, false, camX, camY);
}
