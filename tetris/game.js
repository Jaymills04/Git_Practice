(function () {
  'use strict';

  const COLS = 10;
  const ROWS = 20;
  const CELL = 30;

  const PIECES = {
    I: [
      [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
      [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
      [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
      [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]],
    ],
    O: [
      [[1, 1], [1, 1]],
      [[1, 1], [1, 1]],
      [[1, 1], [1, 1]],
      [[1, 1], [1, 1]],
    ],
    T: [
      [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
      [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
      [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
      [[0, 1, 0], [1, 1, 0], [0, 1, 0]],
    ],
    S: [
      [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
      [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
      [[0, 0, 0], [0, 1, 1], [1, 1, 0]],
      [[1, 0, 0], [1, 1, 0], [0, 1, 0]],
    ],
    Z: [
      [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
      [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
      [[0, 0, 0], [1, 1, 0], [0, 1, 1]],
      [[0, 1, 0], [1, 1, 0], [1, 0, 0]],
    ],
    J: [
      [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
      [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
      [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
      [[0, 1, 0], [0, 1, 0], [1, 1, 0]],
    ],
    L: [
      [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
      [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
      [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
      [[1, 1, 0], [0, 1, 0], [0, 1, 0]],
    ],
  };

  const COLORS = {
    I: '#00f0f0',
    O: '#f0f000',
    T: '#a000f0',
    S: '#00f000',
    Z: '#f00000',
    J: '#0000f0',
    L: '#f0a000',
  };

  const PIECE_TYPES = Object.keys(PIECES);
  const LINE_SCORES = [0, 100, 300, 500, 800];
  const LINES_PER_LEVEL = 10;

  const boardCanvas = document.getElementById('board');
  const nextCanvas = document.getElementById('next');
  const overlayEl = document.getElementById('overlay');
  const scoreEl = document.getElementById('score');
  const levelEl = document.getElementById('level');
  const linesEl = document.getElementById('lines');

  const boardCtx = setupCanvas(boardCanvas, COLS * CELL, ROWS * CELL);
  const nextCtx = setupCanvas(nextCanvas, 120, 120);

  let grid;
  let active;
  let nextType;
  let score;
  let level;
  let linesCleared;
  let gameState;
  let lastDrop;
  let dropIntervalMs;

  function setupCanvas(canvas, w, h) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return ctx;
  }

  function createGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  function randomType() {
    return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  }

  function getShape(type, rotation) {
    return PIECES[type][rotation % PIECES[type].length];
  }

  function spawnX(type, rotation) {
    const shape = getShape(type, rotation);
    const w = shape[0].length;
    return Math.floor((COLS - w) / 2);
  }

  function spawnY(type, rotation) {
    const shape = getShape(type, rotation);
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) return -r;
      }
    }
    return 0;
  }

  function collides(type, rotation, x, y, testGrid) {
    const g = testGrid || grid;
    const shape = getShape(type, rotation);
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const gx = x + c;
        const gy = y + r;
        if (gx < 0 || gx >= COLS || gy >= ROWS) return true;
        if (gy >= 0 && g[gy][gx]) return true;
      }
    }
    return false;
  }

  function lockPiece() {
    const shape = getShape(active.type, active.rotation);
    const colorId = PIECE_TYPES.indexOf(active.type) + 1;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const gy = active.y + r;
        const gx = active.x + c;
        if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS) {
          grid[gy][gx] = colorId;
        }
      }
    }
  }

  function clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r].every((cell) => cell !== 0)) {
        grid.splice(r, 1);
        grid.unshift(Array(COLS).fill(0));
        cleared++;
        r++;
      }
    }
    if (cleared > 0) {
      score += LINE_SCORES[cleared] * level;
      linesCleared += cleared;
      const newLevel = Math.floor(linesCleared / LINES_PER_LEVEL) + 1;
      if (newLevel > level) {
        level = newLevel;
        dropIntervalMs = Math.max(100, 800 - (level - 1) * 60); 
      }
      updateHud();
    }
  }

  function spawnPiece() {
    const type = nextType;
    nextType = randomType();
    const rotation = 0;
    const x = spawnX(type, rotation);
    const y = spawnY(type, rotation);
    active = { type, rotation, x, y };
    if (collides(type, rotation, x, y)) {
      gameState = 'gameover';
      showOverlay('Game Over<br><small>Press R or tap Restart</small>');
    }
  }

  function tryMove(dx, dy, dr) {
    if (gameState !== 'playing' || !active) return false;
    const rot = (active.rotation + (dr || 0) + 4) % 4;
    let nx = active.x + dx;
    let ny = active.y + dy;
    if (!collides(active.type, rot, nx, ny)) {
      active.x = nx;
      active.y = ny;
      active.rotation = rot;
      return true;
    }
    if (dr) {
      nx = active.x + 1;
      if (!collides(active.type, rot, nx, ny)) {
        active.x = nx;
        active.rotation = rot;
        return true;
      }
      nx = active.x - 1;
      if (!collides(active.type, rot, nx, ny)) {
        active.x = nx;
        active.rotation = rot;
        return true;
      }
    }
    return false;
  }

  function softDrop() {
    if (gameState !== 'playing' || !active) return;
    if (tryMove(0, 1, 0)) {
      score += 1;
      updateHud();
    } else {
      lockAndContinue();
    }
  }

  function hardDrop() {
    if (gameState !== 'playing' || !active) return;
    while (tryMove(0, 1, 0)) {
      score += 2;
    }
    lockAndContinue();
    updateHud();
  }

  function lockAndContinue() {
    lockPiece();
    clearLines();
    spawnPiece();
    lastDrop = performance.now();
  }

  function dropInterval() {
    return Math.max(100, 800 - (level - 1) * 60);
  }

  function updateHud() {
    scoreEl.textContent = score;
    levelEl.textContent = level;
    linesEl.textContent = linesCleared;
  }

  function showOverlay(html) {
    overlayEl.innerHTML = html;
    overlayEl.classList.remove('hidden');
  }

  function hideOverlay() {
    overlayEl.classList.add('hidden');
  }

  function colorForCell(id) {
    if (id <= 0) return null;
    return COLORS[PIECE_TYPES[id - 1]];
  }

  function drawCell(ctx, x, y, color, size) {
    const pad = 1;
    ctx.fillStyle = color;
    ctx.fillRect(x * size + pad, y * size + pad, size - pad * 2, size - pad * 2);
  }

  function drawBoard() {
    boardCtx.fillStyle = '#0f0f1a';
    boardCtx.fillRect(0, 0, COLS * CELL, ROWS * CELL);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const color = colorForCell(grid[r][c]);
        if (color) drawCell(boardCtx, c, r, color, CELL);
      }
    }

    if (active && gameState === 'playing') {
      const shape = getShape(active.type, active.rotation);
      const color = COLORS[active.type];
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (!shape[r][c]) continue;
          const gy = active.y + r;
          const gx = active.x + c;
          if (gy >= 0) drawCell(boardCtx, gx, gy, color, CELL);
        }
      }
    }

    boardCtx.strokeStyle = '#2a2a3a';
    boardCtx.lineWidth = 1;
    for (let c = 1; c < COLS; c++) {
      boardCtx.beginPath();
      boardCtx.moveTo(c * CELL, 0);
      boardCtx.lineTo(c * CELL, ROWS * CELL);
      boardCtx.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      boardCtx.beginPath();
      boardCtx.moveTo(0, r * CELL);
      boardCtx.lineTo(COLS * CELL, r * CELL);
      boardCtx.stroke();
    }
  }

  function drawNext() {
    nextCtx.fillStyle = '#0f0f1a';
    nextCtx.fillRect(0, 0, 120, 120);
    if (!nextType) return;
    const shape = getShape(nextType, 0);
    const color = COLORS[nextType];
    const size = 24;
    const offsetX = (4 - shape[0].length) / 2;
    const offsetY = (4 - shape.length) / 2;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          drawCell(nextCtx, offsetX + c, offsetY + r, color, size);
        }
      }
    }
  }

  function tick(now) {
    if (gameState === 'playing' && active) {
      if (now - lastDrop >= dropIntervalMs) {
        if (!tryMove(0, 1, 0)) {
          lockAndContinue();
        }
        lastDrop = now;
      }
    }
    drawBoard();
    drawNext();
    requestAnimationFrame(tick);
  }

  function resetGame() {
    grid = createGrid();
    score = 0;
    level = 1;
    linesCleared = 0;
    dropIntervalMs = dropInterval();
    nextType = randomType();
    active = null;
    gameState = 'idle';
    updateHud();
    drawBoard();
    drawNext();
    showOverlay('Press any key<br>or tap a button to start');
  }

  function startGame() {
    if (gameState === 'playing') return;
    grid = createGrid();
    score = 0;
    level = 1;
    linesCleared = 0;
    dropIntervalMs = dropInterval();
    nextType = randomType();
    gameState = 'playing';
    hideOverlay();
    spawnPiece();
    lastDrop = performance.now();
    updateHud();
  }

  function togglePause() {
    if (gameState === 'idle' || gameState === 'gameover') return;
    if (gameState === 'playing') {
      gameState = 'paused';
      showOverlay('Paused<br><small>Press P or tap Pause to resume</small>');
    } else if (gameState === 'paused') {
      gameState = 'playing';
      hideOverlay();
      lastDrop = performance.now();
    }
  }

  function restart() {
    resetGame();
    startGame();
  }

  const KEY_ACTIONS = {
    ArrowLeft: () => tryMove(-1, 0, 0),
    ArrowRight: () => tryMove(1, 0, 0),
    a: () => tryMove(-1, 0, 0),
    A: () => tryMove(-1, 0, 0),
    d: () => tryMove(1, 0, 0),
    D: () => tryMove(1, 0, 0),
    ArrowDown: softDrop,
    s: softDrop,
    S: softDrop,
    ArrowUp: () => tryMove(0, 0, 1),
    w: () => tryMove(0, 0, 1),
    W: () => tryMove(0, 0, 1),
    x: () => tryMove(0, 0, 1),
    X: () => tryMove(0, 0, 1),
    ' ': hardDrop,
    p: togglePause,
    P: togglePause,
    r: () => { if (gameState === 'gameover') restart(); },
    R: () => { if (gameState === 'gameover') restart(); },
  };

  const PREVENT_KEYS = new Set([
    'ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ', 'a', 'A', 'd', 'D',
    's', 'S', 'w', 'W', 'x', 'X', 'p', 'P',
  ]);

  document.addEventListener('keydown', (e) => {
    if (PREVENT_KEYS.has(e.key)) e.preventDefault();
    if (gameState === 'idle') {
      startGame();
      return;
    }
    if (gameState === 'gameover' && (e.key === 'r' || e.key === 'R')) {
      restart();
      return;
    }
    const action = KEY_ACTIONS[e.key];
    if (action) action();
  });

  document.getElementById('btn-left').addEventListener('click', () => {
    if (gameState === 'idle') startGame();
    else tryMove(-1, 0, 0);
  });
  document.getElementById('btn-right').addEventListener('click', () => {
    if (gameState === 'idle') startGame();
    else tryMove(1, 0, 0);
  });
  document.getElementById('btn-down').addEventListener('click', () => {
    if (gameState === 'idle') startGame();
    else softDrop();
  });
  document.getElementById('btn-rotate').addEventListener('click', () => {
    if (gameState === 'idle') startGame();
    else tryMove(0, 0, 1);
  });
  document.getElementById('btn-hard').addEventListener('click', () => {
    if (gameState === 'idle') startGame();
    else hardDrop();
  });
  document.getElementById('btn-pause').addEventListener('click', () => {
    if (gameState === 'idle') startGame();
    else togglePause();
  });
  document.getElementById('btn-restart').addEventListener('click', restart);

  resetGame();
  requestAnimationFrame(tick);
})();
