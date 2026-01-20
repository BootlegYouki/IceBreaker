// THE TARGET WORDS AND DICTIONARY ARE ON A SEPARATE FILE WHICH IS words.js

// localStorage.removeItem("wordle_guesses_" + (Math.floor((Date.now() - new Date(2025, 0, 1)) / 1000 / 60 / 60 / 24)));
const WORD_LENGTH = 5
const FLIP_ANIMATION_DURATION = 500
const DANCE_ANIMATION_DURATION = 500
const keyboard = document.querySelector("[data-keyboard]")
const alertContainer = document.querySelector("[data-alert-container]")
const guessGrid = document.querySelector("[data-guess-grid]")
const offsetFromDate = new Date(2025, 0, 1)
const msOffset = Date.now() - offsetFromDate
// const dayOffset = Math.floor(msOffset / 1000 / 60 / 60 / 24)
// const STORAGE_KEY = "wordle_guesses_" + dayOffset
const COMPLETED_WORDS_KEY = "wordle_completed_words"

let currentLevelIndex = 0;
let STORAGE_KEY = "wordle_guesses_level_0"; // Default, will change per level

const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const startBtn = document.getElementById("start-btn");
const quitBtn = document.getElementById("quit-btn");
const levelSelectScreen = document.getElementById("level-select-screen");
const levelGrid = document.getElementById("level-grid");
const backToStartBtn = document.getElementById("back-to-start-btn");
const resetProgressBtn = document.getElementById("reset-progress-btn"); // New Reset Button

// Get win modal and buttons
const winModal = document.getElementById("winModal");
const continueBtn = document.getElementById("continueBtn");

// Get lose modal and its content
const loseModal = document.getElementById("loseModal");
const loseContent = loseModal ? loseModal.querySelector(".lose-content") : null;
const loseReturnBtn = loseModal ? loseModal.querySelector("#returnBtn") : null;

// Get pause modal and its elements
const pauseModal = document.getElementById("pauseModal");
const pauseContinueBtn = document.getElementById("continueBtn");
const pauseQuitBtn = document.getElementById("pauseQuitBtn");

let bgMusic; // Store OST globally
let isGamePaused = false; // Track pause state

// Track all created Audio objects
window._activeAudios = [];

function createAudio(src, options = {}) {
  const audio = new Audio(src);
  if (options.volume !== undefined) audio.volume = options.volume;
  if (options.loop !== undefined) audio.loop = options.loop;
  window._activeAudios.push(audio);
  return audio;
}

function stopAllAudio() {
  window._activeAudios.forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
  window._activeAudios = [];
}

