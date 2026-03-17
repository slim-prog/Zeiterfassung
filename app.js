// Current date for calendar navigation
let currentDate = new Date();

// Initialize dashboard on page load
window.addEventListener('load', () => {
    // Check if logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Admins should not access student dashboard
    if (currentUser.role === 'admin') {
        window.location.href = 'admin.html';
        return;
    }

    // Apply dashboard styles to body
    document.body.classList.add('dashboard-page');

    // Update UI
    document.getElementById('currentUser').textContent = `Benutzername: ${currentUser.username}`;
    updateTodayStatus(currentUser);
    updateStatistics(currentUser);
    updateCalendar();
    updateHistoryTable(currentUser);

    // Auto-check for absent status at 12:00
    checkAutoAbsentOnDashboard();
});

// Get current user
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

// Update today's status
function updateTodayStatus(user) {
    // Admins do not need to track präsenztage
    if (user.role === 'admin') {
        return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const attendance = JSON.parse(localStorage.getItem('attendance')) || {};
    const userAttendance = attendance[user.id] || [];
    const todayRecord = userAttendance.find(a => a.date === today);

    const statusDiv = document.getElementById('todayStatus');
    
    // Berechne aktuelle Statistiken
    const presentDays = userAttendance.filter(a => a.status === 'present').length;
    const requiredPresentDays = 134;
    const remainingDays = Math.max(0, requiredPresentDays - presentDays);

    if (todayRecord) {
        if (todayRecord.status === 'present') {
            statusDiv.className = 'status-card present';
            statusDiv.innerHTML = `
                <h3>✓ Anwesend</h3>
                <p>Anmeldungszeit: ${todayRecord.loginTime || 'N/A'}</p>
                <p style="font-size: 12px; margin-top: 10px; color: inherit;">Präsenz: ${presentDays} / ${requiredPresentDays} Tage</p>
            `;
        } else {
            statusDiv.className = 'status-card absent';
            statusDiv.innerHTML = `
                <h3>✗ Abwesend</h3>
                <p>${todayRecord.autoMarked ? 'Automatisch markiert (12:00 Uhr)' : 'Manuell markiert'}</p>
                <p style="font-size: 12px; margin-top: 10px; color: inherit;">Noch erforderlich: ${remainingDays} Tage</p>
            `;
        }
    } else {
        const now = new Date();
        if (now.getHours() >= 12) {
            statusDiv.className = 'status-card absent';
            statusDiv.innerHTML = `
                <h3>✗ Abwesend</h3>
                <p>Nicht angemeldet</p>
                <p style="font-size: 12px; margin-top: 10px; color: inherit;">Noch erforderlich: ${remainingDays} Tage</p>
            `;
        } else {
            statusDiv.className = 'status-card unknown';
            statusDiv.innerHTML = `
                <h3>? Noch nicht angemeldet</h3>
                <p>Bitte melden Sie sich an, um präsent zu sein</p>
                <p style="font-size: 12px; margin-top: 10px; color: inherit;">Präsenz: ${presentDays} / ${requiredPresentDays} Tage</p>
            `;
        }
    }
}

// Update statistics
function updateStatistics(user) {
    // Admins do not need to track präsenztage
    if (user.role === 'admin') {
        return;
    }
    
    const attendance = JSON.parse(localStorage.getItem('attendance')) || {};
    const userAttendance = attendance[user.id] || [];

    // Kriterien:
    // 100% = 263 Tage Unterricht
    // 51% = 134 Tage in Präsenz (mindestens erforderlich)
    const maxTeachingDays = 263;
    const requiredPresentDays = 134;
    const requiredPercentage = 51;

    const presentDays = userAttendance.filter(a => a.status === 'present').length;
    const absentDays = userAttendance.filter(a => a.status === 'absent').length;
    const totalRecordedDays = userAttendance.length;
    
    // Berechne den Prozentsatz basierend auf 263 max Tage
    const percentageOfMax = totalRecordedDays > 0 ? Math.round((presentDays / requiredPresentDays) * 100) : 0;
    
    // Noch fehlende Tage in Präsenz
    const remainingPresentDays = Math.max(0, requiredPresentDays - presentDays);

    document.getElementById('presentDays').textContent = presentDays + ' / ' + requiredPresentDays;
    document.getElementById('absentDays').textContent = absentDays;
    document.getElementById('attendancePercent').textContent = percentageOfMax + '%';
    
    // Speichere Statistiken für Status-Anzeige
    user.stats = {
        presentDays: presentDays,
        requiredPresentDays: requiredPresentDays,
        absentDays: absentDays,
        totalRecordedDays: totalRecordedDays,
        percentageOfRequired: percentageOfMax,
        remainingPresentDays: remainingPresentDays,
        meetsRequirement: presentDays >= requiredPresentDays
    };
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    // Update progress bar
    updateProgressBar(presentDays, requiredPresentDays, remainingPresentDays);
}

// Update progress bar
function updateProgressBar(presentDays, requiredDays, remainingDays) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressFill && progressText) {
        const percentage = Math.min((presentDays / requiredDays) * 100, 100);
        progressFill.style.width = percentage + '%';
        
        if (presentDays >= requiredDays) {
            progressFill.style.backgroundColor = '#28a745';
            progressText.innerHTML = `<strong>✓ Anforderung erfüllt!</strong> Sie haben ${presentDays} Tage erforderlicher${requiredDays} erreicht.`;
        } else {
            progressFill.style.backgroundColor = '#667eea';
            progressText.innerHTML = `Noch ${remainingDays} ${remainingDays === 1 ? 'Tag' : 'Tage'} erforderlich für die Absolvierung`;
        }
    }
}

