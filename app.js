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

    // Auto-check for absent status
    checkAutoAbsentOnDashboard();
});

// Get current user
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

// Update today's status
function updateTodayStatus(user) {
    if (user.role === 'admin') return;
    
    const today = new Date().toISOString().split('T')[0];
    const attendance = JSON.parse(localStorage.getItem('attendance')) || {};
    const userAttendance = attendance[user.id] || [];
    const todayRecord = userAttendance.find(a => a.date === today);

    const statusDiv = document.getElementById('todayStatus');
    
    // Calculăm zilele necesare doar pentru cazul "Abwesend" sau dacă vrei să-l păstrezi ca referință
    const presentDays = userAttendance.filter(a => a.status === 'present' || a.status === 'Verspätet').length;
    const requiredPresentDays = 134;
    const remainingDays = Math.max(0, requiredPresentDays - presentDays);

    if (todayRecord) {
        let checkoutHtml = '';
        if ((todayRecord.status === 'present' || todayRecord.status === 'Verspätet') && !todayRecord.logoutTime) {
            checkoutHtml = `<button onclick="handleCheckout()" style="margin-top: 10px; padding: 6px 12px; background: transparent; color: #dc3545; border: 1px solid #dc3545; border-radius: 4px; cursor: pointer; font-size: 13px;">Gehen / Ausstempeln</button>`;
        }
        
        let logoutText = todayRecord.logoutTime ? `<p style="font-size: 14px; margin-top: 5px;">Gehen: ${todayRecord.logoutTime}</p>` : '';

        if (todayRecord.status === 'present') {
            statusDiv.className = 'status-card present';
            statusDiv.innerHTML = `
                <h3 style="margin-bottom: 10px;">✓ Anwesend</h3>
                <p style="font-size: 14px;">Ankunft: ${todayRecord.loginTime || 'N/A'}</p>
                ${logoutText}
                ${checkoutHtml}
            `;
        } else if (todayRecord.status === 'Verspätet') {
            statusDiv.className = 'status-card';
            statusDiv.style.background = '#fff3cd';
            statusDiv.style.borderLeft = '4px solid #ffc107';
            statusDiv.style.color = '#856404';
            statusDiv.style.padding = '20px';
            statusDiv.style.borderRadius = '8px';
            statusDiv.style.textAlign = 'center';
            
            statusDiv.innerHTML = `
                <h3 style="margin-bottom: 10px; font-size: 18px;">⏱ Verspätet</h3>
                <p style="font-size: 14px;">Ankunft: ${todayRecord.loginTime || 'N/A'}</p>
                ${logoutText}
                ${checkoutHtml}
            `;
        } else {
            statusDiv.className = 'status-card absent';
            statusDiv.innerHTML = `
                <h3 style="margin-bottom: 10px;">✗ Abwesend</h3>
                <p style="font-size: 14px;">${todayRecord.autoMarked ? 'Automatisch markiert (> 08:15)' : 'Manuell markiert'}</p>
            `;
        }
    } else {
        const now = new Date();
        const totalMinutes = (now.getHours() * 60) + now.getMinutes();

        statusDiv.className = 'status-card unknown';
        statusDiv.style.padding = '20px';
        statusDiv.style.borderRadius = '8px';
        statusDiv.style.textAlign = 'center';

        if (totalMinutes < 420) { // < 07:00
            statusDiv.innerHTML = `
                <h3 style="margin-bottom: 10px;">? Zu früh</h3>
                <p style="font-size: 14px;">Anmeldung ab 07:00 Uhr</p>
            `;
        } else if (totalMinutes > 495) { // > 08:15
            statusDiv.className = 'status-card absent';
            statusDiv.innerHTML = `
                <h3 style="margin-bottom: 10px;">✗ Abwesend</h3>
                <p style="font-size: 14px;">Nicht rechtzeitig angemeldet</p>
            `;
        } else { // 07:00 - 08:15
            statusDiv.innerHTML = `
                <h3 style="margin-bottom: 10px;">? Nicht angemeldet</h3>
                <p style="font-size: 14px;">Bitte melde dich an</p>
            `;
        }
    }
}

// Neue Funktion für das "Gehen"
function handleCheckout() {
    const user = getCurrentUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const logoutTimeStr = now.toLocaleTimeString('de-DE');

    const attendance = JSON.parse(localStorage.getItem('attendance')) || {};
    if (!attendance[user.id]) return;

    const todayRecord = attendance[user.id].find(a => a.date === today);
    if (todayRecord) {
        todayRecord.logoutTime = logoutTimeStr;
        localStorage.setItem('attendance', JSON.stringify(attendance));
        
        // UI sofort aktualisieren
        updateTodayStatus(user);
        updateHistoryTable(user);
    }
}

