import sqlite3
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from apscheduler.schedulers.background import BackgroundScheduler
import jwt
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel

SECRET_KEY = "DEIN_SICHERER_SCHLUESSEL"
ALGORITHM = "HS256"
DB_NAME = "zeiterfassung.db"

app = FastAPI()

# CORS aktivieren, damit dein lokales HTML (Frontend) API-Anfragen senden kann
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# A: Datenbank-Initialisierung (SQLite)
def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        username TEXT UNIQUE NOT NULL,
                        password_hash TEXT NOT NULL,
                        role TEXT NOT NULL DEFAULT 'student')''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS attendance (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        date TEXT NOT NULL,
                        login_time TEXT,
                        logout_time TEXT,
                        status TEXT NOT NULL,
                        FOREIGN KEY (user_id) REFERENCES users (id),
                        UNIQUE(user_id, date))''')
    conn.commit()
    conn.close()

init_db()

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

# C: Cronjob - Auto-Absent um 12:00 Uhr
def mark_absent_task():
    conn = get_db()
    cursor = conn.cursor()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    cursor.execute("SELECT id FROM users WHERE role = 'student'")
    students = cursor.fetchall()
    
    for student in students:
        cursor.execute("SELECT id FROM attendance WHERE user_id = ? AND date = ?", (student['id'], today))
        if not cursor.fetchone():
            cursor.execute("INSERT INTO attendance (user_id, date, status) VALUES (?, ?, ?)", (student['id'], today, 'Abwesend'))
    conn.commit()
    conn.close()

scheduler = BackgroundScheduler()
scheduler.add_job(mark_absent_task, 'cron', hour=12, minute=0)
scheduler.start()

class UserAuth(BaseModel):
    username: str
    password: str

# B: Sicherheit - JWT Verifizierung
def verify_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Fehlendes Token")
    token = authorization.split(" ")[1]
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except:
        raise HTTPException(status_code=401, detail="Ungültiges oder abgelaufenes Token")

@app.post("/register")
def register(user: UserAuth):
    conn = get_db()
    cursor = conn.cursor()
    try:
        hashed_pwd = pwd_context.hash(user.password)
        cursor.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'student')", (user.username, hashed_pwd))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Benutzername existiert bereits")
    conn.close()
    return {"message": "Registrierung erfolgreich"}

@app.post("/login")
def login(user: UserAuth):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (user.username,))
    db_user = cursor.fetchone()
    
    if not db_user or not pwd_context.verify(user.password, db_user['password_hash']):
        conn.close()
        raise HTTPException(status_code=401, detail="Falsche Anmeldedaten")
    
    token = jwt.encode({
        "sub": str(db_user['id']),
        "username": db_user['username'],
        "role": db_user['role'],
        "exp": datetime.now(timezone.utc) + timedelta(hours=8)
    }, SECRET_KEY, algorithm=ALGORITHM)
    
    # Anwesenheit für heute setzen
    if db_user['role'] == 'student':
        today = datetime.now().strftime("%Y-%m-%d")
        now_time = datetime.now().strftime("%H:%M:%S")
        cursor.execute("SELECT id FROM attendance WHERE user_id = ? AND date = ?", (db_user['id'], today))
        if not cursor.fetchone():
            status = 'present' if now_time < '08:00:00' else 'Verspätet'
            cursor.execute("INSERT INTO attendance (user_id, date, login_time, status) VALUES (?, ?, ?, ?)", (db_user['id'], today, now_time, status))
            conn.commit()
            
    conn.close()
    return {"token": token, "role": db_user['role'], "username": db_user['username']}

@app.get("/dashboard")
def get_dashboard(user = Depends(verify_token)):
    conn = get_db()
    cursor = conn.cursor()
    today = datetime.now().strftime("%Y-%m-%d")
    cursor.execute("SELECT * FROM attendance WHERE user_id = ? ORDER BY date DESC", (user['sub'],))
    records = [dict(r) for r in cursor.fetchall()]
    today_record = next((r for r in records if r['date'] == today), None)
    conn.close()
    return {"today_record": today_record, "history": records}

@app.post("/checkout")
def checkout(user = Depends(verify_token)):
    conn = get_db()
    cursor = conn.cursor()
    today = datetime.now().strftime("%Y-%m-%d")
    now_time = datetime.now().strftime("%H:%M:%S")
    
    cursor.execute("SELECT id, logout_time FROM attendance WHERE user_id = ? AND date = ?", (user['sub'], today))
    record = cursor.fetchone()
    
    if not record or record['logout_time']:
        conn.close()
        raise HTTPException(status_code=400, detail="Kein Eintrag gefunden oder bereits ausgestempelt")
        
    cursor.execute("UPDATE attendance SET logout_time = ? WHERE id = ?", (now_time, record['id']))
    conn.commit()
    conn.close()
    return {"message": "Ausgestempelt"}