// Einfache Hash-Funktion für Passwörter
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}

// Formularwechsel: Registrierung anzeigen
function showRegister() {
    document.getElementById('loginForm').closest('.login-box').classList.add('hidden');
    document.getElementById('registerBox').classList.remove('hidden');
}

// Formularwechsel: Login anzeigen
function showLogin() {
    document.getElementById('loginForm').closest('.login-box').classList.remove('hidden');
    document.getElementById('registerBox').classList.add('hidden');
}

// Registrierung verarbeiten
function handleRegister(event) {
    event.preventDefault();

    const newUsername = document.getElementById('newUsername').value.trim();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorDiv = document.getElementById('registerErrorMessage');

    errorDiv.textContent = '';

    // Validierung
    if (newUsername.length < 3) {
        errorDiv.textContent = 'Benutzername muss mindestens 3 Zeichen lang sein.';
        return;
    }

    if (newPassword.length < 6) {
        errorDiv.textContent = 'Passwort muss mindestens 6 Zeichen lang sein.';
        return;
    }

    if (newPassword !== confirmPassword) {
        errorDiv.textContent = 'Passwörter stimmen nicht überein.';
        return;
    }

    // Prüfen, ob Benutzer existiert
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.find(u => u.username.toLowerCase() === newUsername.toLowerCase())) {
        errorDiv.textContent = 'Benutzername existiert bereits.';
        return;
    }

    // Neuen Benutzer erstellen - IMMER als Student
    const hashedPassword = simpleHash(newPassword);
    const newUser = {
        id: Date.now(),
        username: newUsername,
        password: hashedPassword,
        role: 'student', 
        createdAt: new Date().toISOString(),
        lastLogin: null,
        loginCount: 0
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    // Leeres Anwesenheitsobjekt initialisieren
    const attendance = JSON.parse(localStorage.getItem('attendance')) || {};
    if (!attendance[newUser.id]) {
        attendance[newUser.id] = [];
    }
    localStorage.setItem('attendance', JSON.stringify(attendance));

    // Erfolgsmeldung
    alert('Konto erfolgreich erstellt! Bitte melde dich an.');
    showLogin();
    document.getElementById('registerForm').reset();
}

// Login verarbeiten
function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');

    errorDiv.textContent = '';

    // Benutzer aus localStorage abrufen
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.username === username);

    if (!user) {
        errorDiv.textContent = 'Benutzer nicht gefunden.';
        return;
    }

    const hashedPassword = simpleHash(password);
    if (user.password !== hashedPassword) {
        errorDiv.textContent = 'Passwort ist falsch.';
        return;
    }

    // IP Verifikation (falls aktiviert)
    if (typeof ENABLE_IP_VERIFICATION !== 'undefined' && ENABLE_IP_VERIFICATION) {
        if (!verifyIPAddress()) {
            errorDiv.textContent = 'Fehler: Sie müssen sich aus dem Büronetzwerk anmelden.';
            return;
        }
    }

    // --- NEUE ANWESENHEITSLOGIK ---
    if (user.role === 'student') {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const totalMinutes = (hours * 60) + minutes;
        
        // 07:00 = 420 Minuten | 08:15 = 495 Minuten
        const START_TIME = 420; 
        const DEADLINE_TIME = 495;

        // Vor 07:00 Uhr Login blockieren
        if (totalMinutes < START_TIME) {
            errorDiv.textContent = 'Die Anwesenheitserfassung startet erst um 07:00 Uhr.';
            return;
        }

        const attendance = JSON.parse(localStorage.getItem('attendance')) || {};
        if (!attendance[user.id]) attendance[user.id] = [];
        
        const today = now.toISOString().split('T')[0];
        const existingRecord = attendance[user.id].find(a => a.date === today);
        const loginTimeString = now.toLocaleTimeString('de-DE');

        if (!existingRecord) {
            // Noch kein Eintrag heute
            const statusForToday = totalMinutes <= DEADLINE_TIME ? 'present' : 'Verspätet';
            
            attendance[user.id].push({
                date: today,
                status: statusForToday,
                loginTime: loginTimeString,
                logoutTime: null, // Für die neue Gehen-Funktion vorbereitet
                markedAt: now.toISOString(),
                autoMarked: false
            });
        } else if (existingRecord.status === 'absent') {
            // Wurde automatisch abwesend markiert, loggt sich aber jetzt ein -> Verspätet
            existingRecord.status = 'Verspätet';
            existingRecord.loginTime = loginTimeString;
            existingRecord.autoMarked = false;
        }
        // Wenn bereits present oder Verspätet, wird nichts überschrieben (verhindert Dubletten)

        localStorage.setItem('attendance', JSON.stringify(attendance));
    }

    // Benutzer-Login-Statistik aktualisieren
    user.lastLogin = new Date().toISOString();
    user.loginCount = (user.loginCount || 0) + 1;
    const userIndex = users.findIndex(u => u.id === user.id);
    users[userIndex] = user;
    localStorage.setItem('users', JSON.stringify(users));

    // Login erfolgreich
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    // Weiterleitung basierend auf Rolle
    if (user.role === 'admin') {
        window.location.href = 'admin.html';
    } else {
        window.location.href = 'dashboard.html';
    }
}

