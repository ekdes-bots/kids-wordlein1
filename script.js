// Launch anchor: Resets daily at 7:00 AM ET starting today (Nov 5, 2026)
const START_DATE_UTC = Date.UTC(2026, 10, 5, 12, 0, 0); 

const DAILY_PUZZLES = [
  [
    { target: "SMILE", clueWord: "TRAIN" },
    { target: "PLANT", clueWord: "HOUSE" },
    { target: "WATER", clueWord: "OCEAN" }
  ],
  [
    { target: "CHAIR", clueWord: "BEACH" },
    { target: "DRIVE", clueWord: "WHEEL" },
    { target: "APPLE", clueWord: "FRUIT" }
  ],
  [
    { target: "HOUSE", clueWord: "STONE" },
    { target: "TIGER", clueWord: "SNAKE" },
    { target: "PIANO", clueWord: "MUSIC" }
  ],
  [
    { target: "RADIO", clueWord: "AUDIO" },
    { target: "MUSIC", clueWord: "SOUND" },
    { target: "SPACE", clueWord: "EARTH" }
  ],
  [
    { target: "LUNAR", clueWord: "SPACE" },
    { target: "CLOUD", clueWord: "STORM" },
    { target: "RAINY", clueWord: "WATER" }
  ],
  [
    { target: "BREAD", clueWord: "FLOUR" }, { target: "SUGAR", clueWord: "SWEET" }, { target: "BRICK", clueWord: "HOUSE" }
  ],
  [
    { target: "PAPER", clueWord: "PENCIL" }, { target: "ERASER", clueWord: "CLEAN" }, { target: "LIGHT", clueWord: "BULB" }
  ],
  [
    { target: "LASER", clueWord: "BEAM" }, { target: "SHIRT", clueWord: "PANTS" }, { target: "SHOES", clueWord: "BOOTS" }
  ],
  [
    { target: "OCEAN", clueWord: "WATER" }, { target: "CORAL", clueWord: "REEFS" }, { target: "WHALE", clueWord: "OCEAN" }
  ],
  [
    { target: "TOWER", clueWord: "CASTLE" }, { target: "BRIDGE", "clueWord": "RIVER" }, { target: "MONEY", "clueWord": "COIN" }
  ]
].map(set => set.map(item => ({
  target: item.target.padEnd(5, 'X').slice(0, 5).toUpperCase(),
  clueWord: item.clueWord.padEnd(5, 'X').slice(0, 5).toUpperCase()
})));

// Game State
let currentDayIndex = 0;
let currentGameIndex = 0; // 0, 1, or 2
let currentPuzzle = null;
let guesses = [];
let currentGuess = "";
let isGameOver = false;

// DOM Elements
const gridEl = document.getElementById("wordle-grid");
const keyboardEl = document.getElementById("keyboard");
const statusEl = document.getElementById("game-status");
const trackerEl = document.getElementById("puzzle-tracker");
const statStreakEl = document.getElementById("stat-streak");
const statCompletedEl = document.getElementById("stat-completed");
const historyListEl = document.getElementById("history-list");

const KEYS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACK"]
];

function getDailyPuzzleIndex() {
  const now = new Date();
  const isEDT = isDaylightSavings(now);
  const etOffsetHours = isEDT ? 4 : 5; 
  const diffMs = now.getTime() - (START_DATE_UTC - (etOffsetHours * 60 * 60 * 1000));
  const dayIndex = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, dayIndex) % DAILY_PUZZLES.length;
}

function isDaylightSavings(date) {
  const jan = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
  const jul = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
  return Math.min(jan, jul) !== date.getTimezoneOffset();
}

function initGame() {
  currentDayIndex = getDailyPuzzleIndex();
  
  const savedData = loadProgress();
  if (savedData && savedData.dayIndex === currentDayIndex) {
    currentGameIndex = savedData.gameIndex;
    isGameOver = savedData.isGameOver;
  } else {
    currentGameIndex = 0;
    isGameOver = false;
  }

  currentPuzzle = DAILY_PUZZLES[currentDayIndex][currentGameIndex];
  guesses = savedData && savedData.dayIndex === currentDayIndex ? savedData.guesses || [] : [];
  currentGuess = "";

  updateTracker();
  renderGrid();
  renderKeyboard();
  renderStatsAndHistory();
}

