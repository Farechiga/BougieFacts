/**
 * MATH MAGIC: BOUGIE STREAKS 
 * Logic Engine v3.0 - Discrete Phases & 80/20 Sum Distribution
 */

const state = {
    phase: 'WARMUP', // Phase 1: WARMUP, Phase 2: CHALLENGE
    cccCount: 0,
    streak: 0,
    sets: 0,
    timerId: null,
    currentProblem: null,
    isProcessing: false,
};

// Configuration Constants
const UNIT_PX = 50; 
const streakImages = [
    'assets/Calf crash.png', 'assets/Calf hop.png', 'assets/Calf kick.png', 
    'assets/Calf licking daisy.png', 'assets/Calf Milk.png', 
    'assets/Calf Sitting.png', 'assets/Calf v Butterfly.png'
];

/**
 * 1. PROBLEM GENERATION (80/20 Rule)
 * 80% Sums up to 15 | 20% Sums up to 20
 */
function generateProblemData() {
    const isHard = Math.random() < 0.2; // 20% chance for hard
    const max = isHard ? 20 : 15;
    const min = isHard ? 16 : 2; // Hard problems sum 16-20, Easy sum 2-15

    let a, b, sum;
    do {
        a = Math.floor(Math.random() * (max - 1)) + 1;
        b = Math.floor(Math.random() * (max - 1)) + 1;
        sum = a + b;
    } while (sum > max || sum < min || a === 0 || b === 0);

    return { a, b, sum };
}

/**
 * 2. SPEECH ENGINE (Australian English)
 */
function speak(text, callback) {
    // Cancel any current speech to prevent overlap
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    msg.voice = voices.find(v => v.lang === 'en-AU' || v.lang === 'en-GB') || voices[0];
    msg.lang = 'en-AU';
    msg.rate = 0.9;
    if (callback) msg.onend = callback;
    window.speechSynthesis.speak(msg);
}

/**
 * 3. VISUALS
 */
function renderStack(a, b) {
    const stackEl = document.getElementById('visual-stack');
    stackEl.innerHTML = `
        <div class="block block-a" style="height:${a * UNIT_PX}px; bottom:0;"></div>
        <div class="block block-b" style="height:${b * UNIT_PX}px; bottom:${a * UNIT_PX}px;"></div>
    `;
}

/**
 * 4. ROUND CONTROLLER
 */
function initRound() {
    if (state.timerId) clearTimeout(state.timerId);
    state.isProcessing = false;

    if (state.cccCount < 20) {
        state.phase = 'WARMUP';
        runWarmupStep1();
    } else {
        state.phase = 'CHALLENGE';
        runChallenge();
    }
}

/**
 * 5. PHASE 1: WARMUP (Step 1: Show/Speak -> Step 2: 3-Field Input)
 */
function runWarmupStep1() {
    state.currentProblem = generateProblemData();
    renderStack(state.currentProblem.a, state.currentProblem.b);
    
    const display = document.getElementById('problem-display');
    display.innerHTML = `${state.currentProblem.a} + ${state.currentProblem.b} = ${state.currentProblem.sum}`;
    
    speak(`${state.currentProblem.a} plus ${state.currentProblem.b} is ${state.currentProblem.sum}`, () => {
        setTimeout(runWarmupStep2, 1000);
    });
}

function runWarmupStep2() {
    const display = document.getElementById('problem-display');
    display.innerHTML = `
        <input type="number" id="w1" class="w-field" autofocus> 
        <span>+</span> 
        <input type="number" id="w2" class="w-field"> 
        <span>=</span> 
        <input type="number" id="w3" class="w-field">
    `;

    const fields = [document.getElementById('w1'), document.getElementById('w2'), document.getElementById('w3')];
    
    fields.forEach((f, i) => {
        f.addEventListener('input', () => {
            // Auto-tab logic based on number of digits
            const val = f.value;
            if (i < 2 && val.length >= 1) {
                fields[i+1].focus();
            } else if (i === 2) {
                const targetLen = state.currentProblem.sum >= 10 ? 2 : 1;
                if (val.length >= targetLen) {
                    checkWarmup(fields);
                }
            }
        });
    });
}

function checkWarmup(fields) {
    const v1 = parseInt(fields[0].value);
    const v2 = parseInt(fields[1].value);
    const v3 = parseInt(fields[2].value);

    const isCommutativeCorrect = (v1 === state.currentProblem.a && v2 === state.currentProblem.b) || 
                                 (v1 === state.currentProblem.b && v2 === state.currentProblem.a);
    
    if (isCommutativeCorrect && v3 === state.currentProblem.sum) {
        state.cccCount++;
        document.getElementById('ccc-count').innerText = `${state.cccCount}/20`;
        initRound();
    } else {
        handleError();
    }
}

/**
 * 6. PHASE 2: CHALLENGE (3s Timer, No Narration)
 */
function runChallenge() {
    state.currentProblem = generateProblemData();
    renderStack(state.currentProblem.a, state.currentProblem.b);
    
    const display = document.getElementById('problem-display');
    display.innerHTML = `${state.currentProblem.a} + ${state.currentProblem.b} = <input type="number" id="ans" class="ans-field" autofocus>`;
    
    const input = document.getElementById('ans');
    input.focus();

    input.onkeydown = (e) => {
        if (e.key === 'Enter') submitChallenge(input.value);
    };

    // Strict 3-second timer
    state.timerId = setTimeout(() => {
        if (!state.isProcessing) handleError("Time's up!");
    }, 3000);
}

function submitChallenge(val) {
    if (state.isProcessing) return;
    clearTimeout(state.timerId);
    state.isProcessing = true;

    if (parseInt(val) === state.currentProblem.sum) {
        state.streak++;
        updateStats();
        if (state.streak === 10) triggerReward(false);
        else if (state.streak === 20) triggerReward(true);
        else initRound();
    } else {
        handleError();
    }
}

/**
 * 7. ERROR HANDLING & REWARDS
 */
function handleError() {
    state.isProcessing = true;
    clearTimeout(state.timerId);
    state.streak = 0;
    updateStats();

    const display = document.getElementById('problem-display');
    display.innerHTML = `<span style="color:#e74c3c">${state.currentProblem.a} + ${state.currentProblem.b} = ${state.currentProblem.sum}</span>`;
    
    // Narrate correct answer, then wait 1 second before new round
    speak(`${state.currentProblem.a} plus ${state.currentProblem.b} is ${state.currentProblem.sum}`, () => {
        setTimeout(initRound, 1000);
    });
}

function triggerReward(isDouble) {
    confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } });
    const title = isDouble ? "DOUBLE BOUGIE!" : "BOUGIE STREAK!";
    const imgPath = isDouble ? 'assets/Double Bougie Ramming.png' : streakImages[Math.floor(Math.random() * streakImages.length)];
    
    const overlay = document.getElementById('reward-overlay');
    overlay.innerHTML = `<img src="${imgPath}"><h1>${title}</h1>`;
    overlay.style.display = 'flex';
    
    speak(title, () => {
        setTimeout(() => {
            overlay.style.display = 'none';
            if (!isDouble) state.sets++;
            initRound();
        }, 3000);
    });
}

function updateStats() {
    document.getElementById('streak-val').innerText = state.streak;
    document.getElementById('sets-val').innerText = state.sets;
}

// Initial Launch
window.onload = () => {
    // Necessary for some browsers to load voices
    window.speechSynthesis.onvoiceschanged = () => { initRound(); window.speechSynthesis.onvoiceschanged = null; };
    if (window.speechSynthesis.getVoices().length > 0) initRound();
};
