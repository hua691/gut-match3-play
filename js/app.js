const IMG = "assets/static/image/";
const MEDIA = "assets/static/media/";
const LOGO = "image/logo.png";

const TILES = {
  1: IMG + "bad.e7701dce.png",
  2: IMG + "good1.bec550f3.png",
  3: IMG + "good2.0b5e797e.png",
  4: IMG + "grape.ec727821.png",
  5: IMG + "carrot.85a5d31e.png",
};

const ROUND_TITLE = [
  IMG + "title_round1.641e9be8.png",
  IMG + "title_round2.6c25f50f.png",
  IMG + "title_round3.3f36998d.png",
];

const state = {
  screen: "loading",
  level: 0,
  board: [],
  stepsUsed: 0,
  counts: [0, 0, 0, 0, 0, 0],
  locked: true,
  selected: null,
  removing: new Set(),
  entering: new Set(),
  falling: false,
  rounds: [],
  result: null,
  showHowTo: false,
  modal: null,
  toast: "",
  banner: null,
  bgmOn: true,
  pointer: null,
};

const audio = {
  bgm: new Audio(MEDIA + "bgm.c4d21b4e.mp3"),
  eliminate: new Audio(MEDIA + "eliminate.afc592e3.mp3"),
  complete: new Audio(MEDIA + "complete.84617f0a.mp3"),
};
audio.bgm.loop = true;

const $ = (id) => document.getElementById(id);

function setFont() {
  const phone = document.getElementById("phone");
  const width = phone ? phone.clientWidth : Math.min(window.innerWidth, 750);
  document.documentElement.style.fontSize = `${(width * 100) / 750}px`;
}

function totalScore() {
  return state.rounds.reduce((sum, round) => sum + round.score, 0);
}

function totalBad() {
  return state.rounds.reduce((sum, round) => sum + round.bad, 0);
}

function totalGood() {
  return state.rounds.reduce((sum, round) => sum + round.yellow + round.green, 0);
}

function currentScore() {
  return scoreOf(state.counts);
}

function play(name) {
  const clip = audio[name];
  if (!clip || (name === "bgm" && !state.bgmOn)) return;
  if (name !== "bgm" && !state.bgmOn) return;
  clip.currentTime = 0;
  clip.play().catch(() => {});
}

function toggleBgm() {
  state.bgmOn = !state.bgmOn;
  if (state.bgmOn) play("bgm");
  else audio.bgm.pause();
  renderChrome();
}

function showToast(text, duration) {
  state.toast = text;
  renderToast();
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    state.toast = "";
    renderToast();
  }, duration || 1600);
}

function saveRank(score) {
  const list = JSON.parse(localStorage.getItem("djx-rank") || "[]");
  list.push({ score, name: "我", time: Date.now() });
  list.sort((a, b) => b.score - a.score);
  localStorage.setItem("djx-rank", JSON.stringify(list.slice(0, 50)));
  return list.slice(0, 50);
}

function rankList() {
  return JSON.parse(localStorage.getItem("djx-rank") || "[]");
}

function myPlace(score) {
  const list = rankList();
  const index = list.findIndex((item) => item.score === score);
  const better = list.filter((item) => item.score > score).length;
  const percent = list.length <= 1 ? 99 : Math.max(1, Math.round((1 - better / list.length) * 100));
  return { place: index < 0 ? better + 1 : index + 1, percent };
}

function render() {
  document.body.dataset.screen = state.screen;
  $("loading").hidden = state.screen !== "loading";
  $("home").hidden = state.screen !== "home";
  $("game").hidden = state.screen !== "game" && state.screen !== "result";
  $("result").hidden = state.screen !== "result";
  $("rank").hidden = state.screen !== "rank";
  $("poster").hidden = state.screen !== "poster";
  $("howto").hidden = !state.showHowTo;
  $("sheet").hidden = !state.modal;
  renderChrome();
  if (state.screen === "game" || state.screen === "result") renderGame();
  if (state.screen === "result") renderResult();
  if (state.screen === "rank") renderRank();
  if (state.modal) renderModal();
  renderBanner();
  renderToast();
}

function renderChrome() {
  document.querySelectorAll("[data-bgm]").forEach((node) => {
    node.src = IMG + (state.bgmOn ? "bgm_play.381f6aaa.png" : "bgm_stop.cf5fa826.png");
    node.closest(".bgm-btn")?.classList.toggle("playing", state.bgmOn);
  });
}

