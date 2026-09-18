
// Opens the popup page instantly
function openPopupPage() {
    const popup = document.getElementById('popupOverlay');
    popup.classList.add('active');
}

// Redirects back to standard calculator
function closePopupPage() {
    const popup = document.getElementById('popupOverlay');
    popup.classList.remove('active');
}

// Calculate date when entering days into popup
function calculateFutureDate() {
    const daysInput = document.getElementById('daysInput').value;
    const resultMain = document.getElementById('resultMain');
    const resultSub = document.getElementById('resultSub');

    const today = new Date();
    
    // Display today's date in footer
    const todayFormatted = today.toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
    resultSub.textContent = `From Today: ${todayFormatted}`;

    if (daysInput === '' || isNaN(daysInput)) {
        resultMain.textContent = 'Enter number of days';
        return;
    }

    const daysCount = parseInt(daysInput, 10);
    const targetDate = new Date();
    
    // Add/subtract days relative to current timestamp
    targetDate.setDate(today.getDate() + daysCount);

    // Format output date (e.g. "Thursday, Jan 14, 2027")
    const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
    resultMain.textContent = targetDate.toLocaleDateString('en-US', options);
}

// Auto-calculate on popup load
function openPopupPage() {
    const popup = document.getElementById('popupOverlay');
    popup.classList.add('active');
    calculateFutureDate(); // Refresh initial state
}

let clockTimer = null;

// Tab Switching
function switchTab(tabId, btnElement) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    btnElement.classList.add('active');

    if (tabId === 'time-tab') {
        startWorldClock();
    } else {
        stopWorldClock();
    }
}

// Age & Date Difference Logic
function calculateDateDifference() {
    const startVal = document.getElementById('startDate').value;
    const endVal = document.getElementById('endDate').value;
    const resultMain = document.getElementById('diffResultMain');
    const resultSub = document.getElementById('diffResultSub');

    if (!startVal || !endVal) return;

    let start = new Date(startVal);
    let end = new Date(endVal);

    if (start > end) {
        // Swap if start is later than end
        [start, end] = [end, start];
    }

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
        months--;
        const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
        days += prevMonth.getDate();
    }
    if (months < 0) {
        years--;
        months += 12;
    }

    const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24));

    resultMain.textContent = `${years}y ${months}m ${days}d`;
    resultSub.textContent = `Total duration: ${totalDays.toLocaleString()} days`;
}

// World Clock Live Updates
function startWorldClock() {
    updateClocks();
    if (!clockTimer) {
        clockTimer = setInterval(updateClocks, 1000);
    }
}

function stopWorldClock() {
    if (clockTimer) {
        clearInterval(clockTimer);
        clockTimer = null;
    }
}