function updateTracker() {
  if (isGameOver && currentGameIndex >= 3) {
    trackerEl.textContent = "🎉 Day Completed!";
  } else {
    trackerEl.textContent = `Wordle in 1 (${currentGameIndex + 1} of 3) • Try ${guesses.length + 1}/6`;
  }
}

function getEvaluatedColors(guess, target) {
  const colors = Array(5).fill("absent");
  const targetLetters = target.split("");
  const guessLetters = guess.split("");

  for (let i = 0; i < 5; i++) {
    if (guessLetters[i] === targetLetters[i]) {
      colors[i] = "correct";
      targetLetters[i] = null;
      guessLetters[i] = null;
    }
  }

  for (let i = 0; i < 5; i++) {
    if (guessLetters[i] && targetLetters.includes(guessLetters[i])) {
      colors[i] = "present";
      targetLetters[targetLetters.indexOf(guessLetters[i])] = null;
    }
  }
  return colors;
}

function renderGrid() {
  gridEl.innerHTML = "";
  
  // 1. Clue Row
  const clueLabel = document.createElement("div");
  clueLabel.className = "row-label";
  clueLabel.textContent = "Clue Row:";
  gridEl.appendChild(clueLabel);

  const clueRowEl = document.createElement("div");
  clueRowEl.className = "wordle-row";
  const clueColors = getEvaluatedColors(currentPuzzle.clueWord, currentPuzzle.target);
  
  for (let c = 0; c < 5; c++) {
    const tileEl = document.createElement("div");
    tileEl.className = `wordle-tile ${clueColors[c]}`;
    tileEl.textContent = currentPuzzle.clueWord[c];
    clueRowEl.appendChild(tileEl);
  }
  gridEl.appendChild(clueRowEl);

  // 2. Active Guess Row (Only show current attempt row)
  const guessLabel = document.createElement("div");
  guessLabel.className = "row-label";
  guessLabel.style.marginTop = "8px";
  guessLabel.textContent = `Your Guess (${guesses.length + 1}/6):`;
  gridEl.appendChild(guessLabel);

  const activeRowEl = document.createElement("div");
  activeRowEl.className = "wordle-row";
  
  for (let c = 0; c < 5; c++) {
    const tileEl = document.createElement("div");
    tileEl.className = "wordle-tile";
    
    const letter = currentGuess[c] || "";
    if (letter) {
      tileEl.textContent = letter;
      tileEl.classList.add("filled");
    }
    activeRowEl.appendChild(tileEl);
  }
  gridEl.appendChild(activeRowEl);
}

function renderKeyboard() {
  keyboardEl.innerHTML = "";
  const keyStates = {};

  // Factor in clue word colors
  const clueColors = getEvaluatedColors(currentPuzzle.clueWord, currentPuzzle.target);
  for (let i = 0; i < 5; i++) {
    const letter = currentPuzzle.clueWord[i];
    const status = clueColors[i];
    if (status === "correct") keyStates[letter] = "correct";
    else if (status === "present" && keyStates[letter] !== "correct") keyStates[letter] = "present";
    else if (status === "absent" && !keyStates[letter]) keyStates[letter] = "absent";
  }

  // Factor in previous guesses for this puzzle
  guesses.forEach(guess => {
    const evalColors = getEvaluatedColors(guess, currentPuzzle.target);
    for (let i = 0; i < 5; i++) {
      const letter = guess[i];
      const status = evalColors[i];
      if (status === "correct") keyStates[letter] = "correct";
      else if (status === "present" && keyStates[letter] !== "correct") keyStates[letter] = "present";
      else if (status === "absent" && !keyStates[letter]) keyStates[letter] = "absent";
    }
  });

  KEYS.forEach(row => {
    const rowEl = document.createElement("div");
    rowEl.className = "keyboard-row";
    
    row.forEach(key => {
      const btn = document.createElement("button");
      btn.className = "key";
      if (key === "ENTER" || key === "BACK") btn.classList.add("wide");
      btn.textContent = key === "BACK" ? "←" : key;
      
      if (keyStates[key]) {
        btn.classList.add(keyStates[key]);
      }
      
      btn.onclick = () => handleKeyPress(key);
      rowEl.appendChild(btn);
    });
    
    keyboardEl.appendChild(rowEl);
  });
}