function renderGame() {
  const level = LEVELS[state.level];
  $("round-title").src = ROUND_TITLE[state.level];
  $("steps-used").textContent = state.stepsUsed;
  $("steps-total").textContent = level.steps;
  $("steps-cap").textContent = level.steps;
  $("bad-used").textContent = state.counts[1];
  $("bad-target").textContent = level.target;
  $("bad-cap").textContent = level.target;
  $("live-score").textContent = currentScore();
  const layer = $("tiles");
  layer.classList.toggle("falling", state.falling);
  layer.innerHTML = "";
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const tile = state.board[row][col];
      if (!tile) continue;
      const node = document.createElement("div");
      node.className = "tile";
      if (state.removing.has(tile.id)) node.classList.add("removing");
      if (state.entering.has(tile.id)) node.classList.add("entering");
      if (state.selected && state.selected.r === row && state.selected.c === col) node.classList.add("selected");
      node.style.transform = `translate(${col * 100}%, ${row * 100}%)`;
      node.dataset.r = row;
      node.dataset.c = col;
      const img = document.createElement("img");
      img.src = TILES[tile.type];
      img.alt = "";
      img.draggable = false;
      node.appendChild(img);
      layer.appendChild(node);
    }
  }
  $("board").classList.toggle("locked", state.locked || state.screen === "result");
}

function renderResult() {
  const info = state.result;
  if (!info) return;
  const box = $("result");
  box.className = `overlay result ${info.kind}`;
  $("result-title").className = `result-title ${info.kind}`;
  $("result-knowledge").innerHTML = (KNOWLEDGE[info.level] || []).map((line) => `<p>${line}</p>`).join("");
  $("result-bad").textContent = `${info.kind === "win-all" ? totalBad() : info.bad}个`;
  $("result-good").textContent = `${info.kind === "win-all" ? totalGood() : info.yellow + info.green}个`;
  const score = info.kind === "win-all" ? totalScore() : info.score;
  $("result-score").textContent = score;
  const rank = rankOf(info.kind === "win-all" ? totalScore() : state.rounds.reduce((s, r) => s + r.score, 0));
  $("result-rank-name").textContent = rank.name;
  $("result-rank-img").src = IMG + rank.image;
  $("result-comment").textContent = rank.comment;
  $("btn-next").hidden = info.kind !== "win";
  $("btn-manager").hidden = info.kind === "lose";
  $("result-book").hidden = info.kind === "lose";
  $("btn-again").hidden = info.kind === "win";
  $("btn-poster").hidden = info.kind !== "win-all";
  $("result-rank-block").hidden = info.kind !== "win-all";
}

function renderRank() {
  const list = rankList().map((item, index) => ({ ...item, rank: index + 1 }));
  const mine = totalScore();
  const place = myPlace(mine);
  $("my-score").textContent = mine || 0;
  $("my-place").textContent = list.length ? place.place : "-";
  const top = list.filter((item) => item.rank <= 3);
  $("podium").innerHTML = top
    .map(
      (item) =>
        `<div class="podium-card r${item.rank}"><div class="avatar"></div><div class="who">${item.name}<br />积分:${item.score}</div></div>`
    )
    .join("");
  const rest = list.filter((item) => item.rank > 3);
  $("rank-list").innerHTML = rest.length
    ? rest
        .map(
          (item) =>
            `<div class="rank-row"><span>${item.rank}</span><span>${item.name}</span><span>${item.score}</span></div>`
        )
        .join("")
    : `<div class="rank-empty">${list.length ? "" : "还没有成绩，先去通关吧"}</div>`;
}

function renderModal() {
  const map = {
    rules: { title: IMG + "tab_rules.2280077b.png", body: IMG + "rules.d30d95b1.png?v=4", frame: IMG + "bg_modal2.f6c41725.png" },
    prize: { title: IMG + "tab_prize.50b50917.png", body: IMG + "tab_prize.50b50917.png", frame: IMG + "bg_modal1.90a830b4.png" },
    protocol: { title: IMG + "title_rules.d6d6c7d2.png", body: IMG + "protocol.e3577188.png", frame: IMG + "bg_modal3.3d7bc8c7.png" },
  };
  const item = map[state.modal];
  if (!item) return;
  $("sheet-frame").style.backgroundImage = `url(${item.frame})`;
  $("sheet-body").src = state.modal === "prize" ? IMG + "tips.acd26454.png" : item.body;
}

function renderBanner() {
  const node = $("banner");
  if (!state.banner) {
    node.hidden = true;
    return;
  }
  node.hidden = false;
  $("banner-count").textContent = state.banner.count;
  $("banner-tip").textContent = state.banner.tip;
}

function renderToast() {
  const node = $("toast");
  node.hidden = !state.toast;
  node.textContent = state.toast;
}

async function boot() {
  setFont();
  render();
  await wait(700);
  state.screen = "home";
  render();
}

function openGame() {
  state.showHowTo = true;
  render();
}

