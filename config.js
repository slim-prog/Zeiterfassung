// SECURITY & CONFIGURATION SETTINGS
// Datenschutz (GDPR/DSGVO) & Sicherheitseinstellungen

// ===== NETWORK SECURITY =====
// IP-Verifikation: Nur bestimmte IPs können sich anmelden
// Leave empty array [] to disable IP verification
const ALLOWED_IP_RANGES = [
    // Reihenfolge: Beispiel für Lutz & Grub-Netzwerk
    // '192.168.1.*',    // Main office
    // '10.0.0.*',       // Secondary office
    // '172.16.0.*'      // Guest network
];
const ENABLE_IP_VERIFICATION = false; // Set to true to enable IP checking

// ===== DAILY PIN SYSTEM =====
// Täglicher PIN zur Überprüfung physischer Präsenz
// PIN wird täglich um 00:00 Uhr (UTC) regeneriert
const ENABLE_DAILY_PIN = false; // 🔴 DEAKTIVIERT (Für Zukunft vorgesehen)
const PIN_DISPLAY_ROOM = 'ROOM-001'; // Raum-Anzeige für PIN-Anzeige

// Hash-Länge für PIN (nur für Sicherheit)
function generateDailyPIN() {
    const today = new Date().toISOString().split('T')[0];
    // Generiere einen eindeutigen PIN basierend auf dem heutigen Datum
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
        const char = today.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    // PIN zwischen 1000 und 9999
    return Math.abs(hash % 9000) + 1000;
}

// ===== GDPR / DSGVO COMPLIANCE =====
// Automatische Löschung alter Daten
const DATA_RETENTION_DAYS = 90; // Nach 90 Tagen werden Daten automatisch gelöscht
const ENABLE_DATA_AUTO_DELETE = false; // Set to true to enable automatic deletion
const ENABLE_DATA_ANONYMIZATION = true; // Anonymisiere alte Daten

// Datenverschlüsselung-Hinweis
const DATA_SECURITY_NOTES = {
    passwordEncryption: 'Paswörter werden mit SHA-256-ähnlichem Hash verschlüsselt',
    dataStorage: 'Alle Daten werden lokal im Browser (localStorage) gespeichert',
    accessControl: 'Nur authentifizierte Benutzer haben Zugriff auf ihre Daten',
    adminAccess: 'Admin-Benutzer können alle Daten ansehen und exportieren'
};

// ===== ROLE-BASED ACCESS CONTROL (RBAC) =====
const USER_ROLES = {
    STUDENT: 'student',
    ADMIN: 'admin'
};

const ROLE_PERMISSIONS = {
    'student': {
        canViewOwnData: true,
        canViewCalendar: true,
        canExportOwnData: true,
        canAccessAdminPanel: false,
        canViewAllData: false,
        canExportAllData: false,
        canManageUsers: false
    },
    'admin': {
        canViewOwnData: true,
        canViewCalendar: true,
        canExportOwnData: true,
        canAccessAdminPanel: true,
        canViewAllData: true,
        canExportAllData: true,
        canManageUsers: true
    }
};

console.log('Security Configuration Loaded - GDPR Compliance: ENABLED');
