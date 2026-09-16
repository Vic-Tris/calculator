    const display = document.getElementById('display');

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

    function appendValue(val) {
    if (isNewCalculation) {
        // If typing a new number after pressing '=', clear the screen first
        if (!isNaN(val) || val === '.') {
            display.value = '';
        }
        isNewCalculation = false;
    }
    display.value += val;
    // Reset stored repeated operation when a new input is typed manually
    lastOperator = null;
    lastOperand = null;
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
                display.value = eval(display.value) / 100;
                triggerPulse();
            }
        } catch (e) {
            display.value = 'Error';
            triggerPulse();
        }
    }

   function calculate() {
    try {
        if (!display.value) return;

        let expr = display.value;

        if (lastOperator !== null && lastOperand !== null) {
            // Repeat the last operator and operand if '=' is pressed sequentially
            expr = `${display.value} ${lastOperator} ${lastOperand}`;
        } else {
            // Capture the trailing operator and number from the expression
            const match = expr.match(/([\+\-\*\/\*\*])\s*([0-9\.]+)$/);
            if (match) {
                lastOperator = match[1];
                lastOperand = match[2];
            }
        }

        display.value = eval(expr);
        triggerPulse();
        isNewCalculation = true;
    } catch (e) {
        display.value = 'Error';
        triggerPulse();
    }
}

    function calculateSquareRoot() {
    try {
        if (display.value) {
            const currentVal = eval(display.value);
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
        return eval(display.value);
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
        const num = eval(display.value);
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
        display.value = (parseFloat(eval(display.value)) * 9/5 + 32).toFixed(2);
        triggerPulse();
    }
}

function convertFtoC() {
    if (display.value) {
        display.value = ((parseFloat(eval(display.value)) - 32) * 5/9).toFixed(2);
        triggerPulse();
    }
}

function convertKmToMiles() {
    if (display.value) {
        display.value = (parseFloat(eval(display.value)) * 0.621371).toFixed(2);
        triggerPulse();
    }
}

function convertMilesToKm() {
    if (display.value) {
        display.value = (parseFloat(eval(display.value)) / 0.621371).toFixed(2);
        triggerPulse();
    }
}

function convertKgToLbs() {
    if (display.value) {
        display.value = (parseFloat(eval(display.value)) * 2.20462).toFixed(2);
        triggerPulse();
    }
}

function convertLbsToKg() {
    if (display.value) {
        display.value = (parseFloat(eval(display.value)) / 2.20462).toFixed(2);
        triggerPulse();
    }
}
