// ============================================================
// DATE / TIME / CURRENCY UTILITIES - date.js
// ============================================================

let clockTimer = null;
let exchangeRatesCache = null;
let cityLookupTimer = null;
let cityLookupController = null;
let currencyConversionTimer = null;

// ------------------------------------------------------------
// Popup
// ------------------------------------------------------------

function openPopupPage() {
    const popup = document.getElementById('popupOverlay');

    if (!popup) return;

    popup.classList.add('active');

    // Default Age/Date Difference values
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');

    const today = new Date().toISOString().split('T')[0];

    if (startDate && !startDate.value) {
        startDate.value = '2000-01-01';
    }

    if (endDate && !endDate.value) {
        endDate.value = today;
    }

    calculateFutureDate();
    calculateDateDifference();
}

function closePopupPage() {
    const popup = document.getElementById('popupOverlay');

    if (popup) {
        popup.classList.remove('active');
    }

    stopWorldClock();
}

// ------------------------------------------------------------
// Future Date Calculator
// ------------------------------------------------------------

function calculateFutureDate() {
    const daysInput = document.getElementById('daysInput');
    const resultMain = document.getElementById('resultMain');
    const resultSub = document.getElementById('resultSub');

    if (!daysInput || !resultMain || !resultSub) return;

    const rawValue = daysInput.value.trim();

    const today = new Date();

    const todayFormatted = today.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    resultSub.textContent = `From Today: ${todayFormatted}`;

    if (rawValue === '' || !Number.isFinite(Number(rawValue))) {
        resultMain.textContent = 'Enter number of days';
        return;
    }

    const daysCount = parseInt(rawValue, 10);

    const targetDate = new Date(today);

    targetDate.setDate(targetDate.getDate() + daysCount);

    const options = {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    };

    resultMain.textContent =
        targetDate.toLocaleDateString('en-US', options);
}

// ------------------------------------------------------------
// Date Difference
// ------------------------------------------------------------

