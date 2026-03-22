// ── UI / HUD ──────────────────────────────────────────────────
const UI = {
  selectedChar: null,

  init() {
    this.drawCharPreview('flashPreview', 'flash');
    this.drawCharPreview('superPreview', 'super');
  },

  drawCharPreview(canvasId, character) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (character === 'flash') {
      grad.addColorStop(0, '#0d2b5e');
      grad.addColorStop(1, '#1a1a2e');
    } else {
      grad.addColorStop(0, '#5e0d0d');
      grad.addColorStop(1, '#1a1a2e');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ground
    ctx.fillStyle = '#555';
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

    // Draw character (hero mode) centered — sprite center sits at ~60% down
    const cx = canvas.width / 2;
    const cy = Math.round(canvas.height * 0.58);

    if (character === 'flash') {
      drawFlashBoy(ctx, cx, cy, true, 0, 0);
    } else {
      drawSuperBoy(ctx, cx, cy, true, 0, 0);
    }
  },

  selectCharacter(character) {
    this.selectedChar = character;
    document.querySelectorAll('.hero-card').forEach(c => c.classList.remove('selected'));
    document.getElementById(character === 'flash' ? 'flashCard' : 'superCard').classList.add('selected');
    document.getElementById('startBtn').disabled = false;
  },

  updateHUD(player, playerCount) {
    const hp = Math.max(0, player.health);
    document.getElementById('healthFill').style.width = hp + '%';
    document.getElementById('scoreValue').textContent = player.score;
    document.getElementById('modeDisplay').textContent =
      player.heroMode
        ? (player.character === 'flash' ? '⚡ Flash Boy' : '🦸 Super Boy')
        : '👤 Normal Mode';
    document.getElementById('modeDisplay').style.color = player.heroMode ? '#FFD700' : '#aaa';
    document.getElementById('playerCount').textContent = 'Players: ' + playerCount;
  },

  showMessage(text, duration = 2000) {
    const el = document.getElementById('gameMessage');
    el.textContent = text;
    el.style.opacity = '1';
    clearTimeout(el._timer);
    el._timer = setTimeout(() => {
      el.style.opacity = '0';
    }, duration);
  },

  // Minimap (sized for the low-res offscreen canvas)
  drawMinimap(ctx, canvasW, canvasH, localPlayer, remotePlayers, enemies) {
    const mapW = 72, mapH = 72;
    const mapX = canvasW - mapW - 4;
    const mapY = 4;
    const scaleX = mapW / WORLD_W;
    const scaleY = mapH / WORLD_H;

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(mapX, mapY, mapW, mapH);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(mapX, mapY, mapW, mapH);

    // Roads (simplified grid lines)
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 0.8;
    for (let col = 0; col < 8; col++) {
      const rx = mapX + roadX(col) * scaleX;
      ctx.beginPath(); ctx.moveTo(rx, mapY); ctx.lineTo(rx, mapY + mapH); ctx.stroke();
    }
    for (let row = 0; row < 8; row++) {
      const ry = mapY + roadY(row) * scaleY;
      ctx.beginPath(); ctx.moveTo(mapX, ry); ctx.lineTo(mapX + mapW, ry); ctx.stroke();
    }

    // Enemies
    ctx.fillStyle = '#f44336';
    for (const e of Object.values(enemies)) {
      ctx.beginPath();
      ctx.arc(mapX + e.x * scaleX, mapY + e.y * scaleY, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Remote players
    ctx.fillStyle = '#fff';
    for (const p of Object.values(remotePlayers)) {
      ctx.beginPath();
      ctx.arc(mapX + p.x * scaleX, mapY + p.y * scaleY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Local player - bright dot
    if (localPlayer) {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(mapX + localPlayer.x * scaleX, mapY + localPlayer.y * scaleY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Label
    ctx.fillStyle = '#888';
    ctx.font = '5px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('MAP', mapX + 2, mapY + mapH - 2);
  },
};
