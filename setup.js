// Admin Setup - First Time Setup
// Diese Datei ermöglicht die Erstellung des ersten Admin-Kontos

// SETUP SICHERHEIT - Geheimer Code
// Ändert diesen Code in der Production!
const SETUP_SECRET_CODE = "LUTZ_2026_GRUB_SETUP";

// Simple hash function (same as in auth.js)
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}

// Handle Setup
function handleSetup(event) {
    event.preventDefault();

    const secretCode = document.getElementById('secretCode').value;
    const adminUsername = document.getElementById('adminUsername').value.trim();
    const adminPassword = document.getElementById('adminPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');

    errorDiv.textContent = '';
    successDiv.textContent = '';

    // Validate secret code
    if (secretCode !== SETUP_SECRET_CODE) {
        errorDiv.textContent = 'FEHLER: Geheimer Code ist falsch.';
        return;
    }

    // Validate username
    if (adminUsername.length < 3) {
        errorDiv.textContent = 'FEHLER: Benutzername muss mindestens 3 Zeichen lang sein.';
        return;
    }

    // Validate password
    if (adminPassword.length < 6) {
        errorDiv.textContent = 'FEHLER: Passwort muss mindestens 6 Zeichen lang sein.';
        return;
    }

    // Validate password match
    if (adminPassword !== confirmPassword) {
        errorDiv.textContent = 'FEHLER: Passwörter stimmen nicht überein.';
        return;
    }

    // Check if admin already exists
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.find(u => u.username === adminUsername)) {
        errorDiv.textContent = 'FEHLER: Benutzername existiert bereits.';
        return;
    }

    // Check if any admin already exists
    const adminExists = users.find(u => u.role === 'admin');
    if (adminExists) {
        errorDiv.textContent = 'FEHLER: Ein Admin-Konto existiert bereits! Verwende das Admin-Panel um weitere Admins hinzuzufügen.';
        return;
    }

    // Create admin user
    const hashedPassword = simpleHash(adminPassword);
    const newAdmin = {
        id: Date.now(),
        username: adminUsername,
        password: hashedPassword,
        role: 'admin', // Admin Role
        createdAt: new Date().toISOString(),
        lastLogin: null,
        loginCount: 0
    };

    users.push(newAdmin);
    localStorage.setItem('users', JSON.stringify(users));

    // Initialize empty attendance data
    const attendance = JSON.parse(localStorage.getItem('attendance')) || {};
    if (!attendance[newAdmin.id]) {
        attendance[newAdmin.id] = [];
    }
    localStorage.setItem('attendance', JSON.stringify(attendance));

    // Success message
    successDiv.innerHTML = `
        <strong>ERFOLG: Admin-Konto erfolgreich erstellt!</strong><br>
        Benutzername: <strong>${adminUsername}</strong><br>
        <br>
        <a href="index.html" style="color: #28a745; text-decoration: none; font-weight: bold;">Zur Anmeldung →</a>
    `;

    // Reset form
    document.getElementById('setupForm').reset();

    // Auto-redirect nach 2 Sekunden
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);
}

// Security Check - Prevent setup if admin already exists
window.addEventListener('load', () => {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const adminExists = users.find(u => u.role === 'admin');

    if (adminExists) {
        const setupBox = document.querySelector('.setup-box');
        setupBox.innerHTML = `
            <h1>Setup Nicht Zulassig</h1>
            <p style="text-align: center; color: #999; margin-bottom: 30px;">Ein Admin-Konto existiert bereits.</p>
            <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 6px; color: #155724; margin-bottom: 20px;">
                <strong>Information:</strong><br>
                Die Setup-Seite kann nur verwendet werden, um das erste Admin-Konto zu erstellen. 
                Um weitere Administratoren hinzuzufügen, verwenden Sie das Admin-Panel.
            </div>
            <a href="index.html" style="display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; text-align: center;">Zur Anmeldung</a>
        `;
    }
});

console.log('Setup Assistant Initialized - First Admin Setup Ready');