document.addEventListener("DOMContentLoaded", () => {
  // Auto-check removed for Level Selector to ensure we always start at the Title Screen
  // Checks are now performed in startGame() for the specific level.

  startBtn.addEventListener('click', function (event) {
    event.preventDefault();
    const btnSound = new Audio('./assets/sounds/buttonsound.mp3');
    btnSound.volume = 0.4;
    btnSound.play().catch(() => { });
    btnSound.addEventListener('ended', () => {
      showLevelSelector();
    }, { once: true });
    setTimeout(() => {
      showLevelSelector();
    }, 250);
  });

  if (backToStartBtn) {
    backToStartBtn.addEventListener('click', function (event) {
      event.preventDefault();
      const btnSound = new Audio('./assets/sounds/buttonsound.mp3');
      btnSound.volume = 0.4;
      btnSound.play().catch(() => { });
      levelSelectScreen.style.display = "none";
      startScreen.style.display = "flex";
    });
  }

  const resetConfirmModal = document.getElementById("resetConfirmModal");
  const confirmResetBtn = document.getElementById("confirmResetBtn");
  const cancelResetBtn = document.getElementById("cancelResetBtn");

  if (resetProgressBtn && resetConfirmModal) {
    resetProgressBtn.addEventListener("click", (event) => {
      event.preventDefault();
      const btnSound = new Audio('./assets/sounds/buttonsound.mp3');
      btnSound.volume = 0.4;
      btnSound.play().catch(() => { });
      resetConfirmModal.style.display = "flex";
    });

    if (confirmResetBtn) {
      confirmResetBtn.addEventListener("click", () => {
        // Clear all completion flags
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith("wordle_completed_level_") || key.startsWith("wordle_guesses_level_")) {
            localStorage.removeItem(key);
          }
        });
        // Refresh level selector grid
        initLevelSelector();
        resetConfirmModal.style.display = "none";
      });
    }

    if (cancelResetBtn) {
      cancelResetBtn.addEventListener("click", () => {
        resetConfirmModal.style.display = "none";
      });
    }
  }

  quitBtn.addEventListener('click', function (event) {
    event.preventDefault();
    // Play button sound if available
    const btnSound = new Audio('./assets/sounds/buttonsound.mp3');
    btnSound.volume = 0.4;
    btnSound.play().catch(() => { });
    btnSound.addEventListener('ended', () => {
      quitGame();
    }, { once: true });
    // Fallback in case sound doesn't load
    setTimeout(() => {
      quitGame();
    }, 250);
  });

  // Modal button handlers
  if (continueBtn) {
    continueBtn.addEventListener("click", () => {
      winModal.style.display = "none";
      // You can add logic here for continuing to next quest if needed
    });
  }

  // Add handler for win modal "Return to Main" button
  const winReturnBtn = document.getElementById("winModal")?.querySelector("#returnBtn");
  if (winReturnBtn) {
    winReturnBtn.onclick = () => {
      const btnSound = new Audio('./assets/sounds/buttonsound.mp3');
      btnSound.volume = 0.4;
      btnSound.play().catch(() => { });
      btnSound.addEventListener('ended', () => {
        stopAllAudio();
        winModal.style.display = "none";
        gameScreen.style.display = "none";
        showLevelSelector();
      }, { once: true });
      setTimeout(() => {
        stopAllAudio();
        winModal.style.display = "none";
        gameScreen.style.display = "none";
        showLevelSelector();
      }, 250);
    };
  }

  // Pause modal event listeners
  if (pauseContinueBtn) {
    pauseContinueBtn.addEventListener("click", () => {
      resumeGame();
    });
  }

  if (pauseQuitBtn) {
    pauseQuitBtn.addEventListener("click", () => {
      const btnSound = new Audio('./assets/sounds/buttonsound.mp3');
      btnSound.volume = 0.4;
      btnSound.play().catch(() => { });
      btnSound.addEventListener('ended', () => {
        stopAllAudio();
        gameScreen.style.display = "none";
        showLevelSelector();
      }, { once: true });
      setTimeout(() => {
        stopAllAudio();
        gameScreen.style.display = "none";
        showLevelSelector();
      }, 250);
    });
  }
});


function getCompletedWords() {
  // Standalone: return empty or just use localStorage logic
  // if (typeof questProgress !== "undefined" && questProgress.getCompletedWordleWords) {
  //   const wordleWords = questProgress.getCompletedWordleWords();
  //   return wordleWords.map(entry => entry.word);
  // }

  // Fallback: check localStorage guesses
  let completed = [];
  for (let i = 0; i < targetWords.length; i++) {
    const key = "wordle_guesses_" + i;
    let guesses = JSON.parse(localStorage.getItem(key)) || [];
    if (guesses.includes(targetWords[i])) {
      completed.push(targetWords[i]);
    }
  }
  return completed;
}

// Remove the immediate word selection - move it to a function
let targetWord = null;
let completedWords = [];
let remainingWords = [];

function selectTargetWord(levelIndex) {
  if (levelIndex !== undefined && levelIndex >= 0 && levelIndex < targetWords.length) {
    targetWord = targetWords[levelIndex];
  } else {
    targetWord = targetWords[0];
  }
}

function showLevelSelector() {
  startScreen.style.display = "none";
  levelSelectScreen.style.display = "flex";
  initLevelSelector();
}

function initLevelSelector() {
  levelGrid.innerHTML = "";
  targetWords.forEach((word, index) => {
    const btn = document.createElement("button");
    btn.classList.add("level-btn");
    btn.textContent = index + 1;

    const isCompleted = localStorage.getItem("wordle_completed_level_" + index) === "true";
    if (isCompleted) {
      btn.classList.add("completed");
    }

    btn.addEventListener("click", () => {
      const btnSound = new Audio('./assets/sounds/buttonsound.mp3');
      btnSound.volume = 0.4;
      btnSound.play().catch(() => { });
      startGame(index);
    });

    levelGrid.appendChild(btn);
  });
}