function calculateDateDifference() {
    const startInput = document.getElementById('startDate');
    const endInput = document.getElementById('endDate');

    const resultMain = document.getElementById('diffResultMain');
    const resultSub = document.getElementById('diffResultSub');

    if (!startInput || !endInput || !resultMain || !resultSub) {
        return;
    }

    const startVal = startInput.value;
    const endVal = endInput.value;

    if (!startVal || !endVal) {
        resultMain.textContent = 'Type or select both dates';
        resultSub.textContent = 'Years, Months & Days';
        return;
    }

    let start = new Date(`${startVal}T00:00:00`);
    let end = new Date(`${endVal}T00:00:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        resultMain.textContent = 'Invalid date';
        resultSub.textContent = '';
        return;
    }

    let reversed = false;

    if (start > end) {
        [start, end] = [end, start];
        reversed = true;
    }

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
        months--;

        const previousMonth = new Date(
            end.getFullYear(),
            end.getMonth(),
            0
        );

        days += previousMonth.getDate();
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    const totalDays = Math.round(
        (end.getTime() - start.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const output = [];

    if (years > 0) {
        output.push(
            `${years} ${years === 1 ? 'year' : 'years'}`
        );
    }

    if (months > 0) {
        output.push(
            `${months} ${months === 1 ? 'month' : 'months'}`
        );
    }

    if (days > 0 || output.length === 0) {
        output.push(
            `${days} ${days === 1 ? 'day' : 'days'}`
        );
    }

    resultMain.textContent = output.join(', ');

    resultSub.textContent =
        `${reversed ? 'Reverse Difference' : 'Total duration'}: ` +
        `${totalDays.toLocaleString()} days`;
}

// ------------------------------------------------------------
// Today Shortcut
// ------------------------------------------------------------

function setToday(inputId) {
    const input = document.getElementById(inputId);

    if (!input) return;

    input.value = new Date()
        .toISOString()
        .split('T')[0];

    calculateDateDifference();
}

// ------------------------------------------------------------
// Swap Dates
// ------------------------------------------------------------

function swapDates() {
    const start = document.getElementById('startDate');
    const end = document.getElementById('endDate');

    if (!start || !end) return;

    [start.value, end.value] = [end.value, start.value];

    calculateDateDifference();
}

// ------------------------------------------------------------
// World Clock
// ------------------------------------------------------------

const worldClockTimeZones = {
    'new york': 'America/New_York',
    'los angeles': 'America/Los_Angeles',
    chicago: 'America/Chicago',
    london: 'Europe/London',
    paris: 'Europe/Paris',
    dubai: 'Asia/Dubai',
    delhi: 'Asia/Kolkata',
    singapore: 'Asia/Singapore',
    tokyo: 'Asia/Tokyo',
    sydney: 'Australia/Sydney'
};

const worldClockCityAliases = {
    'new york city': 'new york',
    nyc: 'new york',
    la: 'los angeles',
    'los angeles city': 'los angeles',
    'new delhi': 'delhi'
};

function getCityTime(cityName) {
    const typedCity = cityName.toLowerCase().trim();
    const normalizedCity = worldClockCityAliases[typedCity] || typedCity;
    const timeZone = worldClockTimeZones[normalizedCity];

    if (!timeZone) return null;

    return {
        city: normalizedCity,
        timeZone,
        time: new Date().toLocaleTimeString('en-US', {
            timeZone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        })
    };
}

function updateTypedCityTime() {
    const input = document.getElementById('clockCityInput');
    const result = document.getElementById('typedCityResult');

    if (!input || !result) return;

    const cityName = input.value.trim();

    if (!cityName) {
        result.textContent = 'Type a city to see its local time.';
        return;
    }

    const cityTime = getCityTime(cityName);

    if (cityTime) {
        result.textContent = `${cityTime.city.replace(/\b\w/g, letter => letter.toUpperCase())}: ${cityTime.time}`;
        return;
    }

    clearTimeout(cityLookupTimer);
    cityLookupTimer = setTimeout(() => lookupCityTime(cityName), 450);
    result.textContent = 'Searching live city data...';
}

async function lookupCityTime(cityName) {
    const input = document.getElementById('clockCityInput');
    const result = document.getElementById('typedCityResult');

    if (!input || !result || input.value.trim() !== cityName) return;

    if (cityLookupController) cityLookupController.abort();
    cityLookupController = new AbortController();

    try {
        const searchResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(cityName)}`,
            { signal: cityLookupController.signal }
        );
        const locations = await searchResponse.json();

        if (!locations.length) throw new Error('City not found');

        const location = locations[0];
        const timeResponse = await fetch(
            `https://timeapi.io/api/Time/current/coordinate?latitude=${encodeURIComponent(location.lat)}&longitude=${encodeURIComponent(location.lon)}`,
            { signal: cityLookupController.signal }
        );
        const timeData = await timeResponse.json();
        const timeZone = timeData.timeZone;
        const time = timeZone
            ? new Date().toLocaleTimeString('en-US', {
                timeZone,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            })
            : timeData.time || timeData.dateTime;

        if (!time) throw new Error('Time unavailable');

        result.textContent = `${location.display_name.split(',')[0]}: ${time}`;
    } catch (error) {
        if (error.name === 'AbortError') return;
        result.textContent = 'Live city data unavailable. Try again.';
        console.error('City lookup error:', error);
    }
}

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
    const clockElements = {
        'clock-new-york': 'new york',
        'clock-los-angeles': 'los angeles',
        'clock-chicago': 'chicago',
        'clock-london': 'london',
        'clock-paris': 'paris',
        'clock-dubai': 'dubai',
        'clock-delhi': 'delhi',
        'clock-singapore': 'singapore',
        'clock-tokyo': 'tokyo',
        'clock-sydney': 'sydney'
    };

    Object.entries(clockElements).forEach(([id, city]) => {
        const element = document.getElementById(id);

        if (!element) return;

        try {
            element.textContent = getCityTime(city).time;
        } catch (error) {
            console.error(`Clock error for ${city}:`, error);
        }
    });
}

// ------------------------------------------------------------
// Tab Switching
// ------------------------------------------------------------

