// ── Player Class ─────────────────────────────────────────────
class Player {
  constructor(id, character, name) {
    this.id = id; this.character = character; this.name = name;
    this.x = 1410; this.y = 1410;
    this.facing = 'down'; this.heroMode = false;
    this.health = 100; this.maxHealth = 100; this.score = 0;
    this.attackCooldown = 0; this.attackEffect = null;
    this.transformEffect = 0; this.animFrame = 0; this.animTimer = 0;
    this.dashEffect = null;
  }
  get baseSpeed() { return this.heroMode ? (this.character === 'flash' ? 5 : 4.5) : 3; }
  update(keys, dt) {
    this.animTimer += dt;
    if (this.animTimer > 160) { this.animTimer = 0; this.animFrame = (this.animFrame + 1) % 4; }
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.transformEffect > 0) this.transformEffect -= dt;
    if (this.attackEffect) {
      this.attackEffect.life -= dt; this.attackEffect.radius += 1;
      if (this.attackEffect.life <= 0) this.attackEffect = null;
    }
    if (this.dashEffect) { this.dashEffect.life -= dt; if (this.dashEffect.life <= 0) this.dashEffect = null; }
    let dx = 0, dy = 0;
    if (keys['ArrowLeft']  || keys['a'] || keys['A']) dx -= 1;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) dx += 1;
    if (keys['ArrowUp']    || keys['w'] || keys['W']) dy -= 1;
    if (keys['ArrowDown']  || keys['s'] || keys['S']) dy += 1;
    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx*dx+dy*dy); dx/=len; dy/=len;
      if (Math.abs(dx) > Math.abs(dy)) this.facing = dx > 0 ? 'right' : 'left';
      else this.facing = dy > 0 ? 'down' : 'up';
    }
    const spd = this.baseSpeed, R = 10;
    const nx = this.x + dx*spd, ny = this.y + dy*spd;
    if (!collidesWithBuilding(nx, this.y, R)) this.x = Math.max(R, Math.min(WORLD_W-R, nx));
    if (!collidesWithBuilding(this.x, ny, R)) this.y = Math.max(R, Math.min(WORLD_H-R, ny));
    if (!this.heroMode && this.health < this.maxHealth) this.health = Math.min(this.maxHealth, this.health + 0.03);
  }
  transform() { this.heroMode = !this.heroMode; this.transformEffect = 600; }
  tryAttack(serverEnemies, socket) {
    if (this.attackCooldown > 0 || !this.heroMode) return;
    this.attackCooldown = this.character === 'flash' ? 600 : 900;
    let aox = 0, aoy = 0;
    if (this.facing === 'right') aox = 40; else if (this.facing === 'left') aox = -40;
    else if (this.facing === 'down') aoy = 40; else aoy = -40;
    if (this.character === 'flash') this.dashEffect = { x: this.x, y: this.y, dx: aox, dy: aoy, life: 300 };
    this.attackEffect = { x: this.x+aox, y: this.y+aoy, radius: 8, life: 300, maxLife: 300, character: this.character };
    const range = this.character === 'flash' ? 85 : 70;
    for (const [id, e] of Object.entries(serverEnemies)) {
      const dx = e.x-(this.x+aox), dy = e.y-(this.y+aoy);
      if (Math.sqrt(dx*dx+dy*dy) < range) socket.emit('attackEnemy', { enemyId: parseInt(id) });
    }
  }
}

// ── Draw Player Wrapper ───────────────────────────────────────
function drawPlayer(ctx, p, isLocal, camX, camY) {
  const sx = Math.round(p.x - camX), sy = Math.round(p.y - camY);
  ctx.fillStyle = isLocal ? '#FFD700' : '#fff';
  ctx.font = '5px monospace'; ctx.textAlign = 'center';
  ctx.fillText(p.name || 'Hero', sx, sy - 38);
  const barW = 28, hp = Math.max(0,(p.health/p.maxHealth)*barW);
  ctx.fillStyle = '#111'; ctx.fillRect(sx-barW/2, sy-36, barW, 3);
  ctx.fillStyle = p.health>60 ? '#4CAF50' : p.health>30 ? '#FF9800' : '#f44336';
  if (hp>0) ctx.fillRect(sx-barW/2, sy-36, hp, 3);
  if (p.character === 'flash') drawFlashBoy(ctx, sx, sy, p.heroMode, p.animFrame||0, p.transformEffect||0);
  else drawSuperBoy(ctx, sx, sy, p.heroMode, p.animFrame||0, p.transformEffect||0);
}

