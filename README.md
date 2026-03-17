# Zeiterfassung - Schulanwesenheit Tracking

## Descriere
Aplicație web pentru înregistrarea prezenței la școală. Utilizatorii se pot loga pentru a marca prezența, iar dacă nu se logheaza până la 12:00, sistemul marchează automat absența.

## Caracteristici

- ✅ **Autentificare Multi-User**: Fiecare utilizator are propriul cont cu username și parolă
- ✅ **Marcarea Prezență**: La login, prezența este marcată automat cu ora
- ✅ **Auto-Absent**: La 12:00, utilizatorii nelogați sunt marcați automat ca absenti
- ✅ **Dashboard Complet**:
  - Status de astazi (Prezent / Absent)
  - Calendar lunar cu codare culori (verde = prezent, roșu = absent)
  - Statistici generale (zile prezente, zile absente, procent)
  - Istoric detaliat al prezenței
- ✅ **Export/Import**: Salvare și restaurare de backup a datelor în format JSON
- ✅ **Responsiv**: Funcționează pe desktop, tabletă și telefon

## Instalare și Utilizare

### Pasul 1: Deschide aplicația
1. Descarcă folderul `Zeiterfassung`
2. Deschide fișierul `index.html` în browserul tău (dublu-click pe fișier)

### Pasul 2: Creează un cont
1. Click pe "Registrieren" (Înregistrare)
2. Introdu un username și parolă (minimum 6 caractere pentru parolă)
3. Click "Konto erstellen"

### Pasul 3: Logheaza-te
1. Introdu username-ul și parola
2. Click "Anmelden"
3. La login, prezența va fi marcată automat pentru ziua curentă

### Pasul 4: Vizualizează Dashboard
După login, vei vedea:
- **Status Astazi**: Dacă ești anwesend (prezent) sau abwesen (absent)
- **Calendar**: Vizualizare grafică a zilelor cu prezență/absență
- **Statistici**: Număr de zile prezent, absent și procent
- **Istoric**: Tabel cu detalii despre fiecare zi

## Cum funcționează Auto-Absent?

- **Înainte de 12:00**: Dacă te loghezi, ești marcat ca "Prezent"
- **La 12:00 și după**: Dacă nu te-ai logat, ești marcat automat ca "Absent"
- **La 12:00 și după**: Dacă te loghezi, ești marcat ca "Prezent" cu ora exactă

## Backup și Export de Date

### Export (Salvare):
1. Mergi la secțiunea "Datensicherung" (Datensicherung)
2. Click "Daten exportieren (JSON)"
3. Un fișier JSON va fi descărcat cu datele tale

### Import (Restaurare):
1. Click "Daten importieren (JSON)"
2. Selectează un fișier JSON exportat anterior
3. Datele vor fi restaurate

## Structura Folderelor

```
Zeiterfassung/
├── index.html          # Pagina de login
├── dashboard.html      # Pagina principală cu statistici
├── styles.css          # Stiluri CSS
├── auth.js             # Logica de autentificare
├── app.js              # Logica de dashboard
└── README.md           # Acest fișier
```

## Datele sunt Salvate Unde?

Datele sunt stocate în **localStorage** al browserului:
- Utilizatorii și parolele: `localStorage.users`
- Prezența: `localStorage.attendance`
- Utilizator logat: `localStorage.currentUser`

**IMPORTANT**: Dacă ștergi istoricul browserului, vei pierde datele. Face regulat backup!

## Securitate

⚠️ **Notă de Siguranță**:
- Parolele sunt hashed cu un algoritm simplu (nu pentru producție)
- Pentru uz personal/educativ este OK
- Pentru uz serios, folosește o bază de date cu autentificare SSL

## Troubleshooting

### Problema: Nu mă pot loga
**Soluție**: Unele browsere sunt strict cu localStorage din fișiere locale. Încearcă:
- Chrome / Edge: Trebuie să rulezi într-un server local
- Firefox: Ar putea funcționa din fișier

### Problema: Vreau să suportă mai mulți oameni pe rețea
**Soluție**: Mută aplicația pe un server web (Apache, Nginx, etc.) sau folosește Replit.com

### Problema: Au dispărut datele mele
**Soluție**: Exportează regular backup! Folosește butonul "Daten exportieren"

## Roadmap (Funcții viitoare)

- [ ] Sincronizare datelor pe cloud
- [ ] Notificări la 11:55 înainte de auto-absent
- [ ] Rapoarte PDF
- [ ] Teme (light/dark mode)
- [ ] Multi-language support

## Support

Dacă ai probleme:
1. Verifică adroni din browser console (F12 → Console)
2. Asigură-te că localStorage nu este dezactivat
3. Încearcă alt browser

---

**Created**: 2026-03-17
**License**: MIT (liber de utilizat)
**Developed for**: School Attendance Tracking
