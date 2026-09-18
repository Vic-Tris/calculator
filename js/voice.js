let voiceCommandId = 0;
let recognition = null;
let isListening = false;
let shouldKeepListening = false;
let silenceTimer = null;
const voiceSilenceDelay = 1500;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// Helper to update status badge on UI
function setVoiceStatus(message, state = 'ready') {
    const status = document.getElementById('voiceStatus');
    if (status) {
        status.textContent = message;
        status.dataset.state = state;
    }
}

// Text-to-Speech Output Handler
function speak(message) {
    if (!('speechSynthesis' in window)) return;
    
    // Pause active recognition while speaking to prevent microphone loopback
    if (recognition && isListening) {
        try { recognition.stop(); } catch (e) {}
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(String(message));
    utterance.lang = 'en-US';
    utterance.rate = 1;

    utterance.onstart = () => setVoiceStatus('Speaking', 'speaking');
    utterance.onend = () => {
        setVoiceStatus(shouldKeepListening ? 'Listening' : 'Voice ready', shouldKeepListening ? 'listening' : 'ready');
        if (shouldKeepListening && recognition) {
            try { recognition.start(); } catch (e) {}
        }
    };

    window.speechSynthesis.speak(utterance);
}

// Toggle Microphone Input On/Off
function toggleVoiceInput() {
    if (!SpeechRecognition) {
        setVoiceStatus('Microphone unavailable', 'unavailable');
        speak('Speech recognition is not available in this browser.');
        return;
    }

    if (!recognition) {
        createRecognition();
    }

    if (isListening) {
        shouldKeepListening = false;
        recognition.stop();
        return;
    }

    shouldKeepListening = true;
    try {
        recognition.start();
    } catch (e) {
        /* Handles quick double-tap restarts */
    }
}

// Silence Timeout Reset
function resetSilenceTimer() {
    window.clearTimeout(silenceTimer);
    silenceTimer = window.setTimeout(() => {
        shouldKeepListening = false;
        if (recognition && isListening) {
            recognition.stop();
        }
    }, voiceSilenceDelay);
}

// Speech Recognition Lifecycle
function createRecognition() {
    if (!SpeechRecognition) return;
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
        isListening = true;
        setVoiceStatus('Listening', 'listening');
        resetSilenceTimer();
    };

    recognition.onresult = event => {
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript.trim();
        const transcriptElement = document.getElementById('voiceTranscript');
        
        if (transcriptElement) {
            transcriptElement.textContent = transcript;
        }

        resetSilenceTimer();
        if (result.isFinal) {
            processVoiceCommand(transcript);
        }
    };

    recognition.onerror = event => {
        isListening = false;
        setVoiceStatus(event.error === 'not-allowed' ? 'Microphone permission denied' : 'Voice error', 'error');
    };

    recognition.onend = () => {
        isListening = false;
        window.clearTimeout(silenceTimer);

        // Resume if continuous mode active and TTS is not currently speaking
        if (shouldKeepListening && !window.speechSynthesis.speaking) {
            window.setTimeout(() => {
                if (shouldKeepListening && !isListening) {
                    try { recognition.start(); } catch (error) {}
                }
            }, 100);
        } else if (!window.speechSynthesis.speaking) {
            setVoiceStatus('Voice ready', 'ready');
        }
    };
}

// Number Words Dictionary & Converter
const numberWords = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
    eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
    fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
    nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
    seventy: 70, eighty: 80, ninety: 90
};

function replaceNumberWords(text) {
    return text.replace(/\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(?:\s+(?:one|two|three|four|five|six|seven|eight|nine))?\b/g, phrase => {
        const parts = phrase.split(' ');
        return String((numberWords[parts[0]] || 0) + (numberWords[parts[1]] || 0));
    });
}

// Wrap Voice Completion
function finishVoiceOperation(message) {
    const display = document.getElementById('display');
    const result = display && display.value;
    if (result && result !== 'Error') {
        if (typeof isNewCalculation !== 'undefined') isNewCalculation = true;
        if (typeof scrollToLatest === 'function') scrollToLatest();
        if (typeof triggerPulse === 'function') triggerPulse();
        speak(message ? `${message} ${result}` : `The answer is ${result}`);
    } else {
        speak('The operation could not be completed');
    }
}

