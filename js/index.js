// load highscores
const highscoresEl = document.getElementById("highscores");
let highscores = localStorage.getItem("highscores") || Array(5).fill(0);
if (typeof highscores == "string") highscores = highscores.split(";");
loadHighscores();

function loadHighscores() {
  highscoresEl.innerHTML = "";
  localStorage.setItem("highscores", highscores.join(";"));
  for (const highscore of highscores) {
    const listItem = document.createElement("li");
    listItem.innerText = highscore;
    listItem.classList.add("highlighted-text"); // Add class for styling
    highscoresEl.appendChild(listItem);
  }
}

// get wordlist and syllables from server
const words = (await (await fetch("assets/wordlist.txt")).text()).split("\r\n");
const syllables = await (await fetch("assets/syllables.json")).json();

const wordsPerPromptInput = document.getElementById("wordsPerPromptInput");
const infiniteModeInput = document.getElementById("infiniteModeInput");
const promptTimeInput = document.getElementById("promptTimeInput");
const gameTimeInput = document.getElementById("gameTimeInput");
const saveSettingsButton = document.getElementById("saveSettingsButton");
const settingsButton = document.getElementById("settingsButton");
const settingsContainer = document.getElementById("settingsContainer");

settingsButton.addEventListener("click", () => {
  settingsContainer.style.display = settingsContainer.style.display === "block" ? "none" : "block";
});

const startContainer = document.getElementById("startContainer");
const gameContainer = document.getElementById("gameContainer");

const startButton = document.getElementById("startButton");
const wordPrompt = document.getElementById("wordPrompt");
const inputWord = document.getElementById("inputWord");
const enterButton = document.getElementById("enterButton");
const gameTimeEl = document.getElementById("gameTime");
// Add this event listener for the close button
const closeSettingsButton = document.getElementById("closeSettingsButton");

closeSettingsButton.addEventListener("click", () => {
  settingsContainer.style.display = "none"; // Hide the settings container when the close button is clicked
});


const finalScoreEl = document.getElementById("finalScore");
const scoreEl = document.getElementById("score");
const highscoreTitle = document.querySelector("h3[style*='Highscores']");

let promptTimeInterval;
let promptTime = 8;
let gameTime = 60;
let wordsPerPrompt = parseInt(wordsPerPromptInput.value) || 5000;

function findSyllables(wordsPerPrompt) {
  let output = [];
  for (const count of Object.keys(syllables).reverse()) {
    if (parseInt(count) >= wordsPerPrompt) {
      output = output.concat(syllables[count]);
    } else {
      break;
    }
  }
  return output;
}

let currentSyllables = findSyllables(wordsPerPrompt);
let inputtedWords = [];
let inGame = false;
let score = 0;

function findHighscoreIndex(score) {
  const index = highscores.findIndex(highscore => highscore < score);
  return index < 0 ? highscores.length - 1 : index;
}

function updateScore(plus) {
  plus ? score++ : score--;
  scoreEl.innerText = `Score: ${score}`;
}

function nextPrompt() {
  const newSyllable =
    currentSyllables[Math.round(Math.random() * (currentSyllables.length - 1))];
  console.log("current syllable:", newSyllable);
  wordPrompt.innerText = newSyllable;
  wordPrompt.classList.add("highlighted-text"); // Add highlight class
  inputWord.value = "";
  if (infiniteModeInput.checked) return;
  let currentPromptTime = promptTime;
  clearInterval(promptTimeInterval);
  promptTimeInterval = setInterval(() => {
    if (currentPromptTime-- == 1) {
      nextPrompt();
      updateScore(false);
    }
  }, 1000);
}



function showBombAndExplode() {
  const bombContainer = document.getElementById("bombContainer");
  const bomb = document.getElementById("bomb");

  bombContainer.style.display = "block"; // Show the bomb

  setTimeout(() => {
    bomb.style.animation = "explode 0.5s forwards"; // Trigger explosion animation
    setTimeout(() => {
      bombContainer.style.display = "none"; // Hide the bomb after explosion
    }, 500);
  }, 500);
}