// Logout verarbeiten
function handleLogout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// ===== SICHERHEITSFUNKTIONEN =====

// IP Adresse prüfen (Platzhalter)
function verifyIPAddress() {
    const allowedIPs = typeof ALLOWED_IP_RANGES !== 'undefined' ? ALLOWED_IP_RANGES : [];
    if (!allowedIPs || allowedIPs.length === 0) return true; 
    console.log('IP-Prüfung würde im Produktionsbetrieb über ein Backend erfolgen');
    return true;
}

// Admin-Rechte prüfen
function isAdmin(user) {
    return user && user.role === 'admin';
}

// Rollenrechte prüfen
function hasPermission(user, permission) {
    if (!user || !user.role) return false;
    const permissions = typeof ROLE_PERMISSIONS !== 'undefined' ? ROLE_PERMISSIONS[user.role] : {};
    return permissions[permission] === true;
}

// Seitenaufruf-Prüfung und Initialisierung
window.addEventListener('load', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const currentUserStr = localStorage.getItem('currentUser');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

    // Geschützte Seiten absichern
    if ((currentPage === 'dashboard.html' || currentPage === 'admin.html') && !currentUser) {
        window.location.href = 'index.html';
        return;
    }

    if (currentPage === 'admin.html' && currentUser && currentUser.role !== 'admin') {
        window.location.href = 'dashboard.html';
        return;
    }

    // Wenn eingeloggt, Login-Seite überspringen
    if ((currentPage === 'index.html' || currentPage === '') && currentUser) {
        if (currentUser.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }
        return;
    }

    // Login-Felder leeren
    if (currentPage === 'index.html' || currentPage === '') {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.reset();
            const usernameField = document.getElementById('username');
            const passwordField = document.getElementById('password');
            if (usernameField) usernameField.value = '';
            if (passwordField) passwordField.value = '';
        }
    }

    // Automatische Abwesenheit prüfen
    checkAndMarkAutoAbsent();
});

// Auto-Absent Logik (Angepasst auf > 08:15 Uhr)
function checkAndMarkAutoAbsent() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = (hours * 60) + minutes;
    
    // Nach 08:15 (495 Minuten) automatisch abwesend markieren
    if (totalMinutes > 495) {
        const today = now.toISOString().split('T')[0];
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const attendance = JSON.parse(localStorage.getItem('attendance')) || {};

        users.forEach(user => {
            if (user.role !== 'student') return;

            if (!attendance[user.id]) attendance[user.id] = [];
            const todayRecord = attendance[user.id].find(a => a.date === today);

            // Wenn bis jetzt kein Eintrag existiert -> absent
            if (!todayRecord) {
                attendance[user.id].push({
                    date: today,
                    status: 'absent',
                    loginTime: null,
                    logoutTime: null,
                    markedAt: now.toISOString(),
                    autoMarked: true
                });
            }
        });

        localStorage.setItem('attendance', JSON.stringify(attendance));
    }
}

console.log('Auth System Initialisiert (Neue Regeln: 07:00 - 08:15)');
