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
        .replace(/equals/g, '')
        .replace(/x/g, '*');

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
}