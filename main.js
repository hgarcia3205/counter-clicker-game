// ---------- DOM ----------
const elPoints = document.getElementById("current-points");
const elTask = document.getElementById("current-task");
const elCounter = document.getElementById("counter");
const elCountdown = document.getElementById("countdown");
const startBtn = document.getElementById("start-btn");

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

// Duration buttons (the 30s / 60s ones in your header)
const durationBtns = Array.from(
  document.querySelectorAll("#game-start-section button")
).filter((b) => b !== startBtn);

// ---------- GAME STATE ----------
let counter = 0;
let points = 0;

let gameRunning = false;
let timeLeft = 60;
let timerId = null;

let task = null; // { min, max }

// boosts unlocked
let unlocked = {
  plus10: false,
  minus10: false,
  plus100: false,
  minus100: false,
};

// ---------- HELPERS ----------
function setText(el, value) {
  el.textContent = String(value);
}

function updateUI() {
  setText(elCounter, counter);
  setText(elPoints, points);
  setText(elCountdown, `${timeLeft}s`);

  // Enable/disable main buttons based on boosts + running state
  plus1Btn.disabled = !gameRunning;
  minus1Btn.disabled = !gameRunning;
  resetBtn.disabled = !gameRunning;

  plus10Btn.disabled = !(gameRunning && unlocked.plus10);
  minus10Btn.disabled = !(gameRunning && unlocked.minus10);
  plus100Btn.disabled = !(gameRunning && unlocked.plus100);
  minus100Btn.disabled = !(gameRunning && unlocked.minus100);

  // Shop is only useful while running
  buyPlus10Btn.disabled = !gameRunning || unlocked.plus10;
  buyMinus10Btn.disabled = !gameRunning || unlocked.minus10;
  buyPlus100Btn.disabled = !gameRunning || unlocked.plus100;
  buyMinus100Btn.disabled = !gameRunning || unlocked.minus100;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeNewTask() {
  // Simple difficulty scaling: ranges get wider as points increase
  const width = Math.min(20 + points * 2, 80); // max width 80
  const center = randomInt(-50, 50);

  const min = center - Math.floor(width / 2);
  const max = center + Math.floor(width / 2);

  task = { min, max };
  elTask.textContent = `Get the number between ${min} and ${max} (inclusive)`;
}

function isCounterInRange() {
  return counter >= task.min && counter <= task.max;
}

function awardPointAndNewTask() {
  points += 1;
  makeNewTask();
  updateUI();
}

function applyDelta(delta) {
  if (!gameRunning) return;
  counter += delta;
  updateUI();

  // Check win condition for current task
  if (task && isCounterInRange()) {
    awardPointAndNewTask();
  }
}

function resetGameState() {
  counter = 0;
  points = 0;
  unlocked = { plus10: false, minus10: false, plus100: false, minus100: false };
  task = null;
}

// ---------- TIMER ----------
function stopGame() {
  gameRunning = false;
  if (timerId) clearInterval(timerId);
  timerId = null;

  elTask.textContent = `Game over! Final score: ${points}. Press Start to play again.`;
  updateUI();
}

function startGame() {
  resetGameState();
  gameRunning = true;
  makeNewTask();
  updateUI();

  timerId = setInterval(() => {
    timeLeft -= 1;
    updateUI();
    if (timeLeft <= 0) stopGame();
  }, 1000);
}

// ---------- SHOP ----------
function buyBoost(type) {
  if (!gameRunning) return;

  // Simple prices (tweak freely)
  const prices = {
    plus10: 3,
    minus10: 3,
    plus100: 10,
    minus100: 10,
  };

  const cost = prices[type];
  if (points < cost) {
    elTask.textContent = `Not enough points to buy that (cost: ${cost}).`;
    return;
  }

  points -= cost;
  unlocked[type] = true;
  elTask.textContent = `Bought ${type}!`;
  updateUI();
}

// ---------- EVENTS ----------

// duration selection
durationBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const label = btn.textContent.trim().toLowerCase();
    if (label.includes("30")) timeLeft = 30;
    if (label.includes("60")) timeLeft = 60;
    updateUI();
  });
});

startBtn.addEventListener("click", () => {
  if (gameRunning) return;
  // If user hasn't clicked 30s/60s, keep whatever is in timeLeft (defaults to 60)
  startGame();
});

plus1Btn.addEventListener("click", () => applyDelta(+1));
minus1Btn.addEventListener("click", () => applyDelta(-1));

plus10Btn.addEventListener("click", () => applyDelta(+10));
minus10Btn.addEventListener("click", () => applyDelta(-10));

plus100Btn.addEventListener("click", () => applyDelta(+100));
minus100Btn.addEventListener("click", () => applyDelta(-100));

resetBtn.addEventListener("click", () => {
  if (!gameRunning) return;
  counter = 0;
  updateUI();
});

buyPlus10Btn.addEventListener("click", () => buyBoost("plus10"));
buyMinus10Btn.addEventListener("click", () => buyBoost("minus10"));
buyPlus100Btn.addEventListener("click", () => buyBoost("plus100"));
buyMinus100Btn.addEventListener("click", () => buyBoost("minus100"));

// ---------- INIT ----------
updateUI();
elTask.textContent = "Press Start to begin."