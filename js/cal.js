    const display = document.getElementById('display');

    // Evaluate only the calculator grammar; never execute arbitrary JavaScript.
    function evaluateExpression(expression) {
        const tokens = [];
        const tokenPattern = /\s*(?:(\d+(?:\.\d*)?|\.\d+)|([A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z][A-Za-z0-9]*)?)|(\*\*|[+\-*/%()]))/y;
        let position = 0;
        while (position < expression.length) {
            tokenPattern.lastIndex = position;
            const match = tokenPattern.exec(expression);
            if (!match) throw new Error('Invalid expression');
            tokens.push(match[1] !== undefined ? { type: 'number', value: Number(match[1]) } :
                match[2] !== undefined ? { type: 'name', value: match[2] } :
                { type: 'operator', value: match[3] });
            position = tokenPattern.lastIndex;
        }

        let tokenIndex = 0;
        const peek = () => tokens[tokenIndex];
        const consume = (value) => {
            if (peek()?.value !== value) throw new Error('Invalid expression');
            tokenIndex++;
        };
        const parseExpression = () => {
            let value = parseTerm();
            while (peek()?.value === '+' || peek()?.value === '-') {
                const operator = tokens[tokenIndex++].value;
                const right = parseTerm();
                value = operator === '+' ? value + right : value - right;
            }
            return value;
        };
        const parseTerm = () => {
            let value = parsePower();
            while (peek()?.value && '*/%'.includes(peek().value)) {
                const operator = tokens[tokenIndex++].value;
                const right = parsePower();
                if (operator === '*') value *= right;
                if (operator === '/') value /= right;
                if (operator === '%') value %= right;
            }
            return value;
        };
        const parsePower = () => {
            const value = parseUnary();
            if (peek()?.value === '**') {
                tokenIndex++;
                return value ** parsePower();
            }
            return value;
        };
        const parseUnary = () => {
            if (peek()?.value === '+') { tokenIndex++; return parseUnary(); }
            if (peek()?.value === '-') { tokenIndex++; return -parseUnary(); }
            return parsePrimary();
        };
        const functions = { sin, cos, tan, asin, acos, atan, log10, ln, sqrt, abs };
        const parsePrimary = () => {
            const token = peek();
            if (!token) throw new Error('Invalid expression');
            if (token.type === 'number') { tokenIndex++; return token.value; }
            if (token.value === '(') {
                tokenIndex++;
                const value = parseExpression();
                consume(')');
                return value;
            }
            if (token.type === 'name') {
                tokenIndex++;
                if (token.value === 'Math.PI') return Math.PI;
                if (token.value === 'Math.E') return Math.E;
                if (!functions[token.value]) throw new Error('Unknown function');
                consume('(');
                const value = functions[token.value](parseExpression());
                consume(')');
                return value;
            }
            throw new Error('Invalid expression');
        };

        const result = parseExpression();
        if (tokenIndex !== tokens.length || !Number.isFinite(result)) throw new Error('Invalid result');
        return result;
    }

    let lastOperator = null;
    let lastOperand = null;
    let isNewCalculation = false;

    // Add ripple effect to all buttons on click
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', function (e) {
            const circle = document.createElement('span');
            const diameter = Math.max(this.clientWidth, this.clientHeight);
            const radius = diameter / 2;

            const rect = this.getBoundingClientRect();
            circle.style.width = circle.style.height = `${diameter}px`;
            circle.style.left = `${e.clientX - rect.left - radius}px`;
            circle.style.top = `${e.clientY - rect.top - radius}px`;
            circle.classList.add('ripple');

            const ripple = this.getElementsByClassName('ripple')[0];
            if (ripple) {
                ripple.remove();
            }

            this.appendChild(circle);
        });
    });

    // Append value with auto-scroll and continuous operator evaluation
