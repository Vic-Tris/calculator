// Calculator controller

const display = document.getElementById('display');
const pagesWrapper = document.getElementById('pages-wrapper');
const pageTitle = document.getElementById('page-title');
let currentMode = 1;
let angleMode = 'DEG';
let calculationHistory = [];

function formatResult(value) {
    if (!Number.isFinite(value)) throw new Error('Invalid result');
    return String(Number(value.toPrecision(12)));
}

function evaluateExpression(expression) {
    const normalized = expression
        .replace(/Math\.PI/g, 'PI')
        .replace(/Math\.E/g, 'E');

    if (!/^[0-9+\-*/%().\sA-Za-z]+$/.test(normalized)) {
        throw new Error('Invalid expression');
    }

    const toRadians = value => angleMode === 'DEG' ? value * Math.PI / 180 : value;
    const fromRadians = value => angleMode === 'DEG' ? value * 180 / Math.PI : value;
    const names = {
        PI: Math.PI,
        E: Math.E,
        sin: value => Math.sin(toRadians(value)),
        cos: value => Math.cos(toRadians(value)),
        tan: value => Math.tan(toRadians(value)),
        asin: value => fromRadians(Math.asin(value)),
        acos: value => fromRadians(Math.acos(value)),
        atan: value => fromRadians(Math.atan(value)),
        log10: value => Math.log10(value),
        ln: value => Math.log(value),
        sqrt: value => Math.sqrt(value),
        abs: value => Math.abs(value)
    };
    const identifiers = normalized.match(/[A-Za-z]+/g) || [];

    if (identifiers.some(name => !Object.prototype.hasOwnProperty.call(names, name))) {
        throw new Error('Invalid expression');
    }

    return Function(...Object.keys(names), `"use strict"; return (${normalized});`)(...Object.values(names));
}

function appendValue(value) {
    if (!display) return;
    display.value += value;
    display.scrollLeft = display.scrollWidth;
}

function clearDisplay() {
    if (display) display.value = '';
}

function deleteLast() {
    if (display) display.value = display.value.slice(0, -1);
}

function toggleSign() {
    if (!display || !display.value) return;
    display.value = display.value.startsWith('-')
        ? display.value.slice(1)
        : `-(${display.value})`;
}

function recordHistory(expression, result) {
    calculationHistory.unshift({ expression, result });
    calculationHistory = calculationHistory.slice(0, 30);
    renderHistory();
}

function calculate() {
    if (!display || !display.value) return;
    const expression = display.value;

    try {
        const result = formatResult(evaluateExpression(expression));
        display.value = result;
        recordHistory(expression, result);
    } catch {
        display.value = 'Error';
    }
}

function calculatePercentage() {
    applyToDisplay(value => value / 100);
}

function calculateReciprocal() {
    applyToDisplay(value => 1 / value);
}

function calculateSquare() {
    applyToDisplay(value => value ** 2);
}

function calculateCube() {
    applyToDisplay(value => value ** 3);
}

function calculateFactorial() {
    applyToDisplay(value => {
        if (value < 0 || !Number.isInteger(value) || value > 170) throw new Error('Invalid factorial');
        let result = 1;
        for (let index = 2; index <= value; index++) result *= index;
        return result;
    });
}

function applyToDisplay(operation) {
    if (!display || !display.value) return;

    try {
        display.value = formatResult(operation(evaluateExpression(display.value)));
    } catch {
        display.value = 'Error';
    }
}

function appendMathFunc(name) {
    if (display) display.value += `${name}(`;
}

function toggleAngleMode() {
    angleMode = angleMode === 'DEG' ? 'RAD' : 'DEG';
    const button = document.getElementById('angle-mode');
    if (button) button.textContent = angleMode;
}

function nextMode() {
    setCalculatorMode(currentMode === 3 ? 1 : currentMode + 1);
}

function setCalculatorMode(mode) {
    const modes = { standard: 1, scientific: 2, converter: 3 };
    currentMode = typeof mode === 'string' ? modes[mode] || 1 : mode;

    if (pagesWrapper) pagesWrapper.className = `pages-wrapper mode-${currentMode}`;
    if (pageTitle) pageTitle.textContent = ['Standard', 'Scientific', 'Converter'][currentMode - 1];
}

function renderHistory() {
    const list = document.getElementById('historyList');
    if (!list) return;

    list.innerHTML = calculationHistory.length
        ? calculationHistory.map(item => `<div class="history-item" onclick="display.value='${item.result}'"><div class="history-expr">${item.expression}</div><div class="history-ans">${item.result}</div></div>`).join('')
        : '<div class="history-empty">No history yet</div>';
}

function toggleHistoryDrawer() {
    const drawer = document.getElementById('historyDrawer');
    if (drawer) drawer.classList.toggle('active');
}

function clearHistory() {
    calculationHistory = [];
    renderHistory();
}

function convert(operation) {
    if (!display || !display.value) return;
    const number = Number(display.value);
    if (Number.isFinite(number)) display.value = formatResult(operation(number));
}

function convertCtoF() { convert(value => value * 9 / 5 + 32); }
function convertFtoC() { convert(value => (value - 32) * 5 / 9); }
function convertKmToMiles() { convert(value => value * 0.621371); }
function convertMilesToKm() { convert(value => value / 0.621371); }
function convertKgToLbs() { convert(value => value * 2.20462); }
function convertLbsToKg() { convert(value => value / 2.20462); }

setCalculatorMode(1);
