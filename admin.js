// Admin Dashboard Logic

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
});

function handleLogout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

function updateAdminOverview() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const attendance = JSON.parse(localStorage.getItem('attendance')) || {};

    const students = users.filter(u => u.role === 'student').length;
    const admins = users.filter(u => u.role === 'admin').length;

    const today = new Date().toISOString().split('T')[0];
    let presentToday = 0;

    for (const userId in attendance) {
        const userRecord = attendance[userId].find(a => a.date === today && (a.status === 'present' || a.status === 'Verspätet'));
        if (userRecord) presentToday++;
    }

    const tu = document.getElementById('totalUsers');
    const ts = document.getElementById('totalStudents');
    const ta = document.getElementById('totalAdmins');
    const pt = document.getElementById('presentToday');

    if (tu) tu.textContent = users.length;
    if (ts) ts.textContent = students;
    if (ta) ta.textContent = admins;
    if (pt) pt.textContent = presentToday;
}

function loadUsersTable() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const attendance = JSON.parse(localStorage.getItem('attendance')) || {};
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const usersTableBody = document.getElementById('usersTableBody');

    if (!usersTableBody) return;

    usersTableBody.innerHTML = '';
    const adminCount = users.filter(u => u.role === 'admin').length;

    users.forEach(user => {
        const userAttendance = attendance[user.id] || [];
        
        let presentDaysText = "-";
        if (user.role === 'student') {
            const presentDays = userAttendance.filter(a => a.status === 'present' || a.status === 'Verspätet').length;
            presentDaysText = `${presentDays} Tage`;
        }

        const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('de-DE') : 'Nie';
        const createdDate = new Date(user.createdAt).toLocaleDateString('de-DE');

        let actionButtons = '';
        const btnStyle = "flex: 1; min-width: 95px; max-width: 120px; padding: 6px 4px; font-size: 11px; font-weight: 500; border: none; border-radius: 4px; cursor: pointer; text-align: center; color: white;";

        if (user.id !== currentUser.id) {
            actionButtons = '<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; max-width: 360px; margin: 0 auto;">';
            
            if (user.role === 'student') {
                actionButtons += `<button onclick="viewUserHistory(${user.id})" style="${btnStyle} background-color: #007bff;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">Verlauf</button>`;
                actionButtons += `<button onclick="promoteToAdmin(${user.id})" style="${btnStyle} background-color: #28a745;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">Zu Admin</button>`;
                actionButtons += `<button onclick="renameUser(${user.id})" style="${btnStyle} background-color: #17a2b8;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">Umbenennen</button>`;
                actionButtons += `<button onclick="changeUserPassword(${user.id})" style="${btnStyle} background-color: #f8f9fa; color: #333; border: 1px solid #ccc;" onmouseover="this.style.backgroundColor='#e2e2e2'" onmouseout="this.style.backgroundColor='#f8f9fa'">Passwort</button>`;
                actionButtons += `<button onclick="editUserAttendance(${user.id})" style="${btnStyle} background-color: #6c757d;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">Anwesenheit</button>`;
                actionButtons += `<button onclick="deleteUser(${user.id})" style="${btnStyle} background-color: #dc3545;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">Löschen</button>`;
            } else if (user.role === 'admin') {
                // Admini: aceleasi butoane, dar FARA "Löschen"
                actionButtons += `<button onclick="viewUserHistory(${user.id})" style="${btnStyle} background-color: #007bff;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">Verlauf</button>`;
                if (adminCount > 1) {
                    actionButtons += `<button onclick="demoteToStudent(${user.id})" style="${btnStyle} background-color: #ffc107; color: #333;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">Zu Teilnehmer</button>`;
                }
                actionButtons += `<button onclick="renameUser(${user.id})" style="${btnStyle} background-color: #17a2b8;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">Umbenennen</button>`;
                actionButtons += `<button onclick="changeUserPassword(${user.id})" style="${btnStyle} background-color: #f8f9fa; color: #333; border: 1px solid #ccc;" onmouseover="this.style.backgroundColor='#e2e2e2'" onmouseout="this.style.backgroundColor='#f8f9fa'">Passwort</button>`;
            }
            
            actionButtons += '</div>';
        } else {
            actionButtons = '<span style="color:#28a745; font-size:12px; font-weight:bold; display:block; text-align:center; padding: 6px;">-</span>';
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="vertical-align: middle; text-align: center;"><strong>${user.username}</strong></td>
            <td style="vertical-align: middle; text-align: center;"><span class="role-badge role-${user.role}">${user.role === 'admin' ? 'Admin' : 'Teilnehmer'}</span></td>
            <td style="vertical-align: middle; text-align: center;">${presentDaysText}</td>
            <td style="vertical-align: middle; text-align: center;">${createdDate}</td>
            <td style="vertical-align: middle; text-align: center;">${lastLogin}</td>
            <td style="vertical-align: middle; text-align: center; min-width: 320px;">${actionButtons}</td>
        `;
        usersTableBody.appendChild(row);
    });
}

function viewUserHistory(userId) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const attendance = JSON.parse(localStorage.getItem('attendance')) || {};
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const userAttendance = attendance[userId] || [];
    const sortedAttendance = [...userAttendance].sort((a, b) => new Date(b.date) - new Date(a.date));
    let tableRows = '';
    
    if (sortedAttendance.length === 0) {
        tableRows = '<tr><td colspan="4" style="text-align:center; padding: 15px;">Keine Daten vorhanden.</td></tr>';
    } else {
        sortedAttendance.forEach(record => {
            const dateObj = new Date(record.date + 'T00:00:00');
            const formattedDate = dateObj.toLocaleDateString('de-DE');
            let statusHtml = '';
            if (record.status === 'present') statusHtml = '<span style="background:#d4edda; color:#155724; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:bold;">Anwesend</span>';
            else if (record.status === 'Verspätet') statusHtml = '<span style="background:#fff3cd; color:#856404; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:bold;">Verspätet</span>';
            else statusHtml = '<span style="background:#f8d7da; color:#721c24; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:bold;">Abwesend</span>';

            tableRows += `<tr><td style="padding: 12px; border-bottom: 1px solid #ddd;">${formattedDate}</td><td style="padding: 12px; border-bottom: 1px solid #ddd;">${statusHtml}</td><td style="padding: 12px; border-bottom: 1px solid #ddd;">${record.loginTime || '-'}</td><td style="padding: 12px; border-bottom: 1px solid #ddd;">${record.logoutTime || '-'}</td></tr>`;
        });
    }

    const htmlContent = `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><title>Verlauf - ${user.username}</title><style>body{font-family:'Segoe UI',Tahoma,sans-serif;background:#f5f7fa;padding:30px;margin:0;color:#333}.container{background:white;max-width:800px;margin:0 auto;padding:30px;border-radius:10px;box-shadow:0 4px 15px rgba(0,0,0,0.1)}h1{margin-top:0;color:#333;border-bottom:2px solid #007bff;padding-bottom:10px}.stats{margin-bottom:20px;font-size:14px;color:#666}table{width:100%;border-collapse:collapse;text-align:center;margin-top:20px}th{background:#f8f9fa;padding:12px;font-weight:600;border-bottom:2px solid #ddd}tbody tr:hover{background:#f1f3f5}button{margin-top:20px;padding:10px 20px;background:#6c757d;color:white;border:none;border-radius:5px;cursor:pointer;font-size:14px}button:hover{background:#5a6268}</style></head><body><div class="container"><h1>Anwesenheitsprotokoll: ${user.username}</h1><div class="stats">Rolle: <strong>${user.role === 'admin' ? 'Administrator' : 'Teilnehmer'}</strong> | Erfasst seit: <strong>${new Date(user.createdAt).toLocaleDateString('de-DE')}</strong></div><table><thead><tr><th>Datum</th><th>Status</th><th>Ankunft</th><th>Gehen</th></tr></thead><tbody>${tableRows}</tbody></table><button onclick="window.close()">Fenster schließen</button></div></body></html>`;

    const newWindow = window.open('', '_blank', 'width=850,height=600');
    if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
    } else {
        alert("Bitte Pop-ups zulassen, um den Verlauf anzuzeigen.");
    }
}

function renameUser(userId) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return;
    const user = users[userIndex];
    const newUsername = prompt(`Neuen Benutzernamen für "${user.username}" eingeben:`, user.username);
    if (newUsername && newUsername.trim() !== '' && newUsername !== user.username) {
        if (users.find(u => u.username.toLowerCase() === newUsername.trim().toLowerCase())) {
            alert('Dieser Benutzername existiert bereits!'); return;
        }
        user.username = newUsername.trim();
        users[userIndex] = user;
        localStorage.setItem('users', JSON.stringify(users));
        loadUsersTable();
        alert('Benutzername erfolgreich geändert.');
    }
}

function editUserAttendance(userId) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const dateStr = prompt(`Für welches Datum möchtest du die Anwesenheit bearbeiten?\nFormat: YYYY-MM-DD`, new Date().toISOString().split('T')[0]);
    if (!dateStr || !dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) { if(dateStr) alert("Ungültiges Datumsformat."); return; }
    const newStatus = prompt(`Neuer Status für den ${dateStr}:\nBitte eingeben: 1 für Anwesend, 2 für Abwesend, 3 für Verspätet`, "1");
    let statusText = '';
    if (newStatus === "1") statusText = 'present';
    else if (newStatus === "2") statusText = 'absent';
    else if (newStatus === "3") statusText = 'Verspätet';
    else { alert("Abgebrochen."); return; }
    const attendance = JSON.parse(localStorage.getItem('attendance')) || {};
    if (!attendance[user.id]) attendance[user.id] = [];
    const existingIndex = attendance[user.id].findIndex(a => a.date === dateStr);
    if (existingIndex >= 0) {
        attendance[user.id][existingIndex].status = statusText;
        attendance[user.id][existingIndex].autoMarked = false;
        attendance[user.id][existingIndex].loginTime = (statusText === 'absent') ? null : "Manuell korrigiert";
    } else {
        attendance[user.id].push({ date: dateStr, status: statusText, loginTime: (statusText === 'absent') ? null : "Manuell eingetragen", logoutTime: null, markedAt: new Date().toISOString(), autoMarked: false });
    }
    localStorage.setItem('attendance', JSON.stringify(attendance));
    updateAdminOverview(); loadUsersTable(); alert(`Aktualisiert.`);
}

