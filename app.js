(function () {
    "use strict";

    let currentDate = new Date();

    function getAuth() {
        if (!window.Auth) {
            throw new Error("Auth.js wurde nicht korrekt geladen.");
        }
        return window.Auth;
    }

    function getCurrentUserOrRedirect() {
        const auth = getAuth();
        const user = auth.requireStudent();
        return user;
    }

    function setCurrentUserLabel(user) {
        const currentUserEl = document.getElementById("currentUser");
        if (currentUserEl && user) {
            currentUserEl.textContent = `Benutzername: ${user.username}`;
        }
    }

    function getUserAttendanceHistory(username) {
        const auth = getAuth();
        const attendance = auth.getAttendance();

        return attendance
            .filter((entry) => entry.username === username)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    function getTodayRecord(username) {
        const auth = getAuth();
        return auth.findTodayAttendanceForUser(username);
    }

    function renderTodayStatus(todayRecord) {
        const statusDiv = document.getElementById("todayStatus");
        if (!statusDiv) return;

        statusDiv.className = "status-card";
        statusDiv.style.background = "";
        statusDiv.style.borderLeft = "";
        statusDiv.style.color = "";

        if (!todayRecord) {
            statusDiv.classList.add("absent");
            statusDiv.innerHTML = `
                <h3 style="margin-bottom: 10px;">✗ Kein Eintrag</h3>
                <p style="font-size: 14px;">Für heute existiert noch kein Eintrag.</p>
            `;
            return;
        }

        const isPresent = todayRecord.status === "present";
        const isLate = todayRecord.status === "Verspätet";
        const isAbsent = todayRecord.status === "Abwesend";

        const canCheckout = (isPresent || isLate) && !todayRecord.logoutTime;

        const checkoutHtml = canCheckout
            ? `<button onclick="handleCheckout()" style="margin-top: 10px; padding: 6px 12px; background: transparent; color: #dc3545; border: 1px solid #dc3545; border-radius: 4px; cursor: pointer; font-size: 13px;">Gehen / Ausstempeln</button>`
            : "";

        const logoutText = todayRecord.logoutTime
            ? `<p style="font-size: 14px; margin-top: 5px;">Gehen: ${todayRecord.logoutTime}</p>`
            : "";

        if (isPresent) {
            statusDiv.classList.add("present");
            statusDiv.innerHTML = `
                <h3 style="margin-bottom: 10px;">✓ Anwesend</h3>
                <p style="font-size: 14px;">Ankunft: ${todayRecord.loginTime || "N/A"}</p>
                ${logoutText}
                ${checkoutHtml}
            `;
            return;
        }

        if (isLate) {
            statusDiv.style.background = "#fff3cd";
            statusDiv.style.borderLeft = "4px solid #ffc107";
            statusDiv.style.color = "#856404";
            statusDiv.innerHTML = `
                <h3 style="margin-bottom: 10px;">⚠️ Verspätet</h3>
                <p style="font-size: 14px;">Ankunft: ${todayRecord.loginTime || "N/A"}</p>
                ${logoutText}
                ${checkoutHtml}
            `;
            return;
        }

        if (isAbsent) {
            statusDiv.classList.add("absent");
            statusDiv.innerHTML = `
                <h3 style="margin-bottom: 10px;">✗ Abwesend</h3>
                <p style="font-size: 14px;">Datum: ${todayRecord.date}</p>
            `;
            return;
        }

        statusDiv.innerHTML = `
            <h3 style="margin-bottom: 10px;">?</h3>
            <p style="font-size: 14px;">Unbekannter Status: ${todayRecord.status}</p>
        `;
    }

    function renderStatistics(history) {
        const presentDays = history.filter(
            (entry) => entry.status === "present" || entry.status === "Verspätet"
        ).length;

        const absentDays = history.filter(
            (entry) => entry.status === "Abwesend"
        ).length;

        const totalDays = history.length;
        const presentRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
        const absentRate = totalDays > 0 ? Math.round((absentDays / totalDays) * 100) : 0;

        const presentDaysEl = document.getElementById("presentDays");
        const absentDaysEl = document.getElementById("absentDays");
        const presentRateEl = document.getElementById("presentRate");
        const absentRateEl = document.getElementById("absentRate");

        if (presentDaysEl) presentDaysEl.textContent = String(presentDays);
        if (absentDaysEl) absentDaysEl.textContent = String(absentDays);
        if (presentRateEl) presentRateEl.textContent = `${presentRate}%`;
        if (absentRateEl) absentRateEl.textContent = `${absentRate}%`;
    }

    function renderHistoryTable(history) {
        const tbody =
            document.getElementById("historyTableBody") ||
            document.getElementById("historyBody");

        if (!tbody) return;

        tbody.innerHTML = "";

        if (!history.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4">Keine Daten vorhanden.</td>
                </tr>
            `;
            return;
        }

        history.forEach((record) => {
            const tr = document.createElement("tr");

            let statusBadge = "";
            if (record.status === "present") {
                statusBadge = `<span class="badge present">Anwesend</span>`;
            } else if (record.status === "Verspätet") {
                statusBadge = `<span class="badge" style="background: #ffc107; color: #000;">Verspätet</span>`;
            } else {
                statusBadge = `<span class="badge absent">Abwesend</span>`;
            }

            tr.innerHTML = `
                <td>${record.date || "-"}</td>
                <td>${statusBadge}</td>
                <td>${record.loginTime || "-"}</td>
                <td>${record.logoutTime || "-"}</td>
            `;

            tbody.appendChild(tr);
        });
    }

    function renderCalendar(history) {
        const calendarBody = document.getElementById("calendarBody");
        const currentMonthEl = document.getElementById("currentMonth");

        if (!calendarBody || !currentMonthEl) return;

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        currentMonthEl.textContent = currentDate.toLocaleDateString("de-DE", {
            month: "long",
            year: "numeric"
        });

        calendarBody.innerHTML = "";

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const normalizedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

        const historyMap = new Map();
        history.forEach((item) => {
            if (item.date) {
                historyMap.set(item.date, item);
            }
        });

        let row = document.createElement("tr");

        for (let i = 0; i < normalizedFirstDay; i++) {
            row.appendChild(document.createElement("td"));
        }

        for (let day = 1; day <= daysInMonth; day++) {
            if (row.children.length === 7) {
                calendarBody.appendChild(row);
                row = document.createElement("tr");
            }

            const td = document.createElement("td");
            td.textContent = String(day);

            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const record = historyMap.get(dateStr);

            if (record) {
                if (record.status === "present") {
                    td.classList.add("calendar-present");
                } else if (record.status === "Verspätet") {
                    td.classList.add("calendar-late");
                } else if (record.status === "Abwesend") {
                    td.classList.add("calendar-absent");
                }
            }

            row.appendChild(td);
        }

        while (row.children.length < 7) {
            row.appendChild(document.createElement("td"));
        }

        calendarBody.appendChild(row);
    }

    function renderDashboard(user) {
        const history = getUserAttendanceHistory(user.username);
        const todayRecord = getTodayRecord(user.username);

        renderTodayStatus(todayRecord);
        renderStatistics(history);
        renderHistoryTable(history);
        renderCalendar(history);
    }

    function checkoutCurrentUser() {
        const auth = getAuth();
        const user = auth.getCurrentUser();

        if (!user) {
            window.location.href = "index.html";
            return false;
        }

        const attendance = auth.getAttendance();
        const today = auth.getTodayDateString();

        const index = attendance.findIndex(
            (entry) =>
                entry.username === user.username &&
                entry.date === today &&
                entry.status !== "Abwesend" &&
                !entry.logoutTime
        );

        if (index === -1) {
            alert("Für heute ist kein offener Anwesenheitseintrag vorhanden.");
            return false;
        }

        attendance[index] = {
            ...attendance[index],
            logoutTime: auth.getTimeString()
        };

        auth.saveAttendance(attendance);
        return true;
    }

    function initDashboard() {
        const user = getCurrentUserOrRedirect();
        if (!user) return;

        setCurrentUserLabel(user);
        renderDashboard(user);
    }

    function previousMonth() {
        currentDate.setMonth(currentDate.getMonth() - 1);
        const auth = getAuth();
        const user = auth.getCurrentUser();
        if (!user) return;

        const history = getUserAttendanceHistory(user.username);
        renderCalendar(history);
    }

    function nextMonth() {
        currentDate.setMonth(currentDate.getMonth() + 1);
        const auth = getAuth();
        const user = auth.getCurrentUser();
        if (!user) return;

        const history = getUserAttendanceHistory(user.username);
        renderCalendar(history);
    }

    function handleCheckout() {
        const success = checkoutCurrentUser();
        if (!success) return;

        const auth = getAuth();
        const user = auth.getCurrentUser();
        if (!user) return;

        renderDashboard(user);
    }

    window.previousMonth = previousMonth;
    window.nextMonth = nextMonth;
    window.handleCheckout = handleCheckout;

    window.addEventListener("load", initDashboard);
})();