// ── Flash Boy ─────────────────────────────────────────────────
// Muscular V-taper build: wide shoulders → narrow waist, thick arms & legs
function drawFlashBoy(ctx, cx, cy, heroMode, frame, transformTimer) {
  const w = frame % 2;
  // Bigger leg/arm swing for a powerful look
  const lL = w ? 3 : 0, rL = w ? 0 : 3;
  const lA = w ? 2 : -2, rA = w ? -2 : 2;

  if (transformTimer > 0) {
    const a = transformTimer/600, s = Math.round((1-a)*22);
    ctx.strokeStyle = `rgba(255,220,0,${a})`; ctx.lineWidth = 1;
    ctx.strokeRect(cx-17-s, cy-32-s, 34+s*2, 66+s*2);
  }

  if (heroMode) {
    // ── CAPE ──────────────────────────────────────────────────
    ctx.fillStyle = '#1a237e';
    ctx.fillRect(cx-10, cy-6, 2, 24); ctx.fillRect(cx+8, cy-6, 2, 24);
    ctx.fillRect(cx-8, cy+17, 16, 10); // tail
    ctx.fillStyle = '#283593';
    ctx.fillRect(cx-9, cy-6, 1, 24); ctx.fillRect(cx+9, cy-6, 1, 24);
    ctx.fillStyle = '#3949AB'; ctx.fillRect(cx-7, cy-6, 14, 4);

    // ── HELMET WINGS ──────────────────────────────────────────
    ctx.fillStyle = '#000';
    ctx.fillRect(cx-18, cy-25, 9, 10); // left outline
    ctx.fillStyle = '#FFD700'; ctx.fillRect(cx-17, cy-24, 8, 9);
    ctx.fillStyle = '#FFC107'; ctx.fillRect(cx-17, cy-24, 3, 9);
    ctx.fillStyle = '#FFEE58'; ctx.fillRect(cx-12, cy-24, 2, 6);
    ctx.fillStyle = '#000';
    ctx.fillRect(cx+9, cy-25, 9, 10); // right outline
    ctx.fillStyle = '#FFD700'; ctx.fillRect(cx+10, cy-24, 8, 9);
    ctx.fillStyle = '#FFC107'; ctx.fillRect(cx+15, cy-24, 3, 9);
    ctx.fillStyle = '#FFEE58'; ctx.fillRect(cx+10, cy-24, 2, 6);

    // ── HELMET (big, wide) ────────────────────────────────────
    ctx.fillStyle = '#000'; ctx.fillRect(cx-9, cy-32, 18, 18);
    ctx.fillStyle = '#FFD700'; ctx.fillRect(cx-8, cy-31, 16, 16);
    ctx.fillStyle = '#FFC107'; ctx.fillRect(cx-8, cy-31, 4, 16); // shadow L
    ctx.fillStyle = '#FFE082'; ctx.fillRect(cx+3, cy-31, 4, 16); // highlight R

    // ── FACE ──────────────────────────────────────────────────
    ctx.fillStyle = '#000'; ctx.fillRect(cx-5, cy-18, 10, 10);
    ctx.fillStyle = '#8D5524'; ctx.fillRect(cx-4, cy-17, 8, 8);
    ctx.fillStyle = '#A0652A'; ctx.fillRect(cx-4, cy-17, 2, 5);
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx-3, cy-16, 3, 2); ctx.fillRect(cx+1, cy-16, 3, 2);
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(cx-2, cy-16, 2, 2); ctx.fillRect(cx+2, cy-16, 2, 2);
    ctx.fillStyle = '#000';
    ctx.fillRect(cx-2, cy-16, 1, 1); ctx.fillRect(cx+3, cy-16, 1, 1);
    ctx.fillStyle = '#7a4520';
    ctx.fillRect(cx, cy-13, 1, 1); ctx.fillRect(cx-2, cy-11, 4, 1);

    // ── NECK ──────────────────────────────────────────────────
    ctx.fillStyle = '#000'; ctx.fillRect(cx-3, cy-9, 6, 5);
    ctx.fillStyle = '#8D5524'; ctx.fillRect(cx-2, cy-8, 4, 4);

    // ── LEFT SHOULDER CAP (deltoid) ───────────────────────────
    ctx.fillStyle = '#000'; ctx.fillRect(cx-15, cy-6, 7, 9);
    ctx.fillStyle = '#1976D2'; ctx.fillRect(cx-14, cy-5, 6, 8);
    ctx.fillStyle = '#1E88E5'; ctx.fillRect(cx-11, cy-5, 2, 8); // highlight

    // ── LEFT ARM (thick) ──────────────────────────────────────
    ctx.fillStyle = '#000'; ctx.fillRect(cx-14, cy+2, 7, 13);
    ctx.fillStyle = '#1565C0'; ctx.fillRect(cx-13, cy+3, 6, 11);
    ctx.fillStyle = '#0D47A1'; ctx.fillRect(cx-13, cy+3, 1, 11);
    ctx.fillStyle = '#1976D2'; ctx.fillRect(cx-9,  cy+3, 1, 11);

    // Left glove
    ctx.fillStyle = '#000'; ctx.fillRect(cx-15, cy+14+lA, 8, 9);
    ctx.fillStyle = '#FFD700'; ctx.fillRect(cx-14, cy+15+lA, 7, 8);
    ctx.fillStyle = '#FFC107'; ctx.fillRect(cx-14, cy+15+lA, 2, 8);
    ctx.fillStyle = '#FFE082'; ctx.fillRect(cx-9,  cy+15+lA, 2, 8);

    // ── RIGHT SHOULDER CAP ────────────────────────────────────
    ctx.fillStyle = '#000'; ctx.fillRect(cx+8, cy-6, 7, 9);
    ctx.fillStyle = '#1976D2'; ctx.fillRect(cx+9, cy-5, 6, 8);
    ctx.fillStyle = '#1E88E5'; ctx.fillRect(cx+9, cy-5, 2, 8);

    // ── RIGHT ARM (thick) ─────────────────────────────────────
    ctx.fillStyle = '#000'; ctx.fillRect(cx+7, cy+2, 7, 13);
    ctx.fillStyle = '#1565C0'; ctx.fillRect(cx+8,  cy+3, 6, 11);
    ctx.fillStyle = '#0D47A1'; ctx.fillRect(cx+13, cy+3, 1, 11);
    ctx.fillStyle = '#1976D2'; ctx.fillRect(cx+8,  cy+3, 1, 11);

    // Right glove
    ctx.fillStyle = '#000'; ctx.fillRect(cx+7,  cy+14+rA, 8, 9);
    ctx.fillStyle = '#FFD700'; ctx.fillRect(cx+8,  cy+15+rA, 7, 8);
    ctx.fillStyle = '#FFC107'; ctx.fillRect(cx+13, cy+15+rA, 2, 8);
    ctx.fillStyle = '#FFE082'; ctx.fillRect(cx+8,  cy+15+rA, 2, 8);

    // ── BODY — V-TAPER (wide shoulders → narrow waist) ────────
    ctx.fillStyle = '#000'; ctx.fillRect(cx-9, cy-6, 18, 22);
    // Shoulder row (widest)
    ctx.fillStyle = '#1565C0'; ctx.fillRect(cx-8, cy-5, 16, 4);
    ctx.fillStyle = '#0D47A1'; ctx.fillRect(cx-8, cy-5, 2, 4);
    ctx.fillStyle = '#1976D2'; ctx.fillRect(cx+4, cy-5, 4, 4);
    // Upper chest
    ctx.fillStyle = '#1565C0'; ctx.fillRect(cx-7, cy-1, 14, 4);
    ctx.fillStyle = '#0D47A1'; ctx.fillRect(cx-7, cy-1, 2, 4);
    ctx.fillStyle = '#1976D2'; ctx.fillRect(cx+3, cy-1, 4, 4);
    // Mid chest
    ctx.fillStyle = '#1565C0'; ctx.fillRect(cx-6, cy+3, 12, 4);
    ctx.fillStyle = '#0D47A1'; ctx.fillRect(cx-6, cy+3, 2, 4);
    ctx.fillStyle = '#1976D2'; ctx.fillRect(cx+2, cy+3, 4, 4);
    // Abs
    ctx.fillStyle = '#1565C0'; ctx.fillRect(cx-5, cy+7, 10, 4);
    ctx.fillStyle = '#0D47A1'; ctx.fillRect(cx-5, cy+7, 2, 4);
    ctx.fillStyle = '#1976D2'; ctx.fillRect(cx+1, cy+7, 3, 4);
    // Lower abs
    ctx.fillStyle = '#1565C0'; ctx.fillRect(cx-5, cy+11, 10, 4);
    ctx.fillStyle = '#0D47A1'; ctx.fillRect(cx-5, cy+11, 2, 4);

    // Lightning bolt (large, prominent)
    ctx.fillStyle = '#000'; ctx.fillRect(cx-2, cy-4, 7, 14);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(cx+2, cy-3, 3, 6);   // top piece
    ctx.fillRect(cx-1, cy+2, 5, 2);   // horizontal bar
    ctx.fillRect(cx-1, cy+4, 3, 7);   // bottom piece
    ctx.fillStyle = '#FFEE58'; ctx.fillRect(cx+3, cy-3, 1, 6);

    // Belt
    ctx.fillStyle = '#000'; ctx.fillRect(cx-6, cy+14, 12, 4);
    ctx.fillStyle = '#FFD700'; ctx.fillRect(cx-5, cy+15, 10, 3);
    ctx.fillStyle = '#FFC107'; ctx.fillRect(cx-5, cy+15, 3, 3);
    ctx.fillStyle = '#fff'; ctx.fillRect(cx-1, cy+15, 2, 3);

    // ── LEFT LEG (thick) ──────────────────────────────────────
    ctx.fillStyle = '#000'; ctx.fillRect(cx-9, cy+17, 9, 14+lL);
    ctx.fillStyle = '#0D47A1'; ctx.fillRect(cx-8, cy+18, 8, 12+lL);
    ctx.fillStyle = '#1565C0'; ctx.fillRect(cx-5, cy+18, 3, 12+lL);
    ctx.fillStyle = '#1a237e'; ctx.fillRect(cx-8, cy+18, 1, 12+lL);
    // Boot
    ctx.fillStyle = '#000'; ctx.fillRect(cx-10, cy+29+lL, 10, 6);
    ctx.fillStyle = '#FFD700'; ctx.fillRect(cx-9, cy+30+lL, 9, 5);
    ctx.fillStyle = '#FFC107'; ctx.fillRect(cx-9, cy+30+lL, 3, 5);
    ctx.fillStyle = '#FFE082'; ctx.fillRect(cx-4, cy+30+lL, 2, 5);

    // ── RIGHT LEG (thick) ─────────────────────────────────────
    ctx.fillStyle = '#000'; ctx.fillRect(cx, cy+17, 9, 14+rL);
    ctx.fillStyle = '#0D47A1'; ctx.fillRect(cx+1, cy+18, 8, 12+rL);
    ctx.fillStyle = '#1565C0'; ctx.fillRect(cx+2, cy+18, 3, 12+rL);
    ctx.fillStyle = '#1a237e'; ctx.fillRect(cx+8, cy+18, 1, 12+rL);
    // Boot
    ctx.fillStyle = '#000'; ctx.fillRect(cx, cy+29+rL, 10, 6);
    ctx.fillStyle = '#FFD700'; ctx.fillRect(cx+1, cy+30+rL, 9, 5);
    ctx.fillStyle = '#FFC107'; ctx.fillRect(cx+6, cy+30+rL, 3, 5);
    ctx.fillStyle = '#FFE082'; ctx.fillRect(cx+1, cy+30+rL, 2, 5);

  } else {
    // ── NORMAL MODE — blue hoodie, still athletic build ────────
    ctx.fillStyle = '#000'; ctx.fillRect(cx-8, cy-29, 16, 18);
    ctx.fillStyle = '#8D5524'; ctx.fillRect(cx-7, cy-28, 14, 16);
    ctx.fillStyle = '#A0652A'; ctx.fillRect(cx-7, cy-28, 3, 8);
    ctx.fillStyle = '#111';
    ctx.fillRect(cx-7, cy-28, 14, 6); ctx.fillRect(cx-8, cy-28, 2, 11); ctx.fillRect(cx+5, cy-28, 3, 7);
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx-4, cy-21, 3, 2); ctx.fillRect(cx+1, cy-21, 3, 2);
    ctx.fillStyle = '#111';
    ctx.fillRect(cx-3, cy-21, 2, 2); ctx.fillRect(cx+2, cy-21, 2, 2);
    ctx.fillStyle = '#7a4520';
    ctx.fillRect(cx, cy-18, 1, 1); ctx.fillRect(cx-2, cy-16, 4, 1);
    ctx.fillRect(cx-3, cy-17, 1, 1); ctx.fillRect(cx+2, cy-17, 1, 1);
    // Neck
    ctx.fillStyle = '#000'; ctx.fillRect(cx-3, cy-11, 6, 5);
    ctx.fillStyle = '#8D5524'; ctx.fillRect(cx-2, cy-10, 4, 4);
    // Body
    ctx.fillStyle = '#000'; ctx.fillRect(cx-9, cy-6, 18, 20);
    ctx.fillStyle = '#1565C0'; ctx.fillRect(cx-8, cy-5, 16, 4);
    ctx.fillStyle = '#1565C0'; ctx.fillRect(cx-7, cy-1, 14, 4);
    ctx.fillStyle = '#1565C0'; ctx.fillRect(cx-6, cy+3, 12, 4);
    ctx.fillStyle = '#1565C0'; ctx.fillRect(cx-5, cy+7, 10, 7);
    ctx.fillStyle = '#0D47A1';
    ctx.fillRect(cx-8, cy-5, 2, 16); ctx.fillRect(cx-7, cy-1, 1, 12); ctx.fillRect(cx-6, cy+3, 1, 9);
    ctx.fillStyle = '#1976D2';
    ctx.fillRect(cx+4, cy-5, 4, 16); ctx.fillRect(cx+3, cy-1, 1, 12);
    ctx.fillStyle = '#0D47A1'; ctx.fillRect(cx-4, cy+6, 8, 5); // pocket
    ctx.fillStyle = '#1565C0'; ctx.fillRect(cx-3, cy+7, 6, 4);
    // Left arm
    ctx.fillStyle = '#000'; ctx.fillRect(cx-14, cy-5, 6, 20);
    ctx.fillStyle = '#1565C0'; ctx.fillRect(cx-13, cy-4, 5, 11);
    ctx.fillStyle = '#0D47A1'; ctx.fillRect(cx-13, cy-4, 1, 11);
    ctx.fillStyle = '#000'; ctx.fillRect(cx-14, cy+6+lA, 6, 6);
    ctx.fillStyle = '#8D5524'; ctx.fillRect(cx-13, cy+7+lA, 5, 5);
    // Right arm
    ctx.fillStyle = '#000'; ctx.fillRect(cx+8, cy-5, 6, 20);
    ctx.fillStyle = '#1565C0'; ctx.fillRect(cx+9, cy-4, 5, 11);
    ctx.fillStyle = '#0D47A1'; ctx.fillRect(cx+13, cy-4, 1, 11);
    ctx.fillStyle = '#000'; ctx.fillRect(cx+8, cy+6+rA, 6, 6);
    ctx.fillStyle = '#8D5524'; ctx.fillRect(cx+9, cy+7+rA, 5, 5);
    // Legs
    ctx.fillStyle = '#000'; ctx.fillRect(cx-9, cy+13, 9, 17+lL);
    ctx.fillStyle = '#1A237E'; ctx.fillRect(cx-8, cy+14, 8, 15+lL);
    ctx.fillStyle = '#283593'; ctx.fillRect(cx-5, cy+14, 3, 15+lL);
    ctx.fillStyle = '#000'; ctx.fillRect(cx, cy+13, 9, 17+rL);
    ctx.fillStyle = '#1A237E'; ctx.fillRect(cx+1, cy+14, 8, 15+rL);
    ctx.fillStyle = '#283593'; ctx.fillRect(cx+2, cy+14, 3, 15+rL);
    // Sneakers
    ctx.fillStyle = '#000'; ctx.fillRect(cx-10, cy+28+lL, 10, 4);
    ctx.fillStyle = '#fff'; ctx.fillRect(cx-9, cy+29+lL, 9, 3);
    ctx.fillStyle = '#42A5F5'; ctx.fillRect(cx-9, cy+29+lL, 9, 1);
    ctx.fillStyle = '#000'; ctx.fillRect(cx, cy+28+rL, 10, 4);
    ctx.fillStyle = '#fff'; ctx.fillRect(cx+1, cy+29+rL, 9, 3);
    ctx.fillStyle = '#42A5F5'; ctx.fillRect(cx+1, cy+29+rL, 9, 1);
  }
}

