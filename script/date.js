
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