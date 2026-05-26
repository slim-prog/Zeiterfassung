# Zeiterfassung

Webanwendung zur Erfassung der **Schulanwesenheit** mit HTML, CSS und JavaScript im Frontend sowie einem Python-Backend mit FastAPI und SQLite. Die Anwendung unterstützt Registrierung, Login, Anwesenheitsmarkierung, Dashboard-Auswertung und eine automatische Abwesenheitsmarkierung für nicht erfasste Schüler.

## Projektstatus

Das Projekt befindet sich aktuell in einer **Übergangsphase von einer rein clientseitigen Lösung zu einer Client-Server-Architektur**. Im Repository sind weiterhin klassische Frontend-Dateien vorhanden, zusätzlich wurde zuletzt ein Python-Backend unter `backend/main.py` eingeführt. Die aktuelle Struktur zeigt damit klar, dass das Projekt aktiv weiterentwickelt wird und sich funktional zwischen lokalem Browserbetrieb und API-basierter Nutzung bewegt.

## Funktionen

- Benutzerregistrierung
- Benutzerlogin mit Passwortprüfung
- JWT-basierte Authentifizierung im Backend
- Erfassung der täglichen Anwesenheit beim Login
- Dashboard mit Tagesstatus und Verlauf
- Admin-Bereich
- Setup-Seite für Erstkonfiguration
- Automatische Abwesenheitsmarkierung per Scheduler
- Speicherung der Daten in SQLite im Backend
- Responsives Web-Frontend mit mehreren HTML-Oberflächen[ cite:1]

## Projektstruktur

```text
Zeiterfassung/
├── README.md
├── SECURITY_DOCUMENTATION.md
├── START.html
├── index.html
├── dashboard.html
├── admin.html
├── setup.html
├── styles.css
├── config.js
├── auth.js
├── app.js
├── admin.js
├── setup.js
└── backend/
    ├── main.py
    └── requirements.txt
```

Die im Repository sichtbare Struktur umfasst Frontend-Dateien für Start, Login, Dashboard, Administration und Setup sowie einen `backend`-Ordner mit FastAPI-Anwendung und Abhängigkeiten. Im letzten Commit wurde insbesondere `backend/main.py` neu hinzugefügt und zentrale JavaScript-Dateien wurden umfangreich überarbeitet.

## Technologie-Stack

### Frontend

- HTML5
- CSS3
- JavaScript

### Backend

- Python
- FastAPI
- SQLite
- Passlib mit bcrypt
- PyJWT bzw. JWT-Verarbeitung
- APScheduler[ cite:6]

## Backend-Funktionen

Das Backend definiert in `backend/main.py` eine FastAPI-Anwendung mit den zentralen Endpunkten `/register`, `/login`, `/dashboard` und `/checkout`. Zusätzlich werden Benutzer- und Anwesenheitsdaten in SQLite-Tabellen gespeichert, Passwörter mit bcrypt gehasht und Zugriffe auf geschützte Routen per Bearer-Token überprüft.

Die automatische Abwesenheitsmarkierung wird durch einen `BackgroundScheduler` realisiert, der täglich um 12:00 Uhr einen Job ausführt. Dieser Job prüft alle Benutzer mit der Rolle `student` und legt für fehlende Tagesdatensätze automatisch einen Abwesenheitseintrag an.

## Aktuelle Architektur

Die aktuelle Codebasis zeigt zwei Entwicklungsrichtungen gleichzeitig:

1. Eine bestehende browserbasierte Frontend-Struktur mit mehreren Seiten und JavaScript-Modulen.
2. Ein neues API-basiertes Backend mit Datenbank, Passwort-Hashing und Token-Authentifizierung.

Daraus folgt: Das Projekt sollte im README nicht mehr als reine `localStorage`-Anwendung beschrieben werden. Diese Beschreibung ist veraltet und stimmt nicht mehr mit dem zuletzt eingecheckten Backend überein.

## Installation

### Voraussetzungen

- Python 3.10 oder neuer
- Ein Browser für das Frontend
- Pip zum Installieren der Python-Abhängigkeiten

### Backend starten

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Danach ist die API standardmäßig lokal verfügbar unter:

```text
http://127.0.0.1:8000
```

### Frontend starten

Das Frontend kann über die vorhandenen HTML-Dateien geöffnet oder besser über einen lokalen Webserver bereitgestellt werden, damit API-Aufrufe sauber funktionieren. Als Einstiegspunkte dienen insbesondere `START.html`, `index.html` und `dashboard.html`.

## API-Übersicht

| Methode | Route | Beschreibung |
|---|---|---|
| POST | `/register` | Registriert einen neuen Benutzer. |
| POST | `/login` | Authentifiziert einen Benutzer und liefert ein JWT zurück. |
| GET | `/dashboard` | Liefert den Tagesstatus und die Anwesenheitshistorie des eingeloggten Benutzers. |
| POST | `/checkout` | Trägt die Ausstempelzeit für den aktuellen Tag ein. |

## Sicherheit

Die Anwendung verwendet Passwort-Hashing über `passlib` mit `bcrypt` sowie JWT für geschützte API-Zugriffe. Gleichzeitig enthält der aktuelle Backend-Code noch einen fest im Quelltext hinterlegten Platzhalter für den geheimen Schlüssel (`SECRET_KEY = "DEIN_SICHERER_SCHLUESSEL"`) und erlaubt CORS für alle Ursprünge (`allow_origins=["*"]`), weshalb die Sicherheitskonfiguration noch nicht produktionsreif ist.

Zusätzlich existiert im Repository eine separate Sicherheitsdokumentation unter `SECURITY_DOCUMENTATION.md`, was zeigt, dass Sicherheit bereits als eigener Arbeitsbereich behandelt wird.

## Bekannte Punkte zur Überarbeitung

- README war bisher in Teilen auf die frühere `localStorage`-Architektur ausgerichtet und muss an das neue Backend angepasst werden.
- Commit-Nachrichten sind derzeit nicht aussagekräftig genug für professionelle Nachvollziehbarkeit.
- Die Architektur sollte im nächsten Schritt klar vereinheitlicht werden, damit Frontend und Backend dokumentativ konsistent sind.
- Die Startanleitung sollte exakt an die tatsächlich vorhandenen Backend-Abhängigkeiten angepasst bleiben.

## Roadmap

Sinnvolle nächste Entwicklungsschritte auf Basis des aktuellen Zustands:

- Frontend vollständig an die neue API anbinden
- Rollen- und Rechtekonzept für Admin und Schüler weiter ausbauen
- Sichere Konfigurationswerte per Umgebungsvariablen auslagern
- CORS restriktiv konfigurieren
- Tests für Authentifizierung und Anwesenheitslogik ergänzen
- Deployment-Dokumentation ergänzen
- Datenmodell und Fehlerbehandlung erweitern

## Lizenz
