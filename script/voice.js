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
        switchTab('time-tab', document.querySelectorAll('.tab-btn')[3]);
        return;
    }
    if (text.includes('currency') || text.includes('exchange rate')) {
        switchTab('currency-tab', document.querySelectorAll('.tab-btn')[2]);
        return;
    }

    const dateMatch = text.match(/(\d+)\s*days?\s*(?:from now|ahead|from today)?/);
    if (dateMatch) {
        openPopupPage();
        switchTab('date-tab', document.querySelectorAll('.tab-btn')[0]);
        document.getElementById('daysInput').value = dateMatch[1];
        calculateFutureDate();
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
            let finalAns = evaluateExpression(fullExpr);
            finalAns = Math.round(finalAns * 100000000) / 100000000;

            if (typeof addToHistory === 'function') addToHistory(fullExpr, finalAns);
            display.value = finalAns;
        } else {
            // Live continuous step calculation
            let result = evaluateExpression(fullExpr);
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

let calculationHistory = [];

// Toggle Slide-out Drawer
function toggleHistoryDrawer() {
    const drawer = document.getElementById('historyDrawer');
    if (drawer) {
        drawer.classList.toggle('active');
    }
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
    if (!listContainer) return;
    listContainer.replaceChildren();

    if (calculationHistory.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'history-empty';
        empty.textContent = 'No history yet';
        listContainer.appendChild(empty);
        return;
    }

    calculationHistory.forEach((item, index) => {
        const historyItem = document.createElement('button');
        historyItem.type = 'button';
        historyItem.className = 'history-item';
        historyItem.addEventListener('click', () => recallHistory(index));

        const expression = document.createElement('div');
        expression.className = 'history-expr';
        expression.textContent = `${item.expression} =`;
        const answer = document.createElement('div');
        answer.className = 'history-ans';
        answer.textContent = String(item.result);

        historyItem.append(expression, answer);
        listContainer.appendChild(historyItem);
    });
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

