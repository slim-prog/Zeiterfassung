import sqlite3
from datetime import datetime, timedelta, timezone

import jwt
from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI, HTTPException, Depends, Header, status
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from pydantic import BaseModel, Field, constr

from settings import settings  # <-- nou

DB_NAME = settings.DB_NAME

app = FastAPI(title="Zeiterfassung API")

# CORS: nur erlaubte Origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# A: Datenbank-Initialisierung (SQLite)
def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'student'
        )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            login_time TEXT,
            logout_time TEXT,
            status TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id),
            UNIQUE(user_id, date)
        )
        """
    )
    conn.commit()
    conn.close()


init_db()


def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn


# C: Cronjob - Auto-Absent um 12:00 Uhr (Serverzeit)
def mark_absent_task():
    conn = get_db()
    cursor = conn.cursor()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    cursor.execute("SELECT id FROM users WHERE role = 'student'")
    students = cursor.fetchall()

    for student in students:
        cursor.execute(
            "SELECT id FROM attendance WHERE user_id = ? AND date = ?",
            (student["id"], today),
        )
        if not cursor.fetchone():
            cursor.execute(
                "INSERT INTO attendance (user_id, date, status) VALUES (?, ?, ?)",
                (student["id"], today, "Abwesend"),
            )
    conn.commit()
    conn.close()


scheduler = BackgroundScheduler()
scheduler.add_job(mark_absent_task, "cron", hour=12, minute=0)
scheduler.start()


# Modelle
class UserAuth(BaseModel):
    username: constr(strip_whitespace=True, min_length=3, max_length=50) = Field(
        ..., description="Benutzername"
    )
    password: constr(min_length=6, max_length=128) = Field(
        ..., description="Passwort"
    )


# B: Sicherheit - JWT Verifizierung
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        hours=settings.ACCESS_TOKEN_EXPIRE_HOURS
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def verify_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Fehlendes Token",
        )
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token abgelaufen",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungültiges Token",
        )


@app.post("/register")
def register(user: UserAuth):
    conn = get_db()
    cursor = conn.cursor()
    try:
        hashed_pwd = pwd_context.hash(user.password)
        cursor.execute(
            "INSERT INTO users (username, password_hash, role) "
            "VALUES (?, ?, 'student')",
            (user.username, hashed_pwd),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Benutzername existiert bereits",
        )
    conn.close()
    return {"message": "Registrierung erfolgreich"}


@app.post("/login")
def login(user: UserAuth):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (user.username,))
    db_user = cursor.fetchone()

    if not db_user or not pwd_context.verify(
        user.password, db_user["password_hash"]
    ):
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Falsche Anmeldedaten",
        )

    token = create_access_token(
        {
            "sub": str(db_user["id"]),
            "username": db_user["username"],
            "role": db_user["role"],
        }
    )

    # Anwesenheit für heute setzen (einfache Logik, später verfeinern)
    if db_user["role"] == "student":
        today = datetime.now().strftime("%Y-%m-%d")
        now_time = datetime.now().strftime("%H:%M:%S")
        cursor.execute(
            "SELECT id FROM attendance WHERE user_id = ? AND date = ?",
            (db_user["id"], today),
        )
        if not cursor.fetchone():
            status_value = "present" if now_time < "08:00:00" else "Verspätet"
            cursor.execute(
                """
                INSERT INTO attendance (user_id, date, login_time, status)
                VALUES (?, ?, ?, ?)
                """,
                (db_user["id"], today, now_time, status_value),
            )
            conn.commit()

    conn.close()
    return {
        "token": token,
        "role": db_user["role"],
        "username": db_user["username"],
    }


@app.get("/dashboard")
def get_dashboard(user=Depends(verify_token)):
    conn = get_db()
    cursor = conn.cursor()
    today = datetime.now().strftime("%Y-%m-%d")
    cursor.execute(
        "SELECT * FROM attendance WHERE user_id = ? ORDER BY date DESC",
        (user["sub"],),
    )
    records = [dict(r) for r in cursor.fetchall()]
    today_record = next((r for r in records if r["date"] == today), None)
    conn.close()
    return {"today_record": today_record, "history": records}


@app.post("/checkout")
def checkout(user=Depends(verify_token)):
    conn = get_db()
    cursor = conn.cursor()
    today = datetime.now().strftime("%Y-%m-%d")
    now_time = datetime.now().strftime("%H:%M:%S")

    cursor.execute(
        "SELECT id, logout_time FROM attendance "
        "WHERE user_id = ? AND date = ?",
        (user["sub"], today),
    )
    record = cursor.fetchone()

    if not record or record["logout_time"]:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kein Eintrag gefunden oder bereits ausgestempelt",
        )

    cursor.execute(
        "UPDATE attendance SET logout_time = ? WHERE id = ?",
        (now_time, record["id"]),
    )
    conn.commit()
    conn.close()
    return {"message": "Ausgestempelt"}