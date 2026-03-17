// Admin Dashboard Logic - GDPR Compliant

// Initialize admin dashboard on page load
window.addEventListener('load', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

    document.body.classList.add('dashboard-page');
    document.getElementById('currentUser').textContent = `Admin: ${currentUser.username}`;
    
    updateAdminOverview();
    loadUsersTable();
    updateSystemSettings();
});

// Update admin overview statistics
function updateAdminOverview() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const attendance = JSON.parse(localStorage.getItem('attendance')) || {};
    
    const students = users.filter(u => u.role === 'student').length;
    const admins = users.filter(u => u.role === 'admin').length;
    
    // Count presents today
    const today = new Date().toISOString().split('T')[0];
    let presentToday = 0;
    
    for (const userId in attendance) {
        const userRecord = attendance[userId].find(a => a.date === today && a.status === 'present');
        if (userRecord) presentToday++;
    }
    
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('totalStudents').textContent = students;
    document.getElementById('totalAdmins').textContent = admins;
    document.getElementById('presentToday').textContent = presentToday;
}

// Load users table
function loadUsersTable() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const attendance = JSON.parse(localStorage.getItem('attendance')) || {};
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const usersTableBody = document.getElementById('usersTableBody');
    
    usersTableBody.innerHTML = '';
    
    users.forEach(user => {
        const userAttendance = attendance[user.id] || [];
        const presentDays = userAttendance.filter(a => a.status === 'present').length;
        const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('de-DE') : 'Nie';
        const createdDate = new Date(user.createdAt).toLocaleDateString('de-DE');
        
        // Button actions - nur der aktuelle Admin kann andere Benutzer verwalten
        let actionButtons = '';
        if (user.id !== currentUser.id) {
            if (user.role === 'student') {
                // Promote to Admin button
                actionButtons = `<button onclick="promoteToAdmin(${user.id})" class="btn-action btn-promote" title="Zu Admin befördern">⬆️ Zu Admin</button>`;
            } else if (user.role === 'admin') {
                // Demote to Student button (nur wenn es mehr als 1 Admin gibt)
                const adminCount = users.filter(u => u.role === 'admin').length;
                if (adminCount > 1) {
                    actionButtons = `<button onclick="demoteToStudent(${user.id})" class="btn-action btn-demote" title="Zu Cursant zurück">⬇️ Zu Cursant</button>`;
                } else {
                    actionButtons = `<span style="color: #999; font-size: 12px;">letzter Admin</span>`;
                }
            }
        } else {
            actionButtons = `<span style="color: #667eea; font-weight: bold;">Du</span>`;
        }
        
        const row = document.createElement('tr');
        const badgeColor = user.role === 'admin' ? 'role-admin' : 'role-student';
        row.innerHTML = `
            <td><strong>${user.username}</strong></td>
            <td><span class="role-badge ${badgeColor}">${user.role === 'admin' ? 'Admin' : 'Cursant'}</span></td>
            <td>${createdDate}</td>
            <td>${lastLogin}</td>
            <td>${user.loginCount || 0}</td>
            <td>${presentDays} Tag${presentDays !== 1 ? 'e' : ''}</td>
            <td>${actionButtons}</td>
        `;
        usersTableBody.appendChild(row);
    });
}

// Handle export data
function handleExportData() {
    const format = document.querySelector('input[name="exportFormat"]:checked').value;
    const range = document.querySelector('input[name="exportRange"]:checked').value;
    
    if (range === 'custom') {
        const startDate = document.getElementById('exportStartDate').value;
        const endDate = document.getElementById('exportEndDate').value;
        
        if (!startDate || !endDate) {
            alert('Bitte wählen Sie Start- und Enddatum.');
            return;
        }
        
        if (format === 'csv') {
            exportToCSV(startDate, endDate);
        } else {
            exportToJSON(startDate, endDate);
        }
    } else {
        if (format === 'csv') {
            exportToCSV(null, null, range);
        } else {
            exportToJSON(null, null, range);
        }
    }
}

