(function () {
    "use strict";

    const STORAGE_KEYS = {
        users: "users",
        currentUser: "currentUser",
        attendance: "attendanceData",
        settings: "settings"
    };

    const DEFAULT_USERS = [
        {
            id: 1,
            username: "admin",
            password: "admin123",
            role: "admin",
            createdAt: "2025-01-01T08:00:00.000Z",
            lastLogin: null
        },
        {
            id: 2,
            username: "student",
            password: "student123",
            role: "student",
            createdAt: "2025-01-01T08:00:00.000Z",
            lastLogin: null
        }
    ];

    const DEFAULT_SETTINGS = {
        schoolStartTime: "08:00",
        lateThresholdMinutes: 15,
        autoAbsentAfter: "08:15",
        retentionDays: 90
    };

    function safeJsonParse(value, fallback) {
        try {
            return JSON.parse(value);
        } catch (error) {
            return fallback;
        }
    }

    function getUsers() {
        return safeJsonParse(localStorage.getItem(STORAGE_KEYS.users), []);
    }

    function saveUsers(users) {
        localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
    }

    function getAttendance() {
        return safeJsonParse(localStorage.getItem(STORAGE_KEYS.attendance), []);
    }

    function saveAttendance(data) {
        localStorage.setItem(STORAGE_KEYS.attendance, JSON.stringify(data));
    }

    function getSettings() {
        const settings = safeJsonParse(localStorage.getItem(STORAGE_KEYS.settings), null);
        return settings && typeof settings === "object"
            ? { ...DEFAULT_SETTINGS, ...settings }
            : { ...DEFAULT_SETTINGS };
    }

    function saveSettings(settings) {
        localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
    }

    function getCurrentUser() {
        return safeJsonParse(localStorage.getItem(STORAGE_KEYS.currentUser), null);
    }

    function setCurrentUser(user) {
        localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
    }

    function clearCurrentUser() {
        localStorage.removeItem(STORAGE_KEYS.currentUser);
    }

    function ensureInitialData() {
        const users = getUsers();
        if (!Array.isArray(users) || users.length === 0) {
            saveUsers(DEFAULT_USERS);
        }

        const attendance = getAttendance();
        if (!Array.isArray(attendance)) {
            saveAttendance([]);
        }

        const settings = safeJsonParse(localStorage.getItem(STORAGE_KEYS.settings), null);
        if (!settings || typeof settings !== "object") {
            saveSettings(DEFAULT_SETTINGS);
        }
    }

    function getTodayDateString() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function getTimeString(date = new Date()) {
        return date.toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function toMinutes(timeString) {
        if (!timeString || typeof timeString !== "string" || !timeString.includes(":")) {
            return null;
        }

        const [hours, minutes] = timeString.split(":").map(Number);
        if (Number.isNaN(hours) || Number.isNaN(minutes)) {
            return null;
        }

        return hours * 60 + minutes;
    }

    function getCurrentMinutes() {
        const now = new Date();
        return now.getHours() * 60 + now.getMinutes();
    }

    function calculateStatusForLogin() {
        const settings = getSettings();
        const autoAbsentAfter = toMinutes(settings.autoAbsentAfter);
        const nowMinutes = getCurrentMinutes();

        if (autoAbsentAfter !== null && nowMinutes > autoAbsentAfter) {
            return "Verspätet";
        }

        return "present";
    }

    function findTodayAttendanceForUser(username) {
        const today = getTodayDateString();
        const attendance = getAttendance();
        return attendance.find(
            (entry) => entry.username === username && entry.date === today
        ) || null;
    }

    function hasOpenAttendance(username) {
        const todayEntry = findTodayAttendanceForUser(username);
        if (!todayEntry) return false;

        return (
            todayEntry.status !== "Abwesend" &&
            !todayEntry.logoutTime
        );
    }

    function upsertTodayAttendance(username) {
        const today = getTodayDateString();
        const currentTime = getTimeString();
        const attendance = getAttendance();

        const existingIndex = attendance.findIndex(
            (entry) => entry.username === username && entry.date === today
        );

        const loginStatus = calculateStatusForLogin();

        if (existingIndex >= 0) {
            const existing = attendance[existingIndex];

            if (existing.status === "Abwesend") {
                attendance[existingIndex] = {
                    ...existing,
                    status: loginStatus,
                    loginTime: currentTime,
                    logoutTime: null
                };
            } else if (!existing.loginTime) {
                attendance[existingIndex] = {
                    ...existing,
                    status: loginStatus,
                    loginTime: currentTime
                };
            }

            saveAttendance(attendance);
            return attendance[existingIndex];
        }

        const newEntry = {
            id: Date.now(),
            username,
            date: today,
            status: loginStatus,
            loginTime: currentTime,
            logoutTime: null,
            createdAt: new Date().toISOString()
        };

        attendance.push(newEntry);
        saveAttendance(attendance);
        return newEntry;
    }

    function markAbsentUsersForToday() {
        const users = getUsers();
        const attendance = getAttendance();
        const today = getTodayDateString();
        const settings = getSettings();
        const autoAbsentAfter = toMinutes(settings.autoAbsentAfter);
        const nowMinutes = getCurrentMinutes();

        if (autoAbsentAfter === null || nowMinutes <= autoAbsentAfter) {
            return;
        }

        let changed = false;

        users
            .filter((user) => user.role === "student")
            .forEach((user) => {
                const exists = attendance.some(
                    (entry) => entry.username === user.username && entry.date === today
                );

                if (!exists) {
                    attendance.push({
                        id: Date.now() + Math.floor(Math.random() * 10000),
                        username: user.username,
                        date: today,
                        status: "Abwesend",
                        loginTime: null,
                        logoutTime: null,
                        createdAt: new Date().toISOString()
                    });
                    changed = true;
                }
            });

        if (changed) {
            saveAttendance(attendance);
        }
    }

    function cleanupOldAttendance() {
        const attendance = getAttendance();
        const settings = getSettings();
        const retentionDays = Number(settings.retentionDays) || 90;

        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - retentionDays);

        const filtered = attendance.filter((entry) => {
            if (!entry.date) return false;
            const entryDate = new Date(`${entry.date}T00:00:00`);
            return entryDate >= thresholdDate;
        });

        saveAttendance(filtered);
    }

    function updateLastLogin(username) {
        const users = getUsers();
        const userIndex = users.findIndex((user) => user.username === username);

        if (userIndex === -1) return null;

        users[userIndex].lastLogin = new Date().toISOString();
        saveUsers(users);

        return users[userIndex];
    }

    function sanitizeUser(user) {
        if (!user) return null;

        return {
            id: user.id,
            username: user.username,
            role: user.role,
            createdAt: user.createdAt || null,
            lastLogin: user.lastLogin || null
        };
    }

    function login(username, password) {
        if (!username || !password) {
            return { success: false, message: "Benutzername und Passwort sind erforderlich." };
        }

        markAbsentUsersForToday();

        const users = getUsers();
        const user = users.find(
            (entry) => entry.username === username && entry.password === password
        );

        if (!user) {
            return { success: false, message: "Ungültiger Benutzername oder Passwort." };
        }

        const updatedUser = updateLastLogin(user.username);
        const safeUser = sanitizeUser(updatedUser || user);

        setCurrentUser(safeUser);

        if (safeUser.role === "student") {
            if (!hasOpenAttendance(safeUser.username)) {
                upsertTodayAttendance(safeUser.username);
            }
        }

        return {
            success: true,
            message: "Login erfolgreich.",
            user: safeUser
        };
    }

    function logout() {
        clearCurrentUser();
        window.location.href = "index.html";
    }

    function requireAuth() {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            window.location.href = "index.html";
            return null;
        }
        return currentUser;
    }

    function requireAdmin() {
        const currentUser = requireAuth();
        if (!currentUser) return null;

        if (currentUser.role !== "admin") {
            window.location.href = "dashboard.html";
            return null;
        }

        return currentUser;
    }

    function requireStudent() {
        const currentUser = requireAuth();
        if (!currentUser) return null;

        if (currentUser.role !== "student") {
            window.location.href = "admin.html";
            return null;
        }

        return currentUser;
    }

    function handleLoginFormSubmit(event) {
        event.preventDefault();

        const usernameInput = document.getElementById("username");
        const passwordInput = document.getElementById("password");
        const errorBox = document.getElementById("errorMessage");

        const username = usernameInput ? usernameInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";

        const result = login(username, password);

        if (!result.success) {
            if (errorBox) {
                errorBox.textContent = result.message;
                errorBox.style.display = "block";
            } else {
                alert(result.message);
            }
            return;
        }

        if (errorBox) {
            errorBox.textContent = "";
            errorBox.style.display = "none";
        }

        if (result.user.role === "admin") {
            window.location.href = "admin.html";
        } else {
            window.location.href = "dashboard.html";
        }
    }

    function attachLoginFormHandler() {
        const loginForm = document.getElementById("loginForm");
        if (!loginForm) return;

        loginForm.addEventListener("submit", handleLoginFormSubmit);
    }

    ensureInitialData();
    cleanupOldAttendance();
    markAbsentUsersForToday();
    attachLoginFormHandler();

    window.Auth = {
        getUsers,
        saveUsers,
        getAttendance,
        saveAttendance,
        getSettings,
        saveSettings,
        getCurrentUser,
        setCurrentUser,
        clearCurrentUser,
        login,
        logout,
        requireAuth,
        requireAdmin,
        requireStudent,
        markAbsentUsersForToday,
        cleanupOldAttendance,
        upsertTodayAttendance,
        findTodayAttendanceForUser,
        getTodayDateString,
        getTimeString,
        sanitizeUser
    };

    window.handleLogout = logout;
})();