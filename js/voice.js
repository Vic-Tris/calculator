// ============================================================
// VOICE CONTROL - voice.js
// ============================================================

let voiceCommandId = 0;
let recognition = null;
let isListening = false;
let shouldKeepListening = false;
let silenceTimer = null;

const voiceSilenceDelay = 2200;

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

// ------------------------------------------------------------
// Voice Status
// ------------------------------------------------------------

function setVoiceStatus(message, state = 'ready') {
    const status = document.getElementById('voiceStatus');

    if (!status) return;

    status.textContent = message;
    status.dataset.state = state;
}

// ------------------------------------------------------------
// Text To Speech
// ------------------------------------------------------------

function speak(message) {
    if (!('speechSynthesis' in window)) {
        return;
    }

    if (!message) return;

    const utterance =
        new SpeechSynthesisUtterance(String(message));

    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1;

    // Stop any previous speech
    window.speechSynthesis.cancel();

    // Temporarily stop recognition while speaking
    if (recognition && isListening) {
        try {
            recognition.stop();
        } catch {}
    }

    utterance.onend = () => {
        if (shouldKeepListening) {
            setTimeout(() => {
                startRecognition();
            }, 250);
        }
    };

    window.speechSynthesis.speak(utterance);
}

// ------------------------------------------------------------
// Create Recognition
// ------------------------------------------------------------

function createRecognition() {
    if (!SpeechRecognition) {
        setVoiceStatus(
            'Voice recognition is not supported in this browser.',
            'error'
        );

        return null;
    }

    const instance = new SpeechRecognition();

    instance.lang = 'en-US';
    instance.continuous = true;
    instance.interimResults = true;
    instance.maxAlternatives = 3;

    instance.onstart = () => {
        isListening = true;

        setVoiceStatus(
            'Listening... Speak your command.',
            'listening'
        );
    };

    instance.onresult = event => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (
            let i = event.resultIndex;
            i < event.results.length;
            i++
        ) {
            const result = event.results[i];

            if (!result || !result[0]) continue;

            const transcript =
                result[0].transcript.trim();

            if (result.isFinal) {
                finalTranscript += ` ${transcript}`;
            } else {
                interimTranscript += ` ${transcript}`;
            }
        }

        const finalText =
            finalTranscript.trim();

        const interimText =
            interimTranscript.trim();

        const transcriptElement =
            document.getElementById('voiceTranscript');

        if (transcriptElement) {
            transcriptElement.textContent =
                finalText || interimText || 'Listening...';
        }

        resetSilenceTimer();

        if (finalText) {
            processVoiceCommand(finalText);
        }
    };

    instance.onerror = event => {
        console.error(
            'Speech recognition error:',
            event.error
        );

        isListening = false;

        clearSilenceTimer();

        switch (event.error) {
            case 'not-allowed':
            case 'service-not-allowed':
                shouldKeepListening = false;

                setVoiceStatus(
                    'Microphone permission was denied.',
                    'error'
                );
                break;

            case 'no-speech':
                if (shouldKeepListening) {
                    setVoiceStatus(
                        'No speech detected. Listening again...',
                        'listening'
                    );
                }
                break;

            case 'audio-capture':
                shouldKeepListening = false;

                setVoiceStatus(
                    'No microphone was found.',
                    'error'
                );
                break;

            case 'network':
                setVoiceStatus(
                    'Network error during voice recognition.',
                    'error'
                );
                break;

            case 'aborted':
                break;

            default:
                setVoiceStatus(
                    'Voice recognition error. Please try again.',
                    'error'
                );
        }
    };

    instance.onend = () => {
        isListening = false;

        clearSilenceTimer();

        if (
            shouldKeepListening &&
            !window.speechSynthesis.speaking
        ) {
            setTimeout(() => {
                startRecognition();
            }, 250);
        } else if (!shouldKeepListening) {
            setVoiceStatus(
                'Voice ready.',
                'ready'
            );
        }
    };

    return instance;
}

// ------------------------------------------------------------
// Start Recognition
// ------------------------------------------------------------