function runVoiceOperation(operation, message) {
    try {
        operation();
        finishVoiceOperation(message);
    } catch (error) {
        speak('The operation could not be completed');
    }
}

// Main Command Processor
function processVoiceCommand(rawText) {
    const commandId = ++voiceCommandId;
    let text = rawText.toLowerCase().replace(/[^a-z0-9.=+\-*/ ]/g, ' ').replace(/\s+/g, ' ').trim();
    text = replaceNumberWords(text);
    const sayResult = message => { if (commandId === voiceCommandId) speak(message); };

    // Tool Navigation Commands
    if (text.includes('open settings') || text.includes('open tools') || text.includes('open pop up')) {
        if (typeof openPopupPage === 'function') openPopupPage();
        sayResult('Tools opened');
        return;
    }
    if (text === 'close' || text.includes('back to calculator')) {
        if (typeof closePopupPage === 'function') closePopupPage();
        sayResult('Calculator ready');
        return;
    }
    if (text.includes('days ahead') || text.includes('tab one')) {
        if (typeof switchTab === 'function') switchTab('date-tab', document.querySelectorAll('.tab-btn')[0]);
        sayResult('Days ahead calculator opened');
        return;
    }
    if (text.includes('age') || text.includes('date difference')) {
        if (typeof switchTab === 'function') switchTab('age-tab', document.querySelectorAll('.tab-btn')[1]);
        sayResult('Age calculator opened');
        return;
    }
    if (text.includes('world clock') || text.includes('time zone')) {
        if (typeof switchTab === 'function') switchTab('time-tab', document.querySelectorAll('.tab-btn')[3]);
        sayResult('World clock opened');
        return;
    }
    if (text.includes('currency') || text.includes('exchange rate')) {
        if (typeof switchTab === 'function') switchTab('currency-tab', document.querySelectorAll('.tab-btn')[2]);
        sayResult('Currency converter opened');
        return;
    }

    // Days-ahead Date Math Voice Command
    const dateMatch = text.match(/(\d+)\s*days?\s*(?:from now|ahead|from today)?/);
    if (dateMatch) {
        if (typeof openPopupPage === 'function') openPopupPage();
        if (typeof switchTab === 'function') switchTab('date-tab', document.querySelectorAll('.tab-btn')[0]);
        const daysInput = document.getElementById('daysInput');
        if (daysInput) daysInput.value = dateMatch[1];
        if (typeof calculateFutureDate === 'function') calculateFutureDate();
        sayResult(`The date is calculated for ${dateMatch[1]} days from today`);
        return;
    }

    // Standard Calculator State Controls
    if (text.includes('clear') || text.includes('reset')) {
        if (typeof clearDisplay === 'function') clearDisplay();
        sayResult('Cleared');
        return;
    }
    if (text.includes('delete') || text.includes('backspace')) {
        if (typeof deleteLast === 'function') deleteLast();
        sayResult('Deleted');
        return;
    }
    if (text.includes('change sign') || text.includes('toggle sign')) {
        if (typeof toggleSign === 'function') toggleSign();
        finishVoiceOperation('The value is');
        return;
    }

    // Mode Switching Commands
    if (text.includes('standard mode') || text.includes('standard calculator')) {
        if (typeof nextMode === 'function') {
            while (typeof currentMode !== 'undefined' && currentMode !== 1) nextMode();
        }
        sayResult('Standard mode selected');
        return;
    }
    if (text.includes('scientific mode') || text.includes('scientific calculator')) {
        if (typeof nextMode === 'function') {
            while (typeof currentMode !== 'undefined' && currentMode !== 2) nextMode();
        }
        sayResult('Scientific mode selected');
        return;
    }
    if (text.includes('converter mode') || text.includes('conversion mode')) {
        if (typeof nextMode === 'function') {
            while (typeof currentMode !== 'undefined' && currentMode !== 3) nextMode();
        }
        sayResult('Converter mode selected');
        return;
    }
    if (text.includes('degrees') || text.includes('radians')) {
        const angleMode = document.getElementById('angle-mode');
        const wantsDegrees = text.includes('degrees');
        if (angleMode && ((wantsDegrees && angleMode.textContent !== 'DEG') || (!wantsDegrees && angleMode.textContent !== 'RAD'))) {
            if (typeof toggleAngleMode === 'function') toggleAngleMode();
        }
        sayResult(wantsDegrees ? 'Degrees selected' : 'Radians selected');
        return;
    }

    // Scientific Direct Calculations
    const operationMatch = text.match(/^(?:calculate|compute|what is)?\s*(?:the\s+)?(.+?)\s*(?:to|of)?\s*(-?[\d.]+)\s*(?:degrees?)?$/);
    const operationText = operationMatch ? operationMatch[1].trim() : text;
    const operationValue = operationMatch ? operationMatch[2] : null;

    const operationPatterns = [
        { pattern: /square root|sqrt/, run: value => appendAndCalculate(value, calculateSquareRoot), message: 'The square root is' },
        { pattern: /square|squared/, run: value => appendAndCalculate(value, calculateSquare), message: 'The square is' },
        { pattern: /cube|cubed/, run: value => appendAndCalculate(value, calculateCube), message: 'The cube is' },
        { pattern: /factorial/, run: value => appendAndCalculate(value, calculateFactorial), message: 'The factorial is' },
        { pattern: /reciprocal|one over/, run: value => appendAndCalculate(value, calculateReciprocal), message: 'The reciprocal is' },
        { pattern: /sine|sin/, run: value => appendMathAndCalculate('sin', value), message: 'The sine is' },
        { pattern: /cosine|cos/, run: value => appendMathAndCalculate('cos', value), message: 'The cosine is' },
        { pattern: /tangent|tan/, run: value => appendMathAndCalculate('tan', value), message: 'The tangent is' },
        { pattern: /inverse sine|arcsine|asin/, run: value => appendMathAndCalculate('asin', value), message: 'The inverse sine is' },
        { pattern: /inverse cosine|arccosine|acos/, run: value => appendMathAndCalculate('acos', value), message: 'The inverse cosine is' },
        { pattern: /inverse tangent|arctangent|atan/, run: value => appendMathAndCalculate('atan', value), message: 'The inverse tangent is' },
        { pattern: /logarithm|log base ten|log10/, run: value => appendMathAndCalculate('log10', value), message: 'The logarithm is' },
        { pattern: /natural log|natural logarithm|ln/, run: value => appendMathAndCalculate('ln', value), message: 'The natural logarithm is' },
        { pattern: /absolute value|absolute/, run: value => appendMathAndCalculate('abs', value), message: 'The absolute value is' },
        { pattern: /percent|percentage/, run: value => appendAndCalculate(value, calculatePercentage), message: 'The percentage is' }
    ];

    if (operationValue) {
        const operation = operationPatterns.find(item => item.pattern.test(operationText));
        if (operation) {
            runVoiceOperation(() => operation.run(operationValue), operation.message);
            return;
        }
    }

    // Percentage Calculation
    const percentMatch = text.match(/^(?:calculate|compute|what is)?\s*(-?[\d.]+)\s*(?:percent|percentage)$/);
    if (percentMatch) {
        runVoiceOperation(() => appendAndCalculate(percentMatch[1], calculatePercentage), 'The percentage is');
        return;
    }

    // Single Word Suffix Operations (e.g. "5 squared")
    const valueFirstMatch = text.match(/^(?:calculate|compute|what is)?\s*(-?[\d.]+)\s+(square|squared|cube|cubed|factorial)$/);
    if (valueFirstMatch) {
        const operationMap = {
            square: calculateSquare,
            squared: calculateSquare,
            cube: calculateCube,
            cubed: calculateCube,
            factorial: calculateFactorial
        };
        const operation = operationMap[valueFirstMatch[2]];
        const operationName = valueFirstMatch[2] === 'squared' ? 'square' : valueFirstMatch[2] === 'cubed' ? 'cube' : valueFirstMatch[2];
        runVoiceOperation(() => appendAndCalculate(valueFirstMatch[1], operation), `The ${operationName} is`);
        return;
    }

    // Power Operations (e.g. "2 to the power of 8")
    const powerMatch = text.match(/^(?:calculate|compute|what is)?\s*(-?[\d.]+)\s+(?:to the power(?: of)?|raised to(?: the power(?: of)?)?|power)\s+(-?[\d.]+)$/);
    if (powerMatch) {
        runVoiceOperation(() => {
            const expression = `${powerMatch[1]}**${powerMatch[2]}`;
            const result = Math.round(evaluateExpression(expression) * 100000000) / 100000000;
            const display = document.getElementById('display');
            if (display) display.value = String(result);
            if (typeof addToHistory === 'function') addToHistory(expression, result);
        }, 'The power result is');
        return;
    }

    // Reciprocal (e.g. "1 over 4")
    const reciprocalMatch = text.match(/^(?:calculate|compute|what is)?\s*(?:one over|1 over)\s+(-?[\d.]+)$/);
    if (reciprocalMatch) {
        runVoiceOperation(() => appendAndCalculate(reciprocalMatch[1], calculateReciprocal), 'The reciprocal is');
        return;
    }

    // Unit Conversions
    const conversionPatterns = [
        { pattern: /celsius.*fahrenheit|degrees? c.*degrees? f|c to f/, run: typeof convertCtoF === 'function' ? convertCtoF : null, message: 'The Fahrenheit value is' },
        { pattern: /fahrenheit.*celsius|degrees? f.*degrees? c|f to c/, run: typeof convertFtoC === 'function' ? convertFtoC : null, message: 'The Celsius value is' },
        { pattern: /kilometers?.*miles?|km to miles?/, run: typeof convertKmToMiles === 'function' ? convertKmToMiles : null, message: 'The miles value is' },
        { pattern: /miles?.*kilometers?|miles? to km/, run: typeof convertMilesToKm === 'function' ? convertMilesToKm : null, message: 'The kilometers value is' },
        { pattern: /kilograms?.*pounds?|kg to lbs?/, run: typeof convertKgToLbs === 'function' ? convertKgToLbs : null, message: 'The pounds value is' },
        { pattern: /pounds?.*kilograms?|lbs? to kg/, run: typeof convertLbsToKg === 'function' ? convertLbsToKg : null, message: 'The kilograms value is' }
    ];

    const conversion = conversionPatterns.find(item => item.pattern.test(text));
    if (conversion && conversion.run) {
        const valueMatch = text.match(/-?\d+(?:\.\d+)?/);
        if (valueMatch) {
            runVoiceOperation(() => appendAndCalculate(valueMatch[0], conversion.run), conversion.message);
            return;
        }
    }

    // Standard Math Expressions (e.g., "5 plus 3 times 2")
    const expression = replaceNumberWords(text)
        .replace(/multiply by|multiplied by|times|x/g, '*')
        .replace(/divided by|divide by|over/g, '/')
        .replace(/plus/g, '+')
        .replace(/minus/g, '-')
        .replace(/equals?|is equal to/g, '=')
        .replace(/what is|what's|calculate|compute/g, '');

    const cleanExpr = expression.replace(/[^0-9+\-*/().=]/g, '').replace(/=/g, '');
    if (!cleanExpr) {
        sayResult('I did not hear a calculation');
        return;
    }

    const display = document.getElementById('display');
    try {
        const result = Math.round(evaluateExpression(cleanExpr) * 100000000) / 100000000;
        if (display) display.value = String(result);
        if (typeof isNewCalculation !== 'undefined') isNewCalculation = true;
        if (typeof addToHistory === 'function') addToHistory(cleanExpr, result);
        if (typeof scrollToLatest === 'function') scrollToLatest();
        if (typeof triggerPulse === 'function') triggerPulse();
        sayResult(`The answer is ${result}`);
    } catch (error) {
        if (display) display.value = cleanExpr;
        sayResult('I need a complete calculation');
    }
}

// Execution Helper Wrappers
function appendAndCalculate(value, operation) {
    const display = document.getElementById('display');
    if (display) display.value = value;
    if (typeof operation === 'function') operation();
}

function appendMathAndCalculate(functionName, value) {
    const display = document.getElementById('display');
    const expression = `${functionName}(${value})`;
    try {
        const result = Math.round(evaluateExpression(expression) * 100000000) / 100000000;
        if (display) display.value = String(result);
        if (typeof addToHistory === 'function') addToHistory(expression, result);
    } catch (e) {
        if (display) display.value = 'Error';
    }
}

// Initialize speech recognition instance when document is ready
document.addEventListener('DOMContentLoaded', () => {
    createRecognition();
});

createRecognition();

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