function switchTab(tabId, btnElement) {
    document
        .querySelectorAll('.tab-content')
        .forEach(tab => tab.classList.remove('active'));

    document
        .querySelectorAll('.tab-btn')
        .forEach(btn => btn.classList.remove('active'));

    const target = document.getElementById(tabId);

    if (!target) {
        console.warn(`Tab not found: ${tabId}`);
        return;
    }

    target.classList.add('active');

    if (btnElement) {
        btnElement.classList.add('active');
    }

    if (tabId === 'time-tab') {
        startWorldClock();
    } else {
        stopWorldClock();
    }

    if (tabId === 'currency-tab') {
        convertCurrency();
    }
}

// ------------------------------------------------------------
// Currency Converter
// ------------------------------------------------------------

function scheduleCurrencyConversion() {
    clearTimeout(currencyConversionTimer);

    const resultMain = document.getElementById('currencyResultMain');
    if (resultMain) resultMain.textContent = 'Waiting for currency code...';

    currencyConversionTimer = setTimeout(() => {
        convertCurrency();
    }, 450);
}

async function convertCurrency() {
    const amountInput = document.getElementById('currencyAmount');
    const fromSelect = document.getElementById('fromCurrency');
    const toSelect = document.getElementById('toCurrency');

    const resultMain = document.getElementById('currencyResultMain');
    const resultSub = document.getElementById('currencyResultSub');

    if (
        !amountInput ||
        !fromSelect ||
        !toSelect ||
        !resultMain ||
        !resultSub
    ) {
        return;
    }

    const amount = parseFloat(amountInput.value);
    const from = fromSelect.value.trim().toUpperCase();
    const to = toSelect.value.trim().toUpperCase();

    fromSelect.value = from;
    toSelect.value = to;

    if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) {
        resultMain.textContent = 'Enter 3-letter currency codes';
        resultSub.textContent = '';
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        resultMain.textContent = 'Enter a valid amount';
        resultSub.textContent = '';
        return;
    }

    if (from === to) {
        resultMain.textContent =
            `${amount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })} ${to}`;

        resultSub.textContent = `1 ${from} = 1.0000 ${to}`;

        return;
    }

    try {
        if (
            !exchangeRatesCache ||
            exchangeRatesCache.base !== from
        ) {
            resultMain.textContent = 'Updating rates...';

            const response = await fetch(
                `https://open.er-api.com/v6/latest/${encodeURIComponent(from)}`
            );

            if (!response.ok) {
                throw new Error('Network request failed');
            }

            const data = await response.json();

            if (
                data.result !== 'success' ||
                !data.rates
            ) {
                throw new Error('Invalid exchange-rate response');
            }

            exchangeRatesCache = {
                base: from,
                rates: data.rates
            };
        }

        const rate = exchangeRatesCache.rates[to];

        if (!Number.isFinite(rate)) {
            throw new Error('Currency rate unavailable');
        }

        const converted = amount * rate;

        resultMain.textContent =
            `${converted.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })} ${to}`;

        resultSub.textContent =
            `1 ${from} = ${rate.toFixed(4)} ${to}`;

    } catch (error) {
        console.error('Currency conversion error:', error);

        resultMain.textContent = 'Offline / Error';
        resultSub.textContent =
            'Could not fetch current exchange rate';
    }
}

// ------------------------------------------------------------
// Swap Currencies
// ------------------------------------------------------------

function swapCurrencies() {
    const fromSelect = document.getElementById('fromCurrency');
    const toSelect = document.getElementById('toCurrency');

    if (!fromSelect || !toSelect) return;

    [fromSelect.value, toSelect.value] =
        [toSelect.value, fromSelect.value];

    exchangeRatesCache = null;

    convertCurrency();
}

// ------------------------------------------------------------
// Dynamic Date Inputs
// ------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const daysInput = document.getElementById('daysInput');

    if (startDate) {
        startDate.addEventListener(
            'input',
            calculateDateDifference
        );

        startDate.addEventListener(
            'change',
            calculateDateDifference
        );
    }

    if (endDate) {
        endDate.addEventListener(
            'input',
            calculateDateDifference
        );

        endDate.addEventListener(
            'change',
            calculateDateDifference
        );
    }

    if (daysInput) {
        daysInput.addEventListener(
            'input',
            calculateFutureDate
        );
    }

    calculateDateDifference();
    calculateFutureDate();
});