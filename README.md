# Zeiterfassung – Schulanwesenheit Tracking

## Beschreibung

Webanwendung zur Erfassung der Anwesenheit in der Schule. Benutzer können sich einloggen, um ihre Anwesenheit zu markieren; wenn sie sich bis 12:00 Uhr nicht anmelden, markiert das System sie automatisch als abwesend.

## Funktionen

- Mehrbenutzer‑Authentifizierung: Jeder Benutzer hat ein eigenes Konto mit Benutzername und Passwort.
- Automatische Anwesenheitsmarkierung: Beim Login wird die Anwesenheit automatisch mit Uhrzeit erfasst.
- Auto‑Absent: Um 12:00 Uhr werden nicht eingeloggte Benutzer automatisch als abwesend markiert.
- Vollständiges Dashboard:
  - Heutiger Status (anwesend / abwesend)
  - Monatskalender mit Farbkennzeichnung (grün = anwesend, rot = abwesend)
  - Allgemeine Statistiken (Anwesenheitstage, Abwesenheitstage, Prozentwerte)
  - Detaillierter Anwesenheitsverlauf
- Export/Import: Sichern und Wiederherstellen der Daten im JSON‑Format.
- Responsives Design: Funktioniert auf Desktop, Tablet und Smartphone.

## Installation und Nutzung

### Schritt 1: Anwendung öffnen

1. Lade den Ordner `Zeiterfassung` herunter.
2. Öffne die Datei `index.html` in deinem Browser (Doppelklick auf die Datei).

### Schritt 2: Konto erstellen

1. Klicke auf „Registrieren“.
2. Gib einen Benutzernamen und ein Passwort ein (Passwort mindestens 6 Zeichen).
3. Klicke auf „Konto erstellen“.

### Schritt 3: Anmelden

1. Gib deinen Benutzernamen und dein Passwort ein.
2. Klicke auf „Anmelden“.
3. Beim Login wird die Anwesenheit automatisch für den aktuellen Tag markiert.

### Schritt 4: Dashboard ansehen

Nach dem Login siehst du:

- Heutigen Status: Ob du anwesend oder abwesend bist.
- Kalender: Grafische Übersicht der Anwesenheits‑/Abwesenheitstage.
- Statistiken: Anzahl Anwesenheitstage, Abwesenheitstage und prozentuale Verteilung.
- Verlauf: Tabelle mit Details zu jedem einzelnen Tag.

## Wie funktioniert Auto‑Absent?

- Vor 12:00 Uhr: Wenn du dich einloggst, wirst du als „anwesend“ markiert.
- Um 12:00 Uhr und danach: Wenn du dich nicht eingeloggt hast, wirst du automatisch als „abwesend“ markiert.
- Um 12:00 Uhr und danach: Wenn du dich einloggst, wirst du als „anwesend“ mit genauer Uhrzeit markiert.

## Backup und Datenexport

### Export (Sichern)

1. Öffne im Dashboard den Bereich „Datensicherung“.
2. Klicke auf „Daten exportieren (JSON)“.
3. Eine JSON‑Datei mit deinen Daten wird heruntergeladen.

### Import (Wiederherstellen)

1. Klicke auf „Daten importieren (JSON)“.
2. Wähle eine zuvor exportierte JSON‑Datei aus.
3. Die Daten werden wiederhergestellt.

## Ordnerstruktur

```text
Zeiterfassung/
├── index.html          # Login-Seite
├── dashboard.html      # Hauptseite mit Statistiken
├── styles.css          # CSS-Stile
├── auth.js             # Logik für Authentifizierung
├── app.js              # Logik für das Dashboard
└── README.md           # Diese Datei
```

## Wo werden die Daten gespeichert?

Die Daten werden im **localStorage** des Browsers gespeichert:

- Benutzer und Passwörter: `localStorage.users`
- Anwesenheit: `localStorage.attendance`
- Eingeloggter Benutzer: `localStorage.currentUser`

Wichtig: Wenn du den Browserverlauf löschst, gehen die Daten verloren. Erstelle regelmäßig Backups.

## Sicherheit

Hinweis zur Sicherheit:

- Passwörter werden mit einem einfachen Hash‑Algorithmus gespeichert (nicht für den Produktionseinsatz geeignet).
- Für persönlichen oder schulischen Gebrauch ist dies ausreichend.
- Für ernsthaften produktiven Einsatz sollte eine Datenbank mit sicherer Authentifizierung (z.B. SSL, stärkeres Hashing, Server‑Backend) verwendet werden.

## Troubleshooting

### Problem: Ich kann mich nicht einloggen

Mögliche Ursache: Einige Browser sind bei lokal geöffneten Dateien streng im Umgang mit `localStorage`.

Lösungen:

- Chrome / Edge: Anwendung über einen lokalen Webserver ausführen.
- Firefox: Kann in vielen Fällen auch direkt über die Datei funktionieren.

### Problem: Mehrere Personen im Netzwerk sollen die Anwendung nutzen

Lösung: Die Anwendung auf einen Webserver (Apache, Nginx usw.) verschieben oder Plattformen wie Replit verwenden.

### Problem: Meine Daten sind verschwunden

Lösung: Erstelle regelmäßig ein Backup. Verwende dazu den Button „Daten exportieren“.

## Roadmap (geplante Funktionen)

- Synchronisation der Daten in der Cloud.
- Benachrichtigungen um 11:55 Uhr vor Auto‑Absent.
- PDF‑Berichte.
- Design‑Themen (z.B. Hell/Dunkel‑Modus).
- Mehrsprachige Unterstützung.

## Support

Wenn du Probleme hast:

1. Prüfe Fehlermeldungen in der Browser‑Konsole (F12 → „Console“).
2. Stelle sicher, dass `localStorage` im Browser nicht deaktiviert ist.
3. Probiere einen anderen Browser aus.

---

**Erstellt:** 2026‑03‑17  
**Lizenz:** MIT (freie Nutzung)  
**Entwickelt für:** School Attendance Tracking
