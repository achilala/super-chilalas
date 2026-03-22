// ── Enemy Drawing (pixel art) ─────────────────────────────────
function drawEnemy(ctx, enemy, camX, camY, animFrame) {
  const sx = Math.round(enemy.x - camX);
  const sy = Math.round(enemy.y - camY);

  const bob = animFrame % 30 < 15 ? 0 : 1;
  const legAlt = Math.floor(animFrame / 8) % 2;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(sx - 7, sy + 14, 14, 3);

  // Legs
  ctx.fillStyle = '#37474F';
  ctx.fillRect(sx - 6, sy + 8 + bob, 4, 6 + legAlt * 2);
  ctx.fillRect(sx + 2, sy + 8 + bob, 4, 6 + (1 - legAlt) * 2);
  // Feet
  ctx.fillStyle = '#B71C1C';
  ctx.fillRect(sx - 7, sy + 14 + legAlt * 2 + bob, 6, 2);
  ctx.fillRect(sx + 1, sy + 14 + (1-legAlt) * 2 + bob, 6, 2);

  // Torso
  ctx.fillStyle = '#546E7A';
  ctx.fillRect(sx - 7, sy - 4 + bob, 14, 13);
  // Panel lines
  ctx.fillStyle = '#37474F';
  ctx.fillRect(sx - 5, sy - 2 + bob, 10, 1);
  ctx.fillRect(sx - 5, sy + 2 + bob, 10, 1);
  ctx.fillRect(sx - 5, sy + 6 + bob, 10, 1);

  // Arms
  ctx.fillStyle = '#455A64';
  ctx.fillRect(sx - 11, sy - 3 + bob, 4, 10);
  ctx.fillRect(sx + 7,  sy - 3 + bob, 4, 10);
  // Claws
  ctx.fillStyle = '#B71C1C';
  ctx.fillRect(sx - 12, sy + 5 + bob, 6, 3);
  ctx.fillRect(sx + 6,  sy + 5 + bob, 6, 3);

  // Head
  ctx.fillStyle = '#455A64';
  ctx.fillRect(sx - 6, sy - 16 + bob, 12, 13);
  // Head ridge
  ctx.fillStyle = '#B71C1C';
  ctx.fillRect(sx - 5, sy - 19 + bob, 10, 4);

  // Eyes (glowing red pixels)
  const eyePulse = Math.floor(animFrame / 15) % 2 === 0;
  ctx.fillStyle = eyePulse ? '#FF1744' : '#B71C1C';
  ctx.fillRect(sx - 5, sy - 12 + bob, 3, 3);
  ctx.fillRect(sx + 2, sy - 12 + bob, 3, 3);
  // Eye glow
  if (eyePulse) {
    ctx.fillStyle = 'rgba(255,23,68,0.3)';
    ctx.fillRect(sx - 6, sy - 13 + bob, 5, 5);
    ctx.fillRect(sx + 1, sy - 13 + bob, 5, 5);
  }

  // Antenna
  ctx.fillStyle = '#546E7A';
  ctx.fillRect(sx - 1, sy - 22 + bob, 2, 6);
  ctx.fillStyle = '#F44336';
  ctx.fillRect(sx - 2, sy - 24 + bob, 4, 4);

  // Health bar
  const hpFrac = enemy.health / enemy.maxHealth;
  const barW = 16;
  ctx.fillStyle = '#222';
  ctx.fillRect(sx - barW / 2, sy - 27, barW, 2);
  ctx.fillStyle = hpFrac > 0.5 ? '#4CAF50' : hpFrac > 0.25 ? '#FF9800' : '#f44336';
  ctx.fillRect(sx - barW / 2, sy - 27, Math.round(barW * hpFrac), 2);
}