function promoteToAdmin(userId) {
    if (confirm('Zum Administrator machen?')) changeUserRole(userId, 'admin');
}
function demoteToStudent(userId) {
    if (confirm('Rechte entziehen?')) changeUserRole(userId, 'student');
}
function changeUserRole(userId, newRole) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        users[userIndex].role = newRole;
        localStorage.setItem('users', JSON.stringify(users));
        updateAdminOverview(); loadUsersTable();
    }
}

function changeUserPassword(userId) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return;
    const newPassword = prompt(`Neues Passwort eingeben (min. 6 Zeichen):`);
    if (newPassword && newPassword.length >= 6) {
        users[userIndex].password = simpleHash(newPassword);
        localStorage.setItem('users', JSON.stringify(users));
        alert('Passwort geändert.');
    } else if (newPassword) { alert('Passwort zu kurz.'); }
}

function deleteUser(userId) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;
    if (confirm(`ACHTUNG: Benutzer "${userToDelete.username}" endgültig löschen?`)) {
        const updatedUsers = users.filter(u => u.id !== userId);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        const attendance = JSON.parse(localStorage.getItem('attendance')) || {};
        delete attendance[userId];
        localStorage.setItem('attendance', JSON.stringify(attendance));
        updateAdminOverview(); loadUsersTable();
    }
}

function toggleDateInput() {
    const rangeVal = document.querySelector('input[name="exportRange"]:checked').value;
    const dateInput = document.getElementById('exportDate');
    if (rangeVal === 'specific') {
        dateInput.disabled = false;
        if (!dateInput.value) dateInput.value = new Date().toISOString().split('T')[0];
    } else { dateInput.disabled = true; }
}