function startRecognition() {
    if (!recognition) {
        recognition = createRecognition();
    }

    if (!recognition || isListening) {
        return;
    }

    try {
        recognition.start();
    } catch (error) {
        // Browser may throw InvalidStateError if start()
        // happens while recognition is already starting.
        console.warn(
            'Could not start speech recognition:',
            error
        );
    }
}

// ------------------------------------------------------------
// Stop Recognition
// ------------------------------------------------------------

function stopRecognition() {
    shouldKeepListening = false;

    clearSilenceTimer();

    if (recognition) {
        try {
            recognition.stop();
        } catch {}
    }

    isListening = false;

    setVoiceStatus(
        'Voice ready.',
        'ready'
    );
}

// ------------------------------------------------------------
// Toggle Voice
// ------------------------------------------------------------

function toggleVoiceInput() {
    if (!SpeechRecognition) {
        setVoiceStatus(
            'Voice recognition is not supported in this browser.',
            'error'
        );

        return;
    }

    if (isListening || shouldKeepListening) {
        stopRecognition();
        return;
    }

    shouldKeepListening = true;

    if (!recognition) {
        recognition = createRecognition();
    }

    startRecognition();
}

// ------------------------------------------------------------
// Silence Timer
// ------------------------------------------------------------

function resetSilenceTimer() {
    clearSilenceTimer();

    if (!shouldKeepListening) return;

    silenceTimer = setTimeout(() => {
        if (recognition && isListening) {
            try {
                recognition.stop();
            } catch {}
        }
    }, voiceSilenceDelay);
}

function clearSilenceTimer() {
    if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
    }
}

// ============================================================
// NUMBER WORD CONVERSION
// ============================================================

const numberUnits = {
    zero: 0,
    oh: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19
};

const numberTens = {
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90
};

const numberScales = {
    hundred: 100,
    thousand: 1000,
    million: 1000000
};

function wordsToNumber(text) {
    const words = text
        .toLowerCase()
        .replace(/-/g, ' ')
        .split(/\s+/)
        .filter(Boolean);

    if (!words.length) return null;

    let total = 0;
    let current = 0;
    let foundNumber = false;

    for (const word of words) {
        if (word === 'and') {
            continue;
        }

        if (
            Object.prototype.hasOwnProperty.call(
                numberUnits,
                word
            )
        ) {
            current += numberUnits[word];
            foundNumber = true;
            continue;
        }

        if (
            Object.prototype.hasOwnProperty.call(
                numberTens,
                word
            )
        ) {
            current += numberTens[word];
            foundNumber = true;
            continue;
        }

        if (word === 'hundred') {
            current =
                current === 0
                    ? 100
                    : current * 100;

            foundNumber = true;
            continue;
        }

        if (
            Object.prototype.hasOwnProperty.call(
                numberScales,
                word
            )
        ) {
            const scale = numberScales[word];

            if (current === 0) {
                current = 1;
            }

            total += current * scale;
            current = 0;

            foundNumber = true;
            continue;
        }

        return null;
    }

    if (!foundNumber) return null;

    return total + current;
}

function replaceNumberWords(text) {
    let result = text;

    // Decimal phrases
    result = result.replace(
        /\b([a-z\s-]+?)\s+point\s+([a-z\s-]+)\b/gi,
        (match, whole, decimals) => {
            const wholeNumber = wordsToNumber(
                whole.trim()
            );

            const decimalWords = decimals
                .trim()
                .split(/\s+/)
                .map(word => {
                    if (
                        Object.prototype.hasOwnProperty.call(
                            numberUnits,
                            word
                        )
                    ) {
                        return numberUnits[word];
                    }

                    return null;
                });

            if (
                wholeNumber === null ||
                decimalWords.some(v => v === null)
            ) {
                return match;
            }

            return `${wholeNumber}.${decimalWords.join('')}`;
        }
    );

    // Common number-word groups
    const numberPattern =
        /\b(?:zero|oh|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|and)(?:[-\s]+(?:zero|oh|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|and))*\b/gi;

    result = result.replace(
        numberPattern,
        match => {
            const value = wordsToNumber(match);

            return value === null
                ? match
                : String(value);
        }
    );

    return result;
}

// ============================================================
// VOICE COMMAND PROCESSOR
// ============================================================

