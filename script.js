// Launch anchor: Resets daily at 7:00 AM ET starting today (Nov 5, 2026)
const START_DATE_UTC = Date.UTC(2026, 10, 5, 12, 0, 0); 

// 75 Days of 3-Wordle Daily Sets (Each day has 3 sequential 5-letter words)
const DAILY_PUZZLES = [
  ["PLANT", "SMILE", "TRAIN"], ["BEACH", "CHAIR", "DRIVE"], ["APPLE", "HOUSE", "WATER"],
  ["SNAKE", "TIGER", "HOUSE"], ["PIANO", "GUITAR", "MUSIC"], ["SPACE", "EARTH", "LUNAR"],
  ["CLOUD", "STORM", "RAINY"], ["BREAD", "SUGAR", "FLOUR"], ["STONE", "BRICK", "METAL"],
  ["PAPER", "PENCIL", "ERASER"], ["LIGHT", "LASER", "BULB"], ["SHIRT", "PANTS", "SHOES"],
  ["OCEAN", "CORAL", "WHALE"], ["TOWER", "BRIDGE", "CASTLE"], ["MONEY", "COIN", "WALLET"],
  ["CLOCK", "WATCH", "TIMER"], ["FRUIT", "BERRY", "MELON"], ["HAPPY", "SMILE", "LAUGH"],
  ["GREEN", "PLANT", "LEAFy".slice(0,5)], ["NORTH", "SOUTH", "BOARD"], ["RADIO", "AUDIO", "VOICE"],
  ["FROST", "WINTER", "CHILL".slice(0,5)], ["SHARK", "CRAB", "TUTOR"], ["TRAIN", "TRACK", "WHEEL"],
  ["CHESS", "CHECK", "BOARD"], ["SHINE", "GLOW", "SPARK"], ["SWEET", "CANDY", "HONEY"],
  ["FLOOR", "CEILING", "WALLS".slice(0,5)], ["CHEF", "PLATE", "SPOON".padEnd(5,'S').slice(0,5)], ["TENT", "CABIN", "MOTEL"],
  // Days 31 - 75
  ["BRAIN", "THINK", "SOLVE"], ["NIGHT", "DREAM", "SLEEP"], ["CLEAN", "WASH", "SCRUB"],
  ["PAINT", "BRUSH", "COLOR"], ["GAMES", "PLAY", "SCORE"], ["PILOT", "PLANE", "FLIGHT"],
  ["GHOST", "MAGIC", "SPELL"], ["TOWER", "QUEEN", "KNIGHT"], ["RIVER", "CREEK", "FLOOD"],
  ["MOUSE", "KEY", "SCREEN"], ["STARE", "BLINK", "VISION"], ["BRUSH", "COMB", "MIRROR"],
  ["PLAZA", "STORE", "MARKET"], ["STEAK", "ROAST", "GRILL"], ["JUICE", "DRINK", "WATER"],
  ["SHARK", "WHALE", "CORAL"], ["TRACK", "FIELD", "SPORT"], ["CROWN", "THRONE", "ROYAL"],
  ["BLADE", "KNIFE", "SWORD"], ["FRAME", "PHOTO", "IMAGE"], ["SHADE", "SHADOW", "DARK"],
  ["GARDEN", "PLANT", "SEEDS".slice(0,5)], ["TIGER", "LION", "ZEBRA"], ["BEARS", "CUBS", "DEN"],
  ["WAVES", "OCEAN", "BEACH"], ["CLOUD", "WINDS", "STORMS".slice(0,5)], ["VALLEY", "HILLS", "MOUNTAIN".slice(0,5)],
  ["PEACE", "QUIET", "CALM"], ["QUICK", "SPEED", "HASTE"], ["SHARP", "POINT", "EDGE"],
  ["MAGIC", "WITCH", "BROOM"], ["SUPER", "HERO", "POWER"], ["PILOT", "CABIN", "WINGS"],
  ["RADIO", "SIGNAL", "WAVES".slice(0,5)], ["STAGE", "ACTOR", "DRAMA"], ["STAMP", "LETTER", "POST"],
  ["AUDIO", "SOUND", "MUSIC"], ["BONUS", "PRIZE", "AWARD"], ["CHAMP", "WINNER", "TROPHY"],
  ["SHINE", "BRIGHT", "STAR"], ["GUIDE", "LEAD", "TRAIL"], ["SCOPE", "LENS", "FOCUS"],
  ["FOUND", "BUILD", "CREATE"], ["DRAFT", "WRITE", "PAPER"], ["FINAL", "END", "GOAL"]
];

// Game State
let currentDayIndex = 0;
let currentWordleIndex = 0; // 0, 1, or 2
let currentWord = "";
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
  
  // Load saved progress for today's 3-in-1 set from localStorage
  const savedData = loadProgress();
  if (savedData && savedData.dayIndex === currentDayIndex) {
    currentWordleIndex = savedData.wordleIndex;
    isGameOver = savedData.isGameOver;
  } else {
    currentWordleIndex = 0;
    isGameOver = false;
  }

  currentWord = DAILY_PUZZLES[currentDayIndex][currentWordleIndex].toUpperCase();
  guesses = savedData && savedData.dayIndex === currentDayIndex ? savedData.guesses || [] : [];
  currentGuess = "";

  updateTracker();
  renderGrid();
  renderKeyboard();
  renderStatsAndHistory();
}