// No auto select on load
// setTimeout(() => {
//   selectTargetWord();
// }, 100);

function startGame(levelIndex) {
  currentLevelIndex = levelIndex;
  STORAGE_KEY = "wordle_guesses_level_" + levelIndex;

  // Only reset if the level hasn't been completed yet (allow retries for incorrect/incomplete, save wins)
  const isCompleted = localStorage.getItem("wordle_completed_level_" + levelIndex) === "true";
  if (!isCompleted) {
    localStorage.removeItem(STORAGE_KEY);
  }

  selectTargetWord(levelIndex);

  // Clear grid
  const tiles = guessGrid.querySelectorAll(".tile");
  tiles.forEach(tile => {
    tile.querySelector(".letter").textContent = "";
    delete tile.dataset.state;
    delete tile.dataset.letter;
    tile.classList.remove("flip", "dance", "shake");
  });

  // Reset keyboard
  const keys = keyboard.querySelectorAll(".key");
  keys.forEach(key => {
    key.classList.remove("correct", "wrong-location", "wrong", "duplicate");
  });

  levelSelectScreen.style.display = "none";
  gameScreen.style.display = "flex";

  // Show hint for the current level permanently
  const hintEl = document.getElementById("level-hint");
  if (hintEl) {
    hintEl.textContent = ""; // Clear previous
    if (typeof targetHints !== 'undefined' && targetHints[levelIndex]) {
      hintEl.textContent = "HINT: " + targetHints[levelIndex];
    }
  }

  bgMusic = createAudio("./assets/sounds/wordle_ost.mp3", { volume: 0.5, loop: true });
  bgMusic.play().catch(() => { });

  loadGuesses(); // Load guesses for THIS level

  if (isGameAlreadyWon()) {
    winModal.style.display = "flex";
    stopInteraction();
  } else if (isGameAlreadyLost()) {
    // Optional: show lost state or just let them see the board
    // If you want them to be able to reset, maybe don't show modal immediately
    // But if lost, they can't play?
    // Let's just show the board as is.
    stopInteraction();
  } else {
    if (typeof startInteraction === 'function') {
      startInteraction();
    }
  }
}

function saveCompletedWord(word) {
  let completed = JSON.parse(localStorage.getItem(COMPLETED_WORDS_KEY)) || [];
  if (!completed.includes(word)) {
    completed.push(word);
    localStorage.setItem(COMPLETED_WORDS_KEY, JSON.stringify(completed));
  }
}

function checkWinLose(guess, tiles) {
  if (guess === targetWord) {
    // Save the completed word to persistent list
    saveCompletedWord(targetWord);
    localStorage.setItem("wordle_completed_level_" + currentLevelIndex, "true");

    // Re-select target word for next game
    // setTimeout(() => {
    //   selectTargetWord();
    // }, 100);

    winModal.style.display = "flex";
    stopAllAudio();
    // Play victory sound when modal is shown
    const victorySound = createAudio("./assets/sounds/8bitsoundreward.mp3", { volume: 0.4 });
    victorySound.currentTime = 0;
    victorySound.play().catch(() => { });
    danceTiles(tiles)
    stopInteraction()
    // Save quest progress
    // Save quest progress (Disabled for standalone)
    // if (typeof questProgress !== "undefined" && questProgress.completeQuest3) {
    //   questProgress.completeQuest3();
    // }
    return
  }

  const remainingTiles = guessGrid.querySelectorAll(":not([data-letter])")

  if (remainingTiles.length === 0) {
    // Show lose modal instead of alert
    if (loseModal && loseContent) {
      stopAllAudio();
      const lostSound = createAudio("./assets/sounds/fail.mp3", { volume: 0.5 });
      lostSound.currentTime = 0;
      stopInteraction();
      lostSound.play().catch(() => { });
      loseModal.style.display = "flex";
      loseContent.querySelector("h2").textContent = "GAME OVER";
      const loseParagraphs = loseContent.querySelectorAll("p");
      if (loseParagraphs.length >= 2) {
        loseParagraphs[0].innerHTML = "Nice try!";
        loseParagraphs[1].textContent = "Give it another shot.";
        if (loseParagraphs[2]) loseParagraphs[2].textContent = "The word hasn't changed.";
      }
      // Return button handler
      if (loseReturnBtn) {
        loseReturnBtn.onclick = () => {
          const btnSound = new Audio('./assets/sounds/buttonsound.mp3');
          btnSound.volume = 0.4;
          btnSound.play().catch(() => { });
          btnSound.addEventListener('ended', () => {
            stopAllAudio();
            loseModal.style.display = "none";
            gameScreen.style.display = "none";
            showLevelSelector();
          }, { once: true });
        };
      }
    }
  }
}

