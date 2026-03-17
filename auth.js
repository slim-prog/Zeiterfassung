// Simple hash function for passwords
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}

// Show/Hide Register Form
function showRegister() {
    document.getElementById('loginForm').closest('.login-box').classList.add('hidden');
    document.getElementById('registerBox').classList.remove('hidden');
}

function showLogin() {
    document.getElementById('loginForm').closest('.login-box').classList.remove('hidden');
    document.getElementById('registerBox').classList.add('hidden');
}

// Handle Registration
function handleRegister(event) {
    event.preventDefault();

    const newUsername = document.getElementById('newUsername').value.trim();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorDiv = document.getElementById('registerErrorMessage');

    errorDiv.textContent = '';

    // Validation
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

    // Check if user already exists
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.find(u => u.username === newUsername)) {
        errorDiv.textContent = 'Benutzername existiert bereits.';
        return;
    }

    // Create new user - ALWAYS as STUDENT (SECURITY FIX)
    // Admin-Konten können nur von bestehenden Administratoren erstellt werden
    const hashedPassword = simpleHash(newPassword);
    const newUser = {
        id: Date.now(),
        username: newUsername,
        password: hashedPassword,
        role: 'student', // SECURITY: Always Student on public registration
        createdAt: new Date().toISOString(),
        lastLogin: null,
        loginCount: 0
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    // Initialize empty attendance data
    const attendance = JSON.parse(localStorage.getItem('attendance')) || {};
    if (!attendance[newUser.id]) {
        attendance[newUser.id] = [];
    }
    localStorage.setItem('attendance', JSON.stringify(attendance));

    // Success message
    alert('Konto erfolgreich erstellt! Bitte melde dich an.');
    showLogin();
    document.getElementById('registerForm').reset();
}

// Handle Login
function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');

    errorDiv.textContent = '';

    // Get users from localStorage
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

    // IP Verification (if enabled)
    if (typeof ENABLE_IP_VERIFICATION !== 'undefined' && ENABLE_IP_VERIFICATION) {
        if (!verifyIPAddress()) {
            errorDiv.textContent = 'Fehler: Sie müssen sich aus dem Büronetzwerk anmelden.';
            return;
        }
    }

    // Daily PIN Verification (DEAKTIVIERT FÜR JETZT)
    // Wird in Zukunft implementiert, wenn Hardware/Software verfügbar ist
    // if (typeof ENABLE_DAILY_PIN !== 'undefined' && ENABLE_DAILY_PIN) {
    //     const enteredPIN = prompt(`Geben Sie den täglichen PIN ein (angezeigt im Klassenzimmer):`);
    //     if (!enteredPIN || !verifyDailyPIN(enteredPIN)) {
    //         errorDiv.textContent = 'PIN ist ungültig oder abgelaufen.';
    //         return;
    //     }
    // }

    // Record attendance
    const attendance = JSON.parse(localStorage.getItem('attendance')) || {};
    if (!attendance[user.id]) {
        attendance[user.id] = [];
    }

    const today = new Date().toISOString().split('T')[0];
    const existingRecord = attendance[user.id].find(a => a.date === today);

    if (!existingRecord) {
        attendance[user.id].push({
            date: today,
            status: 'present',
            loginTime: new Date().toLocaleTimeString('de-DE'),
            markedAt: new Date().toISOString()
        });
    }

    localStorage.setItem('attendance', JSON.stringify(attendance));

    // Update user login stats
    user.lastLogin = new Date().toISOString();
    user.loginCount = (user.loginCount || 0) + 1;
    const userIndex = users.findIndex(u => u.id === user.id);
    users[userIndex] = user;
    localStorage.setItem('users', JSON.stringify(users));

    // Login successful
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    // Redirect based on role
    if (user.role === 'admin') {
        window.location.href = 'admin.html';
    } else {
        window.location.href = 'dashboard.html';
    }
}

// Handle Logout
function handleLogout() {
    localStorage.removeItem('currentUser');
    // Clear form fields
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    if (usernameField) usernameField.value = '';
    if (passwordField) passwordField.value = '';
    window.location.href = 'index.html';
}

// ===== SECURITY FUNCTIONS =====

// Verify IP Address (for office network only)
function verifyIPAddress() {
    // In a real application, this would check the client's IP via a backend API
    // For now, we'll use a placeholder that checks localStorage
    const allowedIPs = typeof ALLOWED_IP_RANGES !== 'undefined' ? ALLOWED_IP_RANGES : [];
    
    if (!allowedIPs || allowedIPs.length === 0) {
        return true; // IP verification disabled
    }

    // This is a simplified check - in production, you'd need a backend service
    // to get the actual IP address securely (browsers cannot directly access client IP for privacy)
    console.log('IP Verification would be performed by backend service in production');
    return true;
}

// Verify Daily PIN
function verifyDailyPIN(enteredPIN) {
    const correctPIN = typeof generateDailyPIN !== 'undefined' ? generateDailyPIN() : null;
    
    if (!correctPIN) {
        return false;
    }

    return parseInt(enteredPIN) === correctPIN;
}

// Check if admin role
function isAdmin(user) {
    return user && user.role === 'admin';
}

// Check permission
function hasPermission(user, permission) {
    if (!user || !user.role) return false;
    
    const permissions = typeof ROLE_PERMISSIONS !== 'undefined' ? ROLE_PERMISSIONS[user.role] : {};
    return permissions[permission] === true;
}

// Check if user is logged in
window.addEventListener('load', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const currentUserStr = localStorage.getItem('currentUser');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

    // Protected pages check
    if ((currentPage === 'dashboard.html' || currentPage === 'admin.html') && !currentUser) {
        window.location.href = 'index.html';
    }

    // Check role-based access
    if (currentPage === 'admin.html' && currentUser && currentUser.role !== 'admin') {
        window.location.href = 'dashboard.html';
    }

    if ((currentPage === 'index.html' || currentPage === '') && currentUser) {
        // Redirect to appropriate page based on role
        if (currentUser.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    }

    // Check for auto-absent (12:00)
    checkAndMarkAutoAbsent();
});

// Auto-absent logic
function checkAndMarkAutoAbsent() {
    const now = new Date();
    const hour = now.getHours();
    const today = now.toISOString().split('T')[0];

    // Only run this check at 12:00 and beyond
    if (hour >= 12) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const attendance = JSON.parse(localStorage.getItem('attendance')) || {};

        users.forEach(user => {
            if (!attendance[user.id]) {
                attendance[user.id] = [];
            }

            const todayRecord = attendance[user.id].find(a => a.date === today);

            // If no record exists at 12:00, mark as absent
            if (!todayRecord) {
                attendance[user.id].push({
                    date: today,
                    status: 'absent',
                    loginTime: null,
                    markedAt: new Date().toISOString(),
                    autoMarked: true
                });
            }
        });

        localStorage.setItem('attendance', JSON.stringify(attendance));
    }
}

// Log user info when page loads
console.log('Auth System Initialized');