function updateTracker() {
  if (isGameOver && currentWordleIndex >= 3) {
    trackerEl.textContent = "🎉 Day Completed!";
  } else {
    trackerEl.textContent = `Wordle ${currentWordleIndex + 1} of 3`;
  }
}

function renderGrid() {
  gridEl.innerHTML = "";
  for (let r = 0; r < 6; r++) {
    const rowEl = document.createElement("div");
    rowEl.className = "wordle-row";
    
    const guessWord = guesses[r] || (r === guesses.length ? currentGuess : "");
    
    for (let c = 0; c < 5; c++) {
      const tileEl = document.createElement("div");
      tileEl.className = "wordle-tile";
      
      const letter = guessWord[c] || "";
      if (letter) {
        tileEl.textContent = letter;
        tileEl.classList.add("filled");
      }

      // Color evaluated guesses
      if (r < guesses.length) {
        const targetLetters = currentWord.split("");
        const guessLetters = guesses[r].split("");
        
        // Correct check
        if (guessLetters[c] === targetLetters[c]) {
          tileEl.classList.add("correct");
          targetLetters[c] = null;
          guessLetters[c] = null;
        }
      }
      
      rowEl.appendChild(tileEl);
    }

    // Second pass for present/absent coloring
    if (r < guesses.length) {
      const targetLetters = currentWord.split("");
      const guessLetters = guesses[r].split("");
      
      // Clear correct matches first
      for (let c = 0; c < 5; c++) {
        if (guessLetters[c] === targetLetters[c]) {
          targetLetters[c] = null;
          guessLetters[c] = null;
        }
      }

      for (let c = 0; c < 5; c++) {
        const tileEl = rowEl.children[c];
        if (tileEl.classList.contains("correct")) continue;
        
        const letter = guessLetters[c];
        if (letter && targetLetters.includes(letter)) {
          tileEl.classList.add("present");
          targetLetters[targetLetters.indexOf(letter)] = null;
        } else if (letter) {
          tileEl.classList.add("absent");
        }
      }
    }

    gridEl.appendChild(rowEl);
  }
}

function renderKeyboard() {
  keyboardEl.innerHTML = "";
  
  // Calculate key states
  const keyStates = {};
  guesses.forEach(guess => {
    const targetLetters = currentWord.split("");
    const guessLetters = guess.split("");
    
    for (let i = 0; i < 5; i++) {
      if (guessLetters[i] === targetLetters[i]) {
        keyStates[guessLetters[i]] = "correct";
        targetLetters[i] = null;
        guessLetters[i] = null;
      }
    }
    
    for (let i = 0; i < 5; i++) {
      const letter = guessLetters[i];
      if (!letter) continue;
      if (targetLetters.includes(letter)) {
        if (keyStates[letter] !== "correct") keyStates[letter] = "present";
        targetLetters[targetLetters.indexOf(letter)] = null;
      } else {
        if (!keyStates[letter]) keyStates[letter] = "absent";
      }
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
    
    if (currentGuess === currentWord) {
      // Word solved! Move to next wordle or finish set
      if (currentWordleIndex < 2) {
        statusEl.textContent = `Awesome! Word ${currentWordleIndex + 1} solved!`;
        setTimeout(() => {
          statusEl.textContent = "";
          currentWordleIndex++;
          currentWord = DAILY_PUZZLES[currentDayIndex][currentWordleIndex].toUpperCase();
          guesses = [];
          currentGuess = "";
          saveProgress();
          updateTracker();
          renderGrid();
          renderKeyboard();
        }, 1200);
      } else {
        // All 3 wordles solved!
        statusEl.textContent = "🏆 Amazing! Completed all 3 wordles today!";
        isGameOver = true;
        saveProgress();
        recordGameResult(true);
        updateTracker();
      }
    } else if (guesses.length === 6) {
      // Out of guesses for this wordle
      statusEl.textContent = `Out of guesses! Word was ${currentWord}`;
      isGameOver = true;
      saveProgress();
      recordGameResult(false);
      updateTracker();
    } else {
      currentGuess = "";
    }
    
    saveProgress();
    renderGrid();
    renderKeyboard();
  } else {
    if (currentGuess.length < 5) {
      currentGuess += key;
    }
  }
  renderGrid();
}

// LocalStorage Persistence
function saveProgress() {
  const data = {
    dayIndex: currentDayIndex,
    wordleIndex: currentWordleIndex,
    guesses: guesses,
    isGameOver: isGameOver
  };
  localStorage.setItem("wordle_3in1_progress", JSON.stringify(data));
}

function loadProgress() {
  try {
    const data = localStorage.getItem("wordle_3in1_progress");
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

function getStatsData() {
  try {
    const data = localStorage.getItem("wordle_3in1_stats");
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
    localStorage.setItem("wordle_3in1_stats", JSON.stringify(stats));
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
    historyListEl.innerHTML = `<div style="color: #888; font-size: 0.8rem; padding: 4px;">No completed days yet. Solve today's 3-in-1 set to record your score!</div>`;
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
