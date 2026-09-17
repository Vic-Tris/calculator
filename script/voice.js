let recognition = null;
let isListening = false;

// Check if browser supports Web Speech API
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = function () {
        isListening = true;
        document.getElementById('micBtn').classList.add('listening');
    };

    recognition.onend = function () {
        isListening = false;
        document.getElementById('micBtn').classList.remove('listening');
    };

    recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        console.log('Voice Input:', transcript);
        processVoiceCommand(transcript);
    };
} else {
    console.warn('Speech Recognition is not supported in this browser.');
}

function toggleVoiceInput() {
    if (!recognition) {
        alert('Voice recognition is not supported in this browser. Try Chrome or Edge.');
        return;
    }
    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

// Process spoken commands & math operations
function processVoiceCommand(text) {
    // 1. Navigation Commands
    if (text.includes('open settings') || text.includes('open tools') || text.includes('open pop up')) {
        openPopupPage();
        return;
    }
    if (text.includes('close') || text.includes('back to calculator')) {
        closePopupPage();
        return;
    }
    if (text.includes('days ahead') || text.includes('tab one')) {
        switchTab('date-tab', document.querySelectorAll('.tab-btn')[0]);
        return;
    }
    if (text.includes('age') || text.includes('date difference')) {
        switchTab('age-tab', document.querySelectorAll('.tab-btn')[1]);
        return;
    }
    if (text.includes('world clock') || text.includes('time zone')) {
        switchTab('time-tab', document.querySelectorAll('.tab-btn')[2]);
        return;
    }

    // 2. Clear Display Command
    if (text.includes('clear') || text.includes('reset')) {
        if (typeof clearDisplay === 'function') clearDisplay();
        return;
    }

    // 3. Process Math Expressions
    let expression = text
        .replace(/plus/g, '+')
        .replace(/minus/g, '-')
        .replace(/times/g, '*')
        .replace(/multiply by/g, '*')
        .replace(/divided by/g, '/')
        .replace(/over/g, '/')
        .replace(/equals/g, '=')
        .replace(/x/g, '*');

        const display = document.getElementById('display');
    if (!display) return;

    // Check if command ends with 'equals' or '='
    const shouldCalculateFinal = expression.includes('=');
    let cleanExpr = expression.replace(/[^0-9+\-*/().]/g, '');

    if (!cleanExpr) return;

    // Continuous evaluation on voice input
    try {
        let fullExpr = display.value + cleanExpr;
        
        if (shouldCalculateFinal) {
            fullExpr = fullExpr.replace('=', '');
            let finalAns = Function(`'use strict'; return (${fullExpr})`)();
            finalAns = Math.round(finalAns * 100000000) / 100000000;

            if (typeof addToHistory === 'function') addToHistory(fullExpr, finalAns);
            display.value = finalAns;
        } else {
            // Live continuous step calculation
            let result = Function(`'use strict'; return (${fullExpr})`)();
            result = Math.round(result * 100000000) / 100000000;

            if (typeof addToHistory === 'function') addToHistory(fullExpr, result);
            display.value = result;
        }

        scrollToLatest(); // Auto-scroll to view continuous result
    } catch (err) {
        // Fallback: Append raw voice input and scroll
        display.value += cleanExpr;
        scrollToLatest();
    }
}

    // Parse "X days from now" if in Date Calculator tab
    const dateMatch = expression.match(/(\d+)\s*days/);
    if (dateMatch && document.getElementById('daysInput')) {
        openPopupPage();
        document.getElementById('daysInput').value = dateMatch[1];
        calculateFutureDate();
        return;
    }

    // Sanitize to only keep numbers and math operators
    const cleanExpr = expression.replace(/[^0-9+\-*/().]/g, '');

    if (cleanExpr) {
        try {
            // Evaluate math safely and output result
            const result = Function(`'use strict'; return (${cleanExpr})`)();
            
            // Assuming your calculator uses a display element with id "display"
            const display = document.getElementById('display');
            if (display) {
                display.value = result;
            }
        } catch (err) {
            console.error('Invalid math expression spoken:', cleanExpr);
        }
    }



let calculationHistory = [];

// Toggle Slide-out Drawer
function toggleHistoryDrawer() {
    const drawer = document.getElementById('historyDrawer');
    drawer.classList.toggle('active');
}

// Save calculation to history list
function addToHistory(expression, result) {
    calculationHistory.unshift({ expression, result }); // Add to start of array
    
    // Keep max 20 history items
    if (calculationHistory.length > 20) {
        calculationHistory.pop();
    }
    
    renderHistory();
}

// Render history items to the UI drawer
function renderHistory() {
    const listContainer = document.getElementById('historyList');
    
    if (calculationHistory.length === 0) {
        listContainer.innerHTML = '<div class="history-empty">No history yet</div>';
        return;
    }

    listContainer.innerHTML = calculationHistory.map((item, index) => `
        <div class="history-item" onclick="recallHistory(${index})">
            <div class="history-expr">${item.expression} =</div>
            <div class="history-ans">${item.result}</div>
        </div>
    `).join('');
}

// Recall past result back to display
function recallHistory(index) {
    const item = calculationHistory[index];
    const display = document.getElementById('display');
    if (display && item) {
        display.value = item.result;
        isNewCalculation = true;
        toggleHistoryDrawer(); // Close drawer on selection
    }
}

// Clear all history items
function clearHistory() {
    calculationHistory = [];
    renderHistory();
}