function handleKeyPress(key) {
  if (isGameOver) return;

  if (key === "BACK") {
    currentGuess = currentGuess.slice(0, -1);
  } else if (key === "ENTER") {
    if (currentGuess.length !== 5) {
      statusEl.textContent = "Not enough letters";
      setTimeout(() => statusEl.textContent = "", 1500);
      return;
    }
    
    guesses.push(currentGuess);
    
    if (currentGuess === currentPuzzle.target) {
      if (currentGameIndex < 2) {
        statusEl.textContent = `Great job! Puzzle ${currentGameIndex + 1} solved!`;
        setTimeout(() => {
          statusEl.textContent = "";
          currentGameIndex++;
          currentPuzzle = DAILY_PUZZLES[currentDayIndex][currentGameIndex];
          guesses = [];
          currentGuess = "";
          saveProgress();
          updateTracker();
          renderGrid();
          renderKeyboard();
        }, 1200);
      } else {
        statusEl.textContent = "🏆 Amazing! Completed all 3 puzzles today!";
        isGameOver = true;
        saveProgress();
        recordGameResult(true);
        updateTracker();
      }
    } else if (guesses.length === 6) {
      statusEl.textContent = `Out of guesses! Word was ${currentPuzzle.target}`;
      isGameOver = true;
      saveProgress();
      recordGameResult(false);
      updateTracker();
    } else {
      currentGuess = "";
    }
    
    saveProgress();
    updateTracker();
    renderGrid();
    renderKeyboard();
  } else {
    if (currentGuess.length < 5) {
      currentGuess += key;
    }
  }
  renderGrid();
}

function saveProgress() {
  const data = {
    dayIndex: currentDayIndex,
    gameIndex: currentGameIndex,
    guesses: guesses,
    isGameOver: isGameOver
  };
  localStorage.setItem("wordle_in_1_progress", JSON.stringify(data));
}

function loadProgress() {
  try {
    const data = localStorage.getItem("wordle_in_1_progress");
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

function getStatsData() {
  try {
    const data = localStorage.getItem("wordle_in_1_stats");
    return data ? JSON.parse(data) : { streak: 0, history: {} };
  } catch (e) {
    return { streak: 0, history: {} };
  }
}

function recordGameResult(won) {
  let stats = getStatsData();
  const dayKey = `day_${currentDayIndex}`;
  
  if (!stats.history[dayKey]) {
    if (won) {
      stats.streak++;
    } else {
      stats.streak = 0;
    }
    stats.history[dayKey] = { won: won, day: currentDayIndex + 1 };
    localStorage.setItem("wordle_in_1_stats", JSON.stringify(stats));
  }
  renderStatsAndHistory();
}

function renderStatsAndHistory() {
  let stats = getStatsData();
  statStreakEl.textContent = `🔥 ${stats.streak}`;
  const totalCompleted = Object.values(stats.history).filter(h => h.won).length;
  statCompletedEl.textContent = `🏆 ${totalCompleted}`;

  historyListEl.innerHTML = "";
  const entries = Object.entries(stats.history);
  if (entries.length === 0) {
    historyListEl.innerHTML = `<div style="color: #888; font-size: 0.75rem; padding: 2px;">No completed days yet. Solve today's 3-in-1 set to record your score!</div>`;
  } else {
    entries.forEach(([key, record]) => {
      const item = document.createElement("div");
      item.className = `history-item ${record.won ? 'won' : 'lost'}`;
      item.innerHTML = `
        <span>Day #${record.day} Set</span>
        <span>${record.won ? '✅ Solved 3/3' : '❌ Failed'}</span>
      `;
      historyListEl.appendChild(item);
    });
  }
}

document.addEventListener("DOMContentLoaded", initGame);
