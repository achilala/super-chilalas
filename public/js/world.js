// ── World Constants ──────────────────────────────────────────
const WORLD_W = 2880;
const WORLD_H = 2880;
const CELL = 300;   // block size
const ROAD = 60;    // road width
const UNIT = CELL + ROAD; // 360 per grid unit

// Road positions (top-left of road strip)
function roadX(col) { return col * UNIT + CELL; }
function roadY(row) { return row * UNIT + CELL; }

// Block top-left corner
function blockX(col) { return col * UNIT; }
function blockY(row) { return row * UNIT; }

// ── City Layout ──────────────────────────────────────────────
// 8 cols × 8 rows of blocks
const CITY_BLOCKS = [
  // [col, row, type, color, label]
  // Park - big green area (merges 2 blocks)
  [1, 1, 'park',   '#2d7a3a', 'Chilala Park'],
  [2, 1, 'park',   '#2d7a3a', null],
  [1, 2, 'park',   '#2d7a3a', null],

  // School
  [3, 1, 'school', '#c8a84b', 'Chilala\nSchool'],

  // Police station
  [5, 2, 'police', '#3a5fa0', 'Police HQ'],

  // Hospital
  [6, 4, 'hospital', '#e05252', 'Hospital'],

  // Mall / shops row
  [1, 4, 'shop',   '#9b6dbf', 'Super Mall'],
  [2, 4, 'shop',   '#bf9b6d', null],

  // Stadium
  [4, 5, 'stadium', '#4a9e6b', 'Stadium'],
  [5, 5, 'stadium', '#4a9e6b', null],

  // Library
  [2, 6, 'library', '#8B7355', 'Library'],

  // All remaining blocks get auto-filled as generic buildings
];

// Pre-compute set of special blocks
const specialSet = new Set(CITY_BLOCKS.map(b => `${b[0]},${b[1]}`));

// Generic building colours for variety
const BLDG_COLORS = [
  '#7b6b8e','#6b8e7b','#8e7b6b','#6b7b8e',
  '#8e6b7b','#7b8e6b','#5a6e7b','#7e5a6b',
  '#6e7b5a','#5a7b6e','#7b5a6b','#8a7060',
];

// Seed-based colour pick so same block always same colour
function bldgColor(col, row) {
  return BLDG_COLORS[(col * 7 + row * 13) % BLDG_COLORS.length];
}

// ── Collision Rects (buildings) ──────────────────────────────
// Returns array of {x,y,w,h} solid rects in world space
const COLLISION_RECTS = [];
function buildCollision() {
  // Special blocks
  CITY_BLOCKS.forEach(([col, row]) => {
    COLLISION_RECTS.push({ x: blockX(col) + 10, y: blockY(row) + 10, w: CELL - 20, h: CELL - 20 });
  });
  // Generic blocks
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (specialSet.has(`${col},${row}`)) continue;
      COLLISION_RECTS.push({ x: blockX(col) + 10, y: blockY(row) + 10, w: CELL - 20, h: CELL - 20 });
    }
  }
}
buildCollision();

function collidesWithBuilding(nx, ny, radius) {
  for (const r of COLLISION_RECTS) {
    if (nx + radius > r.x && nx - radius < r.x + r.w &&
        ny + radius > r.y && ny - radius < r.y + r.h) {
      return true;
    }
  }
  return false;
}