// ── Super Boy ─────────────────────────────────────────────────
function drawSuperBoy(ctx, cx, cy, heroMode, frame, transformTimer) {
  const w = frame % 2;
  const lL = w ? 3 : 0, rL = w ? 0 : 3;
  const lA = w ? 2 : -2, rA = w ? -2 : 2;

  if (transformTimer > 0) {
    const a = transformTimer/600, s = Math.round((1-a)*22);
    ctx.strokeStyle = `rgba(200,0,0,${a})`; ctx.lineWidth = 1;
    ctx.strokeRect(cx-17-s, cy-33-s, 34+s*2, 68+s*2);
  }

  if (heroMode) {
    // ── RED CAPE (wide, behind) ────────────────────────────────
    ctx.fillStyle = '#7B0000';
    ctx.fillRect(cx-11, cy-6, 3, 26); ctx.fillRect(cx+8, cy-6, 3, 26);
    ctx.fillStyle = '#c62828';
    ctx.fillRect(cx-10, cy-6, 2, 26); ctx.fillRect(cx+9, cy-6, 2, 26);
    ctx.fillRect(cx-8, cy+19, 16, 10);
    ctx.fillStyle = '#b71c1c'; ctx.fillRect(cx-7, cy+19, 14, 9);
    ctx.fillStyle = '#e53935'; ctx.fillRect(cx-5, cy-6, 10, 4);

    // ── HEAD (large, round, thick hair) ───────────────────────
    ctx.fillStyle = '#000'; ctx.fillRect(cx-9, cy-33, 18, 22);
    ctx.fillStyle = '#8D5524'; ctx.fillRect(cx-8, cy-32, 16, 20);
    ctx.fillStyle = '#A0652A'; ctx.fillRect(cx-8, cy-32, 4, 11);
    // Dense black hair
    ctx.fillStyle = '#111';
    ctx.fillRect(cx-8, cy-32, 16, 8); // top
    ctx.fillRect(cx-9, cy-32, 2, 15); // left side
    ctx.fillRect(cx+6, cy-32, 3, 10); // right side
    // Superman curl
    ctx.fillStyle = '#222';
    ctx.fillRect(cx+2, cy-33, 5, 4);
    ctx.fillRect(cx+5, cy-31, 3, 3);
    // Eyes (bright blue)
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx-5, cy-23, 4, 3); ctx.fillRect(cx+1, cy-23, 4, 3);
    ctx.fillStyle = '#1565C0';
    ctx.fillRect(cx-4, cy-23, 3, 2); ctx.fillRect(cx+2, cy-23, 3, 2);
    ctx.fillStyle = '#000';
    ctx.fillRect(cx-4, cy-23, 1, 1); ctx.fillRect(cx+4, cy-23, 1, 1);
    ctx.fillStyle = '#7a4520';
    ctx.fillRect(cx, cy-19, 1, 1); ctx.fillRect(cx-2, cy-17, 4, 1);
    ctx.fillRect(cx-3, cy-18, 1, 1); ctx.fillRect(cx+2, cy-18, 1, 1);

    // ── NECK ──────────────────────────────────────────────────
    ctx.fillStyle = '#000'; ctx.fillRect(cx-3, cy-11, 6, 5);
    ctx.fillStyle = '#8D5524'; ctx.fillRect(cx-2, cy-10, 4, 4);

    // ── LEFT SHOULDER CAP ─────────────────────────────────────
    ctx.fillStyle = '#000'; ctx.fillRect(cx-15, cy-6, 7, 9);
    ctx.fillStyle = '#1976D2'; ctx.fillRect(cx-14, cy-5, 6, 8);
    ctx.fillStyle = '#1E88E5'; ctx.fillRect(cx-11, cy-5, 2, 8);

    // ── LEFT ARM (blue, thick) ────────────────────────────────
    ctx.fillStyle = '#000'; ctx.fillRect(cx-14, cy+2, 7, 13);
    ctx.fillStyle = '#1565C0'; ctx.fillRect(cx-13, cy+3, 6, 11);
    ctx.fillStyle = '#0D47A1'; ctx.fillRect(cx-13, cy+3, 1, 11);
    ctx.fillStyle = '#1976D2'; ctx.fillRect(cx-9,  cy+3, 1, 11);
    // Red glove
    ctx.fillStyle = '#000'; ctx.fillRect(cx-15, cy+14+lA, 8, 9);
    ctx.fillStyle = '#b71c1c'; ctx.fillRect(cx-14, cy+15+lA, 7, 8);
    ctx.fillStyle = '#c62828'; ctx.fillRect(cx-11, cy+15+lA, 3, 8);
    ctx.fillStyle = '#7B0000'; ctx.fillRect(cx-14, cy+15+lA, 2, 8);

    // ── RIGHT SHOULDER CAP ────────────────────────────────────
    ctx.fillStyle = '#000'; ctx.fillRect(cx+8, cy-6, 7, 9);
    ctx.fillStyle = '#1976D2'; ctx.fillRect(cx+9, cy-5, 6, 8);
    ctx.fillStyle = '#1E88E5'; ctx.fillRect(cx+9, cy-5, 2, 8);

    // ── RIGHT ARM (blue, thick) ───────────────────────────────
    ctx.fillStyle = '#000'; ctx.fillRect(cx+7, cy+2, 7, 13);
    ctx.fillStyle = '#1565C0'; ctx.fillRect(cx+8,  cy+3, 6, 11);
    ctx.fillStyle = '#0D47A1'; ctx.fillRect(cx+13, cy+3, 1, 11);
    ctx.fillStyle = '#1976D2'; ctx.fillRect(cx+8,  cy+3, 1, 11);
    // Red glove
    ctx.fillStyle = '#000'; ctx.fillRect(cx+7,  cy+14+rA, 8, 9);
    ctx.fillStyle = '#b71c1c'; ctx.fillRect(cx+8,  cy+15+rA, 7, 8);
    ctx.fillStyle = '#c62828'; ctx.fillRect(cx+8,  cy+15+rA, 3, 8);
    ctx.fillStyle = '#7B0000'; ctx.fillRect(cx+13, cy+15+rA, 2, 8);

    // ── BODY — V-TAPER ────────────────────────────────────────
    ctx.fillStyle = '#000'; ctx.fillRect(cx-9, cy-6, 18, 24);

    // TOP HALF — blue
    // Shoulder row (widest)
    ctx.fillStyle = '#1565C0'; ctx.fillRect(cx-8, cy-5, 16, 4);
    ctx.fillStyle = '#0D47A1'; ctx.fillRect(cx-8, cy-5, 2, 4);
    ctx.fillStyle = '#1976D2'; ctx.fillRect(cx+4, cy-5, 4, 4);
    // Upper chest
    ctx.fillStyle = '#1565C0'; ctx.fillRect(cx-7, cy-1, 14, 4);
    ctx.fillStyle = '#0D47A1'; ctx.fillRect(cx-7, cy-1, 2, 4);
    ctx.fillStyle = '#1976D2'; ctx.fillRect(cx+3, cy-1, 4, 4);

    // S-Shield (prominent, centered)
    ctx.fillStyle = '#000'; ctx.fillRect(cx-5, cy-5, 10, 10);
    ctx.fillStyle = '#FFD700'; ctx.fillRect(cx-4, cy-4, 8, 8);
    ctx.fillStyle = '#FFC107'; ctx.fillRect(cx-4, cy-4, 2, 8);
    ctx.fillStyle = '#FFE082'; ctx.fillRect(cx+2, cy-4, 2, 8);
    // Red S
    ctx.fillStyle = '#b71c1c';
    ctx.fillRect(cx-3, cy-3, 5, 1); ctx.fillRect(cx-3, cy-2, 2, 1);
    ctx.fillRect(cx-3, cy-1, 5, 1); ctx.fillRect(cx, cy, 3, 1);
    ctx.fillRect(cx-3, cy+1, 5, 1); ctx.fillRect(cx-3, cy+2, 5, 1);

    // BOTTOM HALF — red, with taper
    ctx.fillStyle = '#b71c1c'; ctx.fillRect(cx-6, cy+3, 12, 4);
    ctx.fillStyle = '#7B0000'; ctx.fillRect(cx-6, cy+3, 2, 4);
    ctx.fillStyle = '#c62828'; ctx.fillRect(cx+2, cy+3, 4, 4);
    ctx.fillStyle = '#b71c1c'; ctx.fillRect(cx-5, cy+7, 10, 4);
    ctx.fillStyle = '#7B0000'; ctx.fillRect(cx-5, cy+7, 2, 4);
    ctx.fillStyle = '#c62828'; ctx.fillRect(cx+1, cy+7, 3, 4);
    ctx.fillStyle = '#b71c1c'; ctx.fillRect(cx-5, cy+11, 10, 4);
    ctx.fillStyle = '#7B0000'; ctx.fillRect(cx-5, cy+11, 2, 4);

    // Belt (gold)
    ctx.fillStyle = '#000'; ctx.fillRect(cx-6, cy+14, 12, 4);
    ctx.fillStyle = '#FFD700'; ctx.fillRect(cx-5, cy+15, 10, 3);
    ctx.fillStyle = '#FFC107'; ctx.fillRect(cx-5, cy+15, 3, 3);
    ctx.fillStyle = '#fff'; ctx.fillRect(cx-1, cy+15, 2, 3);

    // ── LEFT LEG (blue, thick) ────────────────────────────────
    ctx.fillStyle = '#000'; ctx.fillRect(cx-9, cy+17, 9, 14+lL);
    ctx.fillStyle = '#1565C0'; ctx.fillRect(cx-8, cy+18, 8, 12+lL);
    ctx.fillStyle = '#1976D2'; ctx.fillRect(cx-5, cy+18, 3, 12+lL);
    ctx.fillStyle = '#0D47A1'; ctx.fillRect(cx-8, cy+18, 1, 12+lL);
    // Red boot
    ctx.fillStyle = '#000'; ctx.fillRect(cx-10, cy+29+lL, 10, 6);
    ctx.fillStyle = '#b71c1c'; ctx.fillRect(cx-9, cy+30+lL, 9, 5);
    ctx.fillStyle = '#c62828'; ctx.fillRect(cx-6, cy+30+lL, 3, 5);
    ctx.fillStyle = '#7B0000'; ctx.fillRect(cx-9, cy+30+lL, 2, 5);

    // ── RIGHT LEG (blue, thick) ───────────────────────────────
    ctx.fillStyle = '#000'; ctx.fillRect(cx, cy+17, 9, 14+rL);
    ctx.fillStyle = '#1565C0'; ctx.fillRect(cx+1, cy+18, 8, 12+rL);
    ctx.fillStyle = '#1976D2'; ctx.fillRect(cx+2, cy+18, 3, 12+rL);
    ctx.fillStyle = '#0D47A1'; ctx.fillRect(cx+8, cy+18, 1, 12+rL);
    // Red boot
    ctx.fillStyle = '#000'; ctx.fillRect(cx, cy+29+rL, 10, 6);
    ctx.fillStyle = '#b71c1c'; ctx.fillRect(cx+1, cy+30+rL, 9, 5);
    ctx.fillStyle = '#c62828'; ctx.fillRect(cx+1, cy+30+rL, 3, 5);
    ctx.fillStyle = '#7B0000'; ctx.fillRect(cx+8, cy+30+rL, 2, 5);

  } else {
    // ── NORMAL MODE — red t-shirt, athletic build ──────────────
    ctx.fillStyle = '#000'; ctx.fillRect(cx-9, cy-33, 18, 22);
    ctx.fillStyle = '#8D5524'; ctx.fillRect(cx-8, cy-32, 16, 20);
    ctx.fillStyle = '#A0652A'; ctx.fillRect(cx-8, cy-32, 4, 11);
    ctx.fillStyle = '#111';
    ctx.fillRect(cx-8, cy-32, 16, 7); ctx.fillRect(cx-9, cy-32, 2, 14); ctx.fillRect(cx+6, cy-32, 3, 9);
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx-5, cy-24, 4, 3); ctx.fillRect(cx+1, cy-24, 4, 3);
    ctx.fillStyle = '#1565C0';
    ctx.fillRect(cx-4, cy-24, 3, 2); ctx.fillRect(cx+2, cy-24, 3, 2);
    ctx.fillStyle = '#000';
    ctx.fillRect(cx-4, cy-24, 1, 1); ctx.fillRect(cx+4, cy-24, 1, 1);
    ctx.fillStyle = '#7a4520';
    ctx.fillRect(cx, cy-20, 1, 1); ctx.fillRect(cx-2, cy-18, 4, 1);
    ctx.fillRect(cx-3, cy-19, 1, 1); ctx.fillRect(cx+2, cy-19, 1, 1);
    ctx.fillStyle = '#000'; ctx.fillRect(cx-3, cy-11, 6, 5);
    ctx.fillStyle = '#8D5524'; ctx.fillRect(cx-2, cy-10, 4, 4);
    // Body (red t-shirt, V-taper)
    ctx.fillStyle = '#000'; ctx.fillRect(cx-9, cy-6, 18, 20);
    ctx.fillStyle = '#c62828'; ctx.fillRect(cx-8, cy-5, 16, 4);
    ctx.fillStyle = '#c62828'; ctx.fillRect(cx-7, cy-1, 14, 4);
    ctx.fillStyle = '#c62828'; ctx.fillRect(cx-6, cy+3, 12, 4);
    ctx.fillStyle = '#c62828'; ctx.fillRect(cx-5, cy+7, 10, 7);
    ctx.fillStyle = '#7B0000';
    ctx.fillRect(cx-8, cy-5, 2, 16); ctx.fillRect(cx-7, cy-1, 1, 12); ctx.fillRect(cx-6, cy+3, 1, 9);
    ctx.fillStyle = '#e53935';
    ctx.fillRect(cx+4, cy-5, 4, 16); ctx.fillRect(cx+3, cy-1, 1, 12);
    // Left arm
    ctx.fillStyle = '#000'; ctx.fillRect(cx-14, cy-5, 6, 20);
    ctx.fillStyle = '#c62828'; ctx.fillRect(cx-13, cy-4, 5, 11);
    ctx.fillStyle = '#7B0000'; ctx.fillRect(cx-13, cy-4, 1, 11);
    ctx.fillStyle = '#000'; ctx.fillRect(cx-14, cy+6+lA, 6, 6);
    ctx.fillStyle = '#8D5524'; ctx.fillRect(cx-13, cy+7+lA, 5, 5);
    // Right arm
    ctx.fillStyle = '#000'; ctx.fillRect(cx+8, cy-5, 6, 20);
    ctx.fillStyle = '#c62828'; ctx.fillRect(cx+9, cy-4, 5, 11);
    ctx.fillStyle = '#7B0000'; ctx.fillRect(cx+13, cy-4, 1, 11);
    ctx.fillStyle = '#000'; ctx.fillRect(cx+8, cy+6+rA, 6, 6);
    ctx.fillStyle = '#8D5524'; ctx.fillRect(cx+9, cy+7+rA, 5, 5);
    // Legs
    ctx.fillStyle = '#000'; ctx.fillRect(cx-9, cy+13, 9, 17+lL);
    ctx.fillStyle = '#1A237E'; ctx.fillRect(cx-8, cy+14, 8, 15+lL);
    ctx.fillStyle = '#283593'; ctx.fillRect(cx-5, cy+14, 3, 15+lL);
    ctx.fillStyle = '#000'; ctx.fillRect(cx, cy+13, 9, 17+rL);
    ctx.fillStyle = '#1A237E'; ctx.fillRect(cx+1, cy+14, 8, 15+rL);
    ctx.fillStyle = '#283593'; ctx.fillRect(cx+2, cy+14, 3, 15+rL);
    // Sneakers
    ctx.fillStyle = '#000'; ctx.fillRect(cx-10, cy+28+lL, 10, 4);
    ctx.fillStyle = '#fff'; ctx.fillRect(cx-9, cy+29+lL, 9, 3);
    ctx.fillStyle = '#b71c1c'; ctx.fillRect(cx-9, cy+29+lL, 9, 1);
    ctx.fillStyle = '#000'; ctx.fillRect(cx, cy+28+rL, 10, 4);
    ctx.fillStyle = '#fff'; ctx.fillRect(cx+1, cy+29+rL, 9, 3);
    ctx.fillStyle = '#b71c1c'; ctx.fillRect(cx+1, cy+29+rL, 9, 1);
  }
}