function beginLevel(index) {
  state.level = index;
  state.board = createBoard(LEVELS[index].weights);
  if (!hasMove(state.board)) reshuffle(state.board, LEVELS[index].weights);
  state.stepsUsed = 0;
  state.counts = [0, 0, 0, 0, 0, 0];
  state.locked = false;
  state.selected = null;
  state.removing = new Set();
  state.entering = new Set();
  state.falling = false;
  state.result = null;
  state.screen = "game";
  state.showHowTo = false;
  play("bgm");
  render();
  showToast("按住棋子向旁边滑，或先点一个再点相邻的棋子", 2800);
}

function startFresh() {
  state.rounds = [];
  beginLevel(0);
}

function cellFromPoint(x, y) {
  const rect = $("tiles").getBoundingClientRect();
  const col = Math.floor(((x - rect.left) / rect.width) * COLS);
  const row = Math.floor(((y - rect.top) / rect.height) * ROWS);
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null;
  return { r: row, c: col };
}

async function trySwap(from, to) {
  if (state.locked || state.screen !== "game" || !adjacent(from, to)) return;
  state.locked = true;
  state.selected = null;
  swapCells(state.board, from, to);
  renderGame();
  await wait(290);
  if (findMatches(state.board).size === 0) {
    swapCells(state.board, from, to);
    renderGame();
    await wait(290);
    state.locked = false;
    renderGame();
    return;
  }
  state.stepsUsed++;
  play("eliminate");
  let badThisMove = 0;
  let reshuffles = 0;
  for (;;) {
    const matched = findMatches(state.board);
    if (matched.size === 0) {
      if (reshuffles < 5 && !hasMove(state.board)) {
        const before = idsOf(state.board);
        reshuffle(state.board, LEVELS[state.level].weights);
        state.entering = new Set([...idsOf(state.board)].filter((id) => !before.has(id)));
        state.falling = true;
        showToast("无可消除的组合，棋子已重新排列");
        renderGame();
        await wait(610);
        state.entering = new Set();
        state.falling = false;
        reshuffles++;
        continue;
      }
      break;
    }
    const wave = [0, 0, 0, 0, 0, 0];
    const removing = new Set();
    matched.forEach((key) => {
      const [row, col] = key.split(",").map(Number);
      const tile = state.board[row][col];
      wave[tile.type]++;
      removing.add(tile.id);
    });
    state.removing = removing;
    renderGame();
    await wait(510);
    matched.forEach((key) => {
      const [row, col] = key.split(",").map(Number);
      state.board[row][col] = null;
    });
    for (let type = 1; type <= 5; type++) state.counts[type] += wave[type];
    badThisMove += wave[1];
    const before = idsOf(state.board);
    state.removing = new Set();
    state.falling = true;
    collapse(state.board, LEVELS[state.level].weights);
    state.entering = new Set([...idsOf(state.board)].filter((id) => !before.has(id)));
    renderGame();
    await wait(610);
    state.entering = new Set();
    state.falling = false;
  }
  if (badThisMove > 0) {
    state.banner = { count: badThisMove, tip: TIPS[Math.floor(Math.random() * TIPS.length)] };
    renderBanner();
    clearTimeout(trySwap.bannerTimer);
    trySwap.bannerTimer = setTimeout(() => {
      state.banner = null;
      renderBanner();
    }, 1400);
  }
  const level = LEVELS[state.level];
  const win = state.counts[1] >= level.target;
  const lose = !win && state.stepsUsed >= level.steps;
  if (win || lose) {
    if (badThisMove > 0) await wait(700);
    finishLevel(win);
    return;
  }
  state.locked = false;
  renderGame();
}

function finishLevel(win) {
  const snapshot = {
    level: state.level + 1,
    bad: state.counts[1],
    yellow: state.counts[2],
    green: state.counts[3],
    grape: state.counts[4],
    carrot: state.counts[5],
    score: currentScore(),
    win,
  };
  state.rounds.push(snapshot);
  if (win) play("complete");
  const allClear = win && state.level === LEVELS.length - 1;
  state.result = { ...snapshot, kind: allClear ? "win-all" : win ? "win" : "lose" };
  if (allClear) saveRank(totalScore());
  state.screen = "result";
  state.locked = true;
  render();
}

function nextLevel() {
  if (state.level < LEVELS.length - 1) beginLevel(state.level + 1);
}

function retryLevel() {
  state.rounds.pop();
  beginLevel(state.level);
}