function appendValue(val) {
    const display = document.getElementById('display');
    const operators = ['+', '-', '*', '/', '**', '%'];

    if (!display) return;

    // Reset flag if user enters an operator right after a calculation
    if (typeof isNewCalculation !== 'undefined' && isNewCalculation) {
        if (operators.includes(val)) {
            isNewCalculation = false; // Continue calculating with current result
        } else {
            display.value = ''; // Clear for fresh input
            isNewCalculation = false;
        }
    }

    // Handle operator logic
    if (operators.includes(val)) {
        // Prevent leading operators except unary minus or parenthetical operators
        if (display.value === '' && val !== '-') {
            return;
        }

        // Check for existing trailing operators
        const endsWithTwoCharOp = display.value.endsWith('**');
        const lastChar = display.value.slice(-1);

        // Case 1: Replace multi-character operator '**'
        if (endsWithTwoCharOp) {
            display.value = display.value.slice(0, -2) + val;
            scrollToLatest();
            return;
        }

        // Case 2: Replace single-character operator
        if (operators.includes(lastChar)) {
            // Allow negative sign after * or / for signed numbers (e.g., 5 * -2)
            if (val === '-' && (lastChar === '*' || lastChar === '/')) {
                display.value += val;
                scrollToLatest();
                return;
            }

            display.value = display.value.slice(0, -1) + val;
            scrollToLatest();
            return;
        }

        // CONTINUOUS EVALUATION: Evaluate pending expression before chaining the new operator
        if (display.value && /[0-9)]/.test(lastChar)) {
            try {
                let intermediate = evaluateExpression(display.value);
                
                // Avoid displaying NaN or Infinity directly in continuous mode
                if (Number.isFinite(intermediate)) {
                    intermediate = Math.round(intermediate * 1e8) / 1e8;

                    // Push intermediate step to history if function exists
                    if (typeof addToHistory === 'function') {
                        addToHistory(display.value, intermediate);
                    }

                    display.value = intermediate;
                }
            } catch (e) {
                // If expression is invalid or incomplete (e.g. unclosed parens), maintain raw input
            }
        }
    }

    // Prevent multiple decimals in the same number segment
    if (val === '.') {
        const currentSegment = display.value.split(/[\+\-\*\/\%]/).pop();
        if (currentSegment.includes('.')) return;
    }

    // Append the new value
    display.value += val;

    // Trigger auto-scroll to keep latest input visible
    scrollToLatest();
}

// Helper to keep display scrolled to the far right
function scrollToLatest() {
    const display = document.getElementById('display');
    if (display) {
        display.scrollLeft = display.scrollWidth;
    }
}
    function clearDisplay() {
        display.value = '';
        lastOperator = null;
        lastOperand = null;
        isNewCalculation = false;
    }

    function deleteLast() {
        display.value = display.value.slice(0, -1);
    }
    function calculatePercentage() {
        try {
            if (display.value) {
                display.value = evaluateExpression(display.value) / 100;
                triggerPulse();
            }
        } catch (e) {
            display.value = 'Error';
            triggerPulse();
        }
    }

  /**
 * Master Calculate Function
 * Handles standard evaluation, continuous operator chaining, repeated equals,
 * decimal/negative values, division by zero, floating precision cleanup, and history drawer logging.
 */