// ── Attack Effect ─────────────────────────────────────────────
function drawAttackEffect(ctx, effect, camX, camY) {
  if (!effect) return;
  const sx = Math.round(effect.x-camX), sy = Math.round(effect.y-camY);
  const alpha = effect.life/effect.maxLife, r = Math.round(effect.radius);
  if (effect.character === 'flash') {
    ctx.fillStyle = `rgba(255,220,0,${alpha})`;
    ctx.fillRect(sx-r, sy-1, r*2, 3); ctx.fillRect(sx-1, sy-r, 3, r*2);
    ctx.fillRect(sx-r*0.7, sy-r*0.7, 3, 3); ctx.fillRect(sx+r*0.7-2, sy-r*0.7, 3, 3);
    ctx.fillRect(sx-r*0.7, sy+r*0.7-2, 3, 3); ctx.fillRect(sx+r*0.7-2, sy+r*0.7-2, 3, 3);
  } else {
    ctx.fillStyle = `rgba(180,30,30,${alpha})`;
    ctx.fillRect(sx-r, sy-r, r*2, 2); ctx.fillRect(sx-r, sy+r, r*2, 2);
    ctx.fillRect(sx-r, sy-r, 2, r*2); ctx.fillRect(sx+r, sy-r, 2, r*2);
  }
}