// Function to quit the game
function quitGame() {
  if (window.__TAURI__) {
    // Attempt to use the process plugin logic if exposed, or just close window which in single-window app acts as quit
    // But since "Quit" implies exit, let's try the process exit
    try {
      // In v2 with globalTauri, it might be window.__TAURI__.process.exit(0)
      window.__TAURI__.process.exit(0);
    } catch (e) {
      console.error("Failed to exit via process plugin:", e);
      // Fallback
      window.close();
    }
  } else {
    // Fallback for dev or web
    window.close();
  }
}

// Handler for Pause Quit Button to go back to Level Select
if (pauseQuitBtn) {
  pauseQuitBtn.addEventListener("click", (e) => {
    // Override the default listener if possible, strictly speaking
    // But since we are replacing the file content, we can just change the logic there
    // ACTUALLY, I need to update the pauseQuitBtn listener added in DOMContentLoaded
  });
}

// Pause game function
function pauseGame() {
  if (isGamePaused) return; // Already paused
  isGamePaused = true;
  stopInteraction();
  if (bgMusic) {
    bgMusic.pause();
  }
  pauseModal.style.display = "flex";

  // Play pause sound
  const pauseSound = new Audio('./assets/sounds/buttonsound.mp3');
  pauseSound.volume = 0.3;
  pauseSound.play().catch(() => { });
}

// Resume game function
function resumeGame() {
  if (!isGamePaused) return; // Not paused
  isGamePaused = false;
  pauseModal.style.display = "none";
  if (bgMusic) {
    bgMusic.play().catch(() => { });
  }
  startInteraction();

  // Play resume sound
  const resumeSound = new Audio('./assets/sounds/buttonsound.mp3');
  resumeSound.volume = 0.3;
  resumeSound.play().catch(() => { });
}

function startInteraction() {
  document.addEventListener("click", handleMouseClick)
  document.addEventListener("keydown", handleKeyPress)
}

function stopInteraction() {
  document.removeEventListener("click", handleMouseClick)
  document.removeEventListener("keydown", handleKeyPress)
}

function handleMouseClick(e) {
  if (isGamePaused) return; // Don't handle clicks when paused

  if (e.target.matches("[data-key]")) {
    playHoverSound();
    pressKey(e.target.dataset.key)
    return
  }
  if (e.target.matches("[data-enter]")) {
    playHoverSound();
    submitGuess()
    return
  }

  if (e.target.matches("[data-delete]")) {
    playHoverSound();
    deleteKey()
    return
  }
}

function handleKeyPress(e) {
  // Handle Escape key for pause
  if (e.key === "Escape") {
    e.preventDefault();
    if (isGamePaused) {
      resumeGame();
    } else {
      pauseGame();
    }
    return;
  }

  if (isGamePaused) return; // Don't handle other keys when paused

  if (e.key === "Enter") {
    playHoverSound();
    submitGuess()
    return
  }

  if (e.key === "Backspace" || e.key === "Delete") {
    playHoverSound();
    deleteKey()
    return
  }

  if (e.key.match(/^[a-z]$/)) {
    playHoverSound();
    pressKey(e.key)
    return
  }
}

// Play game_hover.mp3 sound
function playHoverSound() {
  const hoverSound = createAudio("./assets/sounds/game_hover.mp3", { volume: 0.3 });
  hoverSound.play().catch(() => { });
}

const tiles = Array.from(guessGrid.querySelectorAll(".tile"));
const letterDivs = tiles.map(tile => tile.querySelector(".letter"));

