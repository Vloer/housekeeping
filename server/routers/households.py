import random
import string
import sqlite3
from fastapi import APIRouter, Depends, HTTPException

from database import get_db
from schemas import HouseholdCreate, HouseholdJoin
from config import PREINSTALLED_TASKS

router = APIRouter(prefix="/api/households", tags=["Households"])

def generate_join_code() -> str:
    chars = string.ascii_uppercase + string.digits
    rand_str = "".join(random.choices(chars, k=4))
    return f"HK-{rand_str}"

@router.post("/create")
def create_household(req: HouseholdCreate, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    join_code = generate_join_code()
    while True:
        cursor.execute("SELECT id FROM households WHERE join_code = ?", (join_code,))
        if not cursor.fetchone():
            break
        join_code = generate_join_code()
    
    cursor.execute("INSERT INTO households (name, join_code) VALUES (?, ?)", (req.name, join_code))
    household_id = cursor.lastrowid
    
    for name, freq in PREINSTALLED_TASKS:
        cursor.execute(
            "INSERT INTO task_catalog (household_id, name, is_custom, default_frequency_days) VALUES (?, ?, 0, ?)",
            (household_id, name, freq)
        )
    
    db.commit()
    return {"household_id": household_id, "name": req.name, "join_code": join_code}

@router.post("/join")
def join_household(req: HouseholdJoin, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    code = req.join_code.strip().upper()
    cursor.execute("SELECT id, name, join_code FROM households WHERE UPPER(join_code) = ?", (code,))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Invalid join code. Household not found.")
    return {"household_id": row["id"], "name": row["name"], "join_code": row["join_code"]}

@router.get("/{household_id}/info")
def get_household_info(household_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT id, name, join_code FROM households WHERE id = ?", (household_id,))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Household not found")
    return {"household_id": row["id"], "name": row["name"], "join_code": row["join_code"]}