// Update calendar
function updateCalendar() {
    const user = getCurrentUser();
    
    // Admins do not need to view calendar
    if (user.role === 'admin') {
        return;
    }
    
    const attendance = JSON.parse(localStorage.getItem('attendance')) || {};
    const userAttendance = attendance[user.id] || [];

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Update month/year display
    const monthNames = [
        'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    document.getElementById('monthYear').textContent = `${monthNames[month]} ${year}`;

    // Create calendar grid
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';

    // Day headers
    const dayHeaders = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    dayHeaders.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day header';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });

    // Get first day of month (0 = Sunday, so we adjust for Monday)
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Previous month's days
    for (let i = firstDay === 0 ? 6 : firstDay - 1; i > 0; i--) {
        const day = daysInPrevMonth - i + 1;
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        dayElement.textContent = day;
        calendarGrid.appendChild(dayElement);
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const record = userAttendance.find(a => a.date === dateStr);

        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';

        if (record) {
            dayElement.classList.add(record.status);
            dayElement.textContent = day;
            dayElement.title = `${record.status === 'present' ? 'Anwesend' : 'Abwesend'}: ${record.loginTime || 'Auto-Markiert'}`;
        } else {
            dayElement.textContent = day;
        }

        calendarGrid.appendChild(dayElement);
    }

    // Next month's days
    const totalCells = calendarGrid.children.length - 7; // Total cells minus headers
    const remainingCells = 35 - totalCells; // 5x7 grid
    for (let day = 1; day <= remainingCells; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        dayElement.textContent = day;
        calendarGrid.appendChild(dayElement);
    }
}

// Navigation
function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateCalendar();
}

// Update history table
function updateHistoryTable(user) {
    // Admins do not need presence history
    if (user.role === 'admin') {
        return;
    }
    
    const attendance = JSON.parse(localStorage.getItem('attendance')) || {};
    const userAttendance = attendance[user.id] || [];

    const historyBody = document.getElementById('historyBody');
    historyBody.innerHTML = '';

    // Sort by date descending (newest first)
    const sortedAttendance = [...userAttendance].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedAttendance.forEach(record => {
        const row = document.createElement('tr');
        const dateObj = new Date(record.date + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('de-DE', {
            weekday: 'short',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        const statusBadge = `<span class="status-badge ${record.status}">${record.status === 'present' ? 'Anwesend' : 'Abwesend'}</span>`;
        const loginTime = record.loginTime || (record.autoMarked ? 'Auto (12:00)' : '-');

        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${statusBadge}</td>
            <td>${loginTime}</td>
        `;

        historyBody.appendChild(row);
    });

    if (sortedAttendance.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="3" style="text-align: center; color: #999;">Keine Daten vorhanden</td>';
        historyBody.appendChild(row);
    }
}

// Export data as JSON
function exportData() {
    const user = getCurrentUser();
    const attendance = JSON.parse(localStorage.getItem('attendance')) || {};
    const userData = {
        username: user.username,
        userId: user.id,
        exportDate: new Date().toISOString(),
        attendance: attendance[user.id] || []
    };

    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zeiterfassung_${user.username}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// Import data from JSON
function importData(event) {
    const user = getCurrentUser();
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);

            if (importedData.userId !== user.id) {
                alert('Fehler: Diese Datei gehört zu einem anderen Benutzer.');
                return;
            }

            const attendance = JSON.parse(localStorage.getItem('attendance')) || {};
            attendance[user.id] = importedData.attendance;
            localStorage.setItem('attendance', JSON.stringify(attendance));

            alert('Daten erfolgreich importiert!');
            updateStatistics(user);
            updateCalendar();
            updateHistoryTable(user);
            updateTodayStatus(user);
        } catch (error) {
            alert('Fehler beim Importieren der Datei: ' + error.message);
        }
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset file input
}

// Auto-absent check on dashboard
function checkAutoAbsentOnDashboard() {
    const now = new Date();
    const user = getCurrentUser();
    
    // Admins do not need auto-absent check
    if (user.role === 'admin') {
        return;
    }
    
    if (now.getHours() >= 12) {
        const today = now.toISOString().split('T')[0];
        const attendance = JSON.parse(localStorage.getItem('attendance')) || {};

        if (!attendance[user.id]) {
            attendance[user.id] = [];
        }

        const todayRecord = attendance[user.id].find(a => a.date === today);

        if (!todayRecord) {
            attendance[user.id].push({
                date: today,
                status: 'absent',
                loginTime: null,
                markedAt: new Date().toISOString(),
                autoMarked: true
            });

            localStorage.setItem('attendance', JSON.stringify(attendance));
            updateTodayStatus(user);
            updateStatistics(user);
        }
    }
}

// Auto-refresh every 5 minutes
setInterval(() => {
    const user = getCurrentUser();
    if (user) {
        updateTodayStatus(user);
        checkAutoAbsentOnDashboard();
    }
}, 5 * 60 * 1000);

console.log('Dashboard App Initialized');