// Export to CSV format
function exportToCSV(startDate, endDate, range = 'all') {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Zeiterfassung Export\n';
    csvContent += `Exportdatum: ${new Date().toLocaleString('de-DE')}\n\n`;
    
    // Header row
    csvContent += 'Benutzername,Rolle,Datum,Status,Uhrzeit\n';
    
    users.forEach(user => {
        const userAttendance = attendance[user.id] || [];
        
        // Filter by date range
        let filteredRecords = userAttendance;
        if (range === 'month') {
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            filteredRecords = userAttendance.filter(a => a.date >= monthStart && a.date <= monthEnd);
        } else if (range === 'custom' && startDate && endDate) {
            filteredRecords = userAttendance.filter(a => a.date >= startDate && a.date <= endDate);
        }
        
        filteredRecords.forEach(record => {
            const date = new Date(record.date).toLocaleDateString('de-DE');
            const time = record.loginTime || '-';
            const status = record.status === 'present' ? 'Präsent' : 'Abwesend';
            csvContent += `"${user.username}","${user.role}","${date}","${status}","${time}"\n`;
        });
    });
    
    // Download CSV
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `zeiterfassung_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('CSV erfolgreich exportiert!');
}

// Export to JSON format
function exportToJSON(startDate, endDate, range = 'all') {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    
    const exportData = {
        exportDate: new Date().toISOString(),
        exportRange: range,
        users: users.map(u => ({
            id: u.id,
            username: u.username,
            role: u.role,
            createdAt: u.createdAt,
            lastLogin: u.lastLogin,
            loginCount: u.loginCount
        })),
        attendance: {}
    };
    
    users.forEach(user => {
        const userAttendance = attendance[user.id] || [];
        let filteredRecords = userAttendance;
        
        if (range === 'month') {
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            filteredRecords = userAttendance.filter(a => a.date >= monthStart && a.date <= monthEnd);
        } else if (range === 'custom' && startDate && endDate) {
            filteredRecords = userAttendance.filter(a => a.date >= startDate && a.date <= endDate);
        }
        
        exportData.attendance[user.id] = filteredRecords;
    });
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zeiterfassung_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    alert('JSON erfolgreich exportiert!');
}

// Export daily report
function exportDailyReport() {
    const today = new Date().toISOString().split('T')[0];
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    
    let reportContent = 'Tagesbericht Zeiterfassung\n';
    reportContent += `Datum: ${new Date().toLocaleDateString('de-DE')}\n`;
    reportContent += '='.repeat(50) + '\n\n';
    
    let presentCount = 0;
    let absentCount = 0;
    const presentUsers = [];
    const absentUsers = [];
    
    users.forEach(user => {
        const userAttendance = attendance[user.id] || [];
        const todayRecord = userAttendance.find(a => a.date === today);
        
        if (todayRecord && todayRecord.status === 'present') {
            presentCount++;
            presentUsers.push(`${user.username} (${todayRecord.loginTime || 'Auto'})`);
        } else {
            absentCount++;
            absentUsers.push(user.username);
        }
    });
    
    reportContent += `ANWESEND (${presentCount}):\n`;
    presentUsers.forEach(u => reportContent += `  ✓ ${u}\n`);
    
    reportContent += `\nABWESEND (${absentCount}):\n`;
    absentUsers.forEach(u => reportContent += `  ✗ ${u}\n`);
    
    // Download report
    const dataBlob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tagesbericht_${today}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    
    alert('Tagesbericht exportiert!');
}

// Clear old data (GDPR compliance)
function clearOldData() {
    if (!confirm('Sind Sie sicher, dass Sie alle Daten älter als 90 Tage löschen möchten? Dies kann nicht rückgängig gemacht werden.')) {
        return;
    }
    
    const attendance = JSON.parse(localStorage.getItem('attendance')) || {};
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const cutoffDate = ninetyDaysAgo.toISOString().split('T')[0];
    
    let deletedCount = 0;
    
    for (const userId in attendance) {
        const before = attendance[userId].length;
        attendance[userId] = attendance[userId].filter(a => a.date >= cutoffDate);
        deletedCount += before - attendance[userId].length;
    }
    
    localStorage.setItem('attendance', JSON.stringify(attendance));
    alert(`${deletedCount} alte Datensätze wurden gelöscht.`);
    loadUsersTable();
}

// Update system settings display
function updateSystemSettings() {
    const pinEnabled = typeof ENABLE_DAILY_PIN !== 'undefined' ? ENABLE_DAILY_PIN : false;
    const ipEnabled = typeof ENABLE_IP_VERIFICATION !== 'undefined' ? ENABLE_IP_VERIFICATION : false;
    const autoDeleteEnabled = typeof ENABLE_DATA_AUTO_DELETE !== 'undefined' ? ENABLE_DATA_AUTO_DELETE : false;
    
    document.getElementById('pinStatus').textContent = pinEnabled ? '✓ Aktiviert' : '✗ Deaktiviert';
    document.getElementById('ipStatus').textContent = ipEnabled ? '✓ Aktiviert' : '✗ Deaktiviert';
    document.getElementById('autoDeleteStatus').textContent = autoDeleteEnabled ? '✓ Aktiviert' : '✗ Deaktiviert';
}

// Regenerate today's PIN
// DEAKTIVIERT FÜR JETZT - Wird in Zukunft aktiviert
function regenerateTodaysPIN() {
    alert('PIN-System ist derzeit nicht aktiviert. Diese Funktion wird implementiert, wenn die notwendige Hardware vorhanden ist.');
    // const pin = typeof generateDailyPIN !== 'undefined' ? generateDailyPIN() : null;
    // if (pin) {
    //     alert(`PIN für heute: ${pin}\n\nZeigen Sie diese Nummer in der Klassenzimmeranzeige an.`);
    // } else {
    //     alert('PIN-System ist nicht aktiviert.');
    // }
}

// Export date range handler
document.addEventListener('DOMContentLoaded', () => {
    const customRadio = document.querySelector('input[value="custom"][name="exportRange"]');
    const dateRangeGroup = document.getElementById('dateRangeGroup');
    
    if (customRadio) {
        document.querySelectorAll('input[name="exportRange"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === 'custom') {
                    dateRangeGroup.style.display = 'block';
                } else {
                    dateRangeGroup.style.display = 'none';
                }
            });
        });
    }
});

// ===== USER ROLE MANAGEMENT =====

// Promote Student to Admin
function promoteToAdmin(userId) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        alert('Benutzer nicht gefunden.');
        return;
    }
    
    if (!confirm(`Möchten Sie "${user.username}" wirklich zum Admin befördern? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
        return;
    }
    
    // Promote to Admin
    user.role = 'admin';
    const userIndex = users.findIndex(u => u.id === userId);
    users[userIndex] = user;
    localStorage.setItem('users', JSON.stringify(users));
    
    alert(`"${user.username}" wurde erfolgreich zum Admin befördert.`);
    loadUsersTable();
}

// Demote Admin to Student
function demoteToStudent(userId) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        alert('Benutzer nicht gefunden.');
        return;
    }
    
    // Check if this is the last admin
    const adminCount = users.filter(u => u.role === 'admin').length;
    if (adminCount <= 1) {
        alert('Fehler: Sie können den letzten Admin nicht degradieren.');
        return;
    }
    
    if (!confirm(`Möchten Sie "${user.username}" wirklich zum Cursant zurückgestufen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
        return;
    }
    
    // Demote to Student
    user.role = 'student';
    const userIndex = users.findIndex(u => u.id === userId);
    users[userIndex] = user;
    localStorage.setItem('users', JSON.stringify(users));
    
    alert(`"${user.username}" wurde erfolgreich zum Cursant zurückgestuft.`);
    loadUsersTable();
}