function pressKey(key) {
  const activeTiles = getActiveTiles()
  if (activeTiles.length >= WORD_LENGTH) return
  const nextTile = Array.from(tiles).find(tile => !tile.dataset.state && !tile.dataset.letter)
  if (!nextTile) return
  const nextIndex = tiles.indexOf(nextTile)
  const letterDiv = letterDivs[nextIndex]
  nextTile.dataset.letter = key.toLowerCase()
  letterDiv.textContent = key
  nextTile.dataset.state = "active"
}

function deleteKey() {
  const activeTiles = getActiveTiles()
  const lastIndex = activeTiles.length - 1
  if (lastIndex < 0) return
  const lastTile = activeTiles[lastIndex]
  const lastLetterDiv = lastTile.querySelector(".letter")
  lastLetterDiv.textContent = ""
  delete lastTile.dataset.state
  delete lastTile.dataset.letter
}

function submitGuess() {
  const activeTiles = [...getActiveTiles()]
  if (activeTiles.length !== WORD_LENGTH) {
    showAlert("Not Enough Letters!", "Words must contain 5 letters")
    shakeTiles(activeTiles)
    return
  }

  const guess = activeTiles.reduce((word, tile) => {
    return word + tile.dataset.letter
  }, "")

  if (!dictionary.includes(guess)) {
    showAlert("Invalid Word", "That word is not in the dictionary")
    shakeTiles(activeTiles)
    return
  }

  stopInteraction()
  saveGuess(guess)

  // No need to reset duplicate alert flag here
  activeTiles.forEach((...params) => flipTile(...params, guess))
}

function flipTile(tile, index, array, guess, skipAnimation = false) {
  const letter = tile.dataset.letter
  const key = keyboard.querySelector(`[data-key="${letter}"i]`)
  const occurrences = [...targetWord].filter(l => l === letter).length

  function applyState() {
    if (targetWord[index] === letter) {
      if (occurrences > 1) {
        tile.dataset.state = "duplicate"
        key.classList.add("duplicate")
        // Show alert only once for the whole game
        if (!window._duplicateAlertShownGlobal) {
          showAlert("Blue Tile", "Blue Tile means CORRECT but also appears ELSEWHERE in the word.", 9000)
          window._duplicateAlertShownGlobal = true;
        }
      } else {
        tile.dataset.state = "correct"
        key.classList.add("correct")
      }
    } else if (targetWord.includes(letter)) {
      tile.dataset.state = "wrong-location"
      key.classList.add("wrong-location")
    } else {
      tile.dataset.state = "wrong"
      key.classList.add("wrong")
    }
  }

  if (!skipAnimation) {
    setTimeout(() => {
      const bubbleSound = createAudio("./assets/sounds/bubblesound.mp3", { volume: 0.4 });
      bubbleSound.currentTime = 0;
      bubbleSound.play().catch(() => { });
      tile.classList.add("flip")
    }, index * FLIP_ANIMATION_DURATION / 2)
  }
  tile.addEventListener("transitionend", () => {
    tile.classList.remove("flip")
    applyState()
    if (index === array.length - 1) {
      tile.addEventListener("transitionend", () => {
        tile.classList.remove("flip")
        startInteraction()
        checkWinLose(guess, array)
      }, { once: true })
    }
  }, { once: true })

  // If skipping animation, immediately set state
  if (skipAnimation) {
    tile.classList.remove("flip")
    applyState()
    if (index === array.length - 1) {
      startInteraction()
      checkWinLose(guess, array)
    }
  }
}

function getActiveTiles() {
  return guessGrid.querySelectorAll('[data-state="active"]')
}

function showAlert(title, description, duration = 2500) {
  const alert = document.createElement("div")
  alert.classList.add("alert")

  // Image container
  const imageContainer = document.createElement("div")
  imageContainer.classList.add("image-container")
  const img = document.createElement("img")
  img.src = "./assets/images/alert.webp"
  img.alt = ""
  img.classList.add("alert-img")
  imageContainer.appendChild(img)

  // Text container
  const textContainer = document.createElement("div")
  textContainer.classList.add("text-container")
  const alertTitle = document.createElement("div")
  alertTitle.classList.add("alert-title")
  alertTitle.textContent = title
  const alertDescription = document.createElement("div")
  alertDescription.classList.add("alert-description")
  alertDescription.textContent = description
  textContainer.appendChild(alertTitle)
  textContainer.appendChild(alertDescription)

  alert.appendChild(imageContainer)
  alert.appendChild(textContainer)

  alertContainer.prepend(alert)

  setTimeout(() => {
    alert.style.animation = "fadeOut 0.5s forwards"
    setTimeout(() => {
      alert.remove()
    }, 500)
  }, duration)
}