function calculate() {
    const display = document.getElementById('display');
    if (!display || !display.value.trim()) return;

    let rawExpr = display.value.trim();

    try {
        // 1. Map visual display symbols to valid JS math operators
        let sanitizedExpr = rawExpr
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-');

        // 2. Continuous Repeated Equals Logic (e.g., 2 + 2 = 4 -> click '=' again -> 6)
        if (isNewCalculation && lastOperator !== null && lastOperand !== null) {
            sanitizedExpr = `${sanitizedExpr} ${lastOperator} ${lastOperand}`;
            rawExpr = `${display.value} ${lastOperator} ${lastOperand}`;
        } else {
            // Trim dangling operators if user hits '=' early (e.g., "12 + " -> "12")
            if (/[+\-*/.]$/.test(sanitizedExpr)) {
                sanitizedExpr = sanitizedExpr.slice(0, -1);
                if (!sanitizedExpr) return;
            }

            // Extract and save the trailing operator and operand for repeated '=' operations
            const match = sanitizedExpr.match(/([+\-*/])\s*(-?\d*\.?\d+)$/);
            if (match) {
                lastOperator = match[1];
                lastOperand = match[2];
            } else {
                lastOperator = null;
                lastOperand = null;
            }
        }

        // 3. Safely evaluate expression using Function constructor
        let result = evaluateExpression(sanitizedExpr);

        // 4. Handle Division by Zero, Infinity, and NaN errors
        if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
            display.value = 'Error';
            if (typeof triggerPulse === 'function') triggerPulse();
            isNewCalculation = true;
            return;
        }

        // 5. Clean up floating-point precision artifacts (e.g., 0.1 + 0.2 = 0.3)
        result = Math.round(result * 100000000) / 100000000;

        // 6. Save calculation entry to History Drawer
        if (typeof addToHistory === 'function') {
            addToHistory(rawExpr, result);
        }

        // 7. Update Display UI and trigger visual/haptic feedback
        display.value = result.toString();

        if (typeof scrollToLatest === 'function') {
            scrollToLatest();
        }

        if (typeof triggerPulse === 'function') {
            triggerPulse();
        }

        // Trigger light mobile haptic vibration if supported
        if (navigator.vibrate) {
            navigator.vibrate(20);
        }

        // Mark calculation state as complete
        isNewCalculation = true;
        if (typeof speak === 'function') speak(`The answer is ${result}`);

    } catch (e) {
        // Catch any evaluation syntax errors safely
        display.value = 'Error';
        if (typeof triggerPulse === 'function') {
            triggerPulse();
        }
        isNewCalculation = true;
    }
}

    function calculateSquareRoot() {
    try {
        if (display.value) {
            const currentVal = evaluateExpression(display.value);
            if (currentVal < 0) {
                display.value = 'Error';
            } else {
                display.value = Math.sqrt(currentVal);
            }
            triggerPulse();
            isNewCalculation = true;
        }
    } catch (e) {
        display.value = 'Error';
        triggerPulse();
    }
}
    function evaluateCurrent() {
        if (!display.value || display.value === 'Error') {
            throw new Error('Missing expression');
        }
        return evaluateExpression(display.value);
    }

    function calculateSquare() {
        try {
            display.value = evaluateCurrent() ** 2;
            triggerPulse();
            isNewCalculation = true;
            lastOperator = null;
            lastOperand = null;
        } catch (e) {
            display.value = 'Error';
            triggerPulse();
        }
    }

    function calculateCube() {
        try {
            display.value = evaluateCurrent() ** 3;
            triggerPulse();
            isNewCalculation = true;
            lastOperator = null;
            lastOperand = null;
        } catch (e) {
            display.value = 'Error';
            triggerPulse();
        }
    }

    function calculateReciprocal() {
        try {
            const value = evaluateCurrent();
            if (value === 0) throw new Error('Division by zero');
            display.value = 1 / value;
            triggerPulse();
            isNewCalculation = true;
        } catch (e) {
            display.value = 'Error';
            triggerPulse();
        }
    }

    function toggleSign() {
        if (!display.value || display.value === 'Error') return;
        display.value = display.value.startsWith('-(') && display.value.endsWith(')')
            ? display.value.slice(2, -1)
            : `-(${display.value})`;
    }

    function toggleAngleMode() {
        const angleMode = document.getElementById('angle-mode');
        angleMode.textContent = angleMode.textContent === 'DEG' ? 'RAD' : 'DEG';
    }

    function usesDegrees() {
        return document.getElementById('angle-mode').textContent === 'DEG';
    }

    function toRadians(value) {
        return usesDegrees() ? value * Math.PI / 180 : value;
    }

    function fromRadians(value) {
        return usesDegrees() ? value * 180 / Math.PI : value;
    }

    function sin(value) { return Math.sin(toRadians(value)); }
    function cos(value) { return Math.cos(toRadians(value)); }
    function tan(value) { return Math.tan(toRadians(value)); }
    function asin(value) { return fromRadians(Math.asin(value)); }
    function acos(value) { return fromRadians(Math.acos(value)); }
    function atan(value) { return fromRadians(Math.atan(value)); }
    function log10(value) { return Math.log10(value); }
    function ln(value) { return Math.log(value); }
    function sqrt(value) { return Math.sqrt(value); }
    function abs(value) { return Math.abs(value); }

    function triggerPulse() {
        display.classList.add('pulse');
        void display.offsetWidth; // Trigger reflow to restart the animation
        display.classList.remove('pulse');
    }
    // Physical Keyboard Listener with Visual Button Feedback
