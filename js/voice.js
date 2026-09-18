let voiceCommandId = 0;

// Process spoken commands & math operations
function processVoiceCommand(text) {
    const commandId = ++voiceCommandId;
    const sayResult = (message) => {
        if (commandId === voiceCommandId) speak(message);
    };

    // 1. Navigation Commands
    if (text.includes('open settings') || text.includes('open tools') || text.includes('open pop up')) {
        openPopupPage();
        sayResult('Tools opened');
        return;
    }
    if (text.includes('close') || text.includes('back to calculator')) {
        closePopupPage();
        sayResult('Calculator ready');
        return;
    }
    if (text.includes('days ahead') || text.includes('tab one')) {
        switchTab('date-tab', document.querySelectorAll('.tab-btn')[0]);
        sayResult('Days ahead calculator opened');
        return;
    }
    if (text.includes('age') || text.includes('date difference')) {
        switchTab('age-tab', document.querySelectorAll('.tab-btn')[1]);
        sayResult('Age calculator opened');
        return;
    }
    if (text.includes('world clock') || text.includes('time zone')) {
        switchTab('time-tab', document.querySelectorAll('.tab-btn')[3]);
        sayResult('World clock opened');
        return;
    }
    if (text.includes('currency') || text.includes('exchange rate')) {
        switchTab('currency-tab', document.querySelectorAll('.tab-btn')[2]);
        sayResult('Currency converter opened');
        return;
    }

    const dateMatch = text.match(/(\d+)\s*days?\s*(?:from now|ahead|from today)?/);
    if (dateMatch) {
        openPopupPage();
        switchTab('date-tab', document.querySelectorAll('.tab-btn')[0]);
        document.getElementById('daysInput').value = dateMatch[1];
        calculateFutureDate();
        sayResult(`The date is calculated for ${dateMatch[1]} days from today`);
        return;
    }

    // 2. Clear Display Command
    if (text.includes('clear') || text.includes('reset')) {
        if (typeof clearDisplay === 'function') clearDisplay();
        sayResult('Cleared');
        return;
    }

    // 3. Process Math Expressions
    const numberWords = {
        zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5',
        six: '6', seven: '7', eight: '8', nine: '9', ten: '10',
        eleven: '11', twelve: '12', thirteen: '13', fourteen: '14', fifteen: '15',
        sixteen: '16', seventeen: '17', eighteen: '18', nineteen: '19', twenty: '20'
    };
    let expression = text.replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b/g,
        (word) => numberWords[word]);
    expression = expression
        .replace(/plus/g, '+')
        .replace(/minus/g, '-')
        .replace(/times/g, '*')
        .replace(/multiply by/g, '*')
        .replace(/divided by/g, '/')
        .replace(/over/g, '/')
        .replace(/equals/g, '=')
        .replace(/calculate|what is|what's/g, '')
        .replace(/x/g, '*');

        const display = document.getElementById('display');
    if (!display) return;

    // Check if command ends with 'equals' or '='
    const shouldCalculateFinal = expression.includes('=');
    let cleanExpr = expression.replace(/[^0-9+\-*/().]/g, '');

    if (!cleanExpr) {
        sayResult('I did not hear a calculation');
        return;
    }

    // Continuous evaluation on voice input
    try {
        let fullExpr = display.value + cleanExpr;
        
        if (shouldCalculateFinal) {
            fullExpr = fullExpr.replace('=', '');
            let finalAns = evaluateExpression(fullExpr);
            finalAns = Math.round(finalAns * 100000000) / 100000000;

            if (typeof addToHistory === 'function') addToHistory(fullExpr, finalAns);
            display.value = finalAns;
            sayResult(`The answer is ${finalAns}`);
        } else {
            // Live continuous step calculation
            let result = evaluateExpression(fullExpr);
            result = Math.round(result * 100000000) / 100000000;

            if (typeof addToHistory === 'function') addToHistory(fullExpr, result);
            display.value = result;
            sayResult(`The answer is ${result}`);
        }

        scrollToLatest(); // Auto-scroll to view continuous result
    } catch (err) {
        // Fallback: Append raw voice input and scroll
        display.value += cleanExpr;
        scrollToLatest();
        sayResult('I need a complete calculation');
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

