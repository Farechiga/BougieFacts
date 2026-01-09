/**
 * MATH MAGIC: BOUGIE STREAKS
 * Logic Engine v4.0
 */

const state = {
    phase: 'WARMUP',
    cccCount: 0,
    streak: 0,
    sets: 0,
    timerId: null,
    currentProblem: null,
    isProcessing: false,
    voice: null
};

const display = document.getElementById('problem-display');
const stackEl = document.getElementById('visual-stack');
const overlay = document.getElementById('reward-overlay');

/**
 * 1. SPEECH ENGINE FIX (Safari & Chrome)
 */
function loadVoices() {
    const voices = window.speechSynthesis.getVoices();
    state.voice = voices.find(v => v.lang === 'en-AU' || v.lang === 'en-GB') || voices[0];
}
window.speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

function speak(text, callback) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    if (state.voice) msg.voice = state.voice;
    msg.lang = 'en-AU';
    msg.rate = 0.9;
    if (callback) msg.onend = callback;
    window.speechSynthesis.speak(msg);
}

/**
 * 2. PROBLEM GENERATION (80/20 Rule)
 */
function generateProblem() {
    let a, b, sum;
    if (state.phase === 'WARMUP') {
        // Memorization: Addends <= 9 for auto-tab consistency
        a = Math.floor(Math.random() * 9) + 1;
        b = Math.floor(Math.random() * 9) + 1;
    } else {
        // Challenge: Max 10 + 10 = 20
        const isHard = Math.random() < 0.2;
        const limit = isHard ? 20 : 15;
        do {
            a = Math.floor(Math.random() * 10) + 1;
            b = Math.floor(Math.random() * 10) + 1;
            sum = a + b;
        } while (sum > limit || (isHard && sum <= 15));
    }
    return { a, b, sum: a + b };
}

/**
 * 3. VISUALS (Pixel-Perfect Stack)
 */
function renderStack(a, b) {
    stackEl.innerHTML = `
        <div class="block block-a" style="height:${a * 50}px; bottom:0;"></div>
        <div class="block block-b" style="height:${b * 50}px; bottom:${a * 50}px;"></div>
    `;
}

/**
 * 4. ROUND INITIALIZATION
 */
function initRound() {
    if (state.timerId) clearTimeout(state.timerId);
    state.isProcessing = false;
    
    if (state.cccCount < 20) {
        state.phase = 'WARMUP';
        state.currentProblem = generateProblem();
        renderStack(state.currentProblem.a, state.currentProblem.b);
        display.innerHTML = `${state.currentProblem.a} + ${state.currentProblem.b} = ${state.currentProblem.sum}`;
        speak(`${state.currentProblem.a} plus ${state.currentProblem.b} is ${state.currentProblem.sum}`, () => {
            setTimeout(setupWarmupInputs, 800);
        });
    } else {
        state.phase = 'CHALLENGE';
        state.currentProblem = generateProblem();
        renderStack(state.currentProblem.a, state.currentProblem.b);
        display.innerHTML = `${state.currentProblem.a} + ${state.currentProblem.b} = <input type="number" id="ans" autofocus>`;
        const input = document.getElementById('ans');
        input.focus();
        
        // AUTO-ADVANCE logic for Challenge
        input.oninput = () => {
            const targetLen = state.currentProblem.sum >= 10 ? 2 : 1;
            if (input.value.length >= targetLen) checkChallenge(input.value);
        };
        state.timerId = setTimeout(() => handleFailure(), 3000);
    }
}

/**
 * 5. WARMUP INPUTS (3 Blanks)
 */
function setupWarmupInputs() {
    display.innerHTML = `
        <input type="number" id="w1" autofocus> <span>+</span> 
        <input type="number" id="w2"> <span>=</span> 
        <input type="number" id="w3">
    `;
    const fields = [document.getElementById('w1'), document.getElementById('w2'), document.getElementById('w3')];
    fields[0].focus(); 

    fields.forEach((f, i) => {
        f.oninput = () => {
            // Auto-tab for single-digit addends
            if (i < 2 && f.value.length >= 1) fields[i+1].focus();
            // Auto-submit for sum (could be 1 or 2 digits)
            if (i === 2) {
                const targetLen = state.currentProblem.sum >= 10 ? 2 : 1;
                if (f.value.length >= targetLen) checkWarmup(fields);
            }
        };
    });
}

function checkWarmup(fields) {
    const v1 = parseInt(fields[0].value);
    const v2 = parseInt(fields[1].value);
    const v3 = parseInt(fields[2].value);
    
    // Commutative check: (a+b) or (b+a)
    const isCorrect = ((v1 === state.currentProblem.a && v2 === state.currentProblem.b) || 
                       (v1 === state.currentProblem.b && v2 === state.currentProblem.a)) && 
                      v3 === state.currentProblem.sum;
    
    if (isCorrect) {
        state.cccCount++;
        document.getElementById('ccc-count').innerText = `${state.cccCount}/20`;
        initRound();
    } else { handleFailure(); }
}

/**
 * 6. CHALLENGE CHECK
 */
function checkChallenge(val) {
    if (state.isProcessing) return;
    clearTimeout(state.timerId);
    state.isProcessing = true;
    
    if (parseInt(val) === state.currentProblem.sum) {
        state.streak++;
        updateStats();
        if (state.streak === 10) triggerReward(false);
        else if (state.streak === 20) triggerReward(true);
        else initRound();
    } else { handleFailure(); }
}

function handleFailure() {
    clearTimeout(state.timerId);
    state.isProcessing = true;
    state.streak = 0;
    updateStats();
    display.innerHTML = `<span style="color:#e74c3c">${state.currentProblem.a} + ${state.currentProblem.b} = ${state.currentProblem.sum}</span>`;
    speak(`${state.currentProblem.a} plus ${state.currentProblem.b} is ${state.currentProblem.sum}`, () => {
        setTimeout(initRound, 1000);
    });
}

/**
 * 7. BOUGIE REWARDS
 */
function triggerReward(isDouble) {
    confetti({ particleCount: 250, spread: 100, origin: { y: 0.6 } });
    const imgs = ['Calf crash.png', 'Calf hop.png', 'Calf kick.png', 'Calf licking daisy.png', 'Calf Milk.png', 'Calf Sitting.png', 'Calf v Butterfly.png'];
    const imgFile = isDouble ? 'Double Bougie Ramming.png' : imgs[Math.floor(Math.random() * imgs.length)];
    
    overlay.innerHTML = `<img src="assets/${imgFile}"><h1>${isDouble ? 'DOUBLE BOUGIE!' : 'BOUGIE STREAK!'}</h1>`;
    overlay.style.display = 'flex';
    
    speak(isDouble ? 'Double Bougie!' : 'Bougie Streak!', () => {
        setTimeout(() => {
            overlay.style.display = 'none';
            if (!isDouble) state.sets++;
            initRound();
        }, 3500);
    });
}

function updateStats() {
    document.getElementById('streak-val').innerText = state.streak;
    document.getElementById('sets-val').innerText = state.sets;
}

function handleFirstClick() {
    if (!state.currentProblem) initRound();
}
