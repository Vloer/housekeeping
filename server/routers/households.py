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

@router.post("/check-join")
def check_join(req: HouseholdJoin, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    code = req.join_code.strip().upper()
    cursor.execute("SELECT id, name, join_code FROM households WHERE UPPER(join_code) = ?", (code,))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Invalid join code. Household not found.")
    
    household_id = row["id"]
    user_uuid = req.user_uuid.strip() if req.user_uuid else ""
    
    existing_username = None
    is_member = False
    if user_uuid:
        cursor.execute(
            "SELECT username FROM household_members WHERE household_id = ? AND user_uuid = ?",
            (household_id, user_uuid)
        )
        member_row = cursor.fetchone()
        if member_row:
            existing_username = member_row["username"]
            is_member = True
            
    return {
        "household_id": household_id,
        "name": row["name"],
        "join_code": row["join_code"],
        "is_member": is_member,
        "existing_username": existing_username
    }

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
    
    username = req.user_name.strip() if req.user_name else "User"
    user_uuid = req.user_uuid.strip() if req.user_uuid else ""
    if user_uuid:
        cursor.execute(
            "SELECT id FROM household_members WHERE household_id = ? AND UPPER(username) = UPPER(?)",
            (household_id, username)
        )
        if cursor.fetchone():
            raise HTTPException(
                status_code=400,
                detail=f"The username '{username}' is already taken in this household. Please choose a different name."
            )
        cursor.execute(
            "INSERT INTO household_members (household_id, user_uuid, username, points) VALUES (?, ?, ?, 0)",
            (household_id, user_uuid, username)
        )
    
    db.commit()
    return {"household_id": household_id, "name": req.name, "join_code": join_code, "username": username}

@router.post("/join")
def join_household(req: HouseholdJoin, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    code = req.join_code.strip().upper()
    cursor.execute("SELECT id, name, join_code FROM households WHERE UPPER(join_code) = ?", (code,))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Invalid join code. Household not found.")
    
    household_id = row["id"]
    user_uuid = req.user_uuid.strip() if req.user_uuid else ""
    username = req.user_name.strip() if req.user_name else ""
    
    if user_uuid:
        cursor.execute(
            "SELECT username FROM household_members WHERE household_id = ? AND user_uuid = ?",
            (household_id, user_uuid)
        )
        member_row = cursor.fetchone()
        if member_row:
            # User is already a member of this household -> lock to existing username
            username = member_row["username"]
        else:
            # User is joining this household for the FIRST time -> require username
            if not username:
                raise HTTPException(
                    status_code=400,
                    detail="Please enter your name for this household."
                )
            cursor.execute(
                "SELECT id FROM household_members WHERE household_id = ? AND UPPER(username) = UPPER(?)",
                (household_id, username)
            )
            if cursor.fetchone():
                raise HTTPException(
                    status_code=400,
                    detail=f"The username '{username}' is already taken in this household. Please choose a different name."
                )
            cursor.execute(
                "INSERT INTO household_members (household_id, user_uuid, username, points) VALUES (?, ?, ?, 0)",
                (household_id, user_uuid, username)
            )
            db.commit()
            
    return {"household_id": household_id, "name": row["name"], "join_code": row["join_code"], "username": username}

@router.get("/{household_id}/info")
def get_household_info(household_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT id, name, join_code FROM households WHERE id = ?", (household_id,))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Household not found")
    return {"household_id": row["id"], "name": row["name"], "join_code": row["join_code"]}
