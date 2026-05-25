(function () {
    "use strict";

    function getAuth() {
        if (!window.Auth) {
            throw new Error("Auth.js wurde nicht korrekt geladen.");
        }
        return window.Auth;
    }

    function initAdminPage() {
        const auth = getAuth();
        const currentUser = auth.requireAdmin();
        if (!currentUser) return;

        const currentUserEl = document.getElementById("currentUser");
        if (currentUserEl) {
            currentUserEl.textContent = `Admin: ${currentUser.username}`;
        }

        renderAdminDashboard();
        toggleDateInput();
    }

    function renderAdminDashboard() {
        renderOverview();
        renderUsersTable();
    }

    function renderOverview() {
        const auth = getAuth();
        auth.markAbsentUsersForToday();

        const users = auth.getUsers();
        const attendance = auth.getAttendance();
        const today = auth.getTodayDateString();

        const totalUsers = users.length;
        const totalStudents = users.filter((user) => user.role === "student").length;
        const totalAdmins = users.filter((user) => user.role === "admin").length;

        const presentToday = attendance.filter((entry) => {
            return entry.date === today &&
                (entry.status === "present" || entry.status === "Verspätet");
        }).length;

        const totalUsersEl = document.getElementById("totalUsers");
        const totalStudentsEl = document.getElementById("totalStudents");
        const totalAdminsEl = document.getElementById("totalAdmins");
        const presentTodayEl = document.getElementById("presentToday");

        if (totalUsersEl) totalUsersEl.textContent = String(totalUsers);
        if (totalStudentsEl) totalStudentsEl.textContent = String(totalStudents);
        if (totalAdminsEl) totalAdminsEl.textContent = String(totalAdmins);
        if (presentTodayEl) presentTodayEl.textContent = String(presentToday);
    }

    function renderUsersTable() {
        const auth = getAuth();
        const users = auth.getUsers();
        const attendance = auth.getAttendance();
        const currentUser = auth.getCurrentUser();

        const usersTableBody = document.getElementById("usersTableBody");
        if (!usersTableBody) return;

        usersTableBody.innerHTML = "";

        if (!users.length) {
            usersTableBody.innerHTML = `
                <tr>
                    <td colspan="6">Keine Benutzer vorhanden.</td>
                </tr>
            `;
            return;
        }

        const sortedUsers = [...users].sort((a, b) => {
            if (a.role !== b.role) {
                return a.role === "admin" ? -1 : 1;
            }
            return a.username.localeCompare(b.username, "de");
        });

        sortedUsers.forEach((user) => {
            const tr = document.createElement("tr");

            const presentDays = attendance.filter((entry) => {
                return entry.username === user.username &&
                    (entry.status === "present" || entry.status === "Verspätet");
            }).length;

            const createdAt = user.createdAt
                ? new Date(user.createdAt).toLocaleDateString("de-DE")
                : "-";

            const lastLogin = user.lastLogin
                ? new Date(user.lastLogin).toLocaleString("de-DE")
                : "Nie";

            const canEdit = currentUser && currentUser.username !== user.username;

            let actionButtons = `<span style="color:#666; font-size:12px;">Keine Aktion</span>`;

            if (canEdit) {
                const safeUsername = String(user.username).replace(/'/g, "\\'");
                const roleLabel = user.role === "admin" ? "Zu Student" : "Zu Admin";

                actionButtons = `
                    <div style="display:flex; flex-wrap:wrap; gap:6px;">
                        <button onclick="toggleUserRole('${safeUsername}')" class="btn-secondary" style="padding:6px 10px; font-size:12px;">
                            ${roleLabel}
                        </button>
                        <button onclick="resetPasswordPrompt('${safeUsername}')" class="btn-export" style="padding:6px 10px; font-size:12px;">
                            Passwort reset
                        </button>
                        <button onclick="deleteUser('${safeUsername}')" class="btn-danger" style="padding:6px 10px; font-size:12px;">
                            Löschen
                        </button>
                    </div>
                `;
            }

            const roleBadgeClass = user.role === "admin" ? "present" : "absent";
            const roleLabelText = user.role === "admin" ? "Admin" : "Student";

            tr.innerHTML = `
                <td>${escapeHtml(user.username)}</td>
                <td><span class="badge ${roleBadgeClass}">${roleLabelText}</span></td>
                <td>${presentDays}</td>
                <td>${createdAt}</td>
                <td>${lastLogin}</td>
                <td>${actionButtons}</td>
            `;

            usersTableBody.appendChild(tr);
        });
    }

    function toggleUserRole(username) {
        const auth = getAuth();
        const users = auth.getUsers();
        const currentUser = auth.getCurrentUser();

        if (!currentUser || currentUser.username === username) {
            alert("Die eigene Rolle kann nicht geändert werden.");
            return;
        }

        const index = users.findIndex((user) => user.username === username);
        if (index === -1) {
            alert("Benutzer nicht gefunden.");
            return;
        }

        users[index] = {
            ...users[index],
            role: users[index].role === "admin" ? "student" : "admin"
        };

        auth.saveUsers(users);
        renderAdminDashboard();
    }

    function resetPasswordPrompt(username) {
        const auth = getAuth();
        const currentUser = auth.getCurrentUser();

        if (!currentUser || currentUser.username === username) {
            alert("Das eigene Passwort sollte nicht über diese Admin-Aktion zurückgesetzt werden.");
            return;
        }

        const newPassword = prompt(`Neues Passwort für ${username}:`);
        if (newPassword === null) return;

        const cleanPassword = newPassword.trim();

        if (cleanPassword.length < 4) {
            alert("Das Passwort muss mindestens 4 Zeichen haben.");
            return;
        }

        const users = auth.getUsers();
        const index = users.findIndex((user) => user.username === username);

        if (index === -1) {
            alert("Benutzer nicht gefunden.");
            return;
        }

        users[index] = {
            ...users[index],
            password: cleanPassword
        };

        auth.saveUsers(users);
        alert(`Passwort für ${username} wurde aktualisiert.`);
        renderUsersTable();
    }

    function deleteUser(username) {
        const auth = getAuth();
        const currentUser = auth.getCurrentUser();

        if (!currentUser || currentUser.username === username) {
            alert("Der aktuell eingeloggte Admin kann nicht gelöscht werden.");
            return;
        }

        const confirmed = confirm(`Soll der Benutzer "${username}" wirklich gelöscht werden?`);
        if (!confirmed) return;

        const users = auth.getUsers();
        const attendance = auth.getAttendance();

        const filteredUsers = users.filter((user) => user.username !== username);
        const filteredAttendance = attendance.filter((entry) => entry.username !== username);

        auth.saveUsers(filteredUsers);
        auth.saveAttendance(filteredAttendance);

        renderAdminDashboard();
    }

    function getSelectedExportFormat() {
        const checked = document.querySelector('input[name="exportFormat"]:checked');
        return checked ? checked.value : "csv";
    }

    function getSelectedExportRange() {
        const checked = document.querySelector('input[name="exportRange"]:checked');
        return checked ? checked.value : "all";
    }

    function getFilteredAttendanceForExport() {
        const auth = getAuth();
        const attendance = auth.getAttendance();
        const range = getSelectedExportRange();

        if (range === "specific") {
            const exportDateInput = document.getElementById("exportDate");
            const selectedDate = exportDateInput ? exportDateInput.value : "";

            if (!selectedDate) {
                alert("Bitte ein Datum auswählen.");
                return null;
            }

            return attendance.filter((entry) => entry.date === selectedDate);
        }

        return attendance;
    }

    function downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    }

    function executeExport() {
        const auth = getAuth();
        const attendance = getFilteredAttendanceForExport();
        if (!attendance) return;

        const users = auth.getUsers();
        const format = getSelectedExportFormat();
        const exportDate = document.getElementById("exportDate")?.value || "alle-daten";

        if (format === "json") {
            const exportPayload = {
                exportedAt: new Date().toISOString(),
                users: users.map((user) => auth.sanitizeUser(user)),
                attendance
            };

            downloadFile(
                `zeiterfassung-export-${exportDate}.json`,
                JSON.stringify(exportPayload, null, 2),
                "application/json"
            );

            return;
        }

        const header = ["Benutzername", "Datum", "Status", "Ankunft", "Gehen"];
        const rows = attendance.map((entry) => [
            csvEscape(entry.username),
            csvEscape(entry.date),
            csvEscape(entry.status),
            csvEscape(entry.loginTime || ""),
            csvEscape(entry.logoutTime || "")
        ]);

        const csvContent = [header.join(";"), ...rows.map((row) => row.join(";"))].join("\n");

        downloadFile(
            `zeiterfassung-export-${exportDate}.csv`,
            csvContent,
            "text/csv;charset=utf-8;"
        );
    }

    function generateDailyReport() {
        const attendance = getFilteredAttendanceForExport();
        if (!attendance) return;

        if (!attendance.length) {
            alert("Für den gewählten Zeitraum sind keine Anwesenheitsdaten vorhanden.");
            return;
        }

        const total = attendance.length;
        const present = attendance.filter((entry) => entry.status === "present").length;
        const late = attendance.filter((entry) => entry.status === "Verspätet").length;
        const absent = attendance.filter((entry) => entry.status === "Abwesend").length;

        const lines = [
            "Tagesbericht / Auswahlbericht",
            "----------------------------------------",
            `Datensätze gesamt: ${total}`,
            `Anwesend: ${present}`,
            `Verspätet: ${late}`,
            `Abwesend: ${absent}`
        ];

        alert(lines.join("\n"));
    }

    function clearOldData() {
        const auth = getAuth();
        const settings = auth.getSettings();
        const retentionDays = Number(settings.retentionDays) || 90;

        const confirmed = confirm(`Sollen alle Datensätze gelöscht werden, die älter als ${retentionDays} Tage sind?`);
        if (!confirmed) return;

        auth.cleanupOldAttendance();
        renderAdminDashboard();
        alert("Alte Datensätze wurden bereinigt.");
    }

    function toggleDateInput() {
        const specificOption = document.querySelector('input[name="exportRange"][value="specific"]');
        const exportDateInput = document.getElementById("exportDate");

        if (!specificOption || !exportDateInput) return;

        exportDateInput.disabled = !specificOption.checked;

        if (!specificOption.checked) {
            exportDateInput.value = "";
        }
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function csvEscape(value) {
        const stringValue = String(value ?? "");
        if (stringValue.includes(";") || stringValue.includes('"') || stringValue.includes("\n")) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
    }

    window.toggleUserRole = toggleUserRole;
    window.resetPasswordPrompt = resetPasswordPrompt;
    window.deleteUser = deleteUser;
    window.executeExport = executeExport;
    window.generateDailyReport = generateDailyReport;
    window.clearOldData = clearOldData;
    window.toggleDateInput = toggleDateInput;

    window.addEventListener("load", initAdminPage);
})();