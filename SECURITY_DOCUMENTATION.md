# Zeiterfassung – Sicherheits- und DSGVO‑Dokumentation

## Inhaltsverzeichnis

1. [Sicherheitsübersicht](#sicherheitsübersicht)
2. [Initiales Setup – Erster Admin](#initiales-setup-erster-admin)
3. [Kritischer Fix – Admin‑Verwundbarkeit](#kritischer-fix-admin-verwundbarkeit)
4. [IP‑Verifikation](#ip-verifikation)
5. [Tägliches PIN‑System](#taegliches-pin-system)
6. [DSGVO‑Konformität](#dsgvo-konformitaet)
7. [Rollenbasierte Zugriffskontrolle](#rollenbasierte-zugriffskontrolle)
8. [Export und Backup](#export-und-backup)

---

## Initiales Setup – Erster Admin

### Versteckte Setup‑Seite

Aus Sicherheitsgründen wird der erste Admin über eine versteckte Setup‑Seite mit einem geheimen Code angelegt.

#### Zugriff auf das Setup

1. Öffne `index.html`.
2. Scrolle bis zum Footer der Seite.
3. Dort befindet sich ein kleiner, grauer Link „Setup“.
4. Klicke darauf – es öffnet sich `setup.html`.

#### Setup‑Formular ausfüllen

1. Geheimer Code: `LUTZ_2026_GRUB_SETUP`  
   (in produktiven Umgebungen ändern)
2. Admin‑Benutzername: frei wählbar (z.B. `admin`, `glander`, `pmo`).
3. Admin‑Passwort: starkes Passwort (mindestens 6 Zeichen).
4. Passwort bestätigen: Passwort wiederholen.
5. Auf „Admin Konto erstellen“ klicken.

#### Ergebnis

- Admin‑Konto wird erstellt.
- Automatische Weiterleitung zur Login‑Seite.
- Die Setup‑Funktion kann nur einmal verwendet werden.

#### Sicherheit des Setups

- Weitere Zugriffe zeigen die Meldung: „Admin‑Konto existiert bereits“.
- Der geheime Code ist zwingend erforderlich.
- Nur Personen mit Kenntnis des Codes können einen Admin anlegen.

### Änderung des geheimen Codes (Produktion)

Wichtig: Nach dem ersten Setup sollte der Code geändert werden.

**Datei: `setup.js` (Zeile 4)**

```javascript
// Vorher:
const SETUP_SECRET_CODE = "LUTZ_2026_GRUB_SETUP";

// Nachher (Beispiel für Produktion):
const SETUP_SECRET_CODE = "SchuleLutzGrub2026Secret#AdminSetup!";
```

Anschließend:

1. Datei speichern.
2. Das Setup funktioniert ab dann nur noch mit dem neuen Code.

---

## Sicherheitsübersicht

Aktueller Status:

- Passwort‑Hashing: Speicherung als Hash (SHA‑256‑ähnliches Verfahren).
- Rollenbasierte Zugriffskontrolle: Trennung zwischen Admin und Student.
- Täglicher PIN‑Mechanismus (für zukünftige Erweiterung vorgesehen).
- IP‑Verifikation: Optionale Einschränkung auf das Schulnetz.
- DSGVO‑Konformität: automatische Löschung alter Daten.
- Admin‑Export: CSV/JSON‑Export für Berichte.
- Sicherheitsfix: Admin‑Erstellung nur noch über bestehende Admins (keine Selbst‑Erhebung über Registrierung).

---

## Kritischer Fix – Admin‑Verwundbarkeit

### Ursprüngliches Problem

Verletzliches Szenario (früherer Stand):

1. Jeder Student konnte die Registrierungsseite aufrufen.
2. Beim Registrieren gab es ein Dropdown mit den Rollen „Student“ und „Admin“.
3. Ein böswilliger Student konnte „Admin“ auswählen.
4. Er erhielt so volle Administratorrechte ohne Berechtigung.

### Umgesetzte Lösung

Neuer, sicherer Ablauf:

#### Öffentliche Registrierung (nur STUDENT)

- Nutzer ruft die Seite auf.
- Klick auf „Registrieren“.
- Eingabe von Benutzername und Passwort.
- Es gibt kein Rollen‑Dropdown mehr.
- Die Rolle wird intern immer auf „student“ gesetzt.
- Nach der Registrierung loggt sich der Student normal ein.

#### Beförderung zum Admin (nur durch Admin)

- Ein bestehender Admin loggt sich ein.
- Im Admin‑Panel öffnet er den Bereich „Benutzerverwaltung“.
- Dort sieht er eine Tabelle mit allen Benutzern.
- Er wählt den Student aus, der Admin werden soll.
- Klick auf „Zu Admin“.
- Eine Sicherheitsabfrage bestätigt die Aktion.
- Erst nach Bestätigung wird der Student zum Admin hochgestuft.
- Der neue Admin erhält Zugriff auf das Admin‑Panel.

### Zusätzliche Schutzmechanismen

- Der letzte verbleibende Admin kann nicht degradiert werden.
- Jede Beförderung/Demotierung erfordert eine Bestätigungsabfrage.
- Nur Admins dürfen Benutzerrollen ändern.
- Optional kann ein Zugriffsprotokoll implementiert werden.

---

## IP‑Verifikation

### Aktivierung

Um die Anmeldung auf das Schulnetz zu beschränken, kann eine IP‑Prüfung aktiviert werden.

**Datei: `config.js`**

```javascript
const ENABLE_IP_VERIFICATION = true; // auf true setzen
const ALLOWED_IP_RANGES = [
    "192.168.1.*",    // Hauptnetz Lutz & Grub
    "10.0.0.*",       // Sekundärnetz
    "172.16.0.*"      // Gastnetz
];
```

### Funktionsweise

1. Der Benutzer versucht sich einzuloggen.
2. Das System prüft die IP‑Adresse des Clients.
3. Liegt die IP nicht im erlaubten Bereich, wird der Login blockiert.
4. Hinweis: In einer produktiven Umgebung ist hierfür ein Backend‑Dienst erforderlich, da der Browser aus Datenschutzgründen nicht direkt auf die Client‑IP zugreifen kann.

### Optionale Backend‑Implementierung

```javascript
// Beispiel für eine IP‑Prüfung über ein Backend‑API
async function verifyIPAddress() {
    const response = await fetch("/api/verify-ip");
    const data = await response.json();
    return data.isAllowed;
}
```

---

## Tägliches PIN‑System

### Status: Deaktiviert (für zukünftige Erweiterung vorgesehen)

Grund für die Deaktivierung:

- Benötigte Hardware (Anzeige im Klassenraum) steht derzeit nicht zur Verfügung.
- Die Funktion wird implementiert, sobald das Gesamtsystem bereit ist.
- Aktuell wird der Zugriff nur innerhalb der Schule verwendet.

### Geplante Umsetzung

Sobald das System bereit ist:

1. In `config.js` wird `const ENABLE_DAILY_PIN = true` gesetzt.
2. Für jeden Tag wird ein eindeutiger PIN generiert.
3. Der PIN ändert sich um Mitternacht.
4. Beim Login muss der im Klassenraum angezeigte PIN eingegeben werden.
5. Der PIN wird deterministisch auf Basis des Datums erzeugt.

### Konfiguration (wenn Hardware vorhanden)

**Datei: `config.js`**

```javascript
const ENABLE_DAILY_PIN = true;        // täglicher PIN aktiv
const PIN_DISPLAY_ROOM = "ROOM-001";  // Kennung des Raums, in dem der PIN angezeigt wird
```

### Beispielhafte PIN‑Berechnung

```javascript
function generateDailyPIN() {
    const today = new Date().toISOString().split("T")[0];
    // Deterministischer Hash basierend auf dem Datum
    // Ergebnis: vierstellige Zahl im Bereich 1000–9999
    return Math.abs(hash % 9000) + 1000;
}
```

---

## DSGVO‑Konformität

### Datenschutz

#### 1. Passwort‑Verschlüsselung

- Passwörter werden bei der Registrierung mit SHA‑256 gehasht.
- Passwörter werden niemals im Klartext gespeichert.
- Passwörter können nicht zurückgerechnet werden (one‑way‑Hash).

#### 2. Speicherort der Daten

Alle Daten werden lokal im Browser des Benutzers gespeichert:

```text
localStorage:
├── users       (Konten + gehashte Passwörter)
├── attendance  (tägliche Anwesenheit)
└── currentUser (aktuell eingeloggter Benutzer)
```

Vorteile:

- Kein Transfer der Daten über das Internet.
- DSGVO‑konform, da die Daten im Einflussbereich der Schule bleiben.
- Volle Kontrolle über die Datenspeicherung.

Nachteile:

- Bei Löschung der Browserdaten gehen die Anwesenheitsdaten verloren.
- Pro Gerät ist die Nutzung praktikabel nur für eine Person.

#### 3. Automatische Löschung alter Daten

Aktivierung der automatischen Datenlöschung:

```javascript
const ENABLE_DATA_AUTO_DELETE = true;
const DATA_RETENTION_DAYS = 90; // Daten werden nach 90 Tagen gelöscht
```

Setze den Wert auf `false`, wenn Daten länger aufbewahrt werden sollen (ggf. datenschutzrechtlich prüfen).

#### 4. Anonymisierung von Daten

Beim Löschen alter Datensätze können Benutzerbezüge entfernt und nur statistische Informationen behalten werden.

Beispielhafte Anonymisierung:

```javascript
function anonymizeOldData() {
    const attendance = JSON.parse(localStorage.getItem("attendance")) || {};
    for (const userId in attendance) {
        let records = attendance[userId];
        // Es bleiben nur Datum und Status erhalten
        records = records.map(r => ({
            date: r.date,
            status: r.status
        }));
    }
}
```

#### 5. Rechte der Betroffenen (Art. 15–20 DSGVO)

Jeder Benutzer kann:

- Seine eigenen Daten im persönlichen Dashboard einsehen.
- Seine Daten im JSON‑Format exportieren.
- Über den Admin eine Berichtigung oder Löschung seiner Daten verlangen.
- Bei Bedarf die Datenportabilität in Anspruch nehmen (Export und Übergabe).

### Empfohlener Datenschutzhinweis

Beispieltext:

```text
ERKLÄRUNG ZUR VERARBEITUNG PERSONENBEZOGENER DATEN (DSGVO)

Verantwortlicher: Lutz & Grub Academy
Auftragsverarbeiter: Zeiterfassung-System

Verarbeitete personenbezogene Daten:
- Benutzername (pseudonymisiert)
- Passwort (gehasht mit SHA-256)
- Tägliche Anwesenheit (Datum und Status)

Zweck der Verarbeitung:
- Nachweis der Anwesenheit von Kursteilnehmern
- Erfüllung gesetzlicher und schulischer Vorgaben
- Erstellung von Anwesenheitsberichten

Speicherdauer:
- 90 Tage nach Erfassung
- Danach automatische Löschung

Ihre Rechte:
- Recht auf Auskunft
- Recht auf Berichtigung
- Recht auf Löschung
- Recht auf Datenübertragbarkeit

Kontakt: datenschutz@lutz-grub.de
```

---

## Rollenbasierte Zugriffskontrolle (RBAC)

### Verfügbare Rollen

#### 1. STUDENT

```javascript
"student": {
    canViewOwnData: true,
    canViewCalendar: true,
    canExportOwnData: true,
    canAccessAdminPanel: false,
    canViewAllData: false,
    canExportAllData: false,
    canManageUsers: false
}
```

#### 2. ADMIN

```javascript
"admin": {
    canViewOwnData: true,
    canViewCalendar: true,
    canExportOwnData: true,
    canAccessAdminPanel: true,
    canViewAllData: true,
    canExportAllData: true,
    canManageUsers: true
}
```

### Sichere Rollenzuweisung

Früheres Problem:

- Bei der Registrierung konnten Benutzer die Rolle „Admin“ wählen und so unberechtigt Administratorrechte erhalten.

Umgesetzte Lösung:

- Öffentliche Registrierung erstellt ausschließlich Konten mit der Rolle `student`.
- Nur bestehende Admins können einen Student im Admin‑Panel zum Admin befördern.

Sicherer Ablauf:

1. Neuer Benutzer registriert sich über den Button „Registrieren“.
2. Das Konto wird intern immer als STUDENT angelegt.
3. Ein Admin kann später im Admin‑Panel bei Bedarf auf „Zu Admin“ klicken und nach Bestätigung die Rolle anheben.

### Rollenverwaltung im Admin‑Panel

#### Beförderung Student → Admin

1. Login als Admin.
2. Wechsel in den Bereich „Benutzerverwaltung“.
3. Student in der Tabelle auswählen.
4. Button „Zu Admin“ anklicken.
5. Sicherheitsbestätigung akzeptieren.
6. Der Student wird Admin.

#### Degradierung Admin → Student

1. Nur möglich, wenn mindestens zwei Admins existieren.
2. Admin in der Tabelle auswählen.
3. Button „Zu Cursant“ anklicken.
4. Sicherheitsbestätigung akzeptieren.
5. Der Admin wird Student.

Schutz: Der letzte verbleibende Admin kann nicht degradiert werden.

---

## Sicherheitsfunktionen im Überblick

- Passwort‑Hashing.
- Lokale Datenspeicherung.
- Rollenbasierte Zugriffskontrolle.
- Optionales tägliches PIN‑System.
- Optionale IP‑Verifikation.
- Aufbewahrungsfristen und automatische Löschung.
- Exportfunktionen für Administratoren.
- Sichere Admin‑Erstellung nur über bestehende Admins.

---

## Export und Backup

### Admin‑Export – CSV

Ort: Admin‑Panel → „Datenexport“ → Auswahl „CSV“.

Beispielspalten:

```text
Benutzername, Rolle, Datum, Status, Uhrzeit
daniel, student, 17.03.2026, Präsent, 08:15
maria, student, 17.03.2026, Abwesend, -
```

Verwendung: Import in Excel oder Google Sheets zur Berichtserstellung.

### Admin‑Export – JSON

Ort: Admin‑Panel → „Datenexport“ → Auswahl „JSON“.

Beispielstruktur:

```json
{
  "exportDate": "2026-03-17T10:30:00Z",
  "exportRange": "all",
  "users": [
    {
      "id": 1234567890,
      "username": "daniel",
      "role": "student",
      "createdAt": "2026-01-15T..."
    }
  ],
  "attendance": {
    "1234567890": [
      {
        "date": "2026-03-17",
        "status": "present",
        "loginTime": "08:15"
      }
    ]
  }
}
```

### Tagesbericht (täglicher Report)

Ort: Admin‑Panel → „Tagesbericht exportieren“.

Beispielinhalt:

```text
Tagesbericht Zeiterfassung
Datum: 17.03.2026
==================================================

ANWESEND (23):
  daniel (08:15)
  maria (08:20)
  ...

ABWESEND (5):
  hans
  petra
  ...
```

---

## Implementierungshinweise

### 1. Initiales Setup – erster Admin

Szenario: Beim ersten Start der Anwendung existiert noch kein Admin‑Konto.

Lösung: Versteckte Setup‑Seite:

1. Website in Browser öffnen (`index.html`).
2. Zum Seitenende (Footer) scrollen.
3. Den dezenten „Setup“‑Link anklicken.
4. Die sichere Setup‑Seite `setup.html` wird geöffnet.
5. Geheimer Code und Admin‑Zugangsdaten eingeben.

### 2. Zentrale Konfiguration

```javascript
// config.js – zentrale Schalter:
const ENABLE_DAILY_PIN = false;        // derzeit deaktiviert
const ENABLE_IP_VERIFICATION = false;  // optional aktivierbar
const ENABLE_DATA_AUTO_DELETE = false; // optional aktivierbar
```

### 3. Geheimen Code in Produktion ändern

Wichtig: Nach dem ersten Setup muss der geheime Code angepasst werden.

**Datei: `setup.js`**

```javascript
// Zeile 4:
const SETUP_SECRET_CODE = "HIER_NEUEN_STARKEN_CODE_EINTRAGEN";
```

Beispiel:

```javascript
const SETUP_SECRET_CODE = "SchuleLutzGrubAdmin2026Secret#42!";
```

Anschließend Datei speichern und ggf. neu testen.

---

## Compliance‑Checkliste

- Passwort‑Hashing (SHA‑256 oder äquivalent).
- Lokale Datenspeicherung statt Cloud.
- Rollenbasierte Zugriffskontrolle.
- Optionales tägliches PIN‑System (geplant).
- Optionale IP‑Verifikation.
- Aufbewahrungs‑ und Löschkonzept.
- Möglichkeit zur Anonymisierung.
- Exportfunktionen für Admins.
- Benutzerverwaltung durch Admins.
- Dokumentierte Sicherheitsarchitektur.
- Sichere Admin‑Erstellung über bestehende Admins.

---

## Support und Kontakt

Bei Fragen oder Problemen:

- Datenschutz: datenschutz@dr.com  
- Entwicklung: Daniel Rogoz danielrogoz@dr.com

Dokumentversion: 1.0  
Datum: 17.03.2026  
Status: Produktionsbereit, DSGVO‑konform (im Rahmen der beschriebenen Annahmen).