// Update statistics
function updateStatistics(user) {
    if (user.role === 'admin') return;
    
    const attendance = JSON.parse(localStorage.getItem('attendance')) || {};
    const userAttendance = attendance[user.id] || [];

    const requiredPresentDays = 134;

    // Verspätet zählt auch als Präsenz für die Anforderungen
    const presentDays = userAttendance.filter(a => a.status === 'present' || a.status === 'Verspätet').length;
    const absentDays = userAttendance.filter(a => a.status === 'absent').length;
    
    // Berechne den Prozentsatz basierend auf 263 max Tage
    const percentageOfMax = userAttendance.length > 0 ? Math.round((presentDays / requiredPresentDays) * 100) : 0;
    const remainingPresentDays = Math.max(0, requiredPresentDays - presentDays);

    document.getElementById('presentDays').textContent = presentDays + ' / ' + requiredPresentDays;
    document.getElementById('absentDays').textContent = absentDays;
    document.getElementById('attendancePercent').textContent = Math.min(percentageOfMax, 100) + '%';
    
    // Update progress bar
    updateProgressBar(presentDays, requiredPresentDays, remainingPresentDays);
}

// Update progress bar
// Update progress bar
function updateProgressBar(presentDays, requiredDays, remainingDays) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressFill && progressText) {
        const percentage = Math.min((presentDays / requiredDays) * 100, 100);
        progressFill.style.width = percentage + '%';
        
        if (presentDays >= requiredDays) {
            progressFill.style.backgroundColor = '#28a745';
            progressText.innerHTML = `<strong>✓ Anforderung erfüllt!</strong> Sie haben ${presentDays} erforderliche Tage erreicht.`;
        } else {
            progressFill.style.backgroundColor = '#667eea';
            // Am eliminat "für die Absolvierung" aici
            progressText.innerHTML = `Noch ${remainingDays} ${remainingDays === 1 ? 'Tag' : 'Tage'} erforderlich`;
        }
    }
}


// Update calendar
function updateCalendar() {
    const user = getCurrentUser();
    if (user.role === 'admin') return;
    
    const attendance = JSON.parse(localStorage.getItem('attendance')) || {};
    const userAttendance = attendance[user.id] || [];

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
        'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    document.getElementById('monthYear').textContent = `${monthNames[month]} ${year}`;

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
            if(record.status === 'Verspätet') {
                // Inline styles für Verspätet, da wir styles.css nicht groß ändern
                dayElement.style.background = '#fff3cd';
                dayElement.style.borderColor = '#ffc107';
                dayElement.style.color = '#856404';
                dayElement.style.fontWeight = 'bold';
            } else {
                dayElement.classList.add(record.status);
            }
            dayElement.textContent = day;
            dayElement.title = `${record.status}: Ankunft ${record.loginTime || '-'}`;
        } else {
            dayElement.textContent = day;
        }

        calendarGrid.appendChild(dayElement);
    }

    // Next month's days
    const totalCells = calendarGrid.children.length - 7;
    const remainingCells = 35 - totalCells;
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
    if (user.role === 'admin') return;
    
    const attendance = JSON.parse(localStorage.getItem('attendance')) || {};
    const userAttendance = attendance[user.id] || [];

    const historyBody = document.getElementById('historyBody');
    historyBody.innerHTML = '';

    const sortedAttendance = [...userAttendance].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedAttendance.forEach(record => {
        const row = document.createElement('tr');
        const dateObj = new Date(record.date + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('de-DE');

        let statusText = '';
        let badgeClass = '';
        let badgeStyle = '';

        if (record.status === 'present') {
            statusText = 'Anwesend';
            badgeClass = 'status-badge present';
        } else if (record.status === 'absent') {
            statusText = 'Abwesend';
            badgeClass = 'status-badge absent';
        } else if (record.status === 'Verspätet') {
            statusText = 'Verspätet';
            badgeClass = 'status-badge';
            badgeStyle = 'background: #fff3cd; color: #856404;';
        }

        row.innerHTML = `
            <td>${formattedDate}</td>
            <td><span class="${badgeClass}" style="${badgeStyle}">${statusText}</span></td>
            <td>${record.loginTime || '-'}</td>
            <td>${record.logoutTime || '-'}</td>
        `;
        historyBody.appendChild(row);
    });
}

// Export data
function exportData() {
    const user = getCurrentUser();
    const attendance = JSON.parse(localStorage.getItem('attendance')) || {};
    const userAttendance = attendance[user.id] || [];

    const dataStr = JSON.stringify(userAttendance, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `zeiterfassung_${user.username}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Import data
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            const user = getCurrentUser();
            const attendance = JSON.parse(localStorage.getItem('attendance')) || {};
            
            attendance[user.id] = importedData;
            localStorage.setItem('attendance', JSON.stringify(attendance));
            
            updateTodayStatus(user);
            updateStatistics(user);
            updateCalendar();
            updateHistoryTable(user);
            
            alert('Daten erfolgreich importiert!');
        } catch (error) {
            alert('Fehler beim Importieren der Datei. Bitte stellen Sie sicher, dass es sich um eine gültige JSON-Datei handelt.');
        }
    };
    reader.readAsText(file);
}

// Helper for auto-absent on dashboard
function checkAutoAbsentOnDashboard() {
    if (typeof checkAndMarkAutoAbsent === 'function') {
        checkAndMarkAutoAbsent();
    }
}