function shakeTiles(tiles) {
  tiles.forEach(tile => {
    tile.classList.add("shake")
    tile.addEventListener("animationend", () => {
      tile.classList.remove("shake")
    }, { once: true })
  })
}

function danceTiles(tiles) {
  tiles.forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.add("dance")
      tile.addEventListener(
        "animationend",
        () => {
          tile.classList.remove("dance")
        },
        { once: true }
      )
    }, (index * DANCE_ANIMATION_DURATION) / 5)
  })
}

function saveGuess(guess) {
  let guesses = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  guesses.push(guess)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(guesses))
}

function loadGuesses() {
  let guesses = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  guesses.forEach(guess => renderGuess(guess, true))
}

function renderGuess(guess, skipAnimation = false) {
  const activeTiles = Array.from(tiles).filter(tile => !tile.dataset.state && !tile.dataset.letter).slice(0, WORD_LENGTH)
  guess.split("").forEach((letter, i) => {
    activeTiles[i].dataset.letter = letter
    activeTiles[i].querySelector(".letter").textContent = letter
    activeTiles[i].dataset.state = "active"
  })
  stopInteraction()
  activeTiles.forEach((...params) => flipTile(...params, guess, skipAnimation))
}

function resetGuessesIfNeeded() {
  // If the stored key is not today's, clear it
  // For Level Selector mode, maybe we don't clear?
  // User can replay or not? User said "needed to be guessed".
  // Let's NOT clear based on date for now.
  /*
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith("wordle_guesses_") && key !== STORAGE_KEY) {
      localStorage.removeItem(key)
    }
  })
  */
}

function isGameAlreadyWon() {
  // if (typeof questProgress !== "undefined" && questProgress.getCompletedWordleWords) {
  //   return questProgress.getCompletedWordleWords().some(entry => entry.dayIndex === dayOffset);
  // }
  let guesses = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  return guesses.includes(targetWord);
}

function isGameAlreadyLost() {
  let guesses = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  // Game is lost if 6 guesses and none match the target word
  return guesses.length === 6 && !guesses.includes(targetWord);
}

// resetGuessesIfNeeded()
loadGuesses()

const inGameBackBtn = document.getElementById("in-game-back-btn");
if (inGameBackBtn) {
  inGameBackBtn.addEventListener('click', (event) => {
    event.preventDefault();
    // Play button sound
    const btnSound = new Audio('./assets/sounds/buttonsound.mp3');
    btnSound.volume = 0.4;
    btnSound.play().catch(() => { });

    stopAllAudio();
    gameScreen.style.display = "none";
    showLevelSelector();
  });
}
// The closeWordListBtn would have been defined in the context of the word list modal.
// Since the word list modal and its related functions are removed, this line
// would cause a ReferenceError if closeWordListBtn is not defined elsewhere.
// Assuming it's meant to be removed along with the word list functionality.
// If it's intended to remain, it needs to be defined or handled.
// For now, following the instruction to place it here, but noting the potential issue.
const closeWordListBtn = document.getElementById("closeWordListBtn"); // Re-declare if it's truly needed
if (closeWordListBtn) {
  closeWordListBtn.remove();
}

window.resetWordleGuesses = function () {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn("Could not remove STORAGE_KEY from localStorage:", e);
  }
  // Reset UI and audio state
  if (typeof resetBoard === "function") resetBoard();
  if (typeof loadGuesses === "function") loadGuesses();
  if (typeof stopAllAudio === "function") stopAllAudio();
  console.info("Wordle guesses reset for today. Board cleared.");
}

function logCompletedWordleWords() {
  const systemDate = new Date().toISOString().slice(0, 10);
  console.log(`System Date: ${systemDate}`);
}