function processVoiceCommand(rawText) {
    if (!rawText) return;

    const commandId = ++voiceCommandId;

    let text = rawText
        .toLowerCase()
        .trim();

    text = text
        .replace(/[?!,;:]/g, ' ')
        .replace(/\s+/g, ' ');

    text = replaceNumberWords(text);

    console.log(
        `Voice command #${commandId}:`,
        text
    );

    const transcript =
        document.getElementById('voiceTranscript');

    if (transcript) {
        transcript.textContent = rawText;
    }

    // --------------------------------------------------------
    // Stop / cancel
    // --------------------------------------------------------

    if (
        /^(stop|stop listening|cancel|cancel voice|turn off voice)$/.test(
            text
        )
    ) {
        stopRecognition();
        speak('Voice control stopped.');
        return;
    }

    // --------------------------------------------------------
    // Clear calculator
    // --------------------------------------------------------

    if (
        /^(clear|clear calculator|reset|reset calculator|all clear)$/.test(
            text
        )
    ) {
        if (typeof clearDisplay === 'function') {
            clearDisplay();
        }

        speak('Calculator cleared.');
        return;
    }

    // --------------------------------------------------------
    // Delete / Backspace
    // --------------------------------------------------------

    if (
        /^(delete|backspace|delete last|remove last)$/.test(
            text
        )
    ) {
        if (typeof deleteLast === 'function') {
            deleteLast();
        }

        speak('Deleted.');
        return;
    }

    // --------------------------------------------------------
    // Sign
    // --------------------------------------------------------

    if (
        /^(change sign|toggle sign|make negative|make positive)$/.test(
            text
        )
    ) {
        if (typeof toggleSign === 'function') {
            toggleSign();
            finishVoiceOperation();
        }

        return;
    }

    // --------------------------------------------------------
    // Mode
    // --------------------------------------------------------

    if (text.includes('scientific mode')) {
        if (typeof setCalculatorMode === 'function') {
            setCalculatorMode('scientific');
        }

        speak('Scientific mode.');
        return;
    }

    if (text.includes('standard mode')) {
        if (typeof setCalculatorMode === 'function') {
            setCalculatorMode('standard');
        }

        speak('Standard mode.');
        return;
    }

    if (
        text.includes('converter mode') ||
        text.includes('conversion mode')
    ) {
        if (typeof setCalculatorMode === 'function') {
            setCalculatorMode('converter');
        }

        speak('Converter mode.');
        return;
    }

    // --------------------------------------------------------
    // Angle mode
    // --------------------------------------------------------

    if (
        text === 'degrees' ||
        text === 'degree mode' ||
        text === 'degrees mode'
    ) {
        if (typeof angleMode !== 'undefined') {
            angleMode = 'DEG';
        }

        speak('Degrees mode.');
        return;
    }

    if (
        text === 'radians' ||
        text === 'radian mode' ||
        text === 'radians mode'
    ) {
        if (typeof angleMode !== 'undefined') {
            angleMode = 'RAD';
        }

        speak('Radians mode.');
        return;
    }

    // --------------------------------------------------------
    // Open utilities
    // --------------------------------------------------------

    if (
        text.includes('open settings') ||
        text === 'settings'
    ) {
        openUtilityPopup('settings');
        return;
    }

    if (
        text.includes('open tools') ||
        text.includes('open utilities') ||
        text === 'tools'
    ) {
        openUtilityPopup('tools');
        return;
    }

    if (
        text.includes('calculator') &&
        (
            text.includes('close') ||
            text.includes('back')
        )
    ) {
        if (typeof closePopupPage === 'function') {
            closePopupPage();
        }

        speak('Back to calculator.');
        return;
    }

    // --------------------------------------------------------
    // Days ahead / future date
    // --------------------------------------------------------

    const daysMatch = text.match(
        /(?:what(?:'s| is)?\s*)?(?:the\s*)?(?:date\s*)?(?:in|after)\s+(-?\d+(?:\.\d+)?)\s+days?/
    );

    if (daysMatch) {
        const days = parseInt(daysMatch[1], 10);

        if (Number.isFinite(days)) {
            openUtilityPopup('days');

            const input =
                document.getElementById('daysInput');

            if (input) {
                input.value = days;

                if (
                    typeof calculateFutureDate === 'function'
                ) {
                    calculateFutureDate();
                }
            }

            const result =
                document.getElementById('resultMain');

            if (result) {
                speak(
                    `The date is ${result.textContent}.`
                );
            }

            return;
        }
    }

    // --------------------------------------------------------
    // Date difference
    // --------------------------------------------------------

    if (
        text.includes('age difference') ||
        text.includes('date difference') ||
        text.includes('difference between dates')
    ) {
        openUtilityPopup('age');

        speak(
            'The date difference calculator is open.'
        );

        return;
    }

    // --------------------------------------------------------
    // World clock
    // --------------------------------------------------------

    if (
        text.includes('world clock') ||
        text.includes('world time') ||
        text.includes('time zones')
    ) {
        openUtilityPopup('time');

        speak('World clock opened.');
        return;
    }

    // --------------------------------------------------------
    // Currency
    // --------------------------------------------------------

    if (
        text.includes('currency') ||
        text.includes('exchange rate') ||
        text.includes('convert money')
    ) {
        openUtilityPopup('currency');

        speak('Currency converter opened.');
        return;
    }

    // --------------------------------------------------------
    // Scientific calculations
    // --------------------------------------------------------

    if (
        /^square root of\s+(.+)$/.test(text)
    ) {
        const valueText =
            text.replace(/^square root of\s+/, '');

        performScientific(
            valueText,
            value => Math.sqrt(value),
            'square root'
        );

        return;
    }

    if (
        /^(.+)\s+squared$/.test(text)
    ) {
        const valueText =
            text.replace(/\s+squared$/, '');

        performScientific(
            valueText,
            value => value ** 2,
            'square'
        );

        return;
    }

    if (
        /^(.+)\s+cubed$/.test(text)
    ) {
        const valueText =
            text.replace(/\s+cubed$/, '');

        performScientific(
            valueText,
            value => value ** 3,
            'cube'
        );

        return;
    }

    if (
        /^(.+)\s+factorial$/.test(text)
    ) {
        const valueText =
            text.replace(/\s+factorial$/, '');

        const value = parseVoiceNumber(valueText);

        if (
            value !== null &&
            Number.isInteger(value) &&
            value >= 0 &&
            value <= 170
        ) {
            let result = 1;

            for (let i = 2; i <= value; i++) {
                result *= i;
            }

            setVoiceResult(result);
        } else {
            speak('I could not calculate that factorial.');
        }

        return;
    }

    const trigMatch = text.match(
        /^(sin|sine|cos|cosine|tan|tangent)\s+(?:of\s+)?(.+)$/
    );

    if (trigMatch) {
        const operation = trigMatch[1];
        const value = parseVoiceNumber(
            trigMatch[2]
        );

        if (value === null) {
            speak('I could not understand the number.');
            return;
        }

        let result;

        const radians =
            typeof angleMode !== 'undefined' &&
            angleMode === 'RAD'
                ? value
                : value * Math.PI / 180;

        if (
            operation === 'sin' ||
            operation === 'sine'
        ) {
            result = Math.sin(radians);
        } else if (
            operation === 'cos' ||
            operation === 'cosine'
        ) {
            result = Math.cos(radians);
        } else {
            result = Math.tan(radians);
        }

        setVoiceResult(result);
        return;
    }

    const logMatch = text.match(
        /^(log|logarithm|log base 10)\s+(?:of\s+)?(.+)$/
    );

    if (logMatch) {
        const value = parseVoiceNumber(
            logMatch[2]
        );

        if (value === null || value <= 0) {
            speak('Logarithm requires a positive number.');
            return;
        }

        setVoiceResult(Math.log10(value));
        return;
    }

    const lnMatch = text.match(
        /^(natural log|ln)\s+(?:of\s+)?(.+)$/
    );

    if (lnMatch) {
        const value = parseVoiceNumber(
            lnMatch[2]
        );

        if (value === null || value <= 0) {
            speak('Natural logarithm requires a positive number.');
            return;
        }

        setVoiceResult(Math.log(value));
        return;
    }

    // --------------------------------------------------------
    // Power
    // --------------------------------------------------------

    const powerMatch = text.match(
        /^(.+?)\s+(?:to the power of|raised to)\s+(.+)$/
    );

    if (powerMatch) {
        const base = parseVoiceNumber(
            powerMatch[1]
        );

        const exponent = parseVoiceNumber(
            powerMatch[2]
        );

        if (
            base === null ||
            exponent === null
        ) {
            speak('I could not understand the power calculation.');
            return;
        }

        setVoiceResult(
            Math.pow(base, exponent)
        );

        return;
    }

    // --------------------------------------------------------
    // Reciprocal
    // --------------------------------------------------------

    const reciprocalMatch = text.match(
        /^(?:one over|reciprocal of)\s+(.+)$/
    );

    if (reciprocalMatch) {
        const value = parseVoiceNumber(
            reciprocalMatch[1]
        );

        if (value === null || value === 0) {
            speak('I cannot divide by zero.');
            return;
        }

        setVoiceResult(1 / value);
        return;
    }

    // --------------------------------------------------------
    // Unit conversion
    // --------------------------------------------------------

    if (
        /\b(?:celsius|centigrade)\b.*\b(?:fahrenheit|f)\b/.test(text)
    ) {
        performConversion(
            text,
            /(-?\d+(?:\.\d+)?)\s*(?:celsius|centigrade).*?(?:to|into)\s*(?:fahrenheit|f)/,
            value => value * 9 / 5 + 32,
            'degrees Fahrenheit'
        );

        return;
    }

    if (
        /\b(?:fahrenheit|f)\b.*\b(?:celsius|centigrade)\b/.test(text)
    ) {
        performConversion(
            text,
            /(-?\d+(?:\.\d+)?)\s*(?:fahrenheit|f).*?(?:to|into)\s*(?:celsius|centigrade)/,
            value => (value - 32) * 5 / 9,
            'degrees Celsius'
        );

        return;
    }

    if (
        /\bkilometers?\b.*\b miles?\b/.test(text)
    ) {
        performConversion(
            text,
            /(-?\d+(?:\.\d+)?)\s*kilometers?.*?(?:to|into)\s*miles?/,
            value => value * 0.621371,
            'miles'
        );

        return;
    }

    if (
        /\bmiles?\b.*\bkilometers?\b/.test(text)
    ) {
        performConversion(
            text,
            /(-?\d+(?:\.\d+)?)\s*miles?.*?(?:to|into)\s*kilometers?/,
            value => value / 0.621371,
            'kilometers'
        );

        return;
    }

    if (
        /\bkilograms?\b.*\bpounds?\b/.test(text)
    ) {
        performConversion(
            text,
            /(-?\d+(?:\.\d+)?)\s*kilograms?.*?(?:to|into)\s*pounds?/,
            value => value * 2.2046226218,
            'pounds'
        );

        return;
    }

    if (
        /\bpounds?\b.*\bkilograms?\b/.test(text)
    ) {
        performConversion(
            text,
            /(-?\d+(?:\.\d+)?)\s*pounds?.*?(?:to|into)\s*kilograms?/,
            value => value / 2.2046226218,
            'kilograms'
        );

        return;
    }

    // --------------------------------------------------------
    // Normal arithmetic
    // --------------------------------------------------------

    let expression = text
        .replace(/\bwhat is\b/g, '')
        .replace(/\bwhat's\b/g, '')
        .replace(/\bcalculate\b/g, '')
        .replace(/\bcompute\b/g, '')
        .replace(/\bplease\b/g, '')
        .replace(/\bthe answer to\b/g, '');

    expression = expression
        .replace(/\bmultiplied by\b/g, '*')
        .replace(/\bmultiply by\b/g, '*')
        .replace(/\btimes\b/g, '*')
        .replace(/\bdivided by\b/g, '/')
        .replace(/\bdivide by\b/g, '/')
        .replace(/\bover\b/g, '/')
        .replace(/\bplus\b/g, '+')
        .replace(/\bminus\b/g, '-')
        .replace(/\bequals\b/g, '=')
        .replace(/\bis equal to\b/g, '=')
        .replace(/\bx\b/g, '*');

    expression = expression
        .replace(/=/g, '')
        .replace(/[^0-9+\-*/%.() ]/g, '')
        .replace(/\s+/g, '');

    if (
        /[0-9]/.test(expression) &&
        /[+\-*/%]/.test(expression)
    ) {
        try {
            const result =
                typeof evaluateExpression === 'function'
                    ? evaluateExpression(expression)
                    : Function(
                        `"use strict"; return (${expression})`
                    )();

            setVoiceResult(result);
            return;

        } catch (error) {
            console.error(
                'Voice expression error:',
                error
            );
        }
    }

    // A single spoken number
    const singleNumber =
        parseVoiceNumber(text);

    if (singleNumber !== null) {
        setVoiceResult(singleNumber);
        return;
    }

    speak(
        `I heard "${rawText}", but I don't understand that command yet.`
    );
}

// ============================================================
// VOICE HELPERS
// ============================================================

function parseVoiceNumber(text) {
    if (!text) return null;

    const cleaned = text
        .toLowerCase()
        .trim();

    if (/^-?\d+(?:\.\d+)?$/.test(cleaned)) {
        return Number(cleaned);
    }

    const converted =
        replaceNumberWords(cleaned);

    if (
        /^-?\d+(?:\.\d+)?$/.test(converted)
    ) {
        return Number(converted);
    }

    return null;
}

function setVoiceResult(result) {
    if (!Number.isFinite(result)) {
        speak('The result is not a valid number.');
        return;
    }

    const formatted =
        typeof formatResult === 'function'
            ? formatResult(result)
            : String(Number(result.toFixed(8)));

    const display =
        document.getElementById('display');

    if (display) {
        display.value = formatted;
    }

    if (typeof isNewCalculation !== 'undefined') {
        isNewCalculation = true;
    }

    if (typeof pulseDisplay === 'function') {
        pulseDisplay();
    }

    speak(
        `The answer is ${formatForSpeech(formatted)}`
    );
}

function formatForSpeech(value) {
    return String(value)
        .replace(/\./g, ' point ')
        .replace(/-/g, ' minus ');
}

function performScientific(
    valueText,
    operation,
    name
) {
    const value =
        parseVoiceNumber(valueText);

    if (value === null) {
        speak(
            `I could not understand the number for ${name}.`
        );

        return;
    }

    try {
        const result = operation(value);

        if (!Number.isFinite(result)) {
            throw new Error('Invalid result');
        }

        setVoiceResult(result);

    } catch {
        speak(
            `I could not calculate the ${name}.`
        );
    }
}

function performConversion(
    text,
    regex,
    operation,
    unitName
) {
    const match = text.match(regex);

    if (!match) {
        speak('I could not understand that conversion.');
        return;
    }

    const value = Number(match[1]);

    if (!Number.isFinite(value)) {
        speak('I could not understand the number.');
        return;
    }

    const result = operation(value);

    setVoiceResult(result);

    // Give the unit in the response
    if (Number.isFinite(result)) {
        const formatted =
            typeof formatResult === 'function'
                ? formatResult(result)
                : String(result);

        speak(
            `${formatForSpeech(formatted)} ${unitName}.`
        );
    }
}

// ------------------------------------------------------------
// Utility Popup Navigation
// ------------------------------------------------------------

function openUtilityPopup(type) {
    if (typeof openPopupPage === 'function') {
        openPopupPage();
    }

    const tabMap = {
        days: 'days-tab',
        age: 'age-tab',
        time: 'time-tab',
        currency: 'currency-tab',
        settings: 'settings-tab',
        tools: 'tools-tab'
    };

    const tabId = tabMap[type];

    if (!tabId) return;

    const button =
        document.querySelector(
            `.tab-btn[data-tab="${tabId}"]`
        );

    if (typeof switchTab === 'function') {
        switchTab(tabId, button);
    }
}

// ============================================================
// INITIALIZATION
// ============================================================

function initializeVoice() {
    if (!SpeechRecognition) {
        setVoiceStatus(
            'Voice recognition is unavailable in this browser.',
            'error'
        );

        return;
    }

    if (!recognition) {
        recognition = createRecognition();
    }

    setVoiceStatus(
        'Voice ready.',
        'ready'
    );
}

if (
    document.readyState === 'loading'
) {
    document.addEventListener(
        'DOMContentLoaded',
        initializeVoice,
        { once: true }
    );
} else {
    initializeVoice();
}