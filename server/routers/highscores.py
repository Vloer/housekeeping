import sqlite3
from fastapi import APIRouter, Depends, HTTPException

from database import get_db

router = APIRouter(prefix="/api/highscores", tags=["Highscores"])

@router.get("/household/{household_id}")
def get_household_highscores(household_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT id FROM households WHERE id = ?", (household_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Household not found")

    cursor.execute(
        """
        SELECT user_uuid, username, points
        FROM household_members
        WHERE household_id = ?
        ORDER BY points DESC, username ASC
        """,
        (household_id,)
    )
    rows = cursor.fetchall()
    result = []
    for idx, r in enumerate(rows, start=1):
        result.append({
            "rank": idx,
            "user_uuid": r["user_uuid"],
            "username": r["username"],
            "points": r["points"]
        })
    return result

@router.get("/global")
def get_global_highscores(db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute(
        """
        SELECT user_uuid, GROUP_CONCAT(DISTINCT username) as names, SUM(points) as total_points
        FROM household_members
        GROUP BY user_uuid
        ORDER BY total_points DESC
        """
    )
    rows = cursor.fetchall()
    result = []
    for idx, r in enumerate(rows, start=1):
        names = r["names"].replace(",", " / ") if r["names"] else "Anonymous"
        result.append({
            "rank": idx,
            "user_uuid": r["user_uuid"],
            "username": names,
            "points": r["total_points"] or 0
        })
    return result
