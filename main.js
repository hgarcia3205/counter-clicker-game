// =====================
// CONSTANTS (easy to tweak)
// =====================
const DEFAULT_GAME_SECONDS = 60;
const DEFAULT_ROUND_SECONDS = 7;
const TOP_SCORES_LIMIT = 5;
const STORAGE_KEY = "topScores_v1";

const BOOST_PRICES = {
  plus10: 3,
  minus10: 3,
  plus100: 10,
  minus100: 10,
};

// =====================
// DOM
// =====================
const elPoints = document.getElementById("current-points");
const elTask = document.getElementById("current-task");
const elCounter = document.getElementById("counter");

const elCountdown = document.getElementById("countdown");
const elRoundCountdown = document.getElementById("round-countdown");

const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const submitRoundBtn = document.getElementById("submit-round-btn");

const nameInput = document.getElementById("player-name");
const topScoresList = document.getElementById("top-scores-list");

// Counter buttons
const plus1Btn = document.getElementById("plus-one-btn");
const minus1Btn = document.getElementById("minus-one-btn");
const plus10Btn = document.getElementById("plus-ten-btn");
const minus10Btn = document.getElementById("minus-ten-btn");
const plus100Btn = document.getElementById("plus-hundred-btn");
const minus100Btn = document.getElementById("minus-hundred-btn");
const resetBtn = document.getElementById("reset-count-btn");

// Shop buttons
const buyPlus10Btn = document.getElementById("buy-plus-ten-btn");
const buyMinus10Btn = document.getElementById("buy-minus-ten-btn");
const buyPlus100Btn = document.getElementById("buy-plus-hundred-btn");
const buyMinus100Btn = document.getElementById("buy-minus-hundred-btn");

// Duration buttons
const durationBtns = Array.from(document.querySelectorAll(".duration-btn"));

// =====================
// GAME STATE
// =====================
let counter = 0;
let points = 0;

let gameRunning = false;
let isPaused = false;

let gameSecondsLeft = DEFAULT_GAME_SECONDS;
let roundSecondsLeft = DEFAULT_ROUND_SECONDS;

let timerId = null;

let task = null; // { min, max }
let lastTaskKey = null;

let playerName = "Player";

// boosts unlocked
let unlocked = {
  plus10: false,
  minus10: false,
  plus100: false,
  minus100: false,
};

// =====================
// TOP SCORES (localStorage)
// =====================
function loadTopScores() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveTopScores(scores) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
}

function addTopScore(name, score) {
  const scores = loadTopScores();

  scores.push({
    name: name || "Player",
    score: Number(score) || 0,
    date: new Date().toISOString(),
  });

  scores.sort((a, b) => b.score - a.score);

  saveTopScores(scores.slice(0, TOP_SCORES_LIMIT));
}

function renderTopScores() {
  const scores = loadTopScores();
  topScoresList.innerHTML = "";

  if (scores.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No scores yet.";
    topScoresList.appendChild(li);
    return;
  }

  scores.forEach((s) => {
    const li = document.createElement("li");
    const shortDate = s.date ? s.date.slice(0, 10) : "";
    li.textContent = `${s.name}: ${s.score} (${shortDate})`;
    topScoresList.appendChild(li);
  });
}

// =====================
// HELPERS
// =====================
function setText(el, value) {
  el.textContent = String(value);
}