document.addEventListener('keydown', function(event) {
    const key = event.key;
    let buttonSelector = null;

    // Handle Number keys (0-9) and Decimal point
    if ((key >= '0' && key <= '9') || key === '.') {
        appendValue(key);
        buttonSelector = `button[onclick="appendValue('${key}')"]`;
    }
    // Handle standard operators
    else if (key === '+' || key === '-' || key === '*' || key === '/') {
        appendValue(key);
        buttonSelector = `button[onclick="appendValue('${key}')"]`;
    }
    // Handle exponentiation key (Caret '^')
    else if (key === '^') {
        appendValue('**');
        buttonSelector = `button[onclick="appendValue('**')"]`;
    }
    // Handle Percentage
    else if (key === '%') {
        calculatePercentage();
        buttonSelector = `button[onclick="calculatePercentage()"]`;
    }
    // Handle Equals / Enter
    else if (key === 'Enter' || key === '=') {
        event.preventDefault(); // Prevents triggering default button re-presses
        calculate();
        buttonSelector = `button[onclick="calculate()"]`;
    }
    // Handle Backspace (Delete last digit)
    else if (key === 'Backspace') {
        deleteLast();
        buttonSelector = `button[onclick="deleteLast()"]`;
    }
    // Handle Escape or 'c' / 'C' (Clear display)
    else if (key === 'Escape' || key.toLowerCase() === 'c') {
        clearDisplay();
        buttonSelector = `button[onclick="clearDisplay()"]`;
    }

    // Trigger physical button visual feedback
    if (buttonSelector) {
        const targetButton = document.querySelector(buttonSelector);
        if (targetButton) {
            triggerButtonVisual(targetButton);
        }
    }
});