function updateClocks() {
    const timeZones = {
        'clock-ny': 'America/New_York',
        'clock-london': 'Europe/London',
        'clock-tokyo': 'Asia/Tokyo',
        'clock-sydney': 'Australia/Sydney'
    };

    const now = new Date();
    for (let id in timeZones) {
        const timeStr = now.toLocaleTimeString('en-US', {
            timeZone: timeZones[id],
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        const elem = document.getElementById(id);
        if (elem) elem.textContent = timeStr;
    }
}

// Initialize default date inputs on popup launch
function openPopupPage() {
    const popup = document.getElementById('popupOverlay');
    popup.classList.add('active');

    // Default dates for Age/Diff tab
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').value = '2000-01-01';
    document.getElementById('endDate').value = today;
    
    calculateFutureDate();
    calculateDateDifference();
}

function closePopupPage() {
    const popup = document.getElementById('popupOverlay');
    popup.classList.remove('active');
    stopWorldClock();
}
// Calculate difference dynamically on user typing or selecting dates
function calculateDateDifference() {
    const startVal = document.getElementById('startDate').value;
    const endVal = document.getElementById('endDate').value;
    const resultMain = document.getElementById('diffResultMain');
    const resultSub = document.getElementById('diffResultSub');

    // Return if either date is incomplete while typing
    if (!startVal || !endVal) {
        resultMain.textContent = 'Type or select both dates';
        resultSub.textContent = 'Years, Months & Days';
        return;
    }

    let start = new Date(startVal);
    let end = new Date(endVal);

    // Swap ordering temporarily if start date is after end date
    let isReversed = false;
    if (start > end) {
        [start, end] = [end, start];
        isReversed = true;
    }

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    // Adjust negative day balances
    if (days < 0) {
        months--;
        const prevMonthLastDay = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
        days += prevMonthLastDay;
    }

    // Adjust negative month balances
    if (months < 0) {
        years--;
        months += 12;
    }

    // Calculate total continuous day count
    const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24));

    // Construct output string
    let outputStr = [];
    if (years > 0) outputStr.push(`${years} ${years === 1 ? 'year' : 'years'}`);
    if (months > 0) outputStr.push(`${months} ${months === 1 ? 'month' : 'months'}`);
    if (days > 0 || outputStr.length === 0) outputStr.push(`${days} ${days === 1 ? 'day' : 'days'}`);

    resultMain.textContent = outputStr.join(', ');
    resultSub.textContent = `${isReversed ? 'Reverse Difference' : 'Total duration'}: ${totalDays.toLocaleString()} days`;
}

// Shortcut: Set input date to Today
function setToday(inputId) {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById(inputId).value = today;
    calculateDateDifference();
}

// Shortcut: Swap 'From' and 'To' inputs
function swapDates() {
    const startElem = document.getElementById('startDate');
    const endElem = document.getElementById('endDate');
    const temp = startElem.value;
    startElem.value = endElem.value;
    endElem.value = temp;
    calculateDateDifference();
}
// Cache exchange rates locally to avoid redundant API network requests
let exchangeRatesCache = null;

// Fetch live currency rates and convert values
async function convertCurrency() {
    const amountInput = document.getElementById('currencyAmount');
    const fromSelect = document.getElementById('fromCurrency');
    const toSelect = document.getElementById('toCurrency');
    const resultMain = document.getElementById('currencyResultMain');
    const resultSub = document.getElementById('currencyResultSub');

    if (!amountInput || !fromSelect || !toSelect) return;

    const amount = parseFloat(amountInput.value);
    const from = fromSelect.value;
    const to = toSelect.value;

    if (isNaN(amount) || amount <= 0) {
        resultMain.textContent = 'Enter a valid amount';
        resultSub.textContent = '';
        return;
    }

    try {
        // Fetch fresh rate matrix if not already cached
        if (!exchangeRatesCache || exchangeRatesCache.base !== from) {
            resultMain.textContent = 'Updating rates...';
            const res = await fetch(`https://open.er-api.com/v6/latest/${from}`);
            const data = await res.json();

            if (data.result === 'success') {
                exchangeRatesCache = { base: from, rates: data.rates };
            } else {
                throw new Error('API Rate Error');
            }
        }

        const rate = exchangeRatesCache.rates[to];
        if (rate) {
            const converted = (amount * rate).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

            resultMain.textContent = `${converted} ${to}`;
            resultSub.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;
        }
    } catch (error) {
        resultMain.textContent = 'Offline / Error';
        resultSub.textContent = 'Could not fetch current exchange rate';
    }
}

// Swap From/To currencies and trigger immediate recalculation
function swapCurrencies() {
    const fromSelect = document.getElementById('fromCurrency');
    const toSelect = document.getElementById('toCurrency');

    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;

    // Reset cache base so fetch loads new base rate
    exchangeRatesCache = null;
    convertCurrency();
}

// Automatically trigger conversion when switching to Currency Tab
const originalSwitchTab = window.switchTab;
window.switchTab = function(tabId, btnElement) {
    if (typeof originalSwitchTab === 'function') originalSwitchTab(tabId, btnElement);
    if (tabId === 'currency-tab') {
        convertCurrency();
    }
};