function endGame() {
  clearInterval(promptTimeInterval);
  inGame = false;

  showBombAndExplode(); // Show bomb animation when game ends

  if (score > highscores[highscores.length - 1]) {
    highscores.splice(findHighscoreIndex(score), 0, score);
    highscores.pop();
    loadHighscores();
  }
  finalScoreEl.innerText = `Final Score: ${score}`;
  finalScoreEl.classList.add("highlighted-text"); 
  score = 0;
  gameTime = 60;
  inputtedWords = [];
  gameContainer.style.display = "none";
  startContainer.style.display = "block";
  let bombSound = document.getElementById("bombSound");
  let explosionSound = document.getElementById("explosionSound");

  // Stop ticking sound
  bombSound.pause();
  bombSound.currentTime = 0;

  // Play explosion sound
  explosionSound.play();
}



function startGame() {
  // Load latest settings before starting
  wordsPerPrompt = parseInt(wordsPerPromptInput.value) || 5000;
  promptTime = parseInt(promptTimeInput.value) || 8;
  gameTime = parseInt(gameTimeInput.value) || 60;

  let bombSound = document.getElementById("bombSound");
  bombSound.currentTime = 0; // Restart ticking sound
  bombSound.play(); // Start ticking sound

  inGame = true;
  startContainer.style.display = "none";
  gameContainer.style.display = "block";
  nextPrompt();
  inputWord.focus();

  if (infiniteModeInput.checked) {
    gameTimeEl.innerText = "Infinite mode";
    return;
  }
  gameTimeEl.innerText = `${gameTime}s`;
  gameTimeEl.classList.add("highlighted-text");

  let currentGameTime = gameTime;
  let gameTimeInterval = setInterval(() => {
    if (currentGameTime-- == 1) {
      endGame();
      clearInterval(gameTimeInterval);
    }
    gameTimeEl.innerText = `${currentGameTime}s`;
  }, 1000);
}


// Load saved settings from localStorage
function loadSettings() {
  const savedWordsPerPrompt = localStorage.getItem("wordsPerPrompt");
  const savedInfiniteMode = localStorage.getItem("infiniteMode");
  const savedPromptTime = localStorage.getItem("promptTime");
  const savedGameTime = localStorage.getItem("gameTime");

  if (savedWordsPerPrompt) wordsPerPromptInput.value = savedWordsPerPrompt;
  if (savedInfiniteMode !== null) infiniteModeInput.checked = savedInfiniteMode === "true";
  if (savedPromptTime) promptTimeInput.value = savedPromptTime;
  if (savedGameTime) gameTimeInput.value = savedGameTime;
}

// Call loadSettings when the page loads
window.addEventListener("load", loadSettings);


startButton.addEventListener("click", startGame);
document.getElementById("skipButton").addEventListener("click", nextPrompt);

function submitWord() {
  const word = inputWord.value.toLowerCase();
  if (!inputtedWords.includes(word) && word.includes(wordPrompt.innerText) && words.includes(word)) {
    updateScore(true);
    inputtedWords.push(word);
    nextPrompt();
  }
}

enterButton.addEventListener("click", submitWord);

document.addEventListener("keypress", e => {
  if (e.code == "Space" && !inGame) startGame();
  if (e.code == "Enter" && inGame) submitWord();
});


saveSettingsButton.addEventListener("click", () => {
  localStorage.setItem("wordsPerPrompt", wordsPerPromptInput.value);
  localStorage.setItem("infiniteMode", infiniteModeInput.checked);
  localStorage.setItem("promptTime", promptTimeInput.value);
  localStorage.setItem("gameTime", gameTimeInput.value);

  // Apply new settings to the game
  wordsPerPrompt = parseInt(wordsPerPromptInput.value) || 5000;
  promptTime = parseInt(promptTimeInput.value) || 8;
  gameTime = parseInt(gameTimeInput.value) || 60;
});

highscoreTitle.classList.add("highlighted-text"); // Add highlight class to Highscores title

// Apply the highlight class to additional elements
finalScoreEl.classList.add("highlighted-text");
gameTimeEl.classList.add("highlighted-text");
wordPrompt.classList.add("highlighted-text");