function openPoster() {
  state.screen = "poster";
  render();
  const canvas = $("poster-canvas");
  const ctx = canvas.getContext("2d");
  const image = new Image();
  image.onload = () => {
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    ctx.fillStyle = "#BE1427";
    ctx.textAlign = "right";
    ctx.font = "bold 72px sans-serif";
    const score = totalScore();
    const place = myPlace(score);
    ctx.fillText(String(score), canvas.width * 0.78, canvas.height * 0.72);
    ctx.fillText(String(place.place), canvas.width * 0.78, canvas.height * 0.8);
    ctx.fillText(`${place.percent}%`, canvas.width * 0.78, canvas.height * 0.88);
  };
  image.src = IMG + "poster_template.45c8acd2.jpg";
}

function bind() {
  window.addEventListener("resize", () => {
    setFont();
    if (state.screen === "game") renderGame();
  });
  document.body.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!action) return;
    if (action === "start") openGame();
    if (action === "howto-go") startFresh();
    if (action === "howto-close") {
      state.showHowTo = false;
      render();
    }
    if (action === "rules") {
      state.modal = "rules";
      render();
    }
    if (action === "prize") {
      state.modal = "prize";
      render();
    }
    if (action === "close-modal") {
      state.modal = null;
      render();
    }
    if (action === "rank") {
      state.screen = "rank";
      render();
    }
    if (action === "home") {
      state.screen = "home";
      state.showHowTo = false;
      render();
    }
    if (action === "next") nextLevel();
    if (action === "again") (state.result && state.result.kind === "lose" ? retryLevel() : startFresh());
    if (action === "poster") openPoster();
    if (action === "bgm") toggleBgm();
    if (action === "back-result") {
      state.screen = "result";
      render();
    }
  });

  const board = $("board");

  function beginGesture(x, y) {
    if (state.locked || state.screen !== "game") return;
    const pos = cellFromPoint(x, y);
    state.pointer = pos ? { x, y, pos } : null;
  }

  function moveGesture(x, y) {
    if (!state.pointer || state.locked) return;
    const dx = x - state.pointer.x;
    const dy = y - state.pointer.y;
    const tile = document.querySelector(`.tile[data-r="${state.pointer.pos.r}"][data-c="${state.pointer.pos.c}"]`);
    if (!tile) return;
    const horizontal = Math.abs(dx) > Math.abs(dy);
    const shiftX = horizontal ? dx : 0;
    const shiftY = horizontal ? 0 : dy;
    tile.style.transform = `translate(${state.pointer.pos.c * 100}%, ${state.pointer.pos.r * 100}%) translate(${shiftX}px, ${shiftY}px)`;
    tile.style.zIndex = "3";
    tile.style.transition = "none";
  }

  function endGesture(x, y) {
    if (!state.pointer || state.locked) {
      state.pointer = null;
      return;
    }
    const dx = x - state.pointer.x;
    const dy = y - state.pointer.y;
    const from = state.pointer.pos;
    state.pointer = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 12) {
      if (state.selected && state.selected.r === from.r && state.selected.c === from.c) {
        state.selected = null;
        renderGame();
      } else if (state.selected && adjacent(state.selected, from)) {
        trySwap(state.selected, from);
      } else {
        state.selected = from;
        renderGame();
      }
      return;
    }
    const to =
      Math.abs(dx) > Math.abs(dy)
        ? { r: from.r, c: from.c + (dx > 0 ? 1 : -1) }
        : { r: from.r + (dy > 0 ? 1 : -1), c: from.c };
    if (to.r < 0 || to.r >= ROWS || to.c < 0 || to.c >= COLS) {
      renderGame();
      return;
    }
    trySwap(from, to);
  }

  board.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") return;
    if (state.locked || state.screen !== "game") return;
    try { board.setPointerCapture(event.pointerId); } catch (error) {}
    beginGesture(event.clientX, event.clientY);
  });
  board.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch" || !state.pointer) return;
    moveGesture(event.clientX, event.clientY);
  });
  board.addEventListener("pointerup", (event) => {
    if (event.pointerType === "touch") return;
    endGesture(event.clientX, event.clientY);
  });
  board.addEventListener("pointercancel", (event) => {
    if (event.pointerType === "touch") return;
    if (!state.pointer) return;
    endGesture(event.clientX, event.clientY);
  });

  board.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    beginGesture(touch.clientX, touch.clientY);
  }, { passive: true });
  board.addEventListener("touchmove", (event) => {
    if (!state.pointer || event.touches.length !== 1) return;
    event.preventDefault();
    const touch = event.touches[0];
    moveGesture(touch.clientX, touch.clientY);
  }, { passive: false });
  board.addEventListener("touchend", (event) => {
    const touch = event.changedTouches[0];
    if (!touch) return;
    endGesture(touch.clientX, touch.clientY);
  });
  board.addEventListener("touchcancel", (event) => {
    const touch = event.changedTouches[0];
    if (!touch || !state.pointer) {
      state.pointer = null;
      return;
    }
    endGesture(touch.clientX, touch.clientY);
  });
}

bind();
boot();