function updateUI() {
  setText(elCounter, counter);
  setText(elPoints, points);
  setText(elCountdown, `${gameSecondsLeft}s`);
  setText(elRoundCountdown, `${roundSecondsLeft}s`);

  const canPlay = gameRunning && !isPaused;

  plus1Btn.disabled = !canPlay;
  minus1Btn.disabled = !canPlay;
  resetBtn.disabled = !canPlay;

  plus10Btn.disabled = !(canPlay && unlocked.plus10);
  minus10Btn.disabled = !(canPlay && unlocked.minus10);
  plus100Btn.disabled = !(canPlay && unlocked.plus100);
  minus100Btn.disabled = !(canPlay && unlocked.minus100);

  buyPlus10Btn.disabled = !canPlay || unlocked.plus10;
  buyMinus10Btn.disabled = !canPlay || unlocked.minus10;
  buyPlus100Btn.disabled = !canPlay || unlocked.plus100;
  buyMinus100Btn.disabled = !canPlay || unlocked.minus100;

  startBtn.disabled = gameRunning;
  pauseBtn.disabled = !gameRunning;
  pauseBtn.textContent = isPaused ? "Play" : "Pause";

  submitRoundBtn.disabled = !canPlay;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function taskKey(t) {
  return `${t.min}:${t.max}`;
}

function makeNewTask() {
  const width = Math.min(20 + points * 2, 80);
  const center = randomInt(-50, 50);

  const min = center - Math.floor(width / 2);
  const max = center + Math.floor(width / 2);

  const newTask = { min, max };

  // prevent identical consecutive range
  if (lastTaskKey && taskKey(newTask) === lastTaskKey) {
    return makeNewTask();
  }

  task = newTask;
  lastTaskKey = taskKey(newTask);

  elTask.textContent = `Get the number between ${min} and ${max} (inclusive)`;
}

function isCounterInRange() {
  return task && counter >= task.min && counter <= task.max;
}

// Round submit (auto at 0s, or early submit button)
function submitRound() {
  if (!gameRunning || isPaused) return;

  if (isCounterInRange()) {
    points += 1;
    elTask.textContent = "Nice. +1 point. New round...";
  } else {
    elTask.textContent = "Missed it. No point. New round...";
  }

  roundSecondsLeft = DEFAULT_ROUND_SECONDS;
  makeNewTask();
  updateUI();
}

function applyDelta(delta) {
  if (!gameRunning || isPaused) return;
  counter += delta;
  updateUI();
}

function resetGameState() {
  counter = 0;
  points = 0;
  unlocked = { plus10: false, minus10: false, plus100: false, minus100: false };
  task = null;
  lastTaskKey = null;
  roundSecondsLeft = DEFAULT_ROUND_SECONDS;
}

// =====================
// TIMER (setInterval)
// =====================
function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}

function stopGame() {
  gameRunning = false;
  isPaused = false;
  stopTimer();

  addTopScore(playerName, points);
  renderTopScores();

  elTask.textContent = `Game over. Final score: ${points}. Press Start to play again.`;
  updateUI();
}

function tick() {
  if (!gameRunning || isPaused) return;

  gameSecondsLeft -= 1;
  roundSecondsLeft -= 1;

  if (roundSecondsLeft <= 0) {
    submitRound();
  }

  updateUI();

  if (gameSecondsLeft <= 0) {
    stopGame();
  }
}

function startGame() {
  playerName = (nameInput.value || "").trim() || "Player";

  resetGameState();
  gameRunning = true;
  isPaused = false;

  makeNewTask();
  updateUI();

  stopTimer();
  timerId = setInterval(tick, 1000);
}

function togglePause() {
  if (!gameRunning) return;
  isPaused = !isPaused;
  updateUI();
}

// =====================
// SHOP BOOSTS
// Decision: timer keeps ticking (no pause while buying)
// =====================
function buyBoost(type) {
  if (!gameRunning || isPaused) return;

  const cost = BOOST_PRICES[type];

  if (points < cost) {
    elTask.textContent = `Not enough points. Cost is ${cost}.`;
    updateUI();
    return;
  }

  points -= cost;
  unlocked[type] = true;

  elTask.textContent = `Bought ${type}. You can use it now.`;
  updateUI();
}

// =====================
// EVENTS
// =====================
durationBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (gameRunning) return;
    const seconds = Number(btn.dataset.seconds);
    if (!Number.isFinite(seconds)) return;
    gameSecondsLeft = seconds;
    updateUI();
  });
});

startBtn.addEventListener("click", () => {
  if (gameRunning) return;
  startGame();
});

pauseBtn.addEventListener("click", togglePause);

submitRoundBtn.addEventListener("click", submitRound);

plus1Btn.addEventListener("click", () => applyDelta(+1));
minus1Btn.addEventListener("click", () => applyDelta(-1));
plus10Btn.addEventListener("click", () => applyDelta(+10));
minus10Btn.addEventListener("click", () => applyDelta(-10));
plus100Btn.addEventListener("click", () => applyDelta(+100));
minus100Btn.addEventListener("click", () => applyDelta(-100));

resetBtn.addEventListener("click", () => {
  if (!gameRunning || isPaused) return;
  counter = 0;
  updateUI();
});

buyPlus10Btn.addEventListener("click", () => buyBoost("plus10"));
buyMinus10Btn.addEventListener("click", () => buyBoost("minus10"));
buyPlus100Btn.addEventListener("click", () => buyBoost("plus100"));
buyMinus100Btn.addEventListener("click", () => buyBoost("minus100"));

// =====================
// INIT
// =====================
renderTopScores();
updateUI();
elTask.textContent = "Press Start to begin.";