// ── Draw World ───────────────────────────────────────────────
function drawWorld(ctx, camX, camY, canvasW, canvasH) {
  // Background (grass / empty)
  ctx.fillStyle = '#3a5c2a';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Visible region in world coords
  const wx1 = camX, wx2 = camX + canvasW;
  const wy1 = camY, wy2 = camY + canvasH;

  // Sidewalk underneath roads (slightly lighter)
  ctx.fillStyle = '#777';
  // Horizontal road strips
  for (let row = 0; row < 8; row++) {
    const ry = roadY(row);
    if (ry + ROAD < wy1 || ry > wy2) continue;
    ctx.fillRect(0 - camX, ry - camY, WORLD_W, ROAD);
  }
  // Vertical road strips
  for (let col = 0; col < 8; col++) {
    const rx = roadX(col);
    if (rx + ROAD < wx1 || rx > wx2) continue;
    ctx.fillRect(rx - camX, 0 - camY, ROAD, WORLD_H);
  }

  // Road asphalt (centre of each road)
  ctx.fillStyle = '#555';
  for (let row = 0; row < 8; row++) {
    const ry = roadY(row);
    if (ry + ROAD < wy1 || ry > wy2) continue;
    ctx.fillRect(0 - camX, ry + 5 - camY, WORLD_W, ROAD - 10);
  }
  for (let col = 0; col < 8; col++) {
    const rx = roadX(col);
    if (rx + ROAD < wx1 || rx > wx2) continue;
    ctx.fillRect(rx + 5 - camX, 0 - camY, ROAD - 10, WORLD_H);
  }

  // Road dashes (yellow centre line)
  ctx.strokeStyle = '#FFD700';
  ctx.setLineDash([20, 20]);
  ctx.lineWidth = 2;
  for (let row = 0; row < 8; row++) {
    const cy = roadY(row) + ROAD / 2;
    if (cy < wy1 - 30 || cy > wy2 + 30) continue;
    ctx.beginPath();
    ctx.moveTo(0 - camX, cy - camY);
    ctx.lineTo(WORLD_W - camX, cy - camY);
    ctx.stroke();
  }
  for (let col = 0; col < 8; col++) {
    const cx = roadX(col) + ROAD / 2;
    if (cx < wx1 - 30 || cx > wx2 + 30) continue;
    ctx.beginPath();
    ctx.moveTo(cx - camX, 0 - camY);
    ctx.lineTo(cx - camX, WORLD_H - camY);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // ── Draw Blocks ─────────────────────────────────────────────
  // Special blocks
  CITY_BLOCKS.forEach(([col, row, type, color, label]) => {
    const bx = blockX(col) - camX;
    const by = blockY(row) - camY;
    if (bx + CELL < 0 || bx > canvasW || by + CELL < 0 || by > canvasH) return;

    ctx.fillStyle = color;
    ctx.fillRect(bx + 8, by + 8, CELL - 16, CELL - 16);

    // Decorations per type
    if (type === 'park') {
      // Trees
      drawTrees(ctx, bx + 8, by + 8, CELL - 16, CELL - 16);
    } else if (type === 'school') {
      drawBuilding(ctx, bx + 8, by + 8, CELL - 16, CELL - 16, '#b89030', label);
    } else if (type === 'police') {
      drawBuilding(ctx, bx + 8, by + 8, CELL - 16, CELL - 16, '#2a4a80', label);
    } else if (type === 'hospital') {
      drawBuilding(ctx, bx + 8, by + 8, CELL - 16, CELL - 16, '#c03030', label);
    } else if (type === 'stadium') {
      drawStadium(ctx, bx + 8, by + 8, CELL - 16, CELL - 16, label);
    } else if (type === 'shop') {
      drawBuilding(ctx, bx + 8, by + 8, CELL - 16, CELL - 16, color, label);
    } else if (type === 'library') {
      drawBuilding(ctx, bx + 8, by + 8, CELL - 16, CELL - 16, '#7a6345', label);
    }
  });

  // Generic blocks
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (specialSet.has(`${col},${row}`)) continue;
      const bx = blockX(col) - camX;
      const by = blockY(row) - camY;
      if (bx + CELL < 0 || bx > canvasW || by + CELL < 0 || by > canvasH) return;
      const c = bldgColor(col, row);
      ctx.fillStyle = c;
      ctx.fillRect(bx + 8, by + 8, CELL - 16, CELL - 16);
      // Windows
      drawWindows(ctx, bx + 8, by + 8, CELL - 16, CELL - 16, col, row);
    }
  }
}

function drawBuilding(ctx, x, y, w, h, roofColor, label) {
  // Roof colour border
  ctx.strokeStyle = roofColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);

  // Windows
  ctx.fillStyle = 'rgba(200, 230, 255, 0.6)';
  const cols = 3, rows = 4;
  const pw = (w - 30) / cols;
  const ph = (h - 40) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillRect(x + 15 + c * pw, y + 20 + r * ph, pw - 6, ph - 6);
    }
  }

  if (label) {
    ctx.fillStyle = '#fff';
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';
    const lines = label.split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line, x + w / 2, y + h / 2 + i * 8);
    });
  }
}

function drawWindows(ctx, x, y, w, h, col, row) {
  ctx.fillStyle = 'rgba(200, 230, 255, 0.5)';
  const cols = 2 + (col % 3);
  const rows = 3 + (row % 3);
  const pw = (w - 20) / cols;
  const ph = (h - 20) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillRect(x + 10 + c * pw, y + 10 + r * ph, pw - 4, ph - 4);
    }
  }
}

function drawTrees(ctx, x, y, w, h) {
  // Pixel-art trees: cross/plus shapes
  const positions = [
    [0.15, 0.15], [0.5, 0.1], [0.8, 0.2],
    [0.1, 0.5],  [0.5, 0.5], [0.85, 0.5],
    [0.2, 0.82], [0.6, 0.78], [0.82, 0.85],
  ];
  positions.forEach(([fx, fy]) => {
    const tx = Math.round(x + fx * w);
    const ty = Math.round(y + fy * h);
    ctx.fillStyle = '#1e5c28';
    ctx.fillRect(tx - 7, ty - 3, 14, 6); // horizontal bar
    ctx.fillRect(tx - 3, ty - 7, 6, 14); // vertical bar
    ctx.fillStyle = '#2d7a3a';
    ctx.fillRect(tx - 4, ty - 4, 8, 8);  // centre highlight
    ctx.fillStyle = '#4a9e55';
    ctx.fillRect(tx - 2, ty - 2, 4, 4);  // bright centre
  });

  // Path
  ctx.fillStyle = '#a0885a';
  ctx.fillRect(Math.round(x + w * 0.3), Math.round(y + h * 0.35), Math.round(w * 0.4), 4);

  // Label
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = '6px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Chilala Park', Math.round(x + w / 2), Math.round(y + h - 8));
}

function drawStadium(ctx, x, y, w, h, label) {
  ctx.strokeStyle = '#2d7a3a';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2 - 10, h / 2 - 10, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#2d7a3a';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2 - 28, h / 2 - 28, 0, 0, Math.PI * 2);
  ctx.fill();
  if (label) {
    ctx.fillStyle = '#fff';
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h / 2 + 4);
  }
}
