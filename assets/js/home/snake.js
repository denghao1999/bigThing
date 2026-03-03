(() => {
  /** @type {HTMLCanvasElement} */
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d", { alpha: false });

  const els = {
    score: document.getElementById("score"),
    bestScore: document.getElementById("bestScore"),
    speed: document.getElementById("speed"),
    overlay: document.getElementById("overlay"),
    overlayTitle: document.getElementById("overlayTitle"),
    overlayDesc: document.getElementById("overlayDesc"),
    btnToggle: document.getElementById("btnToggle"),
    btnRestart: document.getElementById("btnRestart"),
    btnToggle2: document.getElementById("btnToggle2"),
    btnRestart2: document.getElementById("btnRestart2"),
    dpad: document.querySelector(".snake-dpad"),
  };

  const LS_KEY = "snake.bestScore.v1";

  const CONFIG = {
    gridCount: 24,
    cssCanvasSize: 560,
    baseTickMs: 165,
    minTickMs: 60,
    speedUpEveryFood: 4,
    speedUpFactor: 0.92,
  };

  const COLORS = {
    bg: "#0b1220",
    grid: "rgba(255,255,255,0.06)",
    snake: "#57d39c",
    head: "#19b9e7",
    food: "#ff5f7a",
    foodGlow: "rgba(255,95,122,0.25)",
  };

  /** @type {{x:number,y:number}[]} */
  let snake = [];
  /** @type {{x:number,y:number}} */
  let dir = { x: 1, y: 0 };
  /** @type {{x:number,y:number}|null} */
  let nextDir = null;
  /** @type {{x:number,y:number}} */
  let food = { x: 0, y: 0 };

  let score = 0;
  let bestScore = 0;
  let tickMs = CONFIG.baseTickMs;
  let timer = null;

  let isRunning = false;
  let isPaused = true;
  let isGameOver = false;

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function loadBestScore() {
    const v = Number(localStorage.getItem(LS_KEY) || 0);
    return Number.isFinite(v) ? v : 0;
  }

  function saveBestScore(v) {
    localStorage.setItem(LS_KEY, String(v));
  }

  function formatSpeedMultiplier() {
    const mult = CONFIG.baseTickMs / tickMs;
    const pretty = clamp(mult, 1, 9.9).toFixed(1);
    return `${pretty}x`;
  }

  function setOverlay(state, title, desc, primaryText) {
    if (!state) {
      els.overlay.hidden = true;
      els.overlay.style.display = "none";
      return;
    }
    els.overlay.hidden = false;
    els.overlay.style.display = "grid";
    els.overlayTitle.textContent = title;
    els.overlayDesc.textContent = desc;
    els.btnToggle.textContent = primaryText;
  }

  function updateUI() {
    els.score.textContent = String(score);
    els.bestScore.textContent = String(bestScore);
    els.speed.textContent = formatSpeedMultiplier();

    if (isGameOver) {
      setOverlay(true, "游戏结束", "按 R 重新开始，或点下面按钮", "重新开始");
      els.btnToggle2.textContent = "开始";
      return;
    }

    if (!isRunning) {
      setOverlay(true, "准备开始", "按方向键 / WASD 开始移动，或点开始按钮", "开始");
      els.btnToggle2.textContent = "开始";
      return;
    }

    if (isPaused) {
      setOverlay(true, "已暂停", "按空格继续，或点继续按钮", "继续");
      els.btnToggle2.textContent = "继续";
      return;
    }

    setOverlay(false);
    els.btnToggle2.textContent = "暂停";
  }

  function chooseEmptyCell() {
    const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
    const total = CONFIG.gridCount * CONFIG.gridCount;
    if (occupied.size >= total) return null;

    for (let tries = 0; tries < 2000; tries++) {
      const x = Math.floor(Math.random() * CONFIG.gridCount);
      const y = Math.floor(Math.random() * CONFIG.gridCount);
      const key = `${x},${y}`;
      if (!occupied.has(key)) return { x, y };
    }

    for (let y = 0; y < CONFIG.gridCount; y++) {
      for (let x = 0; x < CONFIG.gridCount; x++) {
        const key = `${x},${y}`;
        if (!occupied.has(key)) return { x, y };
      }
    }
    return null;
  }

  function resetGame() {
    const mid = Math.floor(CONFIG.gridCount / 2);
    snake = [
      { x: mid, y: mid },
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid },
    ];
    dir = { x: 1, y: 0 };
    nextDir = null;
    score = 0;
    tickMs = CONFIG.baseTickMs;
    isRunning = false;
    isPaused = true;
    isGameOver = false;
    const cell = chooseEmptyCell();
    food = cell || { x: 0, y: 0 };
    stopLoop();
    render();
    updateUI();
  }

  function applyNextDirection() {
    if (!nextDir) return;
    const nd = nextDir;
    nextDir = null;

    if (snake.length > 1) {
      if (nd.x === -dir.x && nd.y === -dir.y) return;
    }
    dir = nd;
  }

  function isPointInSnake(pt, ignoreTail = false) {
    const len = snake.length - (ignoreTail ? 1 : 0);
    for (let i = 0; i < len; i++) {
      if (snake[i].x === pt.x && snake[i].y === pt.y) return true;
    }
    return false;
  }

  function step() {
    if (!isRunning || isPaused || isGameOver) return;

    applyNextDirection();

    const head = snake[0];
    const newHead = { x: head.x + dir.x, y: head.y + dir.y };

    if (
      newHead.x < 0 ||
      newHead.x >= CONFIG.gridCount ||
      newHead.y < 0 ||
      newHead.y >= CONFIG.gridCount
    ) {
      gameOver();
      return;
    }

    const willEat = newHead.x === food.x && newHead.y === food.y;
    if (isPointInSnake(newHead, !willEat)) {
      gameOver();
      return;
    }

    snake.unshift(newHead);

    if (willEat) {
      score += 1;
      if (score > bestScore) {
        bestScore = score;
        saveBestScore(bestScore);
      }

      if (score % CONFIG.speedUpEveryFood === 0) {
        tickMs = Math.max(CONFIG.minTickMs, Math.floor(tickMs * CONFIG.speedUpFactor));
        if (isRunning && !isPaused) restartLoop();
      }

      const cell = chooseEmptyCell();
      if (cell) food = cell;
      else gameOver(true);
    } else {
      snake.pop();
    }

    render();
    updateUI();
  }

  function gameOver(won = false) {
    isGameOver = true;
    isRunning = true;
    isPaused = true;
    stopLoop();
    render();
    if (won) {
      setOverlay(true, "你赢了！", "棋盘已被填满，按 R 重新开始", "重新开始");
    } else {
      setOverlay(true, "游戏结束", "撞墙或撞到自己了。按 R 重新开始", "重新开始");
    }
    els.btnToggle2.textContent = "开始";
  }

  function stopLoop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function restartLoop() {
    stopLoop();
    timer = setInterval(step, tickMs);
  }

  function startOrResume() {
    if (isGameOver) {
      resetGame();
    }
    if (!isRunning) isRunning = true;
    isPaused = false;
    restartLoop();
    updateUI();
  }

  function pause() {
    if (!isRunning || isPaused || isGameOver) return;
    isPaused = true;
    stopLoop();
    updateUI();
  }

  function toggle() {
    if (isGameOver) {
      resetGame();
      startOrResume();
      return;
    }
    if (!isRunning) {
      startOrResume();
      return;
    }
    if (isPaused) startOrResume();
    else pause();
  }

  function setDirectionByName(name) {
    if (name === "up") nextDir = { x: 0, y: -1 };
    else if (name === "down") nextDir = { x: 0, y: 1 };
    else if (name === "left") nextDir = { x: -1, y: 0 };
    else if (name === "right") nextDir = { x: 1, y: 0 };

    if (!isRunning) startOrResume();
  }

  function onKeyDown(e) {
    const key = e.key.toLowerCase();
    if (key === " " || key === "spacebar") {
      e.preventDefault();
      toggle();
      return;
    }
    if (key === "r" || key === "enter") {
      e.preventDefault();
      resetGame();
      startOrResume();
      return;
    }

    if (key === "arrowup" || key === "w") setDirectionByName("up");
    else if (key === "arrowdown" || key === "s") setDirectionByName("down");
    else if (key === "arrowleft" || key === "a") setDirectionByName("left");
    else if (key === "arrowright" || key === "d") setDirectionByName("right");
  }

  function setupCanvas() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const cssSize = Math.min(CONFIG.cssCanvasSize, Math.floor(window.innerWidth * 0.92));
    canvas.style.width = `${cssSize}px`;
    canvas.style.height = `${cssSize}px`;

    const pxSize = Math.floor(cssSize * dpr);
    canvas.width = pxSize;
    canvas.height = pxSize;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    render();
  }

  function render() {
    const cssWidth = parseFloat(canvas.style.width) || CONFIG.cssCanvasSize;
    const cell = cssWidth / CONFIG.gridCount;

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, cssWidth, cssWidth);

    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let i = 1; i < CONFIG.gridCount; i++) {
      const p = Math.round(i * cell) + 0.5;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, cssWidth);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(cssWidth, p);
      ctx.stroke();
    }

    const foodX = food.x * cell;
    const foodY = food.y * cell;
    const r = cell * 0.32;
    ctx.beginPath();
    ctx.fillStyle = COLORS.foodGlow;
    ctx.arc(foodX + cell / 2, foodY + cell / 2, r * 1.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = COLORS.food;
    ctx.arc(foodX + cell / 2, foodY + cell / 2, r, 0, Math.PI * 2);
    ctx.fill();

    for (let i = snake.length - 1; i >= 0; i--) {
      const p = snake[i];
      const x = p.x * cell;
      const y = p.y * cell;
      const pad = Math.max(1, Math.floor(cell * 0.10));
      const w = cell - pad * 2;
      const h = cell - pad * 2;
      const radius = Math.max(4, Math.floor(cell * 0.22));

      ctx.fillStyle = i === 0 ? COLORS.head : COLORS.snake;
      roundRect(ctx, x + pad, y + pad, w, h, radius);
      ctx.fill();
    }

    if (!isRunning || isPaused || isGameOver) {
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(0, 0, cssWidth, cssWidth);
    }
  }

  function roundRect(c, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }

  function bindUI() {
    els.btnToggle.addEventListener("click", toggle);
    els.btnToggle2.addEventListener("click", toggle);

    const restart = () => {
      resetGame();
      startOrResume();
    };
    els.btnRestart.addEventListener("click", restart);
    els.btnRestart2.addEventListener("click", restart);

    document.addEventListener("keydown", onKeyDown, { passive: false });

    let lastTouchAt = 0;
    els.dpad.addEventListener("pointerdown", (e) => {
      const btn = e.target.closest("[data-dir]");
      if (!btn) return;
      lastTouchAt = Date.now();
      setDirectionByName(btn.getAttribute("data-dir"));
      btn.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    });

    let touchStart = null;
    canvas.addEventListener("pointerdown", (e) => {
      if (Date.now() - lastTouchAt < 250) return;
      touchStart = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture?.(e.pointerId);
    });
    canvas.addEventListener("pointerup", (e) => {
      if (!touchStart) return;
      const dx = e.clientX - touchStart.x;
      const dy = e.clientY - touchStart.y;
      touchStart = null;

      const ax = Math.abs(dx);
      const ay = Math.abs(dy);
      if (Math.max(ax, ay) < 18) {
        toggle();
        return;
      }
      if (ax > ay) setDirectionByName(dx > 0 ? "right" : "left");
      else setDirectionByName(dy > 0 ? "down" : "up");
    });

    window.addEventListener("resize", () => setupCanvas());
  }

  function init() {
    bestScore = loadBestScore();
    setupCanvas();
    bindUI();
    resetGame();
  }

  init();
})();
