from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import psycopg2
import os

app = FastAPI(title="User Service", version="1.0.0")


def get_conn():
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST"),
        port=int(os.getenv("POSTGRES_PORT", 5432)),
        database=os.getenv("POSTGRES_DB", "postgres"),
        user=os.getenv("POSTGRES_USER"),
        password=os.getenv("POSTGRES_PASSWORD"),
        sslmode=os.getenv("POSTGRES_SSLMODE", "require"),
    )


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None


@app.get("/health")
def health():
    return {"status": "healthy", "service": "user-service"}


@app.get("/users")
def list_users():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    users = [
        {
            "id": str(r[0]),
            "username": r[1],
            "email": r[2],
            "role": r[3],
            "created_at": r[4].isoformat() if r[4] else None,
        }
        for r in rows
    ]
    return {"users": users, "total": len(users)}


@app.get("/users/{user_id}")
def get_user(user_id: str):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, username, email, role, created_at FROM users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": str(row[0]), "username": row[1], "email": row[2], "role": row[3], "created_at": row[4].isoformat() if row[4] else None}


@app.put("/users/{user_id}")
def update_user(user_id: str, update: UserUpdate):
    conn = get_conn()
    cur = conn.cursor()
    if update.email:
        cur.execute("UPDATE users SET email = %s WHERE id = %s", (update.email, user_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "User updated"}


@app.delete("/users/{user_id}")
def delete_user(user_id: str):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "User deleted"}