// Function to animate the button when activated by physical keypress
function triggerButtonVisual(btn) {
    // 1. Add keypress highlight style
    btn.classList.add('keyboard-active');

    // 2. Trigger visual ripple effect
    const circle = document.createElement('span');
    const diameter = Math.max(btn.clientWidth, btn.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${btn.clientWidth / 2 - radius}px`;
    circle.style.top = `${btn.clientHeight / 2 - radius}px`;
    circle.classList.add('ripple');

    const existingRipple = btn.getElementsByClassName('ripple')[0];
    if (existingRipple) {
        existingRipple.remove();
    }
    btn.appendChild(circle);

    // 3. Remove highlight style after release animation
    setTimeout(() => {
        btn.classList.remove('keyboard-active');
    }, 150);
}

let currentMode = 1;
const modeTitles = ["Standard", "Scientific", "Converter"];

function nextMode() {
    const wrapper = document.getElementById('pages-wrapper');
    const title = document.getElementById('page-title');

    // Cycle through modes 1 -> 2 -> 3 -> 1
    currentMode = (currentMode % 3) + 1;

    // Remove old mode classes and apply the new one
    wrapper.classList.remove('mode-1', 'mode-2', 'mode-3', 'show-page-2');
    wrapper.classList.add(`mode-${currentMode}`);

    // Update header label
    title.textContent = modeTitles[currentMode - 1];
}

// Helper for scientific functions like sin, cos, log
function appendMathFunc(funcName) {
    if (isNewCalculation) {
        display.value = '';
        isNewCalculation = false;
    }
    if (display.value && !/[+\-*\/(]$/.test(display.value)) {
        display.value = `${funcName}(${display.value})`;
    } else {
        display.value += `${funcName}(`;
    }
}

// Factorial function (n!)
function calculateFactorial() {
    try {
        if (!display.value) return;
        const num = evaluateExpression(display.value);
        if (!Number.isInteger(num) || num < 0 || num > 170) throw new Error('Invalid factorial');
        let result = 1;
        for (let i = 2; i <= num; i++) result *= i;
        display.value = result;
        triggerPulse();
        isNewCalculation = true;
    } catch (e) {
        display.value = 'Error';
        triggerPulse();
    }
}

// Converter Functions for Mode 3
function convertCtoF() {
    if (display.value) {
        display.value = (evaluateExpression(display.value) * 9/5 + 32).toFixed(2);
        triggerPulse();
    }
}

function convertFtoC() {
    if (display.value) {
        display.value = ((evaluateExpression(display.value) - 32) * 5/9).toFixed(2);
        triggerPulse();
    }
}

function convertKmToMiles() {
    if (display.value) {
        display.value = (evaluateExpression(display.value) * 0.621371).toFixed(2);
        triggerPulse();
    }
}

function convertMilesToKm() {
    if (display.value) {
        display.value = (evaluateExpression(display.value) / 0.621371).toFixed(2);
        triggerPulse();
    }
}

function convertKgToLbs() {
    if (display.value) {
        display.value = (evaluateExpression(display.value) * 2.20462).toFixed(2);
        triggerPulse();
    }
}

function convertLbsToKg() {
    if (display.value) {
        display.value = (evaluateExpression(display.value) / 2.20462).toFixed(2);
        triggerPulse();
    }
}

// Auto-scroll display input to show the newest digits
function scrollToLatest() {
    const display = document.getElementById('display');
    if (display) {
        display.scrollLeft = display.scrollWidth;
    }
}
// Toggle (+/-) sign of current display value or expression
function toggleSign() {
    const display = document.getElementById('display');
    if (!display || !display.value) return;

    let currentValue = display.value;

    // Case 1: If current value is a simple positive or negative number
    if (!isNaN(currentValue)) {
        display.value = (parseFloat(currentValue) * -1).toString();
        if (typeof scrollToLatest === 'function') scrollToLatest();
        return;
    }

    // Case 2: If display contains an active expression, wrap or toggle the last operand
    // Matches trailing decimal/integer number at the end of expression
    const lastNumberRegex = /(-?\d*\.?\d+)$/;
    const match = currentValue.match(lastNumberRegex);

    if (match) {
        const lastNum = match[0];
        const startIndex = match.index;
        const toggledNum = (parseFloat(lastNum) * -1).toString();

        display.value = currentValue.substring(0, startIndex) + toggledNum;
    } else {
        // Fallback: If ending with an operator, append minus sign for negative entry
        display.value += '-';
    }

    if (typeof scrollToLatest === 'function') scrollToLatest();
}

// Helper: Handle percentage calculations cleanly without decimal syntax errors
function calculatePercentage() {
    const display = document.getElementById('display');
    if (!display || !display.value) return;

    try {
        let val = evaluateExpression(display.value);
        if (typeof val === 'number' && !isNaN(val)) {
            val = val / 100;
            display.value = Math.round(val * 100000000) / 100000000;
            if (typeof scrollToLatest === 'function') scrollToLatest();
        }
    } catch (e) {
        display.value = 'Error';
    }
}
