/**
 * MATH FACT NEUROSCIENCE ENGINE
 * Features: 80/20 Seeding, Retrieval Practice, Australian Narration
 */

// 1. CONFIGURATION & STATE
const CURRENT_LEVEL = 1; 
const UNIT_PX = 50; // 1 unit = 50px, so 10 = 500px
const PURPLE_GRID = "#876EB8";

const streakImages = [
    'Calf crash.png', 'Calf hop.png', 'Calf kick.png', 
    'Calf licking daisy.png', 'Calf Milk.png', 
    'Calf Sitting.png', 'Calf v Butterfly.png'
];

let state = {
    mode: 'addition',
    currentProblem: null,
    cccCounter: 0,          // Cover-Copy-Compare counter (target 20)
    rehearsalScore: 0,
    tenInARowCount: 0,      // Current streak
    completedSets: 0,       // How many sets of 10-in-a-row achieved
    isCovered: false,
    timer: null,
    knowns: [[2, 2], [5, 5], [3, 3]],
    learning: [[7, 5], [6, 9], [8, 4]] // Examples for Level 1
};

// 2. DOM ELEMENTS
const stackEl = document.getElementById('visual-stack');
const inputEl = document.getElementById('answer-input');
const problemText = document.getElementById('problem-text');
const rewardOverlay = document.getElementById('reward-overlay'); // You'll need this in HTML

// 3. CORE FUNCTIONS

function speak(text) {
    const msg = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    // Prioritize Australian English
    msg.voice = voices.find(v => v.lang === 'en-AU' || v.lang === 'en-GB') || voices[0];
    msg.lang = 'en-AU';
    msg.rate = 0.9; // Slightly slower for clarity
    window.speechSynthesis.speak(msg);
}

function generateProblem() {
    // 80/20 Seeding Logic
    const isLearning = Math.random() < 0.2;
    const pool = isLearning ? state.learning : state.knowns;
    const pair = pool[Math.floor(Math.random() * pool.length)];
    
    state.currentProblem = { a: pair[0], b: pair[1], answer: pair[0] + pair[1] };
    renderStack(pair[0], pair[1]);
    
    // Phase 1: Cover-Copy-Compare (2 seconds)
    state.isCovered = false;
    problemText.innerText = `${pair[0]} + ${pair[1]} = ${state.currentProblem.answer}`;
    speak(`${pair[0]} plus ${pair[1]} is ${state.currentProblem.answer}`);
    
    setTimeout(() => {
        coverProblem();
    }, 2000);
}

function renderStack(a, b) {
    stackEl.innerHTML = ''; // Clear previous
    // Create Block A (Bottom)
    const blockA = document.createElement('div');
    blockA.className = 'block';
    blockA.style.height = `${a * UNIT_PX}px`;
    blockA.style.bottom = '0px';
    blockA.style.backgroundColor = '#4A90E2';
    
    // Create Block B (Top)
    const blockB = document.createElement('div');
    blockB.className = 'block';
    blockB.style.height = `${b * UNIT_PX}px`;
    blockB.style.bottom = `${a * UNIT_PX}px`;
    blockB.style.backgroundColor = '#F5A623';

    stackEl.appendChild(blockA);
    stackEl.appendChild(blockB);
}

function coverProblem() {
    state.isCovered = true;
    problemText.innerText = `${state.currentProblem.a} + ${state.currentProblem.b} = ?`;
    inputEl.focus();
    
    // Start 4-second Decay Timer
    state.timer = setTimeout(() => {
        handleWrong("Time's up!");
    }, 4000);
}

function checkAnswer() {
    clearTimeout(state.timer);
    const userVal = parseInt(inputEl.value);
    
    if (userVal === state.currentProblem.answer) {
        handleCorrect();
    } else {
        handleWrong(`Not quite, it's ${state.currentProblem.answer}`);
    }
    
    inputEl.value = '';
}

function handleCorrect() {
    state.rehearsalScore += 10;
    state.tenInARowCount += 1;
    
    if (state.tenInARowCount === 10) {
        triggerBougieStreak();
    } else {
        generateProblem();
    }
}

function handleWrong(msg) {
    state.tenInARowCount = 0; // Reset streak
    speak(msg);
    // 2-second gentle correction pause
    setTimeout(() => {
        generateProblem();
    }, 2000);
}

async function triggerBougieStreak() {
    state.completedSets += 1;
    state.tenInARowCount = 0;
    
    // 1. Confetti Burst (Requires canvas-confetti script in HTML)
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    
    // 2. Show Bougie Image
    const imgFile = streakImages[Math.floor(Math.random() * streakImages.length)];
    rewardOverlay.innerHTML = `<img src="assets/${imgFile}" style="max-width:80%"><br><h1>BOUGIE STREAK!</h1>`;
    rewardOverlay.style.display = 'flex';
    
    speak("Bougie Streak!");
    
    // 3. Pause for celebration then resume
    setTimeout(() => {
        rewardOverlay.style.display = 'none';
        if (state.completedSets >= 5) {
            alert("Game Won! You mastered these facts!");
        } else {
            generateProblem();
        }
    }, 4000);
}

// 4. LISTENERS
inputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkAnswer();
});

// Initialize
window.onload = () => {
    generateProblem